/**
 * Health Endpoint Integration Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestApp, closeTestApp, GET } from './setup.js';

describe('Health Endpoints', () => {
    beforeAll(async () => {
        await getTestApp();
    });

    afterAll(async () => {
        await closeTestApp();
    });

    describe('GET /health', () => {
        it('should return 200 OK', async () => {
            const response = await GET('/health');
            expect(response.statusCode).toBe(200);
        });

        it('should return status ok', async () => {
            const response = await GET('/health');
            const body = JSON.parse(response.body);
            expect(body.status).toBe('ok');
        });

        it('should include timestamp', async () => {
            const response = await GET('/health');
            const body = JSON.parse(response.body);
            expect(body.timestamp).toBeDefined();
            expect(new Date(body.timestamp).getTime()).not.toBeNaN();
        });
    });
});
