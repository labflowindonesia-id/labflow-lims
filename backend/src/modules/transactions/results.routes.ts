import { FastifyInstance } from 'fastify';
import { db } from '../../db/index';
import {
    testResults,
    testRuns,
    resultAttachments,
    calculations,
    qcChecks,
    nonconformities,
    testTasks
} from '../../db/schema';
import { parameters, subparameters, units, instruments } from '../../db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError, successResponse } from '../../shared/errors';

// ==================== TEST RESULTS ====================
export async function resultsRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/results
     */
    fastify.get<{
        Querystring: {
            page?: number;
            limit?: number;
            taskId?: string;
            parameterId?: string;
            complianceStatus?: string;
            qcStatus?: string;
        }
    }>('/api/results', {
        preHandler: [requireAuth, requirePermission('results:read')],
        schema: {
            description: 'List all test results',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { page = 1, limit = 50, taskId, parameterId, complianceStatus, qcStatus } = request.query;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (taskId) {
            conditions.push(eq(testResults.taskId, taskId));
        }
        if (parameterId) {
            conditions.push(eq(testResults.parameterId, parameterId));
        }
        if (complianceStatus) {
            conditions.push(eq(testResults.complianceStatus, complianceStatus as 'PASS' | 'FAIL' | 'NOT_EVALUATED'));
        }
        if (qcStatus) {
            conditions.push(eq(testResults.qcStatus, qcStatus as 'PASS' | 'FAIL' | 'NONE'));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(testResults).where(whereClause);
        const resultsList = await db.select().from(testResults).where(whereClause).orderBy(desc(testResults.createdAt)).limit(limit).offset(offset);

        return successResponse(resultsList, {
            page,
            perPage: limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
        });
    });

    /**
     * GET /api/results/:id
     */
    fastify.get<{ Params: { id: string } }>('/api/results/:id', {
        preHandler: [requireAuth, requirePermission('results:read')],
        schema: {
            description: 'Get result by ID with runs and attachments',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;

        const [result] = await db.select().from(testResults).where(eq(testResults.id, id)).limit(1);
        if (!result) throw ApiError.notFound('Result');

        // Get related data
        const runs = await db.select().from(testRuns).where(eq(testRuns.taskId, result.taskId)).orderBy(testRuns.runNumber);
        const attachments = await db.select().from(resultAttachments).where(eq(resultAttachments.resultId, id));
        const calcs = await db.select().from(calculations).where(eq(calculations.resultId, id));
        const qcs = await db.select().from(qcChecks).where(eq(qcChecks.resultId, id));
        const ncs = await db.select().from(nonconformities).where(eq(nonconformities.resultId, id));

        // Get task and parameter info
        const [task] = await db.select().from(testTasks).where(eq(testTasks.id, result.taskId)).limit(1);
        const [parameter] = result.parameterId ? await db.select().from(parameters).where(eq(parameters.id, result.parameterId)).limit(1) : [null];
        const [unit] = result.unitId ? await db.select().from(units).where(eq(units.id, result.unitId)).limit(1) : [null];

        return successResponse({
            ...result,
            task,
            parameter,
            unit,
            runs,
            attachments,
            calculations: calcs,
            qcChecks: qcs,
            nonconformities: ncs,
        });
    });

    /**
     * POST /api/results
     * Enter a test result
     */
    fastify.post<{
        Body: {
            taskId: string;
            runId?: string;
            resultValue?: number;
            resultText?: string;
            unitId?: string;
            isND?: boolean;
            ndReportingStyle?: 'ND_TEXT' | 'LT_LOD' | 'LT_LOQ';
            lodValue?: number;
            loqValue?: number;
            uncertainty?: number;
            uncertaintyUnit?: string;
            limitMin?: number;
            limitMax?: number;
        }
    }>('/api/results', {
        preHandler: [requireAuth, requirePermission('results:write')],
        schema: {
            description: 'Enter a test result',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['taskId'],
                properties: {
                    taskId: { type: 'string' },
                    runId: { type: 'string' },
                    resultValue: { type: 'number' },
                    resultText: { type: 'string' },
                    unitId: { type: 'string' },
                    isND: { type: 'boolean', default: false },
                    ndReportingStyle: { type: 'string', enum: ['ND_TEXT', 'LT_LOD', 'LT_LOQ'] },
                    lodValue: { type: 'number' },
                    loqValue: { type: 'number' },
                    uncertainty: { type: 'number' },
                    uncertaintyUnit: { type: 'string' },
                    limitMin: { type: 'number' },
                    limitMax: { type: 'number' },
                },
            },
        },
    }, async (request, reply) => {
        const resultData = request.body;
        const userId = request.user!.id;

        // Validate task
        const [task] = await db.select().from(testTasks).where(eq(testTasks.id, resultData.taskId)).limit(1);
        if (!task) throw ApiError.notFound('Task');

        // Check if result already exists
        const [existing] = await db.select().from(testResults).where(eq(testResults.taskId, resultData.taskId)).limit(1);
        if (existing) {
            throw ApiError.conflict('Result already exists for this task. Use PUT to update.');
        }

        // Determine compliance status
        let complianceStatus: 'PASS' | 'FAIL' | 'NOT_EVALUATED' = 'NOT_EVALUATED';
        if (resultData.resultValue !== undefined && (resultData.limitMin !== undefined || resultData.limitMax !== undefined)) {
            const value = resultData.resultValue;
            const meetsMin = resultData.limitMin === undefined || value >= resultData.limitMin;
            const meetsMax = resultData.limitMax === undefined || value <= resultData.limitMax;
            complianceStatus = (meetsMin && meetsMax) ? 'PASS' : 'FAIL';
        }

        const [newResult] = await db.insert(testResults).values({
            id: crypto.randomUUID(),
            taskId: resultData.taskId,
            runId: resultData.runId,
            parameterId: task.parameterId,
            subparameterId: task.subparameterId,
            resultValue: resultData.resultValue !== undefined ? String(resultData.resultValue) : null,
            resultText: resultData.resultText,
            unitId: resultData.unitId,
            isND: resultData.isND || false,
            ndReportingStyle: resultData.ndReportingStyle,
            lodValue: resultData.lodValue !== undefined ? String(resultData.lodValue) : null,
            loqValue: resultData.loqValue !== undefined ? String(resultData.loqValue) : null,
            uncertainty: resultData.uncertainty !== undefined ? String(resultData.uncertainty) : null,
            uncertaintyUnit: resultData.uncertaintyUnit,
            limitMin: resultData.limitMin !== undefined ? String(resultData.limitMin) : null,
            limitMax: resultData.limitMax !== undefined ? String(resultData.limitMax) : null,
            complianceStatus,
            enteredBy: userId,
            enteredAt: new Date(),
            version: 1,
        }).returning();

        return reply.status(201).send(successResponse(newResult));
    });

    /**
     * PUT /api/results/:id
     * Update a result (creates new version)
     */
    fastify.put<{
        Params: { id: string };
        Body: {
            resultValue?: number;
            resultText?: string;
            unitId?: string;
            isND?: boolean;
            ndReportingStyle?: 'ND_TEXT' | 'LT_LOD' | 'LT_LOQ';
            lodValue?: number;
            loqValue?: number;
            uncertainty?: number;
            uncertaintyUnit?: string;
            limitMin?: number;
            limitMax?: number;
        }
    }>('/api/results/:id', {
        preHandler: [requireAuth, requirePermission('results:write')],
        schema: {
            description: 'Update a test result',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const updateData = request.body;
        const userId = request.user!.id;

        const [existing] = await db.select().from(testResults).where(eq(testResults.id, id)).limit(1);
        if (!existing) throw ApiError.notFound('Result');

        // Recalculate compliance if needed
        let complianceStatus = existing.complianceStatus;
        const resultValue = updateData.resultValue !== undefined ? updateData.resultValue : (existing.resultValue ? Number(existing.resultValue) : undefined);
        const limitMin = updateData.limitMin !== undefined ? updateData.limitMin : (existing.limitMin ? Number(existing.limitMin) : undefined);
        const limitMax = updateData.limitMax !== undefined ? updateData.limitMax : (existing.limitMax ? Number(existing.limitMax) : undefined);

        if (resultValue !== undefined && (limitMin !== undefined || limitMax !== undefined)) {
            const meetsMin = limitMin === undefined || resultValue >= limitMin;
            const meetsMax = limitMax === undefined || resultValue <= limitMax;
            complianceStatus = (meetsMin && meetsMax) ? 'PASS' : 'FAIL';
        }

        const updatePayload: Record<string, unknown> = {
            version: existing.version + 1,
            complianceStatus,
            enteredBy: userId,
            enteredAt: new Date(),
            updatedAt: new Date(),
        };

        if (updateData.resultValue !== undefined) updatePayload.resultValue = String(updateData.resultValue);
        if (updateData.resultText !== undefined) updatePayload.resultText = updateData.resultText;
        if (updateData.unitId !== undefined) updatePayload.unitId = updateData.unitId;
        if (updateData.isND !== undefined) updatePayload.isND = updateData.isND;
        if (updateData.ndReportingStyle !== undefined) updatePayload.ndReportingStyle = updateData.ndReportingStyle;
        if (updateData.lodValue !== undefined) updatePayload.lodValue = String(updateData.lodValue);
        if (updateData.loqValue !== undefined) updatePayload.loqValue = String(updateData.loqValue);
        if (updateData.uncertainty !== undefined) updatePayload.uncertainty = String(updateData.uncertainty);
        if (updateData.uncertaintyUnit !== undefined) updatePayload.uncertaintyUnit = updateData.uncertaintyUnit;
        if (updateData.limitMin !== undefined) updatePayload.limitMin = String(updateData.limitMin);
        if (updateData.limitMax !== undefined) updatePayload.limitMax = String(updateData.limitMax);

        const [updated] = await db.update(testResults).set(updatePayload).where(eq(testResults.id, id)).returning();

        return successResponse(updated);
    });

    // ==================== TEST RUNS ====================
    /**
     * POST /api/tasks/:taskId/runs
     */
    fastify.post<{
        Params: { taskId: string };
        Body: {
            instrumentId?: string;
            dilutionFactor?: number;
            rawReading?: number;
            blankReading?: number;
            notes?: string;
            isFinal?: boolean;
        }
    }>('/api/tasks/:taskId/runs', {
        preHandler: [requireAuth, requirePermission('results:write')],
        schema: {
            description: 'Record a test run',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const { taskId } = request.params;
        const runData = request.body;
        const userId = request.user!.id;

        const [task] = await db.select().from(testTasks).where(eq(testTasks.id, taskId)).limit(1);
        if (!task) throw ApiError.notFound('Task');

        // Get next run number
        const [maxRun] = await db
            .select({ max: sql<number>`COALESCE(MAX(${testRuns.runNumber}), 0)` })
            .from(testRuns)
            .where(eq(testRuns.taskId, taskId));

        const [newRun] = await db.insert(testRuns).values({
            id: crypto.randomUUID(),
            taskId,
            runNumber: Number(maxRun.max) + 1,
            instrumentId: runData.instrumentId || task.instrumentId,
            dilutionFactor: runData.dilutionFactor !== undefined ? String(runData.dilutionFactor) : '1',
            rawReading: runData.rawReading !== undefined ? String(runData.rawReading) : null,
            blankReading: runData.blankReading !== undefined ? String(runData.blankReading) : null,
            startedAt: new Date(),
            performedBy: userId,
            notes: runData.notes,
            isFinal: runData.isFinal || false,
        }).returning();

        // If marked as final, update previous runs
        if (runData.isFinal) {
            await db.update(testRuns).set({ isFinal: false }).where(
                and(eq(testRuns.taskId, taskId), sql`${testRuns.id} != ${newRun.id}`)
            );
        }

        return reply.status(201).send(successResponse(newRun));
    });

    /**
     * PUT /api/runs/:runId/complete
     */
    fastify.put<{ Params: { runId: string }; Body: { rawReading?: number; blankReading?: number; notes?: string } }>('/api/runs/:runId/complete', {
        preHandler: [requireAuth, requirePermission('results:write')],
        schema: {
            description: 'Complete a test run',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { runId } = request.params;
        const { rawReading, blankReading, notes } = request.body;

        const updateData: Record<string, unknown> = {
            completedAt: new Date(),
        };
        if (rawReading !== undefined) updateData.rawReading = String(rawReading);
        if (blankReading !== undefined) updateData.blankReading = String(blankReading);
        if (notes !== undefined) updateData.notes = notes;

        const [updated] = await db.update(testRuns).set(updateData).where(eq(testRuns.id, runId)).returning();
        if (!updated) throw ApiError.notFound('Run');

        return successResponse(updated);
    });

    // ==================== QC CHECKS ====================
    /**
     * POST /api/results/:resultId/qc-checks
     */
    fastify.post<{
        Params: { resultId: string };
        Body: {
            checkType: string;
            expectedValue?: number;
            actualValue: number;
            acceptanceMin?: number;
            acceptanceMax?: number;
            remarks?: string;
        }
    }>('/api/results/:resultId/qc-checks', {
        preHandler: [requireAuth, requirePermission('results:write')],
        schema: {
            description: 'Add QC check to result',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const { resultId } = request.params;
        const qcData = request.body;

        const [result] = await db.select().from(testResults).where(eq(testResults.id, resultId)).limit(1);
        if (!result) throw ApiError.notFound('Result');

        // Determine if passed
        let isPassed = true;
        if (qcData.acceptanceMin !== undefined && qcData.actualValue < qcData.acceptanceMin) isPassed = false;
        if (qcData.acceptanceMax !== undefined && qcData.actualValue > qcData.acceptanceMax) isPassed = false;

        const [newCheck] = await db.insert(qcChecks).values({
            id: crypto.randomUUID(),
            resultId,
            checkType: qcData.checkType,
            expectedValue: qcData.expectedValue !== undefined ? String(qcData.expectedValue) : null,
            actualValue: String(qcData.actualValue),
            acceptanceMin: qcData.acceptanceMin !== undefined ? String(qcData.acceptanceMin) : null,
            acceptanceMax: qcData.acceptanceMax !== undefined ? String(qcData.acceptanceMax) : null,
            isPassed,
            remarks: qcData.remarks,
        }).returning();

        // Update result QC status
        const allChecks = await db.select().from(qcChecks).where(eq(qcChecks.resultId, resultId));
        const allPassed = allChecks.every(c => c.isPassed);
        await db.update(testResults).set({
            qcStatus: allPassed ? 'PASS' : 'FAIL',
            updatedAt: new Date(),
        }).where(eq(testResults.id, resultId));

        return reply.status(201).send(successResponse(newCheck));
    });

    // ==================== NONCONFORMITIES ====================
    /**
     * POST /api/results/:resultId/nonconformities
     */
    fastify.post<{
        Params: { resultId: string };
        Body: {
            description: string;
            rootCause?: string;
            correctiveAction?: string;
            preventiveAction?: string;
        }
    }>('/api/results/:resultId/nonconformities', {
        preHandler: [requireAuth, requirePermission('results:write')],
        schema: {
            description: 'Raise a nonconformity for a result',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const { resultId } = request.params;
        const ncData = request.body;
        const userId = request.user!.id;

        const [result] = await db.select().from(testResults).where(eq(testResults.id, resultId)).limit(1);
        if (!result) throw ApiError.notFound('Result');

        // Generate NC number
        const now = new Date();
        const ncNumber = `NC/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        const [newNC] = await db.insert(nonconformities).values({
            id: crypto.randomUUID(),
            resultId,
            taskId: result.taskId,
            ncNumber,
            description: ncData.description,
            rootCause: ncData.rootCause,
            correctiveAction: ncData.correctiveAction,
            preventiveAction: ncData.preventiveAction,
            status: 'OPEN',
            raisedBy: userId,
            raisedAt: new Date(),
        }).returning();

        return reply.status(201).send(successResponse(newNC));
    });

    /**
     * PUT /api/nonconformities/:ncId/resolve
     */
    fastify.put<{ Params: { ncId: string }; Body: { correctiveAction: string; preventiveAction?: string } }>('/api/nonconformities/:ncId/resolve', {
        preHandler: [requireAuth, requirePermission('results:write')],
        schema: {
            description: 'Resolve a nonconformity',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { ncId } = request.params;
        const { correctiveAction, preventiveAction } = request.body;
        const userId = request.user!.id;

        const [updated] = await db.update(nonconformities).set({
            status: 'RESOLVED',
            correctiveAction,
            preventiveAction,
            resolvedBy: userId,
            resolvedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(nonconformities.id, ncId)).returning();

        if (!updated) throw ApiError.notFound('Nonconformity');

        return successResponse(updated);
    });
}
