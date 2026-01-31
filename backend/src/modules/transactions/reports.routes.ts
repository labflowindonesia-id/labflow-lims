/**
 * Report API Routes
 * Handles Certificate of Analysis (CoA) generation, approval, signing, and release
 */
import { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index';
import {
    reports,
    reportCustomerSnapshot,
    reportSampleSnapshot,
    reportResults,
    reportConformityStatements,
    reportDocuments,
    reportLocks,
    signatures,
    reportStatusEnum,
} from '../../db/schema/reports';
import { workOrders, samples } from '../../db/schema/work-orders';
import { customers } from '../../db/schema/customers';
import { testResults } from '../../db/schema/results';
import { parameters } from '../../db/schema/master-data';
import { users } from '../../db/schema/users';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError } from '../../shared/errors';
import crypto from 'crypto';

// Type definitions
type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'LOCKED' | 'RELEASED';

// Helper to generate report number
function generateReportNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LAB-${year}${month}-${random}`;
}

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
    // ==================== Reports ====================

    /**
     * List all reports
     * GET /api/reports
     */
    fastify.get('/reports', {
        preHandler: [requireAuth, requirePermission('reports:read')],
    }, async (request, reply) => {
        const { workOrderId, status, page = '1', limit = '20' } = request.query as Record<string, string>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = sql`1=1`;

        if (workOrderId) {
            whereClause = sql`${whereClause} AND ${reports.workOrderId} = ${workOrderId}`;
        }

        if (status) {
            whereClause = sql`${whereClause} AND ${reports.status} = ${status}`;
        }

        const reportList = await db
            .select({
                id: reports.id,
                reportNumber: reports.reportNumber,
                revisionNumber: reports.revisionNumber,
                workOrderId: reports.workOrderId,
                status: reports.status,
                title: reports.title,
                isLocked: reports.isLocked,
                generatedAt: reports.generatedAt,
                approvedAt: reports.approvedAt,
                releasedAt: reports.releasedAt,
                createdAt: reports.createdAt,
            })
            .from(reports)
            .where(whereClause)
            .orderBy(desc(reports.createdAt))
            .limit(limitNum)
            .offset(offset);

        // Get total count
        const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(reports)
            .where(whereClause);

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
     * GET /api/reports/:id
     */
    fastify.get('/reports/:id', {
        preHandler: [requireAuth, requirePermission('reports:read')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        // Get customer snapshot
        const [customerSnap] = await db
            .select()
            .from(reportCustomerSnapshot)
            .where(eq(reportCustomerSnapshot.reportId, id))
            .limit(1);

        // Get sample snapshots
        const sampleSnaps = await db
            .select()
            .from(reportSampleSnapshot)
            .where(eq(reportSampleSnapshot.reportId, id));

        // Get results
        const results = await db
            .select()
            .from(reportResults)
            .where(eq(reportResults.reportId, id))
            .orderBy(reportResults.sortOrder);

        // Get conformity statements
        const conformityStatements = await db
            .select()
            .from(reportConformityStatements)
            .where(eq(reportConformityStatements.reportId, id))
            .orderBy(reportConformityStatements.sortOrder);

        // Get documents
        const documents = await db
            .select()
            .from(reportDocuments)
            .where(eq(reportDocuments.reportId, id))
            .orderBy(desc(reportDocuments.createdAt));

        return reply.send({
            success: true,
            data: {
                ...report,
                customer: customerSnap,
                samples: sampleSnaps,
                results,
                conformityStatements,
                documents,
            },
        });
    });

    /**
     * Generate report from work order
     * POST /api/reports
     */
    fastify.post('/reports', {
        preHandler: [requireAuth, requirePermission('reports:write')],
    }, async (request, reply) => {
        const schema = z.object({
            workOrderId: z.string().uuid(),
            title: z.string().optional(),
            regulationReference: z.string().optional(),
            publicNotes: z.string().optional(),
        });

        const body = schema.parse(request.body);
        const userId = request.user!.id;

        // Get work order with samples
        const [workOrder] = await db
            .select()
            .from(workOrders)
            .where(eq(workOrders.id, body.workOrderId))
            .limit(1);

        if (!workOrder) {
            throw ApiError.notFound('Work Order');
        }

        // Check if report already exists for this work order
        const [existingReport] = await db
            .select()
            .from(reports)
            .where(eq(reports.workOrderId, body.workOrderId))
            .limit(1);

        if (existingReport) {
            throw ApiError.badRequest('Report already exists for this work order');
        }

        // Get customer
        const [customer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, workOrder.customerId))
            .limit(1);

        if (!customer) {
            throw ApiError.notFound('Customer');
        }

        // Get samples
        const sampleList = await db
            .select()
            .from(samples)
            .where(eq(samples.workOrderId, body.workOrderId));

        // Get results for all samples (join with tasks to get sampleId)
        const sampleIds = sampleList.map(s => s.id);
        const allResults = await db
            .select({
                id: testResults.id,
                taskId: testResults.taskId,
                parameterId: testResults.parameterId,
                resultValue: testResults.resultValue,
                resultText: testResults.resultText,
                unitId: testResults.unitId,
                limitMin: testResults.limitMin,
                limitMax: testResults.limitMax,
                complianceStatus: testResults.complianceStatus,
            })
            .from(testResults);

        const parameterIds = [...new Set(allResults.map(r => r.parameterId).filter(Boolean))];
        const parametersList = parameterIds.length > 0
            ? await db
                .select()
                .from(parameters)
                .where(inArray(parameters.id, parameterIds as string[]))
            : [];
        const parameterMap = new Map(parametersList.map(p => [p.id, p]));

        // Create report
        const reportId = crypto.randomUUID();
        const reportNumber = generateReportNumber();

        await db.insert(reports).values({
            id: reportId,
            reportNumber,
            workOrderId: body.workOrderId,
            status: 'DRAFT',
            title: body.title || `Certificate of Analysis - ${workOrder.workOrderNumber}`,
            regulationReference: body.regulationReference,
            generatedBy: userId,
            generatedAt: new Date(),
            publicNotes: body.publicNotes,
        });

        // Create customer snapshot
        await db.insert(reportCustomerSnapshot).values({
            id: crypto.randomUUID(),
            reportId,
            customerId: customer.id,
            customerName: customer.name,
            customerAddress: customer.address,
            contactEmail: customer.email,
            contactPhone: customer.phone,
        });

        // Create sample snapshots
        const sampleSnapshots = sampleList.map(sample => ({
            id: crypto.randomUUID(),
            reportId,
            sampleId: sample.id,
            sampleLabId: sample.sampleLabId,
            sampleName: sample.sampleName,
            receivedDate: workOrder.receivedDate,
            samplingDate: sample.samplingDate,
            condition: sample.condition,
        }));

        if (sampleSnapshots.length > 0) {
            await db.insert(reportSampleSnapshot).values(sampleSnapshots);
        }

        // Create sample snapshot map for results
        const sampleSnapshotMap = new Map(sampleSnapshots.map(s => [s.sampleId, s.id]));

        // Create result snapshots
        const resultSnapshots = allResults.map(result => {
            const parameter = result.parameterId ? parameterMap.get(result.parameterId) : null;
            const limitValue = result.limitMin && result.limitMax
                ? `${result.limitMin} - ${result.limitMax}`
                : result.limitMax?.toString() || result.limitMin?.toString() || null;
            return {
                id: crypto.randomUUID(),
                reportId,
                resultId: result.id,
                parameterName: parameter?.name || 'Unknown',
                resultValue: result.resultText || result.resultValue?.toString() || '',
                limitValue,
                complianceStatus: result.complianceStatus,
            };
        });

        if (resultSnapshots.length > 0) {
            await db.insert(reportResults).values(resultSnapshots);
        }

        return reply.status(201).send({
            success: true,
            data: {
                id: reportId,
                reportNumber,
                status: 'DRAFT',
                sampleCount: sampleList.length,
                resultCount: allResults.length,
            },
        });
    });

    /**
     * Update report
     * PUT /api/reports/:id
     */
    fastify.put('/reports/:id', {
        preHandler: [requireAuth, requirePermission('reports:write')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const schema = z.object({
            title: z.string().optional(),
            regulationReference: z.string().optional(),
            internalNotes: z.string().optional(),
            publicNotes: z.string().optional(),
        });

        const body = schema.parse(request.body);

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        if (report.isLocked) {
            throw ApiError.badRequest('Cannot modify locked report');
        }

        await db
            .update(reports)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(reports.id, id));

        return reply.send({
            success: true,
            data: { id, updated: true },
        });
    });

    /**
     * Submit report for approval
     * POST /api/reports/:id/submit
     */
    fastify.post('/reports/:id/submit', {
        preHandler: [requireAuth, requirePermission('reports:write')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        if (report.status !== 'DRAFT' && report.status !== 'REVISION_REQUESTED') {
            throw ApiError.badRequest('Report is not in a submittable state');
        }

        const typedStatus: ReportStatus = 'SUBMITTED';
        await db
            .update(reports)
            .set({
                status: typedStatus,
                updatedAt: new Date(),
            })
            .where(eq(reports.id, id));

        return reply.send({
            success: true,
            data: { id, status: 'SUBMITTED' },
        });
    });

    /**
     * Approve report
     * POST /api/reports/:id/approve
     */
    fastify.post('/reports/:id/approve', {
        preHandler: [requireAuth, requirePermission('reports:approve')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = request.user!.id;

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        if (report.status !== 'SUBMITTED') {
            throw ApiError.badRequest('Report must be submitted before approval');
        }

        const typedStatus: ReportStatus = 'APPROVED';
        await db
            .update(reports)
            .set({
                status: typedStatus,
                approvedBy: userId,
                approvedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(reports.id, id));

        return reply.send({
            success: true,
            data: { id, status: 'APPROVED', approvedAt: new Date() },
        });
    });

    /**
     * Request revision
     * POST /api/reports/:id/revision
     */
    fastify.post('/reports/:id/revision', {
        preHandler: [requireAuth, requirePermission('reports:approve')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { reason } = (request.body || {}) as { reason?: string };

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        if (report.status !== 'SUBMITTED') {
            throw ApiError.badRequest('Only submitted reports can be requested for revision');
        }

        const typedStatus: ReportStatus = 'REVISION_REQUESTED';
        await db
            .update(reports)
            .set({
                status: typedStatus,
                internalNotes: reason ? `Revision requested: ${reason}` : report.internalNotes,
                updatedAt: new Date(),
            })
            .where(eq(reports.id, id));

        return reply.send({
            success: true,
            data: { id, status: 'REVISION_REQUESTED' },
        });
    });

    /**
     * Sign report (add digital signature)
     * POST /api/reports/:id/sign
     */
    fastify.post('/reports/:id/sign', {
        preHandler: [requireAuth, requirePermission('reports:sign')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { signatureId } = (request.body || {}) as { signatureId?: string };
        const userId = request.user!.id;

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        if (report.status !== 'APPROVED') {
            throw ApiError.badRequest('Report must be approved before signing');
        }

        // Verify signature if provided
        let finalSignatureId = signatureId;
        if (!finalSignatureId) {
            // Get user's default signature
            const [userSignature] = await db
                .select()
                .from(signatures)
                .where(and(
                    eq(signatures.userId, userId),
                    eq(signatures.isActive, true)
                ))
                .limit(1);

            if (!userSignature) {
                throw ApiError.badRequest('No signature available. Please set up your signature first.');
            }
            finalSignatureId = userSignature.id;
        }

        await db
            .update(reports)
            .set({
                signatureId: finalSignatureId,
                signedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(reports.id, id));

        return reply.send({
            success: true,
            data: { id, signedAt: new Date() },
        });
    });

    /**
     * Lock report (prevent further changes)
     * POST /api/reports/:id/lock
     */
    fastify.post('/reports/:id/lock', {
        preHandler: [requireAuth, requirePermission('reports:approve')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { reason } = (request.body || {}) as { reason?: string };
        const userId = request.user!.id;

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        if (report.isLocked) {
            throw ApiError.badRequest('Report is already locked');
        }

        const typedStatus: ReportStatus = 'LOCKED';
        await db
            .update(reports)
            .set({
                status: typedStatus,
                isLocked: true,
                lockedAt: new Date(),
                lockedBy: userId,
                updatedAt: new Date(),
            })
            .where(eq(reports.id, id));

        // Create lock record
        await db.insert(reportLocks).values({
            id: crypto.randomUUID(),
            reportId: id,
            lockedBy: userId,
            reason,
        });

        return reply.send({
            success: true,
            data: { id, isLocked: true, lockedAt: new Date() },
        });
    });

    /**
     * Release report to customer
     * POST /api/reports/:id/release
     */
    fastify.post('/reports/:id/release', {
        preHandler: [requireAuth, requirePermission('reports:release')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = request.user!.id;

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        if (report.status === 'RELEASED') {
            throw ApiError.badRequest('Report is already released');
        }

        if (!report.signedAt) {
            throw ApiError.badRequest('Report must be signed before release');
        }

        const typedStatus: ReportStatus = 'RELEASED';
        await db
            .update(reports)
            .set({
                status: typedStatus,
                releasedAt: new Date(),
                releasedBy: userId,
                isLocked: true,
                lockedAt: report.lockedAt || new Date(),
                lockedBy: report.lockedBy || userId,
                updatedAt: new Date(),
            })
            .where(eq(reports.id, id));

        return reply.send({
            success: true,
            data: { id, status: 'RELEASED', releasedAt: new Date() },
        });
    });

    // ==================== Conformity Statements ====================

    /**
     * Add conformity statement
     * POST /api/reports/:id/conformity
     */
    fastify.post('/reports/:id/conformity', {
        preHandler: [requireAuth, requirePermission('reports:write')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const schema = z.object({
            statementText: z.string().min(1),
            sortOrder: z.number().int().optional(),
        });

        const body = schema.parse(request.body);

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        if (report.isLocked) {
            throw ApiError.badRequest('Cannot modify locked report');
        }

        const statementId = crypto.randomUUID();
        await db.insert(reportConformityStatements).values({
            id: statementId,
            reportId: id,
            statementText: body.statementText,
            sortOrder: body.sortOrder || 0,
        });

        return reply.status(201).send({
            success: true,
            data: { id: statementId },
        });
    });

    /**
     * Delete conformity statement
     * DELETE /api/reports/:id/conformity/:statementId
     */
    fastify.delete('/reports/:id/conformity/:statementId', {
        preHandler: [requireAuth, requirePermission('reports:write')],
    }, async (request, reply) => {
        const { id, statementId } = request.params as { id: string; statementId: string };

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        if (report.isLocked) {
            throw ApiError.badRequest('Cannot modify locked report');
        }

        await db
            .delete(reportConformityStatements)
            .where(and(
                eq(reportConformityStatements.id, statementId),
                eq(reportConformityStatements.reportId, id)
            ));

        return reply.send({
            success: true,
            data: { deleted: true },
        });
    });

    // ==================== Report Documents ====================

    /**
     * Add report document (PDF generation record)
     * POST /api/reports/:id/documents
     */
    fastify.post('/reports/:id/documents', {
        preHandler: [requireAuth, requirePermission('reports:write')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const schema = z.object({
            filePath: z.string().min(1),
            fileName: z.string().min(1),
            fileSize: z.number().int().optional(),
            isDraft: z.boolean().default(true),
            hasWatermark: z.boolean().default(true),
        });

        const body = schema.parse(request.body);
        const userId = request.user!.id;

        const [report] = await db
            .select()
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            throw ApiError.notFound('Report');
        }

        // Get current version
        const [lastDoc] = await db
            .select({ version: reportDocuments.version })
            .from(reportDocuments)
            .where(eq(reportDocuments.reportId, id))
            .orderBy(desc(reportDocuments.version))
            .limit(1);

        const version = (lastDoc?.version || 0) + 1;

        const docId = crypto.randomUUID();
        await db.insert(reportDocuments).values({
            id: docId,
            reportId: id,
            version,
            filePath: body.filePath,
            fileName: body.fileName,
            fileSize: body.fileSize,
            isDraft: body.isDraft,
            hasWatermark: body.hasWatermark,
            generatedBy: userId,
        });

        return reply.status(201).send({
            success: true,
            data: { id: docId, version },
        });
    });

    // ==================== Signatures ====================

    /**
     * List signatures (for current user or all if admin)
     * GET /api/signatures
     */
    fastify.get('/signatures', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const userId = request.user!.id;
        const isAdmin = request.user!.role === 'ADMIN';

        let signatureList;
        if (isAdmin) {
            signatureList = await db
                .select()
                .from(signatures)
                .orderBy(desc(signatures.createdAt));
        } else {
            signatureList = await db
                .select()
                .from(signatures)
                .where(eq(signatures.userId, userId))
                .orderBy(desc(signatures.createdAt));
        }

        return reply.send({
            success: true,
            data: { signatures: signatureList },
        });
    });

    /**
     * Create signature
     * POST /api/signatures
     */
    fastify.post('/signatures', {
        preHandler: [requireAuth, requirePermission('settings:write')],
    }, async (request, reply) => {
        const schema = z.object({
            signatoryName: z.string().min(1),
            signatoryTitle: z.string().optional(),
            signatureImagePath: z.string().optional(),
        });

        const body = schema.parse(request.body);
        const userId = request.user!.id;

        const signatureId = crypto.randomUUID();
        await db.insert(signatures).values({
            id: signatureId,
            userId,
            signatoryName: body.signatoryName,
            signatoryTitle: body.signatoryTitle,
            signatureImagePath: body.signatureImagePath,
        });

        return reply.status(201).send({
            success: true,
            data: { id: signatureId },
        });
    });
};

export default reportRoutes;
