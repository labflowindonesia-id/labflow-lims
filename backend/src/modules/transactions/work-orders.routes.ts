import { FastifyInstance } from 'fastify';
import { db } from '../../db/index';
import {
    workOrders,
    samples,
    samplePhotos,
    samplingDetails,
    fieldMeasurements,
    requestedTests,
    quotations,
    quotationLines
} from '../../db/schema';
import { customers, customerContacts, sampleMatrices, parameters, subparameters, methods, instruments } from '../../db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError, successResponse } from '../../shared/errors';

// Helper to generate work order number
function generateWorkOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `WO/${year}${month}${day}/${random}`;
}

// Helper to generate sample lab ID
function generateSampleLabId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `R/${year}${month}${random}`;
}

// ==================== WORK ORDERS ====================
export async function workOrdersRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/work-orders
     */
    fastify.get<{
        Querystring: {
            page?: number;
            limit?: number;
            search?: string;
            status?: string;
            customerId?: string;
            fromDate?: string;
            toDate?: string;
        }
    }>('/api/work-orders', {
        preHandler: [requireAuth, requirePermission('work-orders:read')],
        schema: {
            description: 'List all work orders with pagination',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { page = 1, limit = 20, search, status, customerId, fromDate, toDate } = request.query;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (search) {
            conditions.push(sql`${workOrders.workOrderNumber} ILIKE ${`%${search}%`}`);
        }
        if (status) {
            conditions.push(eq(workOrders.status, status as 'RECEIVED_DRAFT' | 'RECEIVED_CONFIRMED' | 'IN_ANALYSIS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'));
        }
        if (customerId) {
            conditions.push(eq(workOrders.customerId, customerId));
        }
        if (fromDate) {
            conditions.push(sql`${workOrders.receivedDate} >= ${new Date(fromDate)}`);
        }
        if (toDate) {
            conditions.push(sql`${workOrders.receivedDate} <= ${new Date(toDate)}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(workOrders)
            .where(whereClause);

        const ordersList = await db
            .select({
                id: workOrders.id,
                workOrderNumber: workOrders.workOrderNumber,
                customerId: workOrders.customerId,
                customerNameSnapshot: workOrders.customerNameSnapshot,
                status: workOrders.status,
                receivedDate: workOrders.receivedDate,
                dueDate: workOrders.dueDate,
                totalSamples: workOrders.totalSamples,
                createdAt: workOrders.createdAt,
            })
            .from(workOrders)
            .where(whereClause)
            .orderBy(desc(workOrders.receivedDate))
            .limit(limit)
            .offset(offset);

        return successResponse(ordersList, {
            page,
            perPage: limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
        });
    });

    /**
     * GET /api/work-orders/:id
     */
    fastify.get<{ Params: { id: string } }>('/api/work-orders/:id', {
        preHandler: [requireAuth, requirePermission('work-orders:read')],
        schema: {
            description: 'Get work order by ID with samples',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;

        const [workOrder] = await db
            .select()
            .from(workOrders)
            .where(eq(workOrders.id, id))
            .limit(1);

        if (!workOrder) {
            throw ApiError.notFound('Work Order');
        }

        // Get samples
        const samplesList = await db
            .select()
            .from(samples)
            .where(eq(samples.workOrderId, id));

        // Get requested tests for each sample
        const sampleIds = samplesList.map(s => s.id);
        const tests = sampleIds.length > 0
            ? await db.select().from(requestedTests).where(inArray(requestedTests.sampleId, sampleIds))
            : [];

        const testsBySample = tests.reduce((acc, test) => {
            if (!acc[test.sampleId]) acc[test.sampleId] = [];
            acc[test.sampleId].push(test);
            return acc;
        }, {} as Record<string, typeof tests>);

        const samplesWithTests = samplesList.map(sample => ({
            ...sample,
            requestedTests: testsBySample[sample.id] || [],
        }));

        // Get customer info
        const [customer] = await db.select().from(customers).where(eq(customers.id, workOrder.customerId)).limit(1);
        const [matrix] = await db.select().from(sampleMatrices).where(eq(sampleMatrices.id, workOrder.matrixId)).limit(1);

        return successResponse({
            ...workOrder,
            customer,
            matrix,
            samples: samplesWithTests,
        });
    });

    /**
     * POST /api/work-orders
     * Create work order (can be from quotation or walk-in)
     */
    fastify.post<{
        Body: {
            quotationId?: string;
            customerId: string;
            contactId?: string;
            matrixId: string;
            dueDate?: string;
            receiverNotes?: string;
            samples?: {
                customerSampleId?: string;
                sampleName?: string;
                description?: string;
                condition?: 'INTACT' | 'LEAK' | 'DAMAGED' | 'OTHER';
                conditionNotes?: string;
                samplingDate?: string;
                collectedBy?: string;
                tests?: {
                    parameterId?: string;
                    subparameterId?: string;
                    methodId?: string;
                    instrumentId?: string;
                    tatDays?: number;
                    priceAmount?: number;
                }[];
            }[];
        }
    }>('/api/work-orders', {
        preHandler: [requireAuth, requirePermission('work-orders:write')],
        schema: {
            description: 'Create a new work order (from quotation or walk-in)',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const { samples: samplesData, quotationId, dueDate, ...orderData } = request.body;
        const userId = request.user!.id;

        // Validate customer
        const [customer] = await db.select().from(customers).where(eq(customers.id, orderData.customerId)).limit(1);
        if (!customer) throw ApiError.notFound('Customer');

        // If from quotation, validate it's approved
        if (quotationId) {
            const [quotation] = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
            if (!quotation) throw ApiError.notFound('Quotation');
            if (quotation.status !== 'APPROVED') throw ApiError.badRequest('Quotation must be approved');
        }

        const workOrderNumber = generateWorkOrderNumber();
        const totalSamples = samplesData?.length || 1;

        // Create work order
        const [newWorkOrder] = await db.insert(workOrders).values({
            id: crypto.randomUUID(),
            workOrderNumber,
            quotationId,
            customerId: orderData.customerId,
            contactId: orderData.contactId,
            customerNameSnapshot: customer.name,
            customerAddressSnapshot: customer.address,
            matrixId: orderData.matrixId,
            status: 'RECEIVED_DRAFT',
            receivedDate: new Date(),
            dueDate: dueDate ? new Date(dueDate) : null,
            totalSamples,
            receiverNotes: orderData.receiverNotes,
            createdBy: userId,
        }).returning();

        // Create samples
        if (samplesData && samplesData.length > 0) {
            for (const sampleData of samplesData) {
                const sampleLabId = generateSampleLabId();

                const [newSample] = await db.insert(samples).values({
                    id: crypto.randomUUID(),
                    workOrderId: newWorkOrder.id,
                    sampleLabId,
                    customerSampleId: sampleData.customerSampleId,
                    sampleName: sampleData.sampleName,
                    description: sampleData.description,
                    matrixId: orderData.matrixId,
                    condition: sampleData.condition || 'INTACT',
                    conditionNotes: sampleData.conditionNotes,
                    samplingDate: sampleData.samplingDate ? new Date(sampleData.samplingDate) : null,
                    collectedBy: sampleData.collectedBy,
                }).returning();

                // Create requested tests for sample
                if (sampleData.tests && sampleData.tests.length > 0) {
                    await db.insert(requestedTests).values(
                        sampleData.tests.map(test => ({
                            id: crypto.randomUUID(),
                            sampleId: newSample.id,
                            parameterId: test.parameterId,
                            subparameterId: test.subparameterId,
                            methodId: test.methodId,
                            instrumentId: test.instrumentId,
                            tatDays: test.tatDays || 5,
                            dueDate: dueDate ? new Date(dueDate) : null,
                            priceAmount: test.priceAmount ? String(test.priceAmount) : null,
                        }))
                    );
                }
            }
        }

        return reply.status(201).send(successResponse(newWorkOrder));
    });

    /**
     * POST /api/work-orders/:id/confirm
     */
    fastify.post<{ Params: { id: string } }>('/api/work-orders/:id/confirm', {
        preHandler: [requireAuth, requirePermission('work-orders:write')],
        schema: {
            description: 'Confirm sample receiving (start work order)',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const userId = request.user!.id;

        const [existing] = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
        if (!existing) throw ApiError.notFound('Work Order');
        if (existing.status !== 'RECEIVED_DRAFT') throw ApiError.badRequest('Work order is not in draft status');

        // Check has samples
        const [sampleCount] = await db.select({ count: sql<number>`count(*)` }).from(samples).where(eq(samples.workOrderId, id));
        if (Number(sampleCount.count) === 0) {
            throw ApiError.badRequest('Work order must have at least one sample');
        }

        const [updated] = await db.update(workOrders).set({
            status: 'RECEIVED_CONFIRMED',
            confirmedDate: new Date(),
            confirmedBy: userId,
            updatedAt: new Date(),
        }).where(eq(workOrders.id, id)).returning();

        return successResponse({ message: 'Work order confirmed', workOrder: updated });
    });

    /**
     * PUT /api/work-orders/:id/status
     */
    fastify.put<{ Params: { id: string }; Body: { status: string } }>('/api/work-orders/:id/status', {
        preHandler: [requireAuth, requirePermission('work-orders:write')],
        schema: {
            description: 'Update work order status',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const { status } = request.body;

        const validStatuses = ['RECEIVED_DRAFT', 'RECEIVED_CONFIRMED', 'IN_ANALYSIS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            throw ApiError.badRequest('Invalid status');
        }

        const updateData: Record<string, unknown> = {
            status: status as typeof validStatuses[number],
            updatedAt: new Date(),
        };

        if (status === 'COMPLETED') {
            updateData.completedDate = new Date();
        }

        const [updated] = await db.update(workOrders).set(updateData).where(eq(workOrders.id, id)).returning();
        if (!updated) throw ApiError.notFound('Work Order');

        return successResponse(updated);
    });

    // ==================== SAMPLES ====================
    /**
     * POST /api/work-orders/:id/samples
     */
    fastify.post<{
        Params: { id: string };
        Body: {
            customerSampleId?: string;
            sampleName?: string;
            description?: string;
            condition?: 'INTACT' | 'LEAK' | 'DAMAGED' | 'OTHER';
            conditionNotes?: string;
            samplingDate?: string;
            collectedBy?: string;
        }
    }>('/api/work-orders/:id/samples', {
        preHandler: [requireAuth, requirePermission('work-orders:write')],
        schema: {
            description: 'Add sample to work order',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const sampleData = request.body;

        const [workOrder] = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
        if (!workOrder) throw ApiError.notFound('Work Order');
        if (!['RECEIVED_DRAFT', 'RECEIVED_CONFIRMED'].includes(workOrder.status)) {
            throw ApiError.badRequest('Cannot add samples once work order is in analysis');
        }

        const sampleLabId = generateSampleLabId();

        const [newSample] = await db.insert(samples).values({
            id: crypto.randomUUID(),
            workOrderId: id,
            sampleLabId,
            customerSampleId: sampleData.customerSampleId,
            sampleName: sampleData.sampleName,
            description: sampleData.description,
            matrixId: workOrder.matrixId,
            condition: sampleData.condition || 'INTACT',
            conditionNotes: sampleData.conditionNotes,
            samplingDate: sampleData.samplingDate ? new Date(sampleData.samplingDate) : null,
            collectedBy: sampleData.collectedBy,
        }).returning();

        // Update sample count
        await db.update(workOrders).set({
            totalSamples: workOrder.totalSamples + 1,
            updatedAt: new Date(),
        }).where(eq(workOrders.id, id));

        return reply.status(201).send(successResponse(newSample));
    });

    /**
     * GET /api/samples/:sampleId
     */
    fastify.get<{ Params: { sampleId: string } }>('/api/samples/:sampleId', {
        preHandler: [requireAuth, requirePermission('work-orders:read')],
        schema: {
            description: 'Get sample details',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { sampleId } = request.params;

        const [sample] = await db.select().from(samples).where(eq(samples.id, sampleId)).limit(1);
        if (!sample) throw ApiError.notFound('Sample');

        const tests = await db.select().from(requestedTests).where(eq(requestedTests.sampleId, sampleId));
        const photos = await db.select().from(samplePhotos).where(eq(samplePhotos.sampleId, sampleId));
        const [details] = await db.select().from(samplingDetails).where(eq(samplingDetails.sampleId, sampleId)).limit(1);
        const measurements = await db.select().from(fieldMeasurements).where(eq(fieldMeasurements.sampleId, sampleId));

        return successResponse({
            ...sample,
            requestedTests: tests,
            photos,
            samplingDetails: details || null,
            fieldMeasurements: measurements,
        });
    });

    // ==================== REQUESTED TESTS ====================
    /**
     * POST /api/samples/:sampleId/tests
     */
    fastify.post<{
        Params: { sampleId: string };
        Body: {
            parameterId?: string;
            subparameterId?: string;
            methodId?: string;
            instrumentId?: string;
            tatDays?: number;
            priceAmount?: number;
        }
    }>('/api/samples/:sampleId/tests', {
        preHandler: [requireAuth, requirePermission('work-orders:write')],
        schema: {
            description: 'Add requested test to sample',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const { sampleId } = request.params;
        const testData = request.body;

        const [sample] = await db.select().from(samples).where(eq(samples.id, sampleId)).limit(1);
        if (!sample) throw ApiError.notFound('Sample');

        const [workOrder] = await db.select().from(workOrders).where(eq(workOrders.id, sample.workOrderId)).limit(1);
        if (!workOrder) throw ApiError.notFound('Work Order');

        const [newTest] = await db.insert(requestedTests).values({
            id: crypto.randomUUID(),
            sampleId,
            parameterId: testData.parameterId,
            subparameterId: testData.subparameterId,
            methodId: testData.methodId,
            instrumentId: testData.instrumentId,
            tatDays: testData.tatDays || 5,
            dueDate: workOrder.dueDate,
            priceAmount: testData.priceAmount ? String(testData.priceAmount) : null,
        }).returning();

        return reply.status(201).send(successResponse(newTest));
    });
}
