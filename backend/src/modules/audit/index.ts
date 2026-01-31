/**
 * Audit Module
 * Exports all audit and change request related routes
 */
import { FastifyPluginAsync } from 'fastify';
import changeRequestRoutes from './change-requests.routes';
import auditRoutes from './audit.routes';

export const auditModule: FastifyPluginAsync = async (fastify) => {
    // Register change request routes
    await fastify.register(changeRequestRoutes);

    // Register audit routes
    await fastify.register(auditRoutes);
};

export { changeRequestRoutes, auditRoutes };
export default auditModule;
