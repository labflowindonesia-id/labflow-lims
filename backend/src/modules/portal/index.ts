/**
 * Portal Module
 * Customer portal endpoints
 */
import { FastifyPluginAsync } from 'fastify';
import portalRoutes from './portal.routes';

export const portalModule: FastifyPluginAsync = async (fastify) => {
    await fastify.register(portalRoutes);
};

export { portalRoutes };
export default portalModule;
