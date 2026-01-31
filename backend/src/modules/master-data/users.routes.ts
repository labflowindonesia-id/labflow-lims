import { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../../db/index';
import { users, departments, analysts, analystSkills } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { ApiError, successResponse } from '../../shared/errors';
import { authService } from '../auth/auth.service';

// Request body types
interface CreateUserBody {
    email: string;
    password: string;
    fullName: string;
    role: 'ADMIN' | 'MANAGER' | 'ANALYST';
}

interface UpdateUserBody {
    fullName?: string;
    role?: 'ADMIN' | 'MANAGER' | 'ANALYST';
    isActive?: boolean;
}

interface ListUsersQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'ADMIN' | 'MANAGER' | 'ANALYST';
    isActive?: boolean;
}

export async function usersRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/users
     * List all users with pagination and filtering
     */
    fastify.get<{ Querystring: ListUsersQuery }>('/api/users', {
        preHandler: [requireAuth, requirePermission('users:read')],
        schema: {
            description: 'List all users with pagination and filtering',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                    search: { type: 'string' },
                    role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'ANALYST'] },
                    isActive: { type: 'boolean' },
                },
            },
        },
    }, async (request) => {
        const { page = 1, limit = 20, search, role, isActive } = request.query;
        const offset = (page - 1) * limit;

        // Build where conditions
        const conditions = [];
        if (search) {
            conditions.push(
                sql`(${users.fullName} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`})`
            );
        }
        if (role) {
            conditions.push(eq(users.role, role));
        }
        if (isActive !== undefined) {
            conditions.push(eq(users.isActive, isActive));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(whereClause);

        // Get users
        const usersList = await db
            .select({
                id: users.id,
                email: users.email,
                fullName: users.fullName,
                role: users.role,
                isActive: users.isActive,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(whereClause)
            .orderBy(users.fullName)
            .limit(limit)
            .offset(offset);

        return successResponse(usersList, {
            page,
            perPage: limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
        });
    });

    /**
     * GET /api/users/:id
     * Get user by ID
     */
    fastify.get<{ Params: { id: string } }>('/api/users/:id', {
        preHandler: [requireAuth, requirePermission('users:read')],
        schema: {
            description: 'Get user by ID',
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
    }, async (request) => {
        const { id } = request.params;

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!user) {
            throw ApiError.notFound('User');
        }

        // Get analyst info if user is an analyst
        let analystInfo = null;
        if (user.role === 'ANALYST') {
            const [analyst] = await db
                .select()
                .from(analysts)
                .where(eq(analysts.userId, id))
                .limit(1);

            if (analyst) {
                const skillRecords = await db
                    .select({ parameterId: analystSkills.parameterId })
                    .from(analystSkills)
                    .where(eq(analystSkills.analystId, analyst.id));
                analystInfo = {
                    ...analyst,
                    skills: skillRecords.map(s => s.parameterId).filter(Boolean),
                };
            }
        }

        return successResponse({
            ...user,
            analyst: analystInfo,
        });
    });

    /**
     * POST /api/users
     * Create a new user (Admin only)
     */
    fastify.post<{ Body: CreateUserBody }>('/api/users', {
        preHandler: [requireAuth, requirePermission('users:write')],
        schema: {
            description: 'Create a new user',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['email', 'password', 'fullName', 'role'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    fullName: { type: 'string', minLength: 2 },
                    role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'ANALYST'] },
                },
            },
        },
    }, async (request, reply) => {
        const { email, password, fullName, role } = request.body;

        // Check if email already exists
        const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser) {
            throw ApiError.conflict('Email already registered');
        }

        // Create user via auth service (creates in Supabase Auth + database)
        const newUser = await authService.createUser(email, password, fullName, role);

        // If analyst, create analyst record
        if (role === 'ANALYST') {
            await db.insert(analysts).values({
                id: crypto.randomUUID(),
                userId: newUser.id,
                isActive: true,
            });
        }

        return reply.status(201).send(successResponse(newUser));
    });

    /**
     * PUT /api/users/:id
     * Update user by ID
     */
    fastify.put<{ Params: { id: string }; Body: UpdateUserBody }>('/api/users/:id', {
        preHandler: [requireAuth, requirePermission('users:write')],
        schema: {
            description: 'Update user by ID',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
            body: {
                type: 'object',
                properties: {
                    fullName: { type: 'string', minLength: 2 },
                    role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'ANALYST'] },
                    isActive: { type: 'boolean' },
                },
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const updateData = request.body;

        // Check if user exists
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!existingUser) {
            throw ApiError.notFound('User');
        }

        // Update user
        const [updatedUser] = await db
            .update(users)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();

        // Handle role change to ANALYST
        if (updateData.role === 'ANALYST' && existingUser.role !== 'ANALYST') {
            const [existingAnalyst] = await db
                .select()
                .from(analysts)
                .where(eq(analysts.userId, id))
                .limit(1);

            if (!existingAnalyst) {
                await db.insert(analysts).values({
                    id: crypto.randomUUID(),
                    userId: id,
                    isActive: true,
                });
            }
        }

        return successResponse(updatedUser);
    });

    /**
     * DELETE /api/users/:id
     * Soft delete user (set isActive = false)
     */
    fastify.delete<{ Params: { id: string } }>('/api/users/:id', {
        preHandler: [requireAuth, requirePermission('users:write')],
        schema: {
            description: 'Deactivate user (soft delete)',
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
    }, async (request) => {
        const { id } = request.params;

        // Prevent self-deletion
        if (request.user?.id === id) {
            throw ApiError.badRequest('Cannot deactivate your own account');
        }

        const [updatedUser] = await db
            .update(users)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();

        if (!updatedUser) {
            throw ApiError.notFound('User');
        }

        return successResponse({ message: 'User deactivated successfully' });
    });

    // ==================== Departments ====================

    /**
     * GET /api/departments
     */
    fastify.get<{ Querystring: { page?: number; limit?: number; search?: string } }>('/api/departments', {
        preHandler: [requireAuth, requirePermission('master-data:read')],
        schema: {
            description: 'List all departments',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const { page = 1, limit = 50, search } = request.query;
        const offset = (page - 1) * limit;

        const conditions = search ? [sql`${departments.name} ILIKE ${`%${search}%`}`] : [];
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(departments).where(whereClause);
        const deptList = await db.select().from(departments).where(whereClause).orderBy(departments.name).limit(limit).offset(offset);

        return successResponse(deptList, { page, perPage: limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) });
    });

    /**
     * POST /api/departments
     */
    fastify.post<{ Body: { name: string } }>('/api/departments', {
        preHandler: [requireAuth, requirePermission('master-data:write')],
        schema: {
            description: 'Create department',
            tags: ['Master Data'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 2 },
                },
            },
        },
    }, async (request, reply) => {
        const [newDept] = await db.insert(departments).values({
            id: crypto.randomUUID(),
            name: request.body.name,
            isActive: true,
        }).returning();

        return reply.status(201).send(successResponse(newDept));
    });
}
