import type { FastifyCorsOptions } from '@fastify/cors';
import { config } from './env.js';

export const corsOptions: FastifyCorsOptions = {
    origin: config.isProduction
        ? [...config.frontendUrls] // Spread to create mutable array
        : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    maxAge: 86400, // 24 hours
};
