import { FastifyInstance } from 'fastify';
import { quotationsRoutes } from './quotations.routes';
import { workOrdersRoutes } from './work-orders.routes';
import { tasksRoutes } from './tasks.routes';
import { resultsRoutes } from './results.routes';
import { reviewRoutes } from './review.routes';
import { reportRoutes } from './reports.routes';

/**
 * Register all transaction routes
 * Core workflow APIs for LIMS operations
 */
export async function transactionsModule(fastify: FastifyInstance): Promise<void> {
    // Quotations - Quote creation, approval workflow
    await fastify.register(quotationsRoutes);

    // Work Orders - Sample receiving, work order management
    await fastify.register(workOrdersRoutes);

    // Tasks - Test scheduling, work plans, analyst assignment
    await fastify.register(tasksRoutes);

    // Results - Result entry, test runs, QC, nonconformities
    await fastify.register(resultsRoutes);

    // Review - Result submission, approval, revision workflow
    await fastify.register(reviewRoutes);

    // Reports - CoA generation, signing, release
    await fastify.register(reportRoutes);
}

// Export individual route modules for testing
export { quotationsRoutes } from './quotations.routes';
export { workOrdersRoutes } from './work-orders.routes';
export { tasksRoutes } from './tasks.routes';
export { resultsRoutes } from './results.routes';
export { reviewRoutes } from './review.routes';
export { reportRoutes } from './reports.routes';
