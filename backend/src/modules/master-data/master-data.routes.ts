import { FastifyInstance } from 'fastify';
import { db } from '../../db/index';
import {
    parameters,
    subparameters,
    methods,
    instruments,
    sampleMatrices,
    matrixParameterRules,
    priceList,
    testPackages,
    testPackageItems
} from '../../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError, successResponse } from '../../shared/errors';

// ==================== PARAMETERS ====================
export async function parametersRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/parameters
     */
    fastify.get<{ Querystring: { page?: number; limit?: number; search?: string; isActive?: boolean } }>('/api/parameters', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: {
            description: 'List all parameters with subparameters',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { page = 1, limit = 50, search, isActive } = request.query;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (search) {
            conditions.push(sql`${parameters.name} ILIKE ${`%${search}%`}`);
        }
        if (isActive !== undefined) {
            conditions.push(eq(parameters.isActive, isActive));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(parameters)
            .where(whereClause);

        const parametersList = await db
            .select()
            .from(parameters)
            .where(whereClause)
            .orderBy(parameters.name)
            .limit(limit)
            .offset(offset);

        // Get subparameters for each parameter
        const parameterIds = parametersList.map(p => p.id);
        const subparametersList = parameterIds.length > 0
            ? await db
                .select()
                .from(subparameters)
                .where(inArray(subparameters.parameterId, parameterIds))
            : [];

        // Group subparameters by parameterId
        const subparametersByParent = subparametersList.reduce((acc, sub) => {
            if (!acc[sub.parameterId]) acc[sub.parameterId] = [];
            acc[sub.parameterId].push(sub);
            return acc;
        }, {} as Record<string, typeof subparametersList>);

        const result = parametersList.map(param => ({
            ...param,
            subparameters: subparametersByParent[param.id] || [],
        }));

        return successResponse(result, {
            page,
            perPage: limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
        });
    });

    /**
     * GET /api/parameters/:id
     */
    fastify.get<{ Params: { id: string } }>('/api/parameters/:id', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: {
            description: 'Get parameter by ID with subparameters',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;

        const [parameter] = await db
            .select()
            .from(parameters)
            .where(eq(parameters.id, id))
            .limit(1);

        if (!parameter) {
            throw ApiError.notFound('Parameter');
        }

        const subs = await db
            .select()
            .from(subparameters)
            .where(eq(subparameters.parameterId, id));

        return successResponse({ ...parameter, subparameters: subs });
    });

    /**
     * POST /api/parameters
     */
    fastify.post<{ Body: { name: string; symbol?: string; group?: string; category?: string; hasSubparameter?: boolean; subparameters?: { name: string; casNumber?: string }[] } }>('/api/parameters', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Create a new parameter',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string' },
                    symbol: { type: 'string' },
                    group: { type: 'string' },
                    category: { type: 'string' },
                    hasSubparameter: { type: 'boolean', default: false },
                    subparameters: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                casNumber: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { subparameters: subs, ...paramData } = request.body;

        const [newParam] = await db
            .insert(parameters)
            .values({
                id: crypto.randomUUID(),
                ...paramData,
                hasSubparameter: subs && subs.length > 0 ? true : (paramData.hasSubparameter || false),
                isActive: true,
            })
            .returning();

        // Create subparameters if provided
        if (subs && subs.length > 0) {
            await db.insert(subparameters).values(
                subs.map(sub => ({
                    id: crypto.randomUUID(),
                    parameterId: newParam.id,
                    name: sub.name,
                    casNumber: sub.casNumber,
                    isActive: true,
                }))
            );
        }

        return reply.status(201).send(successResponse(newParam));
    });

    /**
     * PUT /api/parameters/:id
     */
    fastify.put<{ Params: { id: string }; Body: { name?: string; symbol?: string; group?: string; category?: string; isActive?: boolean } }>('/api/parameters/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Update parameter',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const updateData = request.body;

        const [updated] = await db
            .update(parameters)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(parameters.id, id))
            .returning();

        if (!updated) {
            throw ApiError.notFound('Parameter');
        }

        return successResponse(updated);
    });
}

// ==================== METHODS ====================
export async function methodsRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{ Querystring: { page?: number; limit?: number; search?: string } }>('/api/methods', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: { description: 'List all methods', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const { page = 1, limit = 50, search } = request.query;
        const offset = (page - 1) * limit;

        const conditions = search ? [sql`${methods.name} ILIKE ${`%${search}%`} OR ${methods.code} ILIKE ${`%${search}%`}`] : [];
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(methods).where(whereClause);
        const methodsList = await db.select().from(methods).where(whereClause).orderBy(methods.name).limit(limit).offset(offset);

        return successResponse(methodsList, { page, perPage: limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) });
    });

    fastify.post<{ Body: { code: string; name: string; description?: string; isAccredited?: boolean } }>('/api/methods', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Create method',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['code', 'name'],
                properties: {
                    code: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    isAccredited: { type: 'boolean', default: false },
                },
            },
        },
    }, async (request, reply) => {
        const [newMethod] = await db.insert(methods).values({
            id: crypto.randomUUID(),
            ...request.body,
            isActive: true
        }).returning();
        return reply.status(201).send(successResponse(newMethod));
    });

    fastify.put<{ Params: { id: string }; Body: { code?: string; name?: string; description?: string; isAccredited?: boolean; isActive?: boolean } }>('/api/methods/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Update method', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const [updated] = await db.update(methods).set({ ...request.body, updatedAt: new Date() }).where(eq(methods.id, request.params.id)).returning();
        if (!updated) throw ApiError.notFound('Method');
        return successResponse(updated);
    });
}

