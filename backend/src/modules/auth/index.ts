// Auth module exports
export { authService, AuthUser, PortalUser } from './auth.service';
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
    Permission,
} from './rbac.middleware';
export { authRoutes } from './auth.routes';
