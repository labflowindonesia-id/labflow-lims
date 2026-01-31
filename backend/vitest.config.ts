import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Test file patterns
        include: ['src/tests/**/*.test.ts'],

        // Environment
        environment: 'node',

        // Globals (describe, it, expect, etc.)
        globals: true,

        // Test timeout (15 seconds for integration tests)
        testTimeout: 15000,

        // Hook timeout
        hookTimeout: 10000,

        // Single-threaded to avoid port conflicts
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },

        // Coverage (optional)
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/tests/**', 'src/**/*.d.ts'],
        },
    },
});
