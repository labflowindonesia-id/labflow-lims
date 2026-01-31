/**
 * Review API Routes
 * Handles result submission, review approval, and revision workflow
 */
import { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index';
import {
    resultSubmissions,
    submissionItems,
    revisionRequests,
    revisionRequestItems,
    resultVersions,
    submissionStatusEnum,
} from '../../db/schema/reports';
import { testTasks, taskStatusEnum } from '../../db/schema/tasks';
import { testResults } from '../../db/schema/results';
import { workOrders } from '../../db/schema/work-orders';
import { users } from '../../db/schema/users';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError } from '../../shared/errors';
import crypto from 'crypto';

// Type definitions
type SubmissionStatus = 'SUBMITTED' | 'RETURNED' | 'APPROVED';
type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

// Helper to generate submission number
function generateSubmissionNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SUB-${timestamp}-${random}`;
}

// Helper to generate revision number
function generateRevisionNumber(submissionId: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `REV-${submissionId.substring(0, 8).toUpperCase()}-${timestamp}`;
}

export const reviewRoutes: FastifyPluginAsync = async (fastify) => {
    // ==================== Result Submissions ====================

    /**
     * List all result submissions
     * GET /api/submissions
     */
    fastify.get('/submissions', {
        preHandler: [requireAuth, requirePermission('results:read')],
    }, async (request, reply) => {
        const { workOrderId, status, page = '1', limit = '20' } = request.query as Record<string, string>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = sql`1=1`;

        if (workOrderId) {
            whereClause = sql`${whereClause} AND ${resultSubmissions.workOrderId} = ${workOrderId}`;
        }

        if (status) {
            whereClause = sql`${whereClause} AND ${resultSubmissions.status} = ${status}`;
        }

        const submissions = await db
            .select({
                id: resultSubmissions.id,
                submissionNumber: resultSubmissions.submissionNumber,
                workOrderId: resultSubmissions.workOrderId,
                status: resultSubmissions.status,
                submittedBy: resultSubmissions.submittedBy,
                submittedAt: resultSubmissions.submittedAt,
                reviewedBy: resultSubmissions.reviewedBy,
                reviewedAt: resultSubmissions.reviewedAt,
                analystNotes: resultSubmissions.analystNotes,
                reviewerNotes: resultSubmissions.reviewerNotes,
                createdAt: resultSubmissions.createdAt,
            })
            .from(resultSubmissions)
            .where(whereClause)
            .orderBy(desc(resultSubmissions.createdAt))
            .limit(limitNum)
            .offset(offset);

        // Get total count
        const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(resultSubmissions)
            .where(whereClause);

        return reply.send({
            success: true,
            data: {
                submissions,
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
     * Get submission details
     * GET /api/submissions/:id
     */
    fastify.get('/submissions/:id', {
        preHandler: [requireAuth, requirePermission('results:read')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const [submission] = await db
            .select()
            .from(resultSubmissions)
            .where(eq(resultSubmissions.id, id))
            .limit(1);

        if (!submission) {
            throw ApiError.notFound('Submission');
        }

        // Get submission items
        const items = await db
            .select({
                id: submissionItems.id,
                taskId: submissionItems.taskId,
                resultId: submissionItems.resultId,
                isApproved: submissionItems.isApproved,
                returnReason: submissionItems.returnReason,
            })
            .from(submissionItems)
            .where(eq(submissionItems.submissionId, id));

        // Get revision requests
        const revisions = await db
            .select()
            .from(revisionRequests)
            .where(eq(revisionRequests.submissionId, id))
            .orderBy(desc(revisionRequests.requestedAt));

        return reply.send({
            success: true,
            data: {
                ...submission,
                items,
                revisionRequests: revisions,
            },
        });
    });

    /**
     * Create result submission (analyst submits for review)
     * POST /api/submissions
     */
    fastify.post('/submissions', {
        preHandler: [requireAuth, requirePermission('results:submit')],
    }, async (request, reply) => {
        const schema = z.object({
            workOrderId: z.string().uuid(),
            taskIds: z.array(z.string().uuid()).min(1),
            analystNotes: z.string().optional(),
        });

        const body = schema.parse(request.body);
        const userId = request.user!.id;

        // Verify work order exists
        const [workOrder] = await db
            .select()
            .from(workOrders)
            .where(eq(workOrders.id, body.workOrderId))
            .limit(1);

        if (!workOrder) {
            throw ApiError.notFound('Work Order');
        }

        // Verify all tasks exist and are completed
        const tasks = await db
            .select()
            .from(testTasks)
            .where(inArray(testTasks.id, body.taskIds));

        if (tasks.length !== body.taskIds.length) {
            throw ApiError.badRequest('One or more tasks not found');
        }

        const incompleteTasks = tasks.filter(t => t.status !== 'COMPLETED');
        if (incompleteTasks.length > 0) {
            throw ApiError.badRequest(`${incompleteTasks.length} tasks are not completed yet`);
        }

        // Get results for these tasks
        const results = await db
            .select()
            .from(testResults)
            .where(inArray(testResults.taskId, body.taskIds));

        const resultMap = new Map(results.map(r => [r.taskId, r]));

        // Create submission
        const submissionId = crypto.randomUUID();
        const submissionNumber = generateSubmissionNumber();

        await db.insert(resultSubmissions).values({
            id: submissionId,
            submissionNumber,
            workOrderId: body.workOrderId,
            status: 'SUBMITTED',
            submittedBy: userId,
            analystNotes: body.analystNotes,
        });

        // Create submission items
        const submissionItemsData = body.taskIds.map(taskId => ({
            id: crypto.randomUUID(),
            submissionId,
            taskId,
            resultId: resultMap.get(taskId)?.id || null,
        }));

        await db.insert(submissionItems).values(submissionItemsData);

        // Update task statuses to indicate submitted for review
        await db
            .update(testTasks)
            .set({ updatedAt: new Date() })
            .where(inArray(testTasks.id, body.taskIds));

        return reply.status(201).send({
            success: true,
            data: {
                id: submissionId,
                submissionNumber,
                status: 'SUBMITTED',
                itemCount: body.taskIds.length,
            },
        });
    });

    /**
     * Approve submission (manager approves all results)
     * POST /api/submissions/:id/approve
     */
    fastify.post('/submissions/:id/approve', {
        preHandler: [requireAuth, requirePermission('review:approve')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { reviewerNotes } = (request.body || {}) as { reviewerNotes?: string };
        const userId = request.user!.id;

        const [submission] = await db
            .select()
            .from(resultSubmissions)
            .where(eq(resultSubmissions.id, id))
            .limit(1);

        if (!submission) {
            throw ApiError.notFound('Submission');
        }

        if (submission.status === 'APPROVED') {
            throw ApiError.badRequest('Submission already approved');
        }

        // Get submission items and mark all as approved
        await db
            .update(submissionItems)
            .set({ isApproved: true })
            .where(eq(submissionItems.submissionId, id));

        // Update submission status
        const typedStatus: SubmissionStatus = 'APPROVED';
        await db
            .update(resultSubmissions)
            .set({
                status: typedStatus,
                reviewedBy: userId,
                reviewedAt: new Date(),
                reviewerNotes,
                updatedAt: new Date(),
            })
            .where(eq(resultSubmissions.id, id));

        return reply.send({
            success: true,
            data: {
                id,
                status: 'APPROVED',
                reviewedAt: new Date(),
            },
        });
    });

    /**
     * Return submission for revision
     * POST /api/submissions/:id/return
     */
    fastify.post('/submissions/:id/return', {
        preHandler: [requireAuth, requirePermission('review:approve')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const schema = z.object({
            scope: z.enum(['ENTIRE_REPORT', 'SPECIFIC_TESTS']).default('SPECIFIC_TESTS'),
            reason: z.string().min(1),
            taskIds: z.array(z.string().uuid()).optional(),
            reviewerNotes: z.string().optional(),
        });

        const body = schema.parse(request.body);
        const userId = request.user!.id;

        const [submission] = await db
            .select()
            .from(resultSubmissions)
            .where(eq(resultSubmissions.id, id))
            .limit(1);

        if (!submission) {
            throw ApiError.notFound('Submission');
        }

        if (submission.status === 'APPROVED') {
            throw ApiError.badRequest('Cannot return approved submission');
        }

        // Update submission status
        const typedStatus: SubmissionStatus = 'RETURNED';
        await db
            .update(resultSubmissions)
            .set({
                status: typedStatus,
                reviewedBy: userId,
                reviewedAt: new Date(),
                reviewerNotes: body.reviewerNotes,
                updatedAt: new Date(),
            })
            .where(eq(resultSubmissions.id, id));

        // Create revision request
        const revisionId = crypto.randomUUID();
        const revisionNumber = generateRevisionNumber(id);

        await db.insert(revisionRequests).values({
            id: revisionId,
            revisionNumber,
            submissionId: id,
            scope: body.scope,
            reason: body.reason,
            requestedBy: userId,
        });

        // If specific tests, create revision request items
        if (body.scope === 'SPECIFIC_TESTS' && body.taskIds?.length) {
            const revisionItems = body.taskIds.map(taskId => ({
                id: crypto.randomUUID(),
                revisionRequestId: revisionId,
                taskId,
            }));

            await db.insert(revisionRequestItems).values(revisionItems);

            // Mark specific items as not approved
            await db
                .update(submissionItems)
                .set({ isApproved: false, returnReason: body.reason })
                .where(and(
                    eq(submissionItems.submissionId, id),
                    inArray(submissionItems.taskId, body.taskIds)
                ));
        }

        return reply.send({
            success: true,
            data: {
                id,
                status: 'RETURNED',
                revisionRequest: {
                    id: revisionId,
                    revisionNumber,
                    scope: body.scope,
                    reason: body.reason,
                },
            },
        });
    });

    /**
     * Resubmit after revision
     * POST /api/submissions/:id/resubmit
     */
    fastify.post('/submissions/:id/resubmit', {
        preHandler: [requireAuth, requirePermission('results:submit')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { analystNotes } = (request.body || {}) as { analystNotes?: string };
        const userId = request.user!.id;

        const [submission] = await db
            .select()
            .from(resultSubmissions)
            .where(eq(resultSubmissions.id, id))
            .limit(1);

        if (!submission) {
            throw ApiError.notFound('Submission');
        }

        if (submission.status !== 'RETURNED') {
            throw ApiError.badRequest('Only returned submissions can be resubmitted');
        }

        // Update submission status back to SUBMITTED
        const typedStatus: SubmissionStatus = 'SUBMITTED';
        await db
            .update(resultSubmissions)
            .set({
                status: typedStatus,
                submittedBy: userId,
                submittedAt: new Date(),
                analystNotes: analystNotes || submission.analystNotes,
                reviewedBy: null,
                reviewedAt: null,
                reviewerNotes: null,
                updatedAt: new Date(),
            })
            .where(eq(resultSubmissions.id, id));

        // Resolve any pending revision requests
        await db
            .update(revisionRequests)
            .set({
                isResolved: true,
                resolvedBy: userId,
                resolvedAt: new Date(),
            })
            .where(and(
                eq(revisionRequests.submissionId, id),
                eq(revisionRequests.isResolved, false)
            ));

        // Reset submission items approval status
        await db
            .update(submissionItems)
            .set({ isApproved: null, returnReason: null })
            .where(eq(submissionItems.submissionId, id));

        return reply.send({
            success: true,
            data: {
                id,
                status: 'SUBMITTED',
                resubmittedAt: new Date(),
            },
        });
    });

    // ==================== Revision Requests ====================

    /**
     * List revision requests
     * GET /api/revisions
     */
    fastify.get('/revisions', {
        preHandler: [requireAuth, requirePermission('results:read')],
    }, async (request, reply) => {
        const { submissionId, isResolved, page = '1', limit = '20' } = request.query as Record<string, string>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = sql`1=1`;

        if (submissionId) {
            whereClause = sql`${whereClause} AND ${revisionRequests.submissionId} = ${submissionId}`;
        }

        if (isResolved !== undefined) {
            whereClause = sql`${whereClause} AND ${revisionRequests.isResolved} = ${isResolved === 'true'}`;
        }

        const revisions = await db
            .select()
            .from(revisionRequests)
            .where(whereClause)
            .orderBy(desc(revisionRequests.requestedAt))
            .limit(limitNum)
            .offset(offset);

        return reply.send({
            success: true,
            data: { revisions },
        });
    });

    /**
     * Get revision request details
     * GET /api/revisions/:id
     */
    fastify.get('/revisions/:id', {
        preHandler: [requireAuth, requirePermission('results:read')],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const [revision] = await db
            .select()
            .from(revisionRequests)
            .where(eq(revisionRequests.id, id))
            .limit(1);

        if (!revision) {
            throw ApiError.notFound('Revision Request');
        }

        // Get revision items
        const items = await db
            .select()
            .from(revisionRequestItems)
            .where(eq(revisionRequestItems.revisionRequestId, id));

        return reply.send({
            success: true,
            data: {
                ...revision,
                items,
            },
        });
    });

    // ==================== Result Versions (Audit Trail) ====================

    /**
     * Get result version history
     * GET /api/results/:resultId/versions
     */
    fastify.get('/results/:resultId/versions', {
        preHandler: [requireAuth, requirePermission('results:read')],
    }, async (request, reply) => {
        const { resultId } = request.params as { resultId: string };

        const versions = await db
            .select({
                id: resultVersions.id,
                version: resultVersions.version,
                resultData: resultVersions.resultData,
                changedFields: resultVersions.changedFields,
                changeReason: resultVersions.changeReason,
                changedBy: resultVersions.changedBy,
                createdAt: resultVersions.createdAt,
            })
            .from(resultVersions)
            .where(eq(resultVersions.resultId, resultId))
            .orderBy(desc(resultVersions.version));

        return reply.send({
            success: true,
            data: { versions },
        });
    });
};

export default reviewRoutes;
