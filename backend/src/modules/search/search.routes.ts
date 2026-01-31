/**
 * Search & Archive Module
 * Provides global search across entities and data archival/retention
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/index.js';
import {
    customers,
    workOrders,
    samples,
    reports,
    quotations,
} from '../../db/schema/index.js';
import { eq, sql, and, or, ilike, desc, lt } from 'drizzle-orm';

// ==================== Search Types ====================

interface SearchResult {
    id: string;
    type: 'customer' | 'work_order' | 'sample' | 'report' | 'quotation' | 'method' | 'parameter';
    title: string;
    subtitle?: string;
    description?: string;
    status?: string | null;
    date?: string;
    relevance: number;
}

// Helper to safely convert various date types to ISO string
function dateToString(value: Date | string | null | undefined): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    return value.toISOString();
}

// ==================== Archive Configuration ====================

// Default retention period in years
const DEFAULT_RETENTION_YEARS = 5;

// ==================== Route Handlers ====================

export async function searchArchiveRoutes(app: FastifyInstance) {
    // ==================== Global Search ====================

    /**
     * Global search across all entities
     * GET /api/search
     */
    const searchQuerySchema = z.object({
        q: z.string().min(2, 'Search query must be at least 2 characters'),
        types: z.string().optional(), // comma-separated: customer,work_order,sample,report
        limit: z.coerce.number().min(1).max(100).default(20),
        offset: z.coerce.number().min(0).default(0),
    });

    app.get('/search', async (request: FastifyRequest<{
        Querystring: z.infer<typeof searchQuerySchema>;
    }>, reply: FastifyReply) => {
        const { q, types, limit, offset } = searchQuerySchema.parse(request.query);

        const searchTerm = `%${q}%`;
        const typeFilter = types ? types.split(',') : null;
        const results: SearchResult[] = [];

        // Search Customers
        if (!typeFilter || typeFilter.includes('customer')) {
            const customerResults = await db
                .select({
                    id: customers.id,
                    name: customers.name,
                    email: customers.email,
                    phone: customers.phone,
                    createdAt: customers.createdAt,
                })
                .from(customers)
                .where(
                    or(
                        ilike(customers.name, searchTerm),
                        ilike(customers.email, searchTerm),
                        ilike(customers.phone, searchTerm)
                    )
                )
                .limit(limit);

            results.push(...customerResults.map(c => ({
                id: c.id,
                type: 'customer' as const,
                title: c.name,
                subtitle: c.email || undefined,
                description: c.phone || undefined,
                date: c.createdAt?.toISOString(),
                relevance: c.name.toLowerCase().includes(q.toLowerCase()) ? 1 : 0.5,
            })));
        }

        // Search Work Orders
        if (!typeFilter || typeFilter.includes('work_order')) {
            const woResults = await db
                .select({
                    id: workOrders.id,
                    workOrderNumber: workOrders.workOrderNumber,
                    status: workOrders.status,
                    customerName: customers.name,
                    receivedDate: workOrders.receivedDate,
                })
                .from(workOrders)
                .leftJoin(customers, eq(workOrders.customerId, customers.id))
                .where(
                    or(
                        ilike(workOrders.workOrderNumber, searchTerm),
                        ilike(customers.name, searchTerm)
                    )
                )
                .limit(limit);

            results.push(...woResults.map(wo => ({
                id: wo.id,
                type: 'work_order' as const,
                title: wo.workOrderNumber,
                subtitle: wo.customerName || undefined,
                status: wo.status,
                date: dateToString(wo.receivedDate),
                relevance: wo.workOrderNumber.toLowerCase().includes(q.toLowerCase()) ? 1 : 0.5,
            })));
        }

        // Search Samples
        if (!typeFilter || typeFilter.includes('sample')) {
            const sampleResults = await db
                .select({
                    id: samples.id,
                    sampleLabId: samples.sampleLabId,
                    sampleName: samples.sampleName,
                    condition: samples.condition,
                    samplingDate: samples.samplingDate,
                })
                .from(samples)
                .where(
                    or(
                        ilike(samples.sampleLabId, searchTerm),
                        ilike(samples.sampleName, searchTerm)
                    )
                )
                .limit(limit);

            results.push(...sampleResults.map(s => ({
                id: s.id,
                type: 'sample' as const,
                title: s.sampleLabId,
                subtitle: s.sampleName || undefined,
                status: s.condition,
                date: dateToString(s.samplingDate),
                relevance: s.sampleLabId.toLowerCase().includes(q.toLowerCase()) ? 1 : 0.5,
            })));
        }

        // Search Reports
        if (!typeFilter || typeFilter.includes('report')) {
            const reportResults = await db
                .select({
                    id: reports.id,
                    reportNumber: reports.reportNumber,
                    title: reports.title,
                    status: reports.status,
                    createdAt: reports.createdAt,
                })
                .from(reports)
                .where(
                    or(
                        ilike(reports.reportNumber, searchTerm),
                        ilike(reports.title, searchTerm)
                    )
                )
                .limit(limit);

            results.push(...reportResults.map(r => ({
                id: r.id,
                type: 'report' as const,
                title: r.reportNumber,
                subtitle: r.title || undefined,
                status: r.status,
                date: r.createdAt?.toISOString(),
                relevance: r.reportNumber.toLowerCase().includes(q.toLowerCase()) ? 1 : 0.5,
            })));
        }

        // Search Quotations
        if (!typeFilter || typeFilter.includes('quotation')) {
            const quotationResults = await db
                .select({
                    id: quotations.id,
                    quotationNumber: quotations.quotationNumber,
                    status: quotations.status,
                    customerName: customers.name,
                    createdAt: quotations.createdAt,
                })
                .from(quotations)
                .leftJoin(customers, eq(quotations.customerId, customers.id))
                .where(
                    or(
                        ilike(quotations.quotationNumber, searchTerm),
                        ilike(customers.name, searchTerm)
                    )
                )
                .limit(limit);

            results.push(...quotationResults.map(quot => ({
                id: quot.id,
                type: 'quotation' as const,
                title: quot.quotationNumber,
                subtitle: quot.customerName || undefined,
                status: quot.status,
                date: quot.createdAt?.toISOString(),
                relevance: quot.quotationNumber.toLowerCase().includes(q.toLowerCase()) ? 1 : 0.5,
            })));
        }

        // Sort by relevance and apply pagination
        const sortedResults = results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(offset, offset + limit);

        return reply.send({
            query: q,
            total: results.length,
            limit,
            offset,
            results: sortedResults,
        });
    });

    // ==================== Archive Management ====================

    /**
     * Get archive statistics
     * GET /api/archive/stats
     */
    app.get('/archive/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
        const retentionDate = new Date();
        retentionDate.setFullYear(retentionDate.getFullYear() - DEFAULT_RETENTION_YEARS);

        // Count archived vs active records
        const [woStats] = await db
            .select({
                total: sql<number>`count(*)`,
                archived: sql<number>`count(*) filter (where ${workOrders.createdAt} < ${retentionDate.toISOString()})`,
            })
            .from(workOrders);

        const [reportStats] = await db
            .select({
                total: sql<number>`count(*)`,
                archived: sql<number>`count(*) filter (where ${reports.createdAt} < ${retentionDate.toISOString()})`,
            })
            .from(reports);

        const [sampleStats] = await db
            .select({
                total: sql<number>`count(*)`,
                archived: sql<number>`count(*) filter (where ${samples.createdAt} < ${retentionDate.toISOString()})`,
            })
            .from(samples);

        return reply.send({
            retentionPeriodYears: DEFAULT_RETENTION_YEARS,
            retentionCutoffDate: retentionDate.toISOString(),
            statistics: {
                workOrders: {
                    total: Number(woStats.total) || 0,
                    archived: Number(woStats.archived) || 0,
                    active: (Number(woStats.total) || 0) - (Number(woStats.archived) || 0),
                },
                reports: {
                    total: Number(reportStats.total) || 0,
                    archived: Number(reportStats.archived) || 0,
                    active: (Number(reportStats.total) || 0) - (Number(reportStats.archived) || 0),
                },
                samples: {
                    total: Number(sampleStats.total) || 0,
                    archived: Number(sampleStats.archived) || 0,
                    active: (Number(sampleStats.total) || 0) - (Number(sampleStats.archived) || 0),
                },
            },
        });
    });

    /**
     * List archived work orders
     * GET /api/archive/work-orders
     */
    const archiveListSchema = z.object({
        limit: z.coerce.number().min(1).max(100).default(20),
        offset: z.coerce.number().min(0).default(0),
        year: z.coerce.number().optional(),
    });

    app.get('/archive/work-orders', async (request: FastifyRequest<{
        Querystring: z.infer<typeof archiveListSchema>;
    }>, reply: FastifyReply) => {
        const { limit, offset, year } = archiveListSchema.parse(request.query);

        const retentionDate = new Date();
        retentionDate.setFullYear(retentionDate.getFullYear() - DEFAULT_RETENTION_YEARS);

        let query = db
            .select({
                id: workOrders.id,
                workOrderNumber: workOrders.workOrderNumber,
                status: workOrders.status,
                receivedDate: workOrders.receivedDate,
                customerName: customers.name,
                createdAt: workOrders.createdAt,
            })
            .from(workOrders)
            .leftJoin(customers, eq(workOrders.customerId, customers.id))
            .where(lt(workOrders.createdAt, retentionDate))
            .orderBy(desc(workOrders.createdAt))
            .limit(limit)
            .offset(offset);

        const results = await query;

        return reply.send({
            type: 'work_orders',
            retentionCutoffDate: retentionDate.toISOString(),
            total: results.length,
            limit,
            offset,
            data: results,
        });
    });

    /**
     * List archived reports
     * GET /api/archive/reports
     */
    app.get('/archive/reports', async (request: FastifyRequest<{
        Querystring: z.infer<typeof archiveListSchema>;
    }>, reply: FastifyReply) => {
        const { limit, offset } = archiveListSchema.parse(request.query);

        const retentionDate = new Date();
        retentionDate.setFullYear(retentionDate.getFullYear() - DEFAULT_RETENTION_YEARS);

        const results = await db
            .select({
                id: reports.id,
                reportNumber: reports.reportNumber,
                title: reports.title,
                status: reports.status,
                createdAt: reports.createdAt,
            })
            .from(reports)
            .where(lt(reports.createdAt, retentionDate))
            .orderBy(desc(reports.createdAt))
            .limit(limit)
            .offset(offset);

        return reply.send({
            type: 'reports',
            retentionCutoffDate: retentionDate.toISOString(),
            total: results.length,
            limit,
            offset,
            data: results,
        });
    });

    /**
     * Search archived data
     * GET /api/archive/search
     */
    const archiveSearchSchema = z.object({
        q: z.string().min(2),
        type: z.enum(['work_order', 'report', 'sample']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
    });

    app.get('/archive/search', async (request: FastifyRequest<{
        Querystring: z.infer<typeof archiveSearchSchema>;
    }>, reply: FastifyReply) => {
        const { q, type, startDate, endDate, limit } = archiveSearchSchema.parse(request.query);

        const retentionDate = new Date();
        retentionDate.setFullYear(retentionDate.getFullYear() - DEFAULT_RETENTION_YEARS);
        const searchTerm = `%${q}%`;

        const results: Array<{
            id: string;
            type: string;
            identifier: string;
            description: string | null;
            date: Date | null;
        }> = [];

        // Search archived work orders
        if (!type || type === 'work_order') {
            const woResults = await db
                .select({
                    id: workOrders.id,
                    workOrderNumber: workOrders.workOrderNumber,
                    customerName: customers.name,
                    createdAt: workOrders.createdAt,
                })
                .from(workOrders)
                .leftJoin(customers, eq(workOrders.customerId, customers.id))
                .where(
                    and(
                        lt(workOrders.createdAt, retentionDate),
                        or(
                            ilike(workOrders.workOrderNumber, searchTerm),
                            ilike(customers.name, searchTerm)
                        )
                    )
                )
                .limit(limit);

            results.push(...woResults.map(wo => ({
                id: wo.id,
                type: 'work_order',
                identifier: wo.workOrderNumber,
                description: wo.customerName,
                date: wo.createdAt,
            })));
        }

        // Search archived reports
        if (!type || type === 'report') {
            const reportResults = await db
                .select({
                    id: reports.id,
                    reportNumber: reports.reportNumber,
                    title: reports.title,
                    createdAt: reports.createdAt,
                })
                .from(reports)
                .where(
                    and(
                        lt(reports.createdAt, retentionDate),
                        or(
                            ilike(reports.reportNumber, searchTerm),
                            ilike(reports.title, searchTerm)
                        )
                    )
                )
                .limit(limit);

            results.push(...reportResults.map(r => ({
                id: r.id,
                type: 'report',
                identifier: r.reportNumber,
                description: r.title,
                date: r.createdAt,
            })));
        }

        return reply.send({
            query: q,
            archiveType: type || 'all',
            total: results.length,
            data: results,
        });
    });

    /**
     * Get retention policy
     * GET /api/archive/policy
     */
    app.get('/archive/policy', async (_request: FastifyRequest, reply: FastifyReply) => {
        return reply.send({
            retentionPeriodYears: DEFAULT_RETENTION_YEARS,
            policies: [
                {
                    entity: 'work_orders',
                    retentionYears: 5,
                    description: 'Work orders and related samples are retained for 5 years',
                },
                {
                    entity: 'reports',
                    retentionYears: 5,
                    description: 'Reports and CoA documents are retained for 5 years',
                },
                {
                    entity: 'audit_logs',
                    retentionYears: 7,
                    description: 'Audit logs are retained for 7 years for compliance',
                },
                {
                    entity: 'customer_data',
                    retentionYears: 10,
                    description: 'Customer master data is retained for 10 years',
                },
            ],
            notes: [
                'Data older than retention period is marked as archived',
                'Archived data remains accessible but may have reduced functionality',
                'Permanent deletion requires explicit admin action',
            ],
        });
    });
}
