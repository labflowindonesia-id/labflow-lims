/**
 * Portal API Routes
 * Customer portal endpoints for order tracking and report access
 */
import { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index';
import {
    portalAccounts,
    portalSessions,
    portalAccessPolicies,
    portalActivityLogs,
    reportCustomerVisibility,
    statusTimelineEvents,
} from '../../db/schema/portal';
import { reports, reportDocuments } from '../../db/schema/reports';
import { workOrders, samples } from '../../db/schema/work-orders';
import { customers } from '../../db/schema/customers';
import { eq, desc, and, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { ApiError } from '../../shared/errors';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Type for portal user context
interface PortalUser {
    id: string;
    customerId: string;
    email: string;
    contactName: string | null;
}

// Middleware to verify portal session
async function requirePortalAuth(request: any, reply: any) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw ApiError.unauthorized('Portal authentication required');
    }

    const token = authHeader.substring(7);

    // Find valid session
    const [session] = await db
        .select({
            id: portalSessions.id,
            accountId: portalSessions.accountId,
            expiresAt: portalSessions.expiresAt,
            isRevoked: portalSessions.isRevoked,
        })
        .from(portalSessions)
        .where(eq(portalSessions.token, token))
        .limit(1);

    if (!session || session.isRevoked || new Date(session.expiresAt) < new Date()) {
        throw ApiError.unauthorized('Invalid or expired portal session');
    }

    // Get account
    const [account] = await db
        .select({
            id: portalAccounts.id,
            customerId: portalAccounts.customerId,
            email: portalAccounts.email,
            contactName: portalAccounts.contactName,
            isActive: portalAccounts.isActive,
        })
        .from(portalAccounts)
        .where(eq(portalAccounts.id, session.accountId))
        .limit(1);

    if (!account || !account.isActive) {
        throw ApiError.unauthorized('Portal account is inactive');
    }

    request.portalUser = {
        id: account.id,
        customerId: account.customerId,
        email: account.email,
        contactName: account.contactName,
    } as PortalUser;

    request.portalSessionId = session.id;
}

// Helper to log portal activity
async function logPortalActivity(
    accountId: string,
    sessionId: string | null,
    action: string,
    resourceType?: string,
    resourceId?: string,
    ipAddress?: string,
    metadata?: Record<string, unknown>
) {
    await db.insert(portalActivityLogs).values({
        id: crypto.randomUUID(),
        accountId,
        sessionId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        metadata,
    });
}

