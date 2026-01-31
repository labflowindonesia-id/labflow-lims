import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthUser } from './auth.service';
import { ApiError } from '../../shared/errors';

/**
 * RBAC Permission definitions based on LabFlow LIMS requirements
 * 
 * | Role     | Permissions |
 * |----------|-------------|
 * | ADMIN    | Create quotations, receiving, scheduling, create CR |
 * | ANALYST  | View worklist, input results, QC input, submit for review, create CR |
 * | MANAGER  | View all, approve quotations, approve CR, review & sign reports (NO data input) |
 */

export type Permission =
    // Master Data
    | 'master-data:read'
    | 'master-data:write'

    // Quotations
    | 'quotations:read'
    | 'quotations:write'
    | 'quotations:create'
    | 'quotations:update'
    | 'quotations:submit'
    | 'quotations:approve'

    // Receiving & Work Orders
    | 'work-orders:read'
    | 'work-orders:write'
    | 'work-orders:create'
    | 'work-orders:confirm'

    // Scheduling
    | 'scheduling:read'
    | 'scheduling:assign'

    // Worklist & Testing
    | 'worklist:read'
    | 'tasks:read'
    | 'tasks:write'
    | 'tasks:start'

    // Results
    | 'results:read'
    | 'results:write'
    | 'results:enter'
    | 'results:submit'

    // QC
    | 'qc:read'
    | 'qc:enter'

    // Review
    | 'review:read'
    | 'review:approve'
    | 'review:reject'

    // Reports
    | 'reports:read'
    | 'reports:write'
    | 'reports:generate'
    | 'reports:approve'
    | 'reports:sign'
    | 'reports:release'
    | 'reports:finalize'

    // Change Requests
    | 'change-requests:read'
    | 'change-requests:create'
    | 'change-requests:submit'
    | 'change-requests:approve'

    // Users & Settings
    | 'users:read'
    | 'users:write'
    | 'settings:read'
    | 'settings:write';

/**
 * Role-to-permissions mapping
 */
const rolePermissions: Record<'ADMIN' | 'MANAGER' | 'ANALYST', Permission[]> = {
    ADMIN: [
        // Master Data - full access
        'master-data:read',
        'master-data:write',

        // Quotations - create and submit, not approve
        'quotations:read',
        'quotations:write',
        'quotations:create',
        'quotations:update',
        'quotations:submit',

        // Receiving - full access
        'work-orders:read',
        'work-orders:write',
        'work-orders:create',
        'work-orders:confirm',

        // Scheduling - full access
        'scheduling:read',
        'scheduling:assign',

        // Worklist & Tasks - read and assign
        'worklist:read',
        'tasks:read',
        'tasks:write',

        // Results - read only (no entry)
        'results:read',

        // QC - read only
        'qc:read',

        // Review - read only
        'review:read',

        // Reports - read and generate draft
        'reports:read',
        'reports:generate',

        // Change Requests - create and submit
        'change-requests:read',
        'change-requests:create',
        'change-requests:submit',

        // Users & Settings - full access
        'users:read',
        'users:write',
        'settings:read',
        'settings:write',
    ],

    MANAGER: [
        // Master Data - read only
        'master-data:read',

        // Quotations - read and approve (NO create/update)
        'quotations:read',
        'quotations:approve',

        // Receiving - read only
        'work-orders:read',

        // Scheduling - read only (can view but not assign)
        'scheduling:read',

        // Worklist - read only
        'worklist:read',
        'tasks:read',

        // QC - read for monitoring
        'qc:read',

        // Review - full access to review and approve
        'review:read',
        'review:approve',
        'review:reject',

        // Reports - full access including sign and finalize
        'reports:read',
        'reports:write',
        'reports:generate',
        'reports:approve',
        'reports:sign',
        'reports:release',
        'reports:finalize',

        // Change Requests - read and approve (NO create)
        'change-requests:read',
        'change-requests:approve',

        // Users - read only
        'users:read',
        'settings:read',
    ],

    ANALYST: [
        // Master Data - read only
        'master-data:read',

        // Quotations - read only
        'quotations:read',

        // Receiving - read only
        'work-orders:read',

        // Scheduling - read only (view own assignments)
        'scheduling:read',

        // Worklist - full access to own tasks
        'worklist:read',
        'tasks:read',
        'tasks:start',

        // Results - full access to enter and submit results
        'results:read',
        'results:write',
        'results:enter',
        'results:submit',

        // QC - full access to enter data
        'qc:read',
        'qc:enter',

        // Review - read only (view own submissions)
        'review:read',

        // Reports - read only
        'reports:read',

        // Change Requests - create and submit
        'change-requests:read',
        'change-requests:create',
        'change-requests:submit',
    ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: AuthUser, permission: Permission): boolean {
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthUser, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthUser, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Middleware factory for checking permissions
 */
export function requirePermission(...requiredPermissions: Permission[]) {
    return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.user) {
            return reply.status(401).send({
                error: 'Authentication required',
                statusCode: 401,
            });
        }

        for (const permission of requiredPermissions) {
            if (!hasPermission(request.user, permission)) {
                return reply.status(403).send({
                    error: `Permission denied: ${permission}`,
                    statusCode: 403,
                    required: requiredPermissions,
                    userRole: request.user.role,
                });
            }
        }
    };
}

/**
 * Middleware factory for checking any of the permissions
 */
export function requireAnyPermission(...requiredPermissions: Permission[]) {
    return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.user) {
            return reply.status(401).send({
                error: 'Authentication required',
                statusCode: 401,
            });
        }

        if (!hasAnyPermission(request.user, requiredPermissions)) {
            return reply.status(403).send({
                error: `Permission denied. Requires any of: ${requiredPermissions.join(', ')}`,
                statusCode: 403,
                required: requiredPermissions,
                userRole: request.user.role,
            });
        }
    };
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: 'ADMIN' | 'MANAGER' | 'ANALYST'): Permission[] {
    return rolePermissions[role] || [];
}