// ==================== INSTRUMENTS ====================
export async function instrumentsRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{ Querystring: { page?: number; limit?: number; search?: string } }>('/api/instruments', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: { description: 'List all instruments', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const { page = 1, limit = 50, search } = request.query;
        const offset = (page - 1) * limit;

        const conditions = search ? [sql`${instruments.name} ILIKE ${`%${search}%`}`] : [];
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(instruments).where(whereClause);
        const instrumentsList = await db.select().from(instruments).where(whereClause).orderBy(instruments.name).limit(limit).offset(offset);

        return successResponse(instrumentsList, { page, perPage: limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) });
    });

    fastify.post<{ Body: { name: string; code?: string; model?: string; serialNumber?: string; location?: string; calibrationDueDate?: string } }>('/api/instruments', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Create instrument', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request, reply) => {
        const { calibrationDueDate, ...rest } = request.body;
        const [newInstrument] = await db.insert(instruments).values({
            id: crypto.randomUUID(),
            ...rest,
            calibrationDueDate: calibrationDueDate ? new Date(calibrationDueDate) : null,
            isActive: true
        }).returning();
        return reply.status(201).send(successResponse(newInstrument));
    });

    fastify.put<{ Params: { id: string }; Body: { name?: string; code?: string; model?: string; serialNumber?: string; location?: string; calibrationDueDate?: string; isActive?: boolean } }>('/api/instruments/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Update instrument', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const { calibrationDueDate, ...rest } = request.body;
        const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
        if (calibrationDueDate) updateData.calibrationDueDate = new Date(calibrationDueDate);

        const [updated] = await db.update(instruments).set(updateData).where(eq(instruments.id, request.params.id)).returning();
        if (!updated) throw ApiError.notFound('Instrument');
        return successResponse(updated);
    });
}

// ==================== SAMPLE MATRICES ====================
export async function matricesRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{ Querystring: { page?: number; limit?: number; search?: string } }>('/api/matrices', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: { description: 'List all sample matrices', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const { page = 1, limit = 50, search } = request.query;
        const offset = (page - 1) * limit;

        const conditions = search ? [sql`${sampleMatrices.name} ILIKE ${`%${search}%`}`] : [];
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(sampleMatrices).where(whereClause);
        const matricesList = await db.select().from(sampleMatrices).where(whereClause).orderBy(sampleMatrices.name).limit(limit).offset(offset);

        return successResponse(matricesList, { page, perPage: limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) });
    });

    fastify.post<{ Body: { name: string; code?: string; category?: string } }>('/api/matrices', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Create sample matrix', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request, reply) => {
        const [newMatrix] = await db.insert(sampleMatrices).values({ id: crypto.randomUUID(), ...request.body, isActive: true }).returning();
        return reply.status(201).send(successResponse(newMatrix));
    });

    fastify.put<{ Params: { id: string }; Body: { name?: string; code?: string; category?: string; isActive?: boolean } }>('/api/matrices/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Update sample matrix', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const [updated] = await db.update(sampleMatrices).set({ ...request.body, updatedAt: new Date() }).where(eq(sampleMatrices.id, request.params.id)).returning();
        if (!updated) throw ApiError.notFound('Sample Matrix');
        return successResponse(updated);
    });
}

// ==================== MATRIX-PARAMETER RULES ====================
export async function rulesRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{ Querystring: { matrixId?: string; parameterId?: string } }>('/api/rules', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: { description: 'List matrix-parameter rules', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const { matrixId, parameterId } = request.query;

        const conditions = [];
        if (matrixId) conditions.push(eq(matrixParameterRules.matrixId, matrixId));
        if (parameterId) conditions.push(eq(matrixParameterRules.parameterId, parameterId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const rulesList = await db.select().from(matrixParameterRules).where(whereClause);

        return successResponse(rulesList);
    });

    fastify.post<{ Body: { matrixId: string; parameterId?: string; subparameterId?: string; defaultMethodId?: string; defaultInstrumentId?: string; defaultTatDays?: number; limitMin?: string; limitMax?: string; basePrice: string } }>('/api/rules', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Create matrix-parameter rule', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request, reply) => {
        const [newRule] = await db.insert(matrixParameterRules).values({
            id: crypto.randomUUID(),
            ...request.body,
            isActive: true
        }).returning();
        return reply.status(201).send(successResponse(newRule));
    });

    fastify.put<{ Params: { id: string }; Body: { defaultMethodId?: string; defaultInstrumentId?: string; defaultTatDays?: number; limitMin?: string; limitMax?: string; basePrice?: string; isActive?: boolean } }>('/api/rules/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Update matrix-parameter rule', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const [updated] = await db.update(matrixParameterRules).set({ ...request.body, updatedAt: new Date() }).where(eq(matrixParameterRules.id, request.params.id)).returning();
        if (!updated) throw ApiError.notFound('Rule');
        return successResponse(updated);
    });
}

