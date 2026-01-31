import { FastifyInstance } from 'fastify';
import { db } from '../../db/index';
import {
    quotations,
    quotationLines,
    contractReviews,
    quotationDocuments
} from '../../db/schema';
import { customers, customerContacts, sampleMatrices, parameters, subparameters, methods, testPackages } from '../../db/schema';
import { eq, and, sql, desc, or } from 'drizzle-orm';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError, successResponse } from '../../shared/errors';

// Helper to generate quotation number
function generateQuotationNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `Q/${year}${month}/${random}`;
}

// ==================== QUOTATIONS ====================
export async function quotationsRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/quotations
     */
    fastify.get<{
        Querystring: {
            page?: number;
            limit?: number;
            search?: string;
            status?: string;
            customerId?: string;
        }
    }>('/api/quotations', {
        preHandler: [requireAuth, requirePermission('quotations:read')],
        schema: {
            description: 'List all quotations with pagination and filtering',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { page = 1, limit = 20, search, status, customerId } = request.query;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (search) {
            conditions.push(
                or(
                    sql`${quotations.quotationNumber} ILIKE ${`%${search}%`}`,
                    sql`${quotations.customerNameSnapshot} ILIKE ${`%${search}%`}`
                )
            );
        }
        if (status) {
            conditions.push(eq(quotations.status, status as 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'));
        }
        if (customerId) {
            conditions.push(eq(quotations.customerId, customerId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(quotations)
            .where(whereClause);

        const quotationsList = await db
            .select({
                id: quotations.id,
                quotationNumber: quotations.quotationNumber,
                revisionNumber: quotations.revisionNumber,
                customerId: quotations.customerId,
                customerNameSnapshot: quotations.customerNameSnapshot,
                status: quotations.status,
                grandTotal: quotations.grandTotal,
                currency: quotations.currency,
                validUntil: quotations.validUntil,
                tatDays: quotations.tatDays,
                createdAt: quotations.createdAt,
            })
            .from(quotations)
            .where(whereClause)
            .orderBy(desc(quotations.createdAt))
            .limit(limit)
            .offset(offset);

        return successResponse(quotationsList, {
            page,
            perPage: limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
        });
    });

    /**
     * GET /api/quotations/:id
     */
    fastify.get<{ Params: { id: string } }>('/api/quotations/:id', {
        preHandler: [requireAuth, requirePermission('quotations:read')],
        schema: {
            description: 'Get quotation by ID with lines and contract review',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;

        const [quotation] = await db
            .select()
            .from(quotations)
            .where(eq(quotations.id, id))
            .limit(1);

        if (!quotation) {
            throw ApiError.notFound('Quotation');
        }

        // Get lines
        const lines = await db
            .select()
            .from(quotationLines)
            .where(eq(quotationLines.quotationId, id))
            .orderBy(quotationLines.lineNumber);

        // Get contract review if exists
        const [review] = await db
            .select()
            .from(contractReviews)
            .where(eq(contractReviews.quotationId, id))
            .limit(1);

        // Get customer and matrix info
        const [customer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, quotation.customerId))
            .limit(1);

        const [matrix] = await db
            .select()
            .from(sampleMatrices)
            .where(eq(sampleMatrices.id, quotation.matrixId))
            .limit(1);

        return successResponse({
            ...quotation,
            customer,
            matrix,
            lines,
            contractReview: review || null,
        });
    });

    /**
     * POST /api/quotations
     */
    fastify.post<{
        Body: {
            customerId: string;
            contactId?: string;
            matrixId: string;
            sampleCount?: number;
            samplingType?: string;
            tatDays?: number;
            validUntilDays?: number;
            urgencyFactor?: number;
            internalNotes?: string;
            publicNotes?: string;
            termsConditions?: string;
            lines?: {
                parameterId?: string;
                subparameterId?: string;
                packageId?: string;
                methodId?: string;
                instrumentId?: string;
                unitPrice: number;
                quantity?: number;
                discountPercent?: number;
                tatDays?: number;
                notes?: string;
            }[];
        }
    }>('/api/quotations', {
        preHandler: [requireAuth, requirePermission('quotations:write')],
        schema: {
            description: 'Create a new quotation',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['customerId', 'matrixId'],
                properties: {
                    customerId: { type: 'string' },
                    contactId: { type: 'string' },
                    matrixId: { type: 'string' },
                    sampleCount: { type: 'integer', default: 1 },
                    samplingType: { type: 'string' },
                    tatDays: { type: 'integer', default: 5 },
                    validUntilDays: { type: 'integer', default: 30 },
                    urgencyFactor: { type: 'number', default: 1.0 },
                    internalNotes: { type: 'string' },
                    publicNotes: { type: 'string' },
                    termsConditions: { type: 'string' },
                    lines: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['unitPrice'],
                            properties: {
                                parameterId: { type: 'string' },
                                subparameterId: { type: 'string' },
                                packageId: { type: 'string' },
                                methodId: { type: 'string' },
                                instrumentId: { type: 'string' },
                                unitPrice: { type: 'number' },
                                quantity: { type: 'integer', default: 1 },
                                discountPercent: { type: 'number', default: 0 },
                                tatDays: { type: 'integer' },
                                notes: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { lines: linesData, validUntilDays = 30, ...quotationData } = request.body;
        const userId = request.user!.id;

        // Get customer snapshot
        const [customer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, quotationData.customerId))
            .limit(1);

        if (!customer) {
            throw ApiError.notFound('Customer');
        }

        // Generate quotation number
        const quotationNumber = generateQuotationNumber();
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validUntilDays);

        // Calculate totals
        let subtotal = 0;
        if (linesData) {
            subtotal = linesData.reduce((sum, line) => {
                const qty = line.quantity || 1;
                const discount = line.discountPercent || 0;
                const lineTotal = line.unitPrice * qty * (1 - discount / 100);
                return sum + lineTotal;
            }, 0);
        }

        const taxRate = 11; // PPN 11%
        const taxAmount = subtotal * (taxRate / 100);
        const grandTotal = subtotal + taxAmount;

        // Create quotation
        const [newQuotation] = await db.insert(quotations).values({
            id: crypto.randomUUID(),
            quotationNumber,
            revisionNumber: 0,
            ...quotationData,
            sampleCount: quotationData.sampleCount || 1,
            tatDays: quotationData.tatDays || 5,
            urgencyFactor: String(quotationData.urgencyFactor || 1),
            customerNameSnapshot: customer.name,
            customerAddressSnapshot: customer.address,
            validUntil,
            status: 'DRAFT',
            subtotal: String(subtotal),
            discount: '0',
            taxRate: String(taxRate),
            taxAmount: String(taxAmount),
            grandTotal: String(grandTotal),
            currency: 'IDR',
            createdBy: userId,
        }).returning();

        // Create lines
        if (linesData && linesData.length > 0) {
            const linesToInsert = await Promise.all(linesData.map(async (line, index) => {
                const qty = line.quantity || 1;
                const discount = line.discountPercent || 0;
                const lineTotal = line.unitPrice * qty * (1 - discount / 100);

                // Get parameter/method names for snapshot
                let parameterNameSnapshot = null;
                let methodCodeSnapshot = null;

                if (line.parameterId) {
                    const [param] = await db.select().from(parameters).where(eq(parameters.id, line.parameterId)).limit(1);
                    if (param) parameterNameSnapshot = param.name;
                }

                if (line.methodId) {
                    const [method] = await db.select().from(methods).where(eq(methods.id, line.methodId)).limit(1);
                    if (method) methodCodeSnapshot = method.code;
                }

                return {
                    id: crypto.randomUUID(),
                    quotationId: newQuotation.id,
                    lineNumber: index + 1,
                    parameterId: line.parameterId,
                    subparameterId: line.subparameterId,
                    packageId: line.packageId,
                    methodId: line.methodId,
                    instrumentId: line.instrumentId,
                    parameterNameSnapshot,
                    methodCodeSnapshot,
                    unitPrice: String(line.unitPrice),
                    quantity: qty,
                    discountPercent: String(discount),
                    lineTotal: String(lineTotal),
                    tatDays: line.tatDays,
                    notes: line.notes,
                };
            }));

            await db.insert(quotationLines).values(linesToInsert);
        }

        return reply.status(201).send(successResponse(newQuotation));
    });

    /**
     * PUT /api/quotations/:id
     */
    fastify.put<{
        Params: { id: string };
        Body: {
            sampleCount?: number;
            samplingType?: string;
            tatDays?: number;
            urgencyFactor?: number;
            internalNotes?: string;
            publicNotes?: string;
            termsConditions?: string;
            discount?: number;
        }
    }>('/api/quotations/:id', {
        preHandler: [requireAuth, requirePermission('quotations:write')],
        schema: {
            description: 'Update quotation',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const { urgencyFactor, discount, ...updateData } = request.body;

        const [existing] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
        if (!existing) {
            throw ApiError.notFound('Quotation');
        }

        if (existing.status !== 'DRAFT') {
            throw ApiError.badRequest('Can only update quotations in DRAFT status');
        }

        const finalData: Record<string, unknown> = { ...updateData, updatedAt: new Date() };
        if (urgencyFactor !== undefined) finalData.urgencyFactor = String(urgencyFactor);
        if (discount !== undefined) {
            const subtotal = Number(existing.subtotal);
            const newDiscount = discount;
            const taxableAmount = subtotal - newDiscount;
            const taxAmount = taxableAmount * (Number(existing.taxRate) / 100);
            const grandTotal = taxableAmount + taxAmount;

            finalData.discount = String(newDiscount);
            finalData.taxAmount = String(taxAmount);
            finalData.grandTotal = String(grandTotal);
        }

        const [updated] = await db.update(quotations).set(finalData).where(eq(quotations.id, id)).returning();

        return successResponse(updated);
    });

    /**
     * POST /api/quotations/:id/submit
     */
    fastify.post<{ Params: { id: string } }>('/api/quotations/:id/submit', {
        preHandler: [requireAuth, requirePermission('quotations:write')],
        schema: {
            description: 'Submit quotation for approval',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const userId = request.user!.id;

        const [existing] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
        if (!existing) throw ApiError.notFound('Quotation');
        if (existing.status !== 'DRAFT') throw ApiError.badRequest('Can only submit DRAFT quotations');

        // Check has at least one line
        const [lineCount] = await db.select({ count: sql<number>`count(*)` }).from(quotationLines).where(eq(quotationLines.quotationId, id));
        if (Number(lineCount.count) === 0) {
            throw ApiError.badRequest('Quotation must have at least one line item');
        }

        const [updated] = await db.update(quotations).set({
            status: 'SUBMITTED',
            submittedAt: new Date(),
            submittedBy: userId,
            updatedAt: new Date(),
        }).where(eq(quotations.id, id)).returning();

        // Create contract review record
        await db.insert(contractReviews).values({
            id: crypto.randomUUID(),
            quotationId: id,
            status: 'PENDING',
        });

        return successResponse({ message: 'Quotation submitted for approval', quotation: updated });
    });

    /**
     * POST /api/quotations/:id/approve
     */
    fastify.post<{ Params: { id: string }; Body: { notes?: string } }>('/api/quotations/:id/approve', {
        preHandler: [requireAuth, requirePermission('quotations:approve')],
        schema: {
            description: 'Approve a submitted quotation',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const { notes } = request.body || {};
        const userId = request.user!.id;

        const [existing] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
        if (!existing) throw ApiError.notFound('Quotation');
        if (existing.status !== 'SUBMITTED') throw ApiError.badRequest('Can only approve SUBMITTED quotations');

        // Update quotation
        const [updated] = await db.update(quotations).set({
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: userId,
            updatedAt: new Date(),
        }).where(eq(quotations.id, id)).returning();

        // Update contract review
        await db.update(contractReviews).set({
            status: 'APPROVED',
            notes,
            reviewedBy: userId,
            reviewedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(contractReviews.quotationId, id));

        return successResponse({ message: 'Quotation approved', quotation: updated });
    });

    /**
     * POST /api/quotations/:id/reject
     */
    fastify.post<{ Params: { id: string }; Body: { reason: string } }>('/api/quotations/:id/reject', {
        preHandler: [requireAuth, requirePermission('quotations:approve')],
        schema: {
            description: 'Reject a submitted quotation',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['reason'],
                properties: {
                    reason: { type: 'string', minLength: 5 },
                },
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const { reason } = request.body;
        const userId = request.user!.id;

        const [existing] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
        if (!existing) throw ApiError.notFound('Quotation');
        if (existing.status !== 'SUBMITTED') throw ApiError.badRequest('Can only reject SUBMITTED quotations');

        const [updated] = await db.update(quotations).set({
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectedBy: userId,
            rejectionReason: reason,
            updatedAt: new Date(),
        }).where(eq(quotations.id, id)).returning();

        await db.update(contractReviews).set({
            status: 'REJECTED',
            notes: reason,
            reviewedBy: userId,
            reviewedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(contractReviews.quotationId, id));

        return successResponse({ message: 'Quotation rejected', quotation: updated });
    });

    /**
     * POST /api/quotations/:id/revise
     */
    fastify.post<{ Params: { id: string } }>('/api/quotations/:id/revise', {
        preHandler: [requireAuth, requirePermission('quotations:write')],
        schema: {
            description: 'Create a new revision of a rejected quotation',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { id } = request.params;
        const userId = request.user!.id;

        const [existing] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
        if (!existing) throw ApiError.notFound('Quotation');
        if (existing.status !== 'REJECTED') throw ApiError.badRequest('Can only revise REJECTED quotations');

        // Update current to new revision
        const [revised] = await db.update(quotations).set({
            revisionNumber: existing.revisionNumber + 1,
            status: 'DRAFT',
            submittedAt: null,
            submittedBy: null,
            approvedAt: null,
            approvedBy: null,
            rejectedAt: null,
            rejectedBy: null,
            rejectionReason: null,
            updatedAt: new Date(),
        }).where(eq(quotations.id, id)).returning();

        // Delete old contract review
        await db.delete(contractReviews).where(eq(contractReviews.quotationId, id));

        return successResponse({ message: 'Quotation revised to draft', quotation: revised });
    });

    // ==================== QUOTATION LINES ====================
    /**
     * POST /api/quotations/:id/lines
     */
    fastify.post<{
        Params: { id: string };
        Body: {
            parameterId?: string;
            subparameterId?: string;
            packageId?: string;
            methodId?: string;
            instrumentId?: string;
            unitPrice: number;
            quantity?: number;
            discountPercent?: number;
            tatDays?: number;
            notes?: string;
        }
    }>('/api/quotations/:id/lines', {
        preHandler: [requireAuth, requirePermission('quotations:write')],
        schema: {
            description: 'Add line item to quotation',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const lineData = request.body;

        const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
        if (!quotation) throw ApiError.notFound('Quotation');
        if (quotation.status !== 'DRAFT') throw ApiError.badRequest('Can only modify DRAFT quotations');

        // Get next line number
        const [maxLine] = await db
            .select({ max: sql<number>`COALESCE(MAX(${quotationLines.lineNumber}), 0)` })
            .from(quotationLines)
            .where(eq(quotationLines.quotationId, id));

        const qty = lineData.quantity || 1;
        const discount = lineData.discountPercent || 0;
        const lineTotal = lineData.unitPrice * qty * (1 - discount / 100);

        // Get snapshots
        let parameterNameSnapshot = null;
        let methodCodeSnapshot = null;
        if (lineData.parameterId) {
            const [param] = await db.select().from(parameters).where(eq(parameters.id, lineData.parameterId)).limit(1);
            if (param) parameterNameSnapshot = param.name;
        }
        if (lineData.methodId) {
            const [method] = await db.select().from(methods).where(eq(methods.id, lineData.methodId)).limit(1);
            if (method) methodCodeSnapshot = method.code;
        }

        const [newLine] = await db.insert(quotationLines).values({
            id: crypto.randomUUID(),
            quotationId: id,
            lineNumber: Number(maxLine.max) + 1,
            parameterId: lineData.parameterId,
            subparameterId: lineData.subparameterId,
            packageId: lineData.packageId,
            methodId: lineData.methodId,
            instrumentId: lineData.instrumentId,
            parameterNameSnapshot,
            methodCodeSnapshot,
            unitPrice: String(lineData.unitPrice),
            quantity: qty,
            discountPercent: String(discount),
            lineTotal: String(lineTotal),
            tatDays: lineData.tatDays,
            notes: lineData.notes,
        }).returning();

        // Recalculate totals
        await recalculateQuotationTotals(id);

        return reply.status(201).send(successResponse(newLine));
    });

    /**
     * DELETE /api/quotations/:quotationId/lines/:lineId
     */
    fastify.delete<{ Params: { quotationId: string; lineId: string } }>('/api/quotations/:quotationId/lines/:lineId', {
        preHandler: [requireAuth, requirePermission('quotations:write')],
        schema: {
            description: 'Remove line from quotation',
            tags: ['Transactions'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { quotationId, lineId } = request.params;

        const [quotation] = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
        if (!quotation) throw ApiError.notFound('Quotation');
        if (quotation.status !== 'DRAFT') throw ApiError.badRequest('Can only modify DRAFT quotations');

        await db.delete(quotationLines).where(
            and(eq(quotationLines.id, lineId), eq(quotationLines.quotationId, quotationId))
        );

        // Recalculate totals
        await recalculateQuotationTotals(quotationId);

        return successResponse({ message: 'Line removed' });
    });
}

// Helper to recalculate quotation totals
async function recalculateQuotationTotals(quotationId: string) {
    const lines = await db.select().from(quotationLines).where(eq(quotationLines.quotationId, quotationId));
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);

    if (!quotation) return;

    const subtotal = lines.reduce((sum, line) => sum + Number(line.lineTotal), 0);
    const discount = Number(quotation.discount) || 0;
    const taxableAmount = subtotal - discount;
    const taxRate = Number(quotation.taxRate) || 11;
    const taxAmount = taxableAmount * (taxRate / 100);
    const grandTotal = taxableAmount + taxAmount;

    await db.update(quotations).set({
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        grandTotal: String(grandTotal),
        updatedAt: new Date(),
    }).where(eq(quotations.id, quotationId));
}
