import { FastifyRequest, FastifyReply } from 'fastify';
import { authService, AuthUser, PortalUser } from './auth.service';
import { ApiError } from '../../shared/errors';

// Extend FastifyRequest to include user
declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthUser;
        portalUser?: PortalUser;
    }
}

/**
 * Extract bearer token from Authorization header
 */
function extractBearerToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Authentication middleware for internal users (Supabase Auth)
 * Use this for all internal API routes
 */
export async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const token = extractBearerToken(request);

        if (!token) {
            throw ApiError.unauthorized('Authorization header required');
        }

        const user = await authService.verifyToken(token);
        request.user = user;
    } catch (error) {
        if (error instanceof ApiError) {
            return reply.status(error.statusCode).send({
                success: false,
                error: {
                    code: error.code ?? 'UNAUTHORIZED',
                    message: error.message,
                },
            });
        }
        return reply.status(401).send({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication failed',
            },
        });
    }
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export async function optionalAuth(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const token = extractBearerToken(request);

        if (token) {
            const user = await authService.verifyToken(token);
            request.user = user;
        }
    } catch {
        // Ignore authentication errors for optional auth
        request.user = undefined;
    }
}

/**
 * Portal authentication middleware (session-based)
 * Use this for customer portal routes
 */
export async function requirePortalAuth(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const token = extractBearerToken(request);

        if (!token) {
            throw ApiError.unauthorized('Session token required');
        }

        const portalUser = await authService.verifyPortalSession(token);
        request.portalUser = portalUser;
    } catch (error) {
        if (error instanceof ApiError) {
            return reply.status(error.statusCode).send({
                success: false,
                error: {
                    code: error.code ?? 'UNAUTHORIZED',
                    message: error.message,
                },
            });
        }
        return reply.status(401).send({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Portal authentication failed',
            },
        });
    }
}

/**
 * Factory function to check if user has any of the specified roles
 */
export function requireRole(...allowedRoles: Array<'ADMIN' | 'MANAGER' | 'ANALYST'>) {
    return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Ensure user is authenticated
        if (!request.user) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            });
        }

        // Check role
        if (!allowedRoles.includes(request.user.role)) {
            return reply.status(403).send({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                },
            });
        }
    };
}

// Pre-configured role middleware for convenience
export const requireAdmin = requireRole('ADMIN');
export const requireManager = requireRole('MANAGER');
export const requireAnalyst = requireRole('ANALYST');
export const requireAdminOrManager = requireRole('ADMIN', 'MANAGER');
export const requireAnyInternalRole = requireRole('ADMIN', 'MANAGER', 'ANALYST');
