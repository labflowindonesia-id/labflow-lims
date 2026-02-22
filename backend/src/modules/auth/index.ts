// Auth module exports
export { authService } from './auth.service';
export type { AuthUser, PortalUser } from './auth.service';
export {
    requireAuth,
    requirePortalAuth,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireManager,
    requireAnalyst,
    requireAdminOrManager,
    requireAnyInternalRole,
} from './auth.middleware';
export {
    requirePermission,
    requireAnyPermission,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsForRole,
} from './rbac.middleware';
export type { Permission } from './rbac.middleware';
export { authRoutes } from './auth.routes';
