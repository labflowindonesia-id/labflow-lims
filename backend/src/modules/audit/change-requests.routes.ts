/**
 * Change Request API Routes
 * Handles change requests for modifying locked/released entities
 */
import { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index';
import {
    changeRequests,
    changeRequestItems,
    changeRequestAttachments,
    changeRequestAudit,
    changeRequestStatusEnum,
    changeTypeEnum,
    entityTypeEnum,
} from '../../db/schema/change-requests';
import { users } from '../../db/schema/users';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError } from '../../shared/errors';
import crypto from 'crypto';

// Type definitions
type ChangeRequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'APPLIED';

// Helper to generate CR number
function generateCRNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CR-${year}${month}-${random}`;
}

// Helper to create audit log
async function logChangeRequestAction(
    changeRequestId: string,
    action: string,
    previousStatus: ChangeRequestStatus | null,
    newStatus: ChangeRequestStatus | null,
    performedBy: string,
    notes?: string,
    metadata?: Record<string, unknown>
) {
    await db.insert(changeRequestAudit).values({
        id: crypto.randomUUID(),
        changeRequestId,
        action,
        previousStatus,
        newStatus,
        performedBy,
        notes,
        metadata,
    });
}

export const changeRequestRoutes: FastifyPluginAsync = async (fastify) => {
    // ==================== Change Requests ====================

    /**
     * List change requests
     * GET /api/change-requests
     */
    fastify.get('/change-requests', {
        preHandler: [requireAuth, requirePermission('change-requests:read')],
    }, async (request, reply) => {
        const { status, workOrderId, page = '1', limit = '20' } = request.query as Record<string, string>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = sql`1=1`;

        if (status) {
            whereClause = sql`${whereClause} AND ${changeRequests.status} = ${status}`;
        }

        if (workOrderId) {
            whereClause = sql`${whereClause} AND ${changeRequests.workOrderId} = ${workOrderId}`;
        }

        const crList = await db
            .select({
                id: changeRequests.id,
                crNumber: changeRequests.crNumber,
                workOrderId: changeRequests.workOrderId,
                reportId: changeRequests.reportId,
                status: changeRequests.status,
                reason: changeRequests.reason,
                requestedBy: changeRequests.requestedBy,
                requestedAt: changeRequests.requestedAt,
                submittedAt: changeRequests.submittedAt,
                reviewedBy: changeRequests.reviewedBy,
                reviewedAt: changeRequests.reviewedAt,
                appliedAt: changeRequests.appliedAt,
                createdAt: changeRequests.createdAt,
            })
            .from(changeRequests)
            .where(whereClause)
            .orderBy(desc(changeRequests.createdAt))
            .limit(limitNum)
            .offset(offset);

        // Get total count
        const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(changeRequests)
            .where(whereClause);

        return reply.send({
            success: true,
            data: {
                changeRequests: crList,
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
     * Get change request details
     * GET /api/change-requests/:id
     */
    fastify.get('/change-requests/:id', {
        preHandler: [requireAuth, requirePermission('change-requests:read')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        // Get items
        const items = await db
            .select()
            .from(changeRequestItems)
            .where(eq(changeRequestItems.changeRequestId, id));

        // Get attachments
        const attachments = await db
            .select()
            .from(changeRequestAttachments)
            .where(eq(changeRequestAttachments.changeRequestId, id));

        // Get audit logs
        const auditLogs = await db
            .select()
            .from(changeRequestAudit)
            .where(eq(changeRequestAudit.changeRequestId, id))
            .orderBy(desc(changeRequestAudit.createdAt));

        return reply.send({
            success: true,
            data: {
                ...cr,
                items,
                attachments,
                auditLogs,
            },
        });
    });

    /**
     * Create change request
     * POST /api/change-requests
     */
    fastify.post('/change-requests', {
        preHandler: [requireAuth, requirePermission('change-requests:create')],
    }, async (request, reply) => {
        const schema = z.object({
            workOrderId: z.string().uuid().optional(),
            reportId: z.string().uuid().optional(),
            reason: z.string().min(1),
            businessJustification: z.string().optional(),
        });

        const body = schema.parse(request.body);
        const userId = request.user!.id;

        // Require at least one entity reference
        if (!body.workOrderId && !body.reportId) {
            throw ApiError.badRequest('Either workOrderId or reportId is required');
        }

        const crId = crypto.randomUUID();
        const crNumber = generateCRNumber();

        await db.insert(changeRequests).values({
            id: crId,
            crNumber,
            workOrderId: body.workOrderId,
            reportId: body.reportId,
            status: 'DRAFT',
            reason: body.reason,
            businessJustification: body.businessJustification,
            requestedBy: userId,
            requestedAt: new Date(),
        });

        // Log the creation
        await logChangeRequestAction(crId, 'CREATED', null, 'DRAFT', userId);

        return reply.status(201).send({
            success: true,
            data: { id: crId, crNumber, status: 'DRAFT' },
        });
    });

    /**
     * Update change request
     * PUT /api/change-requests/:id
     */
    fastify.put('/change-requests/:id', {
        preHandler: [requireAuth, requirePermission('change-requests:create')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const schema = z.object({
            reason: z.string().optional(),
            businessJustification: z.string().optional(),
        });

        const body = schema.parse(request.body);

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        if (cr.status !== 'DRAFT') {
            throw ApiError.badRequest('Can only update draft change requests');
        }

        await db
            .update(changeRequests)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(changeRequests.id, id));

        return reply.send({
            success: true,
            data: { id, updated: true },
        });
    });

    /**
     * Add change request item
     * POST /api/change-requests/:id/items
     */
    fastify.post('/change-requests/:id/items', {
        preHandler: [requireAuth, requirePermission('change-requests:create')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const schema = z.object({
            changeType: z.enum(['ADD_TEST', 'REMOVE_TEST', 'UPDATE_TEST_DUE_DATE', 'UPDATE_METHOD_INSTRUMENT',
                'UPDATE_SAMPLE_METADATA', 'UPDATE_STORAGE_LOCATION', 'UPDATE_CUSTOMER_CONTACT', 'OTHER']),
            entityType: z.enum(['QUOTATION', 'QUOTATION_LINE', 'WORK_ORDER', 'SAMPLE', 'REQUESTED_TEST', 'TEST_TASK', 'REPORT']),
            entityId: z.string(),
            fieldName: z.string(),
            oldValue: z.unknown().optional(),
            newValue: z.unknown(),
            description: z.string().optional(),
        });

        const body = schema.parse(request.body);

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        if (cr.status !== 'DRAFT') {
            throw ApiError.badRequest('Can only add items to draft change requests');
        }

        const itemId = crypto.randomUUID();
        await db.insert(changeRequestItems).values({
            id: itemId,
            changeRequestId: id,
            changeType: body.changeType,
            entityType: body.entityType,
            entityId: body.entityId,
            fieldName: body.fieldName,
            oldValue: body.oldValue,
            newValue: body.newValue,
            description: body.description,
        });

        return reply.status(201).send({
            success: true,
            data: { id: itemId },
        });
    });

    /**
     * Delete change request item
     * DELETE /api/change-requests/:id/items/:itemId
     */
    fastify.delete('/change-requests/:id/items/:itemId', {
        preHandler: [requireAuth, requirePermission('change-requests:create')],
    }, async (request, reply) => {
        const { id, itemId } = request.params as { id: string; itemId: string };

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        if (cr.status !== 'DRAFT') {
            throw ApiError.badRequest('Can only delete items from draft change requests');
        }

        await db
            .delete(changeRequestItems)
            .where(and(
                eq(changeRequestItems.id, itemId),
                eq(changeRequestItems.changeRequestId, id)
            ));

        return reply.send({
            success: true,
            data: { deleted: true },
        });
    });

    /**
     * Submit change request for approval
     * POST /api/change-requests/:id/submit
     */
    fastify.post('/change-requests/:id/submit', {
        preHandler: [requireAuth, requirePermission('change-requests:submit')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = request.user!.id;

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        if (cr.status !== 'DRAFT') {
            throw ApiError.badRequest('Can only submit draft change requests');
        }

        // Check that there's at least one item
        const [itemCount] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(changeRequestItems)
            .where(eq(changeRequestItems.changeRequestId, id));

        if (!itemCount?.count || itemCount.count === 0) {
            throw ApiError.badRequest('Change request must have at least one item');
        }

        const typedStatus: ChangeRequestStatus = 'SUBMITTED';
        const previousStatus = cr.status as ChangeRequestStatus;

        await db
            .update(changeRequests)
            .set({
                status: typedStatus,
                submittedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(changeRequests.id, id));

        await logChangeRequestAction(id, 'SUBMITTED', previousStatus, typedStatus, userId);

        return reply.send({
            success: true,
            data: { id, status: 'SUBMITTED', submittedAt: new Date() },
        });
    });

    /**
     * Approve change request
     * POST /api/change-requests/:id/approve
     */
    fastify.post('/change-requests/:id/approve', {
        preHandler: [requireAuth, requirePermission('change-requests:approve')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { notes } = (request.body || {}) as { notes?: string };
        const userId = request.user!.id;

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        if (cr.status !== 'SUBMITTED') {
            throw ApiError.badRequest('Can only approve submitted change requests');
        }

        const typedStatus: ChangeRequestStatus = 'APPROVED';
        const previousStatus = cr.status as ChangeRequestStatus;

        await db
            .update(changeRequests)
            .set({
                status: typedStatus,
                reviewedBy: userId,
                reviewedAt: new Date(),
                reviewNotes: notes,
                updatedAt: new Date(),
            })
            .where(eq(changeRequests.id, id));

        await logChangeRequestAction(id, 'APPROVED', previousStatus, typedStatus, userId, notes);

        return reply.send({
            success: true,
            data: { id, status: 'APPROVED', reviewedAt: new Date() },
        });
    });

    /**
     * Reject change request
     * POST /api/change-requests/:id/reject
     */
    fastify.post('/change-requests/:id/reject', {
        preHandler: [requireAuth, requirePermission('change-requests:approve')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { notes } = (request.body || {}) as { notes?: string };
        const userId = request.user!.id;

        if (!notes) {
            throw ApiError.badRequest('Rejection notes are required');
        }

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        if (cr.status !== 'SUBMITTED') {
            throw ApiError.badRequest('Can only reject submitted change requests');
        }

        const typedStatus: ChangeRequestStatus = 'REJECTED';
        const previousStatus = cr.status as ChangeRequestStatus;

        await db
            .update(changeRequests)
            .set({
                status: typedStatus,
                reviewedBy: userId,
                reviewedAt: new Date(),
                reviewNotes: notes,
                updatedAt: new Date(),
            })
            .where(eq(changeRequests.id, id));

        await logChangeRequestAction(id, 'REJECTED', previousStatus, typedStatus, userId, notes);

        return reply.send({
            success: true,
            data: { id, status: 'REJECTED', reviewedAt: new Date() },
        });
    });

    /**
     * Apply approved change request
     * POST /api/change-requests/:id/apply
     */
    fastify.post('/change-requests/:id/apply', {
        preHandler: [requireAuth, requirePermission('change-requests:approve')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = request.user!.id;

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        if (cr.status !== 'APPROVED') {
            throw ApiError.badRequest('Can only apply approved change requests');
        }

        // Get items to apply
        const items = await db
            .select()
            .from(changeRequestItems)
            .where(eq(changeRequestItems.changeRequestId, id));

        // Apply each item (mark as applied)
        // Note: Actual entity modifications would be done here based on changeType and entityType
        for (const item of items) {
            await db
                .update(changeRequestItems)
                .set({
                    isApplied: true,
                    appliedAt: new Date(),
                })
                .where(eq(changeRequestItems.id, item.id));
        }

        const typedStatus: ChangeRequestStatus = 'APPLIED';
        const previousStatus = cr.status as ChangeRequestStatus;

        await db
            .update(changeRequests)
            .set({
                status: typedStatus,
                appliedBy: userId,
                appliedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(changeRequests.id, id));

        await logChangeRequestAction(id, 'APPLIED', previousStatus, typedStatus, userId);

        return reply.send({
            success: true,
            data: { id, status: 'APPLIED', appliedAt: new Date(), itemsApplied: items.length },
        });
    });

    /**
     * Cancel change request
     * POST /api/change-requests/:id/cancel
     */
    fastify.post('/change-requests/:id/cancel', {
        preHandler: [requireAuth, requirePermission('change-requests:create')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { notes } = (request.body || {}) as { notes?: string };
        const userId = request.user!.id;

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        if (cr.status === 'APPLIED' || cr.status === 'CANCELLED') {
            throw ApiError.badRequest('Cannot cancel applied or already cancelled change requests');
        }

        const typedStatus: ChangeRequestStatus = 'CANCELLED';
        const previousStatus = cr.status as ChangeRequestStatus;

        await db
            .update(changeRequests)
            .set({
                status: typedStatus,
                updatedAt: new Date(),
            })
            .where(eq(changeRequests.id, id));

        await logChangeRequestAction(id, 'CANCELLED', previousStatus, typedStatus, userId, notes);

        return reply.send({
            success: true,
            data: { id, status: 'CANCELLED' },
        });
    });

    /**
     * Add attachment to change request
     * POST /api/change-requests/:id/attachments
     */
    fastify.post('/change-requests/:id/attachments', {
        preHandler: [requireAuth, requirePermission('change-requests:create')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const schema = z.object({
            filePath: z.string(),
            fileName: z.string(),
            fileType: z.string().optional(),
            fileSize: z.number().int().optional(),
            description: z.string().optional(),
        });

        const body = schema.parse(request.body);
        const userId = request.user!.id;

        const [cr] = await db
            .select()
            .from(changeRequests)
            .where(eq(changeRequests.id, id))
            .limit(1);

        if (!cr) {
            throw ApiError.notFound('Change Request');
        }

        if (cr.status !== 'DRAFT' && cr.status !== 'SUBMITTED') {
            throw ApiError.badRequest('Can only add attachments to draft or submitted change requests');
        }

        const attachmentId = crypto.randomUUID();
        await db.insert(changeRequestAttachments).values({
            id: attachmentId,
            changeRequestId: id,
            filePath: body.filePath,
            fileName: body.fileName,
            fileType: body.fileType,
            fileSize: body.fileSize,
            description: body.description,
            uploadedBy: userId,
        });

        return reply.status(201).send({
            success: true,
            data: { id: attachmentId },
        });
    });
};

export default changeRequestRoutes;
