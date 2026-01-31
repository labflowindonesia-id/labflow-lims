import { FastifyInstance } from 'fastify';
import { db } from '../../db/index';
import { customers, customerContacts } from '../../db/schema';
import { eq, ilike, and, sql, desc } from 'drizzle-orm';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError, successResponse } from '../../shared/errors';

// Request body types
interface CreateCustomerBody {
    name: string;
    code?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
    billingAddress?: string;
    notes?: string;
}

interface CreateContactBody {
    customerId: string;
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    isPrimary?: boolean;
}

interface ListCustomersQuery {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}

export async function customersRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/customers
     * List all customers with pagination
     */
    fastify.get<{ Querystring: ListCustomersQuery }>('/api/customers', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: {
            description: 'List all customers with pagination and filtering',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                    search: { type: 'string' },
                    isActive: { type: 'boolean' },
                },
            },
        },
    }, async (request, reply) => {
        const { page = 1, limit = 20, search, isActive } = request.query;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (search) {
            conditions.push(
                sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.code} ILIKE ${`%${search}%`})`
            );
        }
        if (isActive !== undefined) {
            conditions.push(eq(customers.isActive, isActive));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(customers)
            .where(whereClause);

        const customersList = await db
            .select()
            .from(customers)
            .where(whereClause)
            .orderBy(customers.name)
            .limit(limit)
            .offset(offset);

        return successResponse(customersList, {
            page,
            perPage: limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
        });
    });

    /**
     * GET /api/customers/:id
     * Get customer by ID with contacts
     */
    fastify.get<{ Params: { id: string } }>('/api/customers/:id', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: {
            description: 'Get customer by ID with contacts',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;

        const [customer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, id))
            .limit(1);

        if (!customer) {
            throw ApiError.notFound('Customer');
        }

        // Get contacts
        const contacts = await db
            .select()
            .from(customerContacts)
            .where(eq(customerContacts.customerId, id))
            .orderBy(desc(customerContacts.isPrimary));

        return successResponse({
            ...customer,
            contacts,
        });
    });

    /**
     * POST /api/customers
     * Create a new customer
     */
    fastify.post<{ Body: CreateCustomerBody }>('/api/customers', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Create a new customer',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 2 },
                    code: { type: 'string' },
                    address: { type: 'string' },
                    city: { type: 'string' },
                    province: { type: 'string' },
                    postalCode: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    website: { type: 'string' },
                    taxId: { type: 'string' },
                    billingAddress: { type: 'string' },
                    notes: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        const data = request.body;

        // Generate customer code if not provided
        if (!data.code) {
            const [{ count }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(customers);
            data.code = `CUST-${String(Number(count) + 1).padStart(4, '0')}`;
        }

        const [newCustomer] = await db
            .insert(customers)
            .values({
                id: crypto.randomUUID(),
                ...data,
                isActive: true,
            })
            .returning();

        return reply.status(201).send(successResponse(newCustomer));
    });

    /**
     * PUT /api/customers/:id
     * Update customer by ID
     */
    fastify.put<{ Params: { id: string }; Body: Partial<CreateCustomerBody> & { isActive?: boolean } }>('/api/customers/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Update customer by ID',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const updateData = request.body;

        const [updatedCustomer] = await db
            .update(customers)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(eq(customers.id, id))
            .returning();

        if (!updatedCustomer) {
            throw ApiError.notFound('Customer');
        }

        return successResponse(updatedCustomer);
    });

    /**
     * DELETE /api/customers/:id
     * Soft delete customer
     */
    fastify.delete<{ Params: { id: string } }>('/api/customers/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Deactivate customer (soft delete)',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;

        const [updatedCustomer] = await db
            .update(customers)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(customers.id, id))
            .returning();

        if (!updatedCustomer) {
            throw ApiError.notFound('Customer');
        }

        return successResponse({ message: 'Customer deactivated successfully' });
    });

    // ==================== Customer Contacts ====================

    /**
     * POST /api/customers/:customerId/contacts
     * Add contact to customer
     */
    fastify.post<{ Params: { customerId: string }; Body: Omit<CreateContactBody, 'customerId'> }>('/api/customers/:customerId/contacts', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Add contact to customer',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['customerId'],
                properties: {
                    customerId: { type: 'string', format: 'uuid' },
                },
            },
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 2 },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    position: { type: 'string' },
                    isPrimary: { type: 'boolean', default: false },
                },
            },
        },
    }, async (request, reply) => {
        const { customerId } = request.params;
        const data = request.body;

        // Check if customer exists
        const [customer] = await db
            .select({ id: customers.id })
            .from(customers)
            .where(eq(customers.id, customerId))
            .limit(1);

        if (!customer) {
            throw ApiError.notFound('Customer');
        }

        // If this contact is primary, unset other primary contacts
        if (data.isPrimary) {
            await db
                .update(customerContacts)
                .set({ isPrimary: false })
                .where(eq(customerContacts.customerId, customerId));
        }

        const [newContact] = await db
            .insert(customerContacts)
            .values({
                id: crypto.randomUUID(),
                customerId,
                ...data,
            })
            .returning();

        return reply.status(201).send(successResponse(newContact));
    });

    /**
     * PUT /api/contacts/:id
     * Update contact
     */
    fastify.put<{ Params: { id: string }; Body: Partial<Omit<CreateContactBody, 'customerId'>> }>('/api/contacts/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Update contact',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const updateData = request.body;

        // Get current contact to find customerId
        const [currentContact] = await db
            .select()
            .from(customerContacts)
            .where(eq(customerContacts.id, id))
            .limit(1);

        if (!currentContact) {
            throw ApiError.notFound('Contact');
        }

        // If setting as primary, unset other primary contacts
        if (updateData.isPrimary) {
            await db
                .update(customerContacts)
                .set({ isPrimary: false })
                .where(eq(customerContacts.customerId, currentContact.customerId));
        }

        const [updatedContact] = await db
            .update(customerContacts)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(eq(customerContacts.id, id))
            .returning();

        return successResponse(updatedContact);
    });

    /**
     * DELETE /api/contacts/:id
     * Delete contact
     */
    fastify.delete<{ Params: { id: string } }>('/api/contacts/:id', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Delete contact',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;

        const result = await db
            .delete(customerContacts)
            .where(eq(customerContacts.id, id))
            .returning();

        if (result.length === 0) {
            throw ApiError.notFound('Contact');
        }

        return successResponse({ message: 'Contact deleted successfully' });
    });
}
