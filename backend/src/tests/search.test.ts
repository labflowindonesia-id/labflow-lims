/**
 * Search & Archive API Integration Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestApp, closeTestApp, GET, POST } from './setup.js';

describe('Search & Archive API', () => {
    beforeAll(async () => {
        await getTestApp();
    });

    afterAll(async () => {
        await closeTestApp();
    });

    describe('GET /api/search', () => {
        it('should require query parameter', async () => {
            const response = await GET('/api/search');
            expect(response.statusCode).toBe(400);
        });

        it('should require minimum 2 character query', async () => {
            const response = await GET('/api/search', { query: { q: 'a' } });
            expect(response.statusCode).toBe(400);
        });

        it('should return search results for valid query', async () => {
            const response = await GET('/api/search', { query: { q: 'test' } });
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.query).toBe('test');
            expect(body.results).toBeDefined();
            expect(Array.isArray(body.results)).toBe(true);
        });

        it('should filter by type', async () => {
            const response = await GET('/api/search', {
                query: { q: 'test', types: 'customer,work_order' }
            });
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.results).toBeDefined();
        });

        it('should respect limit parameter', async () => {
            const response = await GET('/api/search', {
                query: { q: 'test', limit: '5' }
            });
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.limit).toBe(5);
        });
    });

    describe('GET /api/archive/stats', () => {
        it('should return archive statistics', async () => {
            const response = await GET('/api/archive/stats');
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.retentionPeriodYears).toBe(5);
            expect(body.retentionCutoffDate).toBeDefined();
            expect(body.statistics).toBeDefined();
            expect(body.statistics.workOrders).toBeDefined();
            expect(body.statistics.reports).toBeDefined();
            expect(body.statistics.samples).toBeDefined();
        });
    });

    describe('GET /api/archive/work-orders', () => {
        it('should return archived work orders list', async () => {
            const response = await GET('/api/archive/work-orders');
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.type).toBe('work_orders');
            expect(body.retentionCutoffDate).toBeDefined();
            expect(body.data).toBeDefined();
            expect(Array.isArray(body.data)).toBe(true);
        });

        it('should respect pagination', async () => {
            const response = await GET('/api/archive/work-orders', {
                query: { limit: '10', offset: '0' }
            });
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.limit).toBe(10);
            expect(body.offset).toBe(0);
        });
    });

    describe('GET /api/archive/reports', () => {
        it('should return archived reports list', async () => {
            const response = await GET('/api/archive/reports');
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.type).toBe('reports');
            expect(body.data).toBeDefined();
            expect(Array.isArray(body.data)).toBe(true);
        });
    });

    describe('GET /api/archive/policy', () => {
        it('should return retention policy', async () => {
            const response = await GET('/api/archive/policy');
            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.retentionPeriodYears).toBe(5);
            expect(body.policies).toBeDefined();
            expect(Array.isArray(body.policies)).toBe(true);
            expect(body.notes).toBeDefined();
        });

        it('should include expected policy entities', async () => {
            const response = await GET('/api/archive/policy');
            const body = JSON.parse(response.body);

            const entities = body.policies.map((p: { entity: string }) => p.entity);
            expect(entities).toContain('work_orders');
            expect(entities).toContain('reports');
            expect(entities).toContain('audit_logs');
        });
    });
});