// ==================== PRICE LIST ====================
export async function priceListRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{ Querystring: { matrixId?: string; parameterId?: string } }>('/api/prices', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: { description: 'List price list entries', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const { matrixId, parameterId } = request.query;

        const conditions = [];
        if (matrixId) conditions.push(eq(priceList.matrixId, matrixId));
        if (parameterId) conditions.push(eq(priceList.parameterId, parameterId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const prices = await db.select().from(priceList).where(whereClause);

        return successResponse(prices);
    });

    fastify.post<{ Body: { matrixId: string; parameterId?: string; subparameterId?: string; priceAmount: string; currency?: string; effectiveFrom?: string; effectiveTo?: string } }>('/api/prices', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Create price entry', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request, reply) => {
        const { effectiveFrom, effectiveTo, ...rest } = request.body;
        const [newPrice] = await db.insert(priceList).values({
            id: crypto.randomUUID(),
            ...rest,
            effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
            effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
            isActive: true
        }).returning();
        return reply.status(201).send(successResponse(newPrice));
    });

    fastify.put<{ Params: { id: string }; Body: { priceAmount?: string; currency?: string; effectiveFrom?: string; effectiveTo?: string; isActive?: boolean } }>('/api/prices/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Update price entry', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const { effectiveFrom, effectiveTo, ...rest } = request.body;
        const updateData: Record<string, unknown> = { ...rest };
        if (effectiveFrom) updateData.effectiveFrom = new Date(effectiveFrom);
        if (effectiveTo) updateData.effectiveTo = new Date(effectiveTo);

        const [updated] = await db.update(priceList).set(updateData).where(eq(priceList.id, request.params.id)).returning();
        if (!updated) throw ApiError.notFound('Price');
        return successResponse(updated);
    });
}

// ==================== TEST PACKAGES ====================
export async function testPackagesRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{ Querystring: { page?: number; limit?: number; search?: string } }>('/api/packages', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: { description: 'List all test packages', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const { page = 1, limit = 50, search } = request.query;
        const offset = (page - 1) * limit;

        const conditions = search ? [sql`${testPackages.name} ILIKE ${`%${search}%`}`] : [];
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(testPackages).where(whereClause);
        const packagesList = await db.select().from(testPackages).where(whereClause).orderBy(testPackages.name).limit(limit).offset(offset);

        // Get items for each package
        const packageIds = packagesList.map(p => p.id);
        const items = packageIds.length > 0
            ? await db.select().from(testPackageItems).where(inArray(testPackageItems.packageId, packageIds))
            : [];

        const itemsByPackage = items.reduce((acc, item) => {
            if (!acc[item.packageId]) acc[item.packageId] = [];
            acc[item.packageId].push(item);
            return acc;
        }, {} as Record<string, typeof items>);

        const result = packagesList.map(pkg => ({
            ...pkg,
            items: itemsByPackage[pkg.id] || [],
        }));

        return successResponse(result, { page, perPage: limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) });
    });

    fastify.post<{ Body: { name: string; matrixId: string; description?: string; totalPrice: string; tatDays?: number; items?: { parameterId?: string; subparameterId?: string; methodId?: string }[] } }>('/api/packages', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Create test package', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request, reply) => {
        const { items, ...packageData } = request.body;

        const [newPackage] = await db.insert(testPackages).values({
            id: crypto.randomUUID(),
            ...packageData,
            isActive: true
        }).returning();

        if (items && items.length > 0) {
            await db.insert(testPackageItems).values(
                items.map(item => ({
                    id: crypto.randomUUID(),
                    packageId: newPackage.id,
                    ...item,
                }))
            );
        }

        return reply.status(201).send(successResponse(newPackage));
    });

    fastify.put<{ Params: { id: string }; Body: { name?: string; matrixId?: string; description?: string; totalPrice?: string; tatDays?: number; isActive?: boolean } }>('/api/packages/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: { description: 'Update test package', tags: ['Master Data'], security: [{ bearerAuth: [] }] },
    }, async (request) => {
        const [updated] = await db.update(testPackages).set({ ...request.body, updatedAt: new Date() }).where(eq(testPackages.id, request.params.id)).returning();
        if (!updated) throw ApiError.notFound('Test Package');
        return successResponse(updated);
    });
}
