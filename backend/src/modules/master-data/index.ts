import { FastifyInstance } from 'fastify';
import { usersRoutes } from './users.routes';
import { customersRoutes } from './customers.routes';
import {
    parametersRoutes,
    methodsRoutes,
    instrumentsRoutes,
    matricesRoutes,
    rulesRoutes,
    priceListRoutes,
    testPackagesRoutes,
} from './master-data.routes';

export async function masterDataRoutes(fastify: FastifyInstance): Promise<void> {
    // Register all master data routes
    await fastify.register(usersRoutes);
    await fastify.register(customersRoutes);
    await fastify.register(parametersRoutes);
    await fastify.register(methodsRoutes);
    await fastify.register(instrumentsRoutes);
    await fastify.register(matricesRoutes);
    await fastify.register(rulesRoutes);
    await fastify.register(priceListRoutes);
    await fastify.register(testPackagesRoutes);
}
