import { FastifyInstance } from 'fastify';
import { db } from '../../db/index';
import {
    testTasks,
    workPlans,
    taskStatusLogs,
    requestedTests,
    samples,
    taskStatusEnum,
    taskPriorityEnum
} from '../../db/schema';
import { analysts, parameters, methods } from '../../db/schema';
import { eq, and, sql, desc, inArray, isNull } from 'drizzle-orm';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError, successResponse } from '../../shared/errors';

// Type for task status
type TaskStatus = 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_RECHECK' | 'COMPLETED' | 'CANCELLED';
type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// Helper to generate task number
function generateTaskNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `TK/${year}${month}${day}/${random}`;
}

// ==================== WORK PLANS ====================
export async function tasksRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/work-plans
     */
    fastify.get<{
        Querystring: {
            page?: number;
            limit?: number;
            departmentId?: string;
            fromDate?: string;
            toDate?: string;
        }
    }>('/api/work-plans', {
        preHandler: [requireAuth, requirePermission('tasks:read')],
        schema: {
            description: 'List all work plans',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { page = 1, limit = 20, departmentId, fromDate, toDate } = request.query;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (departmentId) {
            conditions.push(eq(workPlans.departmentId, departmentId));
        }
        if (fromDate) {
            conditions.push(sql`${workPlans.plannedDate} >= ${new Date(fromDate)}`);
        }
        if (toDate) {
            conditions.push(sql`${workPlans.plannedDate} <= ${new Date(toDate)}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(workPlans).where(whereClause);
        const plansList = await db.select().from(workPlans).where(whereClause).orderBy(desc(workPlans.plannedDate)).limit(limit).offset(offset);

        // Get task counts for each plan
        const planIds = plansList.map(p => p.id);
        const taskCounts = planIds.length > 0
            ? await db
                .select({
                    workPlanId: testTasks.workPlanId,
                    count: sql<number>`count(*)`,
                    completed: sql<number>`SUM(CASE WHEN ${testTasks.status} = 'COMPLETED' THEN 1 ELSE 0 END)`
                })
                .from(testTasks)
                .where(inArray(testTasks.workPlanId, planIds))
                .groupBy(testTasks.workPlanId)
            : [];

        const countsByPlan = taskCounts.reduce((acc, tc) => {
            if (tc.workPlanId) {
                acc[tc.workPlanId] = { total: Number(tc.count), completed: Number(tc.completed) };
            }
            return acc;
        }, {} as Record<string, { total: number; completed: number }>);

        const result = plansList.map(plan => ({
            ...plan,
            taskCount: countsByPlan[plan.id]?.total || 0,
            completedCount: countsByPlan[plan.id]?.completed || 0,
        }));

        return successResponse(result, {
            page,
            perPage: limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
        });
    });

    /**
     * POST /api/work-plans
     */
    fastify.post<{
        Body: {
            name: string;
            plannedDate: string;
            departmentId?: string;
            notes?: string;
        }
    }>('/api/work-plans', {
        preHandler: [requireAuth, requirePermission('tasks:write')],
        schema: {
            description: 'Create a new work plan',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['name', 'plannedDate'],
                properties: {
                    name: { type: 'string' },
                    plannedDate: { type: 'string', format: 'date' },
                    departmentId: { type: 'string' },
                    notes: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        const { plannedDate, ...planData } = request.body;
        const userId = request.user!.id;

        const [newPlan] = await db.insert(workPlans).values({
            id: crypto.randomUUID(),
            ...planData,
            plannedDate: new Date(plannedDate),
            createdBy: userId,
        }).returning();

        return reply.status(201).send(successResponse(newPlan));
    });

    // ==================== TEST TASKS ====================
    /**
     * GET /api/tasks
     */
    fastify.get<{
        Querystring: {
            page?: number;
            limit?: number;
            status?: string;
            priority?: string;
            assignedToId?: string;
            workPlanId?: string;
            sampleId?: string;
            isOverdue?: boolean;
            unassigned?: boolean;
        }
    }>('/api/tasks', {
        preHandler: [requireAuth, requirePermission('tasks:read')],
        schema: {
            description: 'List all test tasks with filtering',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { page = 1, limit = 50, status, priority, assignedToId, workPlanId, sampleId, isOverdue, unassigned } = request.query;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (status) {
            conditions.push(eq(testTasks.status, status as 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_RECHECK' | 'COMPLETED' | 'CANCELLED'));
        }
        if (priority) {
            conditions.push(eq(testTasks.priority, priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'));
        }
        if (assignedToId) {
            conditions.push(eq(testTasks.assignedToId, assignedToId));
        }
        if (workPlanId) {
            conditions.push(eq(testTasks.workPlanId, workPlanId));
        }
        if (sampleId) {
            conditions.push(eq(testTasks.sampleId, sampleId));
        }
        if (isOverdue) {
            conditions.push(eq(testTasks.isOverdue, true));
        }
        if (unassigned) {
            conditions.push(isNull(testTasks.assignedToId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(testTasks).where(whereClause);

        const tasksList = await db
            .select({
                id: testTasks.id,
                taskNumber: testTasks.taskNumber,
                sampleId: testTasks.sampleId,
                workPlanId: testTasks.workPlanId,
                parameterId: testTasks.parameterId,
                subparameterId: testTasks.subparameterId,
                methodId: testTasks.methodId,
                assignedToId: testTasks.assignedToId,
                status: testTasks.status,
                priority: testTasks.priority,
                plannedDate: testTasks.plannedDate,
                dueDate: testTasks.dueDate,
                isOverdue: testTasks.isOverdue,
                isUrgent: testTasks.isUrgent,
            })
            .from(testTasks)
            .where(whereClause)
            .orderBy(desc(testTasks.createdAt))
            .limit(limit)
            .offset(offset);

        return successResponse(tasksList, {
            page,
            perPage: limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
        });
    });

    /**
     * GET /api/tasks/:id
     */
    fastify.get<{ Params: { id: string } }>('/api/tasks/:id', {
        preHandler: [requireAuth, requirePermission('tasks:read')],
        schema: {
            description: 'Get task by ID with details',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;

        const [task] = await db.select().from(testTasks).where(eq(testTasks.id, id)).limit(1);
        if (!task) throw ApiError.notFound('Task');

        // Get related info
        const [sample] = task.sampleId ? await db.select().from(samples).where(eq(samples.id, task.sampleId)).limit(1) : [null];
        const [parameter] = task.parameterId ? await db.select().from(parameters).where(eq(parameters.id, task.parameterId)).limit(1) : [null];
        const [method] = task.methodId ? await db.select().from(methods).where(eq(methods.id, task.methodId)).limit(1) : [null];
        const [analyst] = task.assignedToId ? await db.select().from(analysts).where(eq(analysts.id, task.assignedToId)).limit(1) : [null];

        // Get status logs
        const statusLogs = await db.select().from(taskStatusLogs).where(eq(taskStatusLogs.taskId, id)).orderBy(desc(taskStatusLogs.createdAt));

        return successResponse({
            ...task,
            sample,
            parameter,
            method,
            analyst,
            statusLogs,
        });
    });

    /**
     * POST /api/tasks
     * Create task from requested test
     */
    fastify.post<{
        Body: {
            requestedTestId: string;
            workPlanId?: string;
            priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
            plannedDate?: string;
        }
    }>('/api/tasks', {
        preHandler: [requireAuth, requirePermission('tasks:write')],
        schema: {
            description: 'Create a test task from requested test',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const { requestedTestId, workPlanId, priority, plannedDate } = request.body;

        // Get requested test
        const [requestedTest] = await db.select().from(requestedTests).where(eq(requestedTests.id, requestedTestId)).limit(1);
        if (!requestedTest) throw ApiError.notFound('Requested Test');

        // Check not already scheduled
        if (requestedTest.isScheduled) {
            throw ApiError.badRequest('This test has already been scheduled');
        }

        const taskNumber = generateTaskNumber();

        const [newTask] = await db.insert(testTasks).values({
            id: crypto.randomUUID(),
            taskNumber,
            requestedTestId,
            sampleId: requestedTest.sampleId,
            workPlanId,
            parameterId: requestedTest.parameterId,
            subparameterId: requestedTest.subparameterId,
            methodId: requestedTest.methodId,
            instrumentId: requestedTest.instrumentId,
            status: 'PLANNED',
            priority: priority || 'NORMAL',
            plannedDate: plannedDate ? new Date(plannedDate) : null,
            dueDate: requestedTest.dueDate,
        }).returning();

        // Mark requested test as scheduled
        await db.update(requestedTests).set({
            isScheduled: true,
            updatedAt: new Date(),
        }).where(eq(requestedTests.id, requestedTestId));

        return reply.status(201).send(successResponse(newTask));
    });

    /**
     * POST /api/tasks/bulk
     * Create multiple tasks from requested tests
     */
    fastify.post<{
        Body: {
            requestedTestIds: string[];
            workPlanId?: string;
            priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
            plannedDate?: string;
        }
    }>('/api/tasks/bulk', {
        preHandler: [requireAuth, requirePermission('tasks:write')],
        schema: {
            description: 'Create multiple test tasks',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const { requestedTestIds, workPlanId, priority, plannedDate } = request.body;

        const tests = await db.select().from(requestedTests).where(
            and(
                inArray(requestedTests.id, requestedTestIds),
                eq(requestedTests.isScheduled, false)
            )
        );

        if (tests.length === 0) {
            throw ApiError.badRequest('No unscheduled tests found');
        }

        const tasksToInsert = tests.map(test => ({
            id: crypto.randomUUID(),
            taskNumber: generateTaskNumber(),
            requestedTestId: test.id,
            sampleId: test.sampleId,
            workPlanId,
            parameterId: test.parameterId,
            subparameterId: test.subparameterId,
            methodId: test.methodId,
            instrumentId: test.instrumentId,
            status: 'PLANNED' as const,
            priority: priority || 'NORMAL' as const,
            plannedDate: plannedDate ? new Date(plannedDate) : null,
            dueDate: test.dueDate,
        }));

        await db.insert(testTasks).values(tasksToInsert);

        // Mark tests as scheduled
        await db.update(requestedTests).set({
            isScheduled: true,
            updatedAt: new Date(),
        }).where(inArray(requestedTests.id, tests.map(t => t.id)));

        return reply.status(201).send(successResponse({ created: tasksToInsert.length }));
    });

    /**
     * PUT /api/tasks/:id/assign
     */
    fastify.put<{ Params: { id: string }; Body: { analystId: string } }>('/api/tasks/:id/assign', {
        preHandler: [requireAuth, requirePermission('tasks:write')],
        schema: {
            description: 'Assign task to analyst',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const { analystId } = request.body;
        const userId = request.user!.id;

        const [task] = await db.select().from(testTasks).where(eq(testTasks.id, id)).limit(1);
        if (!task) throw ApiError.notFound('Task');

        // Validate analyst exists
        const [analyst] = await db.select().from(analysts).where(eq(analysts.id, analystId)).limit(1);
        if (!analyst) throw ApiError.notFound('Analyst');

        const previousStatus = task.status;
        const newStatus: TaskStatus = 'ASSIGNED';

        const [updated] = await db.update(testTasks).set({
            assignedToId: analystId,
            assignedBy: userId,
            assignedAt: new Date(),
            status: newStatus,
            updatedAt: new Date(),
        }).where(eq(testTasks.id, id)).returning();

        // Log status change
        await db.insert(taskStatusLogs).values({
            id: crypto.randomUUID(),
            taskId: id,
            previousStatus,
            newStatus,
            changedBy: userId,
            reason: 'Assigned to analyst',
        });

        return successResponse(updated);
    });

    /**
     * PUT /api/tasks/:id/status
     */
    fastify.put<{ Params: { id: string }; Body: { status: string; reason?: string } }>('/api/tasks/:id/status', {
        preHandler: [requireAuth, requirePermission('tasks:write')],
        schema: {
            description: 'Update task status',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const { status, reason } = request.body;
        const userId = request.user!.id;

        const validStatuses: TaskStatus[] = ['PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_RECHECK', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status as TaskStatus)) {
            throw ApiError.badRequest('Invalid status');
        }

        const [task] = await db.select().from(testTasks).where(eq(testTasks.id, id)).limit(1);
        if (!task) throw ApiError.notFound('Task');

        const previousStatus = task.status;
        const typedStatus = status as TaskStatus;
        const updateData: Record<string, unknown> = {
            status: typedStatus,
            updatedAt: new Date(),
        };

        if (status === 'IN_PROGRESS' && !task.startedAt) {
            updateData.startedAt = new Date();
        }
        if (status === 'COMPLETED') {
            updateData.completedAt = new Date();

            // Mark requested test as completed
            await db.update(requestedTests).set({
                isCompleted: true,
                updatedAt: new Date(),
            }).where(eq(requestedTests.id, task.requestedTestId));
        }

        const [updated] = await db.update(testTasks).set(updateData).where(eq(testTasks.id, id)).returning();

        // Log status change
        await db.insert(taskStatusLogs).values({
            id: crypto.randomUUID(),
            taskId: id,
            previousStatus,
            newStatus: typedStatus,
            changedBy: userId,
            reason,
        });

        return successResponse(updated);
    });

    /**
     * PUT /api/tasks/:id/priority
     */
    fastify.put<{ Params: { id: string }; Body: { priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' } }>('/api/tasks/:id/priority', {
        preHandler: [requireAuth, requirePermission('tasks:write')],
        schema: {
            description: 'Update task priority',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const { priority } = request.body;

        const [updated] = await db.update(testTasks).set({
            priority,
            isUrgent: priority === 'URGENT',
            updatedAt: new Date(),
        }).where(eq(testTasks.id, id)).returning();

        if (!updated) throw ApiError.notFound('Task');

        return successResponse(updated);
    });
}
