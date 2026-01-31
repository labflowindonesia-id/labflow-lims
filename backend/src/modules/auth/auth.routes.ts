import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService, AuthUser, PortalUser } from './auth.service';
import { requireAuth, requirePortalAuth } from './auth.middleware';
import { ApiError } from '../../shared/errors';

// Request body types
interface LoginBody {
    email: string;
    password: string;
}

interface RefreshBody {
    refreshToken: string;
}

interface CreateUserBody {
    email: string;
    password: string;
    fullName: string;
    role: 'ADMIN' | 'MANAGER' | 'ANALYST';
}

interface CreatePortalAccountBody {
    customerId: string;
    email: string;
    password: string;
    contactName: string;
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
    // ==================== Internal User Authentication ====================

    /**
     * POST /auth/login
     * Login with email and password (internal users)
     */
    fastify.post<{ Body: LoginBody }>('/auth/login', {
        schema: {
            description: 'Login for internal users (ADMIN, MANAGER, ANALYST)',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                fullName: { type: 'string' },
                                role: { type: 'string' },
                                isActive: { type: 'boolean' },
                            },
                        },
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { email, password } = request.body;

        try {
            const result = await authService.login(email, password);
            return result;
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({
                    error: error.message,
                    statusCode: error.statusCode,
                });
            }
            throw error;
        }
    });

    /**
     * POST /auth/logout
     * Logout (revoke session)
     */
    fastify.post('/auth/logout', {
        preHandler: [requireAuth],
        schema: {
            description: 'Logout and revoke session',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const token = request.headers.authorization?.substring(7);
        if (token) {
            await authService.logout(token);
        }
        return { success: true, message: 'Logged out successfully' };
    });

    /**
     * POST /auth/refresh
     * Refresh access token using refresh token
     */
    fastify.post<{ Body: RefreshBody }>('/auth/refresh', {
        schema: {
            description: 'Refresh access token',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                    refreshToken: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { refreshToken } = request.body;

        try {
            const result = await authService.refreshToken(refreshToken);
            return result;
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({
                    error: error.message,
                    statusCode: error.statusCode,
                });
            }
            throw error;
        }
    });

    /**
     * GET /auth/me
     * Get current authenticated user
     */
    fastify.get('/auth/me', {
        preHandler: [requireAuth],
        schema: {
            description: 'Get current authenticated user',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        fullName: { type: 'string' },
                        role: { type: 'string' },
                        isActive: { type: 'boolean' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return request.user;
    });

    /**
     * POST /auth/users (Admin only)
     * Create a new user
     */
    fastify.post<{ Body: CreateUserBody }>('/auth/users', {
        preHandler: [requireAuth],
        schema: {
            description: 'Create a new internal user (Admin only)',
            tags: ['Auth'],
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
        // Only admins can create users
        if (request.user?.role !== 'ADMIN') {
            return reply.status(403).send({
                error: 'Only administrators can create users',
                statusCode: 403,
            });
        }

        const { email, password, fullName, role } = request.body;

        try {
            const newUser = await authService.createUser(email, password, fullName, role);
            return { success: true, user: newUser };
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({
                    error: error.message,
                    statusCode: error.statusCode,
                });
            }
            throw error;
        }
    });

    // ==================== Portal Authentication ====================

    /**
     * POST /portal/auth/login
     * Portal login for customers
     */
    fastify.post<{ Body: LoginBody }>('/portal/auth/login', {
        schema: {
            description: 'Login for customer portal',
            tags: ['Portal'],
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                customerId: { type: 'string' },
                                email: { type: 'string' },
                                customerName: { type: 'string' },
                            },
                        },
                        sessionToken: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { email, password } = request.body;

        try {
            const result = await authService.portalLogin(email, password);
            return result;
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({
                    error: error.message,
                    statusCode: error.statusCode,
                });
            }
            throw error;
        }
    });

    /**
     * POST /portal/auth/logout
     * Portal logout
     */
    fastify.post('/portal/auth/logout', {
        preHandler: [requirePortalAuth],
        schema: {
            description: 'Logout from customer portal',
            tags: ['Portal'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        const token = request.headers.authorization?.substring(7);
        if (token) {
            await authService.portalLogout(token);
        }
        return { success: true, message: 'Logged out successfully' };
    });

    /**
     * GET /portal/auth/me
     * Get current portal user
     */
    fastify.get('/portal/auth/me', {
        preHandler: [requirePortalAuth],
        schema: {
            description: 'Get current portal user',
            tags: ['Portal'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        customerId: { type: 'string' },
                        email: { type: 'string' },
                        customerName: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return request.portalUser;
    });

    /**
     * POST /portal/accounts (Admin only)
     * Create a portal account for a customer
     */
    fastify.post<{ Body: CreatePortalAccountBody }>('/portal/accounts', {
        preHandler: [requireAuth],
        schema: {
            description: 'Create a portal account for a customer (Admin only)',
            tags: ['Portal'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['customerId', 'email', 'password', 'contactName'],
                properties: {
                    customerId: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    contactName: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        // Only admins can create portal accounts
        if (request.user?.role !== 'ADMIN') {
            return reply.status(403).send({
                error: 'Only administrators can create portal accounts',
                statusCode: 403,
            });
        }

        const { customerId, email, password, contactName } = request.body;

        try {
            const portalAccount = await authService.createPortalAccount(
                customerId,
                email,
                password,
                contactName
            );
            return { success: true, account: portalAccount };
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({
                    error: error.message,
                    statusCode: error.statusCode,
                });
            }
            throw error;
        }
    });
}
