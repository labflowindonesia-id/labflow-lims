/**
 * Integrations API Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestApp, closeTestApp, GET, POST } from './setup.js';

describe('Integrations API', () => {
    beforeAll(async () => {
        await getTestApp();
    });

    afterAll(async () => {
        await closeTestApp();
    });

    describe('GET /api/integrations/status', () => {
        it('should return integration status', async () => {
            const response = await GET('/api/integrations/status');
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.webhooks).toBeDefined();
            expect(body.webhooks.outgoing).toBeDefined();
            expect(body.webhooks.incoming).toBeDefined();
            expect(body.realtime).toBeDefined();
            expect(body.alerts).toBeDefined();
        });

        it('should show webhook configuration status', async () => {
            const response = await GET('/api/integrations/status');
            const body = JSON.parse(response.body);

            expect(typeof body.webhooks.outgoing.configured).toBe('boolean');
            expect(body.webhooks.incoming.signatureVerification).toBe(true);
        });
    });

    describe('GET /api/integrations/realtime/channels', () => {
        it('should return realtime channel configuration', async () => {
            const response = await GET('/api/integrations/realtime/channels');
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.channels).toBeDefined();
            expect(Array.isArray(body.channels)).toBe(true);
            expect(body.documentation).toBeDefined();
        });

        it('should include expected channels', async () => {
            const response = await GET('/api/integrations/realtime/channels');
            const body = JSON.parse(response.body);

            const channelNames = body.channels.map((c: { name: string }) => c.name);
            expect(channelNames).toContain('work-orders');
            expect(channelNames).toContain('samples');
            expect(channelNames).toContain('test-results');
            expect(channelNames).toContain('reports');
            expect(channelNames).toContain('notifications');
        });

        it('should include channel details', async () => {
            const response = await GET('/api/integrations/realtime/channels');
            const body = JSON.parse(response.body);

            const firstChannel = body.channels[0];
            expect(firstChannel.name).toBeDefined();
            expect(firstChannel.table).toBeDefined();
            expect(firstChannel.events).toBeDefined();
            expect(firstChannel.description).toBeDefined();
        });
    });

    describe('POST /api/integrations/webhooks/test', () => {
        it('should attempt to send test webhook', async () => {
            const response = await POST('/api/integrations/webhooks/test');
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(typeof body.success).toBe('boolean');
            expect(body.message).toBeDefined();
        });
    });

    describe('POST /api/integrations/webhooks/receive', () => {
        it('should accept incoming webhook', async () => {
            const response = await POST('/api/integrations/webhooks/receive', {
                body: {
                    event: 'test.event',
                    source: 'test',
                    data: { message: 'test' }
                },
                headers: { 'Content-Type': 'application/json' }
            });
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.received).toBe(true);
            expect(body.event).toBe('test.event');
        });

        it('should require event and source', async () => {
            const response = await POST('/api/integrations/webhooks/receive', {
                body: { data: {} },
                headers: { 'Content-Type': 'application/json' }
            });
            expect(response.statusCode).toBe(400);
        });
    });

    describe('POST /api/integrations/alerts/due-date-check', () => {
        it('should run due date check', async () => {
            const response = await POST('/api/integrations/alerts/due-date-check');
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(typeof body.checked).toBe('number');
            expect(typeof body.alertsSent).toBe('number');
            expect(body.workOrders).toBeDefined();
            expect(Array.isArray(body.workOrders)).toBe(true);
        });
    });
});
