/**
 * Audit API Routes
 * Handles audit trail logging and entity locking
 */
import { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index';
import {
    auditEvents,
    entityLocks,
    policyViolations,
    notifications,
    auditActionEnum,
} from '../../db/schema/audit';
import { users } from '../../db/schema/users';
import { eq, desc, and, sql, gte, lte, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError } from '../../shared/errors';
import crypto from 'crypto';

// Type definitions
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'GENERATE_PDF' | 'LOCK' | 'UNLOCK';

export const auditRoutes: FastifyPluginAsync = async (fastify) => {
    // ==================== Audit Events ====================

    /**
     * List audit events
     * GET /api/audit/events
     */
    fastify.get('/audit/events', {
        preHandler: [requireAuth, requirePermission('settings:read')],
    }, async (request, reply) => {
        const { entityType, entityId, userId, action, startDate, endDate, page = '1', limit = '50' } = request.query as Record<string, string>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = sql`1=1`;

        if (entityType) {
            whereClause = sql`${whereClause} AND ${auditEvents.entityType} = ${entityType}`;
        }

        if (entityId) {
            whereClause = sql`${whereClause} AND ${auditEvents.entityId} = ${entityId}`;
        }

        if (userId) {
            whereClause = sql`${whereClause} AND ${auditEvents.userId} = ${userId}`;
        }

        if (action) {
            whereClause = sql`${whereClause} AND ${auditEvents.action} = ${action}`;
        }

        if (startDate) {
            whereClause = sql`${whereClause} AND ${auditEvents.createdAt} >= ${new Date(startDate)}`;
        }

        if (endDate) {
            whereClause = sql`${whereClause} AND ${auditEvents.createdAt} <= ${new Date(endDate)}`;
        }

        const events = await db
            .select({
                id: auditEvents.id,
                entityType: auditEvents.entityType,
                entityId: auditEvents.entityId,
                action: auditEvents.action,
                userId: auditEvents.userId,
                userEmail: auditEvents.userEmail,
                userRole: auditEvents.userRole,
                changedFields: auditEvents.changedFields,
                reason: auditEvents.reason,
                ipAddress: auditEvents.ipAddress,
                createdAt: auditEvents.createdAt,
            })
            .from(auditEvents)
            .where(whereClause)
            .orderBy(desc(auditEvents.createdAt))
            .limit(limitNum)
            .offset(offset);

        // Get total count
        const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(auditEvents)
            .where(whereClause);

        return reply.send({
            success: true,
            data: {
                events,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: countResult?.count || 0,
                    totalPages: Math.ceil((countResult?.count || 0) / limitNum),
                },
            },
        });
    });

    /**
     * Get audit event details
     * GET /api/audit/events/:id
     */
    fastify.get('/audit/events/:id', {
        preHandler: [requireAuth, requirePermission('settings:read')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const [event] = await db
            .select()
            .from(auditEvents)
            .where(eq(auditEvents.id, id))
            .limit(1);

        if (!event) {
            throw ApiError.notFound('Audit event');
        }

        return reply.send({
            success: true,
            data: event,
        });
    });

    /**
     * Get entity history
     * GET /api/audit/history/:entityType/:entityId
     */
    fastify.get('/audit/history/:entityType/:entityId', {
        preHandler: [requireAuth, requirePermission('settings:read')],
    }, async (request, reply) => {
        const { entityType, entityId } = request.params as { entityType: string; entityId: string };

        const history = await db
            .select()
            .from(auditEvents)
            .where(and(
                eq(auditEvents.entityType, entityType),
                eq(auditEvents.entityId, entityId)
            ))
            .orderBy(desc(auditEvents.createdAt));

        return reply.send({
            success: true,
            data: { history },
        });
    });

    /**
     * Create audit event (internal use)
     * POST /api/audit/events
     */
    fastify.post('/audit/events', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const schema = z.object({
            entityType: z.string(),
            entityId: z.string(),
            action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT', 'GENERATE_PDF', 'LOCK', 'UNLOCK']),
            oldValues: z.record(z.unknown()).optional(),
            newValues: z.record(z.unknown()).optional(),
            changedFields: z.array(z.string()).optional(),
            reason: z.string().optional(),
            relatedEntities: z.array(z.object({
                type: z.string(),
                id: z.string(),
            })).optional(),
        });

        const body = schema.parse(request.body);
        const user = request.user!;

        const eventId = crypto.randomUUID();
        await db.insert(auditEvents).values({
            id: eventId,
            entityType: body.entityType,
            entityId: body.entityId,
            action: body.action,
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            oldValues: body.oldValues,
            newValues: body.newValues,
            changedFields: body.changedFields,
            reason: body.reason,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            relatedEntities: body.relatedEntities,
        });

        return reply.status(201).send({
            success: true,
            data: { id: eventId },
        });
    });

    // ==================== Entity Locks ====================

    /**
     * List active entity locks
     * GET /api/audit/locks
     */
    fastify.get('/audit/locks', {
        preHandler: [requireAuth, requirePermission('settings:read')],
    }, async (request, reply) => {
        const { entityType, entityId } = request.query as Record<string, string>;

        let whereClause = sql`${entityLocks.isReleased} = false`;

        if (entityType) {
            whereClause = sql`${whereClause} AND ${entityLocks.entityType} = ${entityType}`;
        }

        if (entityId) {
            whereClause = sql`${whereClause} AND ${entityLocks.entityId} = ${entityId}`;
        }

        const locks = await db
            .select({
                id: entityLocks.id,
                entityType: entityLocks.entityType,
                entityId: entityLocks.entityId,
                lockedBy: entityLocks.lockedBy,
                lockedAt: entityLocks.lockedAt,
                reason: entityLocks.reason,
                expiresAt: entityLocks.expiresAt,
            })
            .from(entityLocks)
            .where(whereClause)
            .orderBy(desc(entityLocks.lockedAt));

        return reply.send({
            success: true,
            data: { locks },
        });
    });

    /**
     * Check if entity is locked
     * GET /api/audit/locks/:entityType/:entityId
     */
    fastify.get('/audit/locks/:entityType/:entityId', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const { entityType, entityId } = request.params as { entityType: string; entityId: string };

        // Find active lock (not released and not expired)
        const [activeLock] = await db
            .select()
            .from(entityLocks)
            .where(and(
                eq(entityLocks.entityType, entityType),
                eq(entityLocks.entityId, entityId),
                eq(entityLocks.isReleased, false),
                or(
                    isNull(entityLocks.expiresAt),
                    gte(entityLocks.expiresAt, new Date())
                )
            ))
            .orderBy(desc(entityLocks.lockedAt))
            .limit(1);

        return reply.send({
            success: true,
            data: {
                isLocked: !!activeLock,
                lock: activeLock || null,
            },
        });
    });

    /**
     * Acquire entity lock
     * POST /api/audit/locks
     */
    fastify.post('/audit/locks', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const schema = z.object({
            entityType: z.string(),
            entityId: z.string(),
            reason: z.string().optional(),
            durationMinutes: z.number().int().positive().optional().default(30),
        });

        const body = schema.parse(request.body);
        const userId = request.user!.id;

        // Check if already locked by someone else
        const [existingLock] = await db
            .select()
            .from(entityLocks)
            .where(and(
                eq(entityLocks.entityType, body.entityType),
                eq(entityLocks.entityId, body.entityId),
                eq(entityLocks.isReleased, false),
                or(
                    isNull(entityLocks.expiresAt),
                    gte(entityLocks.expiresAt, new Date())
                )
            ))
            .limit(1);

        if (existingLock) {
            if (existingLock.lockedBy === userId) {
                // Extend existing lock
                const newExpiry = new Date(Date.now() + body.durationMinutes * 60 * 1000);
                await db
                    .update(entityLocks)
                    .set({ expiresAt: newExpiry })
                    .where(eq(entityLocks.id, existingLock.id));

                return reply.send({
                    success: true,
                    data: { id: existingLock.id, extended: true, expiresAt: newExpiry },
                });
            } else {
                throw ApiError.conflict('Entity is already locked by another user');
            }
        }

        const lockId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + body.durationMinutes * 60 * 1000);

        await db.insert(entityLocks).values({
            id: lockId,
            entityType: body.entityType,
            entityId: body.entityId,
            lockedBy: userId,
            reason: body.reason,
            expiresAt,
        });

        return reply.status(201).send({
            success: true,
            data: { id: lockId, expiresAt },
        });
    });

    /**
     * Release entity lock
     * DELETE /api/audit/locks/:lockId
     */
    fastify.delete('/audit/locks/:lockId', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const { lockId } = request.params as { lockId: string };
        const userId = request.user!.id;
        const isAdmin = request.user!.role === 'ADMIN';

        const [lock] = await db
            .select()
            .from(entityLocks)
            .where(eq(entityLocks.id, lockId))
            .limit(1);

        if (!lock) {
            throw ApiError.notFound('Lock');
        }

        // Only owner or admin can release
        if (lock.lockedBy !== userId && !isAdmin) {
            throw ApiError.forbidden('Only lock owner or admin can release lock');
        }

        await db
            .update(entityLocks)
            .set({
                isReleased: true,
                releasedAt: new Date(),
            })
            .where(eq(entityLocks.id, lockId));

        return reply.send({
            success: true,
            data: { released: true },
        });
    });

    /**
     * Force release entity lock (admin only)
     * POST /api/audit/locks/:lockId/force-release
     */
    fastify.post('/audit/locks/:lockId/force-release', {
        preHandler: [requireAuth, requirePermission('settings:write')],
    }, async (request, reply) => {
        const { lockId } = request.params as { lockId: string };
        const { reason } = (request.body || {}) as { reason?: string };

        const [lock] = await db
            .select()
            .from(entityLocks)
            .where(eq(entityLocks.id, lockId))
            .limit(1);

        if (!lock) {
            throw ApiError.notFound('Lock');
        }

        await db
            .update(entityLocks)
            .set({
                isReleased: true,
                releasedAt: new Date(),
                reason: lock.reason ? `${lock.reason} (Force released: ${reason || 'No reason provided'})` : `Force released: ${reason || 'No reason provided'}`,
            })
            .where(eq(entityLocks.id, lockId));

        return reply.send({
            success: true,
            data: { forceReleased: true },
        });
    });

    // ==================== Policy Violations ====================

    /**
     * List policy violations
     * GET /api/audit/violations
     */
    fastify.get('/audit/violations', {
        preHandler: [requireAuth, requirePermission('settings:read')],
    }, async (request, reply) => {
        const { severity, isResolved, page = '1', limit = '20' } = request.query as Record<string, string>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = sql`1=1`;

        if (severity) {
            whereClause = sql`${whereClause} AND ${policyViolations.severity} = ${severity}`;
        }

        if (isResolved !== undefined) {
            const resolved = isResolved === 'true';
            whereClause = sql`${whereClause} AND ${policyViolations.isResolved} = ${resolved}`;
        }

        const violations = await db
            .select()
            .from(policyViolations)
            .where(whereClause)
            .orderBy(desc(policyViolations.createdAt))
            .limit(limitNum)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(policyViolations)
            .where(whereClause);

        return reply.send({
            success: true,
            data: {
                violations,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: countResult?.count || 0,
                    totalPages: Math.ceil((countResult?.count || 0) / limitNum),
                },
            },
        });
    });

    /**
     * Resolve policy violation
     * PUT /api/audit/violations/:id/resolve
     */
    fastify.put('/audit/violations/:id/resolve', {
        preHandler: [requireAuth, requirePermission('settings:write')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { resolution } = (request.body || {}) as { resolution?: string };
        const userId = request.user!.id;

        const [violation] = await db
            .select()
            .from(policyViolations)
            .where(eq(policyViolations.id, id))
            .limit(1);

        if (!violation) {
            throw ApiError.notFound('Policy violation');
        }

        if (violation.isResolved) {
            throw ApiError.badRequest('Violation is already resolved');
        }

        await db
            .update(policyViolations)
            .set({
                isResolved: true,
                resolvedBy: userId,
                resolvedAt: new Date(),
                resolution,
            })
            .where(eq(policyViolations.id, id));

        return reply.send({
            success: true,
            data: { id, resolved: true },
        });
    });
};

export default auditRoutes;
