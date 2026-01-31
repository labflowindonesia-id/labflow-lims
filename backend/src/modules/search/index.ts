/**
 * Search & Archive Module
 * Global search and data archival
 */
import { FastifyInstance } from 'fastify';
import { searchArchiveRoutes } from './search.routes.js';

export async function searchModule(app: FastifyInstance) {
    await app.register(searchArchiveRoutes, { prefix: '/api' });
}
