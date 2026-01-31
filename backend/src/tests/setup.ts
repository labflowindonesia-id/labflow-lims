/**
 * Test Setup
 * Configures the test environment for integration tests
 */
import { FastifyInstance } from 'fastify';

// Test server instance
let testApp: FastifyInstance | null = null;

/**
 * Creates a fresh Fastify instance for testing
 * Uses in-memory database or test database
 */
export async function createTestApp(): Promise<FastifyInstance> {
    // Import the app builder lazily to avoid module issues
    const { buildApp } = await import('../app.js');
    const app = await buildApp();
    return app;
}

/**
 * Gets or creates the test app instance
 */
export async function getTestApp(): Promise<FastifyInstance> {
    if (!testApp) {
        testApp = await createTestApp();
        await testApp.ready();
    }
    return testApp;
}

/**
 * Closes the test app
 */
export async function closeTestApp(): Promise<void> {
    if (testApp) {
        await testApp.close();
        testApp = null;
    }
}

/**
 * Makes a request to the test app
 */
export async function testRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    options?: {
        body?: unknown;
        headers?: Record<string, string>;
        query?: Record<string, string>;
    }
) {
    const app = await getTestApp();

    return app.inject({
        method,
        url,
        payload: options?.body,
        headers: options?.headers,
        query: options?.query,
    });
}

// Test helpers
export const GET = (url: string, options?: Parameters<typeof testRequest>[2]) =>
    testRequest('GET', url, options);

export const POST = (url: string, options?: Parameters<typeof testRequest>[2]) =>
    testRequest('POST', url, options);

export const PUT = (url: string, options?: Parameters<typeof testRequest>[2]) =>
    testRequest('PUT', url, options);

export const DELETE = (url: string, options?: Parameters<typeof testRequest>[2]) =>
    testRequest('DELETE', url, options);

export const PATCH = (url: string, options?: Parameters<typeof testRequest>[2]) =>
    testRequest('PATCH', url, options);
