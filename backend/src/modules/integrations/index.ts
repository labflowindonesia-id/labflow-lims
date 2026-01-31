/**
 * Integrations Module
 * Handles webhooks, realtime, and external integrations
 */
import { FastifyInstance } from 'fastify';
import { integrationsRoutes } from './integrations.routes.js';

export async function integrationsModule(app: FastifyInstance) {
    await app.register(integrationsRoutes, { prefix: '/api/integrations' });
}

export { sendWebhook, WebhookEvents } from './integrations.routes.js';