export const portalRoutes: FastifyPluginAsync = async (fastify) => {
    // ==================== Portal Authentication ====================

    /**
     * Portal login
     * POST /portal/auth/login
     */
    fastify.post('/portal/auth/login', async (request, reply) => {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(1),
        });

        const body = schema.parse(request.body);

        // Find account
        const [account] = await db
            .select()
            .from(portalAccounts)
            .where(eq(portalAccounts.email, body.email.toLowerCase()))
            .limit(1);

        if (!account) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Check if locked
        if (account.lockedUntil && new Date(account.lockedUntil) > new Date()) {
            throw ApiError.forbidden('Account is temporarily locked');
        }

        // Verify password
        const isValid = await bcrypt.compare(body.password, account.passwordHash);
        if (!isValid) {
            // Increment failed attempts
            const newAttempts = account.failedLoginAttempts + 1;
            const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

            await db
                .update(portalAccounts)
                .set({
                    failedLoginAttempts: newAttempts,
                    lockedUntil: lockUntil,
                    updatedAt: new Date(),
                })
                .where(eq(portalAccounts.id, account.id));

            throw ApiError.unauthorized('Invalid email or password');
        }

        if (!account.isActive) {
            throw ApiError.forbidden('Account is inactive');
        }

        // Reset failed attempts and create session
        const sessionId = crypto.randomUUID();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await db
            .update(portalAccounts)
            .set({
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(portalAccounts.id, account.id));

        await db.insert(portalSessions).values({
            id: sessionId,
            accountId: account.id,
            token,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            expiresAt,
        });

        await logPortalActivity(account.id, sessionId, 'LOGIN', undefined, undefined, request.ip);

        // Get customer info
        const [customer] = await db
            .select({ name: customers.name })
            .from(customers)
            .where(eq(customers.id, account.customerId))
            .limit(1);

        return reply.send({
            success: true,
            data: {
                token,
                expiresAt,
                user: {
                    id: account.id,
                    email: account.email,
                    contactName: account.contactName,
                    customerName: customer?.name,
                },
            },
        });
    });

    /**
     * Portal logout
     * POST /portal/auth/logout
     */
    fastify.post('/portal/auth/logout', {
        preHandler: [requirePortalAuth],
    }, async (request: any, reply) => {
        const sessionId = request.portalSessionId;
        const portalUser = request.portalUser as PortalUser;

        await db
            .update(portalSessions)
            .set({ isRevoked: true })
            .where(eq(portalSessions.id, sessionId));

        await logPortalActivity(portalUser.id, sessionId, 'LOGOUT', undefined, undefined, request.ip);

        return reply.send({
            success: true,
            data: { loggedOut: true },
        });
    });

    /**
     * Get portal user profile
     * GET /portal/auth/me
     */
    fastify.get('/portal/auth/me', {
        preHandler: [requirePortalAuth],
    }, async (request: any, reply) => {
        const portalUser = request.portalUser as PortalUser;

        const [customer] = await db
            .select({ name: customers.name, address: customers.address })
            .from(customers)
            .where(eq(customers.id, portalUser.customerId))
            .limit(1);

        return reply.send({
            success: true,
            data: {
                id: portalUser.id,
                email: portalUser.email,
                contactName: portalUser.contactName,
                customer: {
                    id: portalUser.customerId,
                    name: customer?.name,
                    address: customer?.address,
                },
            },
        });
    });

    // ==================== Status Tracker ====================

    /**
     * List work orders for customer
     * GET /portal/orders
     */
    fastify.get('/portal/orders', {
        preHandler: [requirePortalAuth],
    }, async (request: any, reply) => {
        const portalUser = request.portalUser as PortalUser;
        const { status, page = '1', limit = '10' } = request.query as Record<string, string>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = sql`${workOrders.customerId} = ${portalUser.customerId}`;

        if (status) {
            whereClause = sql`${whereClause} AND ${workOrders.status} = ${status}`;
        }

        const orders = await db
            .select({
                id: workOrders.id,
                workOrderNumber: workOrders.workOrderNumber,
                status: workOrders.status,
                receivedDate: workOrders.receivedDate,
                dueDate: workOrders.dueDate,
                totalSamples: workOrders.totalSamples,
                createdAt: workOrders.createdAt,
            })
            .from(workOrders)
            .where(whereClause)
            .orderBy(desc(workOrders.createdAt))
            .limit(limitNum)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(workOrders)
            .where(whereClause);

        return reply.send({
            success: true,
            data: {
                orders,
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
     * Get work order details with timeline
     * GET /portal/orders/:id
     */
    fastify.get('/portal/orders/:id', {
        preHandler: [requirePortalAuth],
    }, async (request: any, reply) => {
        const { id } = request.params as { id: string };
        const portalUser = request.portalUser as PortalUser;

        // Verify ownership
        const [order] = await db
            .select()
            .from(workOrders)
            .where(and(
                eq(workOrders.id, id),
                eq(workOrders.customerId, portalUser.customerId)
            ))
            .limit(1);

        if (!order) {
            throw ApiError.notFound('Order');
        }

        // Get samples
        const sampleList = await db
            .select({
                id: samples.id,
                sampleLabId: samples.sampleLabId,
                sampleName: samples.sampleName,
                condition: samples.condition,
            })
            .from(samples)
            .where(eq(samples.workOrderId, id));

        // Get timeline events
        const timeline = await db
            .select()
            .from(statusTimelineEvents)
            .where(eq(statusTimelineEvents.workOrderId, id))
            .orderBy(statusTimelineEvents.timestamp);

        await logPortalActivity(portalUser.id, null, 'VIEW_ORDER', 'WORK_ORDER', id, request.ip);

        return reply.send({
            success: true,
            data: {
                order: {
                    id: order.id,
                    workOrderNumber: order.workOrderNumber,
                    status: order.status,
                    receivedDate: order.receivedDate,
                    dueDate: order.dueDate,
                    totalSamples: order.totalSamples,
                },
                samples: sampleList,
                timeline,
            },
        });
    });

    // ==================== Report Repository ====================

    /**
     * List available reports
     * GET /portal/reports
     */
    fastify.get('/portal/reports', {
        preHandler: [requirePortalAuth],
    }, async (request: any, reply) => {
        const portalUser = request.portalUser as PortalUser;
        const { page = '1', limit = '10' } = request.query as Record<string, string>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        // Get reports visible to this customer
        const reportList = await db
            .select({
                id: reports.id,
                reportNumber: reports.reportNumber,
                title: reports.title,
                status: reports.status,
                releasedAt: reports.releasedAt,
                workOrderId: reports.workOrderId,
            })
            .from(reports)
            .innerJoin(reportCustomerVisibility, eq(reports.id, reportCustomerVisibility.reportId))
            .where(and(
                eq(reportCustomerVisibility.customerId, portalUser.customerId),
                eq(reportCustomerVisibility.isVisible, true),
                eq(reports.status, 'RELEASED')
            ))
            .orderBy(desc(reports.releasedAt))
            .limit(limitNum)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(reports)
            .innerJoin(reportCustomerVisibility, eq(reports.id, reportCustomerVisibility.reportId))
            .where(and(
                eq(reportCustomerVisibility.customerId, portalUser.customerId),
                eq(reportCustomerVisibility.isVisible, true),
                eq(reports.status, 'RELEASED')
            ));

        return reply.send({
            success: true,
            data: {
                reports: reportList,
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
     * Get report details
     * GET /portal/reports/:id
     */
    fastify.get('/portal/reports/:id', {
        preHandler: [requirePortalAuth],
    }, async (request: any, reply) => {
        const { id } = request.params as { id: string };
        const portalUser = request.portalUser as PortalUser;

        // Verify visibility
        const [visibility] = await db
            .select()
            .from(reportCustomerVisibility)
            .where(and(
                eq(reportCustomerVisibility.reportId, id),
                eq(reportCustomerVisibility.customerId, portalUser.customerId),
                eq(reportCustomerVisibility.isVisible, true)
            ))
            .limit(1);

        if (!visibility) {
            throw ApiError.notFound('Report');
        }

        const [report] = await db
            .select()
            .from(reports)
            .where(and(
                eq(reports.id, id),
                eq(reports.status, 'RELEASED')
            ))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        // Get documents
        const documents = await db
            .select({
                id: reportDocuments.id,
                version: reportDocuments.version,
                fileName: reportDocuments.fileName,
                createdAt: reportDocuments.createdAt,
            })
            .from(reportDocuments)
            .where(eq(reportDocuments.reportId, id))
            .orderBy(desc(reportDocuments.version));

        await logPortalActivity(portalUser.id, null, 'VIEW_REPORT', 'REPORT', id, request.ip);

        return reply.send({
            success: true,
            data: {
                report: {
                    id: report.id,
                    reportNumber: report.reportNumber,
                    title: report.title,
                    status: report.status,
                    releasedAt: report.releasedAt,
                },
                documents,
            },
        });
    });

    /**
     * Download report document
     * GET /portal/reports/:id/download/:documentId
     */
    fastify.get('/portal/reports/:id/download/:documentId', {
        preHandler: [requirePortalAuth],
    }, async (request: any, reply) => {
        const { id, documentId } = request.params as { id: string; documentId: string };
        const portalUser = request.portalUser as PortalUser;

        // Verify visibility
        const [visibility] = await db
            .select()
            .from(reportCustomerVisibility)
            .where(and(
                eq(reportCustomerVisibility.reportId, id),
                eq(reportCustomerVisibility.customerId, portalUser.customerId),
                eq(reportCustomerVisibility.isVisible, true)
            ))
            .limit(1);

        if (!visibility) {
            throw ApiError.notFound('Report');
        }

        // Check access policy
        const [policy] = await db
            .select()
            .from(portalAccessPolicies)
            .where(eq(portalAccessPolicies.customerId, portalUser.customerId))
            .limit(1);

        if (policy && !policy.canDownloadReports) {
            throw ApiError.forbidden('Report download is not enabled for your account');
        }

        // Get document
        const [document] = await db
            .select()
            .from(reportDocuments)
            .where(and(
                eq(reportDocuments.id, documentId),
                eq(reportDocuments.reportId, id)
            ))
            .limit(1);

        if (!document) {
            throw ApiError.notFound('Document');
        }

        await logPortalActivity(portalUser.id, null, 'DOWNLOAD_REPORT', 'REPORT', id, request.ip, {
            documentId,
            fileName: document.fileName,
        });

        // Return download info (actual file serving would be handled by storage)
        return reply.send({
            success: true,
            data: {
                documentId: document.id,
                fileName: document.fileName,
                filePath: document.filePath,
                // In production, this would return a pre-signed URL
                downloadUrl: `/api/storage/download/${document.filePath}`,
            },
        });
    });

    // ==================== Bulk Download ====================

    /**
     * Request bulk download of reports
     * POST /portal/reports/bulk-download
     */
    fastify.post('/portal/reports/bulk-download', {
        preHandler: [requirePortalAuth],
    }, async (request: any, reply) => {
        const portalUser = request.portalUser as PortalUser;
        const schema = z.object({
            reportIds: z.array(z.string().uuid()).min(1).max(50),
        });

        const { reportIds } = schema.parse(request.body);

        // Check access policy
        const [policy] = await db
            .select()
            .from(portalAccessPolicies)
            .where(eq(portalAccessPolicies.customerId, portalUser.customerId))
            .limit(1);

        if (policy && !policy.canDownloadReports) {
            throw ApiError.forbidden('Report download is not enabled for your account');
        }

        // Verify all reports are visible to custom customer
        const visibleReports = await db
            .select({ reportId: reportCustomerVisibility.reportId })
            .from(reportCustomerVisibility)
            .where(and(
                sql`${reportCustomerVisibility.reportId} IN (${sql.join(reportIds.map(id => sql`${id}`), sql`, `)})`,
                eq(reportCustomerVisibility.customerId, portalUser.customerId),
                eq(reportCustomerVisibility.isVisible, true)
            ));

        const visibleIds = new Set(visibleReports.map(r => r.reportId));
        const invalidIds = reportIds.filter(id => !visibleIds.has(id));

        if (invalidIds.length > 0) {
            throw ApiError.badRequest(`Some reports are not accessible: ${invalidIds.join(', ')}`);
        }

        // Get documents for all reports
        const documents = await db
            .select({
                reportId: reportDocuments.reportId,
                documentId: reportDocuments.id,
                fileName: reportDocuments.fileName,
                filePath: reportDocuments.filePath,
            })
            .from(reportDocuments)
            .where(sql`${reportDocuments.reportId} IN (${sql.join(reportIds.map(id => sql`${id}`), sql`, `)})`);

        await logPortalActivity(portalUser.id, null, 'BULK_DOWNLOAD', undefined, undefined, request.ip, {
            reportCount: reportIds.length,
            reportIds,
        });

        // In production, this would generate a ZIP file or return pre-signed URLs
        return reply.send({
            success: true,
            data: {
                message: 'Bulk download request initiated',
                reportCount: reportIds.length,
                documents: documents.map(d => ({
                    reportId: d.reportId,
                    documentId: d.documentId,
                    fileName: d.fileName,
                    downloadUrl: `/api/storage/download/${d.filePath}`,
                })),
            },
        });
    });

    // ==================== Activity History ====================

    /**
     * Get portal activity history
     * GET /portal/activity
     */
    fastify.get('/portal/activity', {
        preHandler: [requirePortalAuth],
    }, async (request: any, reply) => {
        const portalUser = request.portalUser as PortalUser;
        const { page = '1', limit = '20' } = request.query as Record<string, string>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        const activities = await db
            .select()
            .from(portalActivityLogs)
            .where(eq(portalActivityLogs.accountId, portalUser.id))
            .orderBy(desc(portalActivityLogs.createdAt))
            .limit(limitNum)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(portalActivityLogs)
            .where(eq(portalActivityLogs.accountId, portalUser.id));

        return reply.send({
            success: true,
            data: {
                activities,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: countResult?.count || 0,
                    totalPages: Math.ceil((countResult?.count || 0) / limitNum),
                },
            },
        });
    });
};

export default portalRoutes;
