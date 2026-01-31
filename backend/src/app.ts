import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { config, corsOptions } from './config/index.js';
import { ApiError, errorResponse } from './shared/errors.js';

export async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify({
        logger: {
            level: config.isDevelopment ? 'debug' : 'info',
            transport: config.isDevelopment
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
        },
        disableRequestLogging: config.isProduction,
    });

    // Security plugins
    await app.register(helmet, {
        contentSecurityPolicy: false, // Disable for API
    });

    await app.register(cors, corsOptions);

    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
            success: false,
            error: { code: 'RATE_LIMIT', message: 'Too many requests' },
        }),
    });

    // File upload support
    await app.register(multipart, {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB max
            files: 10,
        },
    });

    // OpenAPI documentation
    await app.register(swagger, {
        openapi: {
            openapi: '3.1.0',
            info: {
                title: 'LabFlow LIMS API',
                description: 'Laboratory Information Management System API',
                version: '1.0.0',
                contact: {
                    name: 'PT LabFlow Indonesia',
                    email: 'api@labflow.id',
                },
            },
            servers: [
                {
                    url: config.isDevelopment ? 'http://localhost:3001' : 'https://api.labflow.id',
                    description: config.isDevelopment ? 'Development' : 'Production',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            tags: [
                { name: 'Auth', description: 'Authentication endpoints' },
                { name: 'Master Data', description: 'Master data management' },
                { name: 'Quotations', description: 'Quotation management' },
                { name: 'Work Orders', description: 'Work order and sample receiving' },
                { name: 'Tasks', description: 'Test task management' },
                { name: 'Results', description: 'Test results entry' },
                { name: 'QC', description: 'Quality control' },
                { name: 'Review', description: 'Result review and approval' },
                { name: 'Reports', description: 'Report generation' },
                { name: 'Change Requests', description: 'Change request management' },
                { name: 'Portal', description: 'Customer portal' },
                { name: 'Search', description: 'Global search' },
                { name: 'Archive', description: 'Data archival and retention' },
                { name: 'Integrations', description: 'Webhooks and external integrations' },
            ],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
            persistAuthorization: true,
        },
    });

    // Global error handler
    app.setErrorHandler((error, request: FastifyRequest, reply: FastifyReply) => {
        request.log.error(error);

        if (error instanceof ApiError) {
            return reply.status(error.statusCode).send(errorResponse(error));
        }

        // Zod validation errors
        if (error.name === 'ZodError') {
            return reply.status(400).send({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error,
                },
            });
        }

        // Fastify validation errors
        if (error.validation) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.message,
                    details: error.validation,
                },
            });
        }

        // Generic error
        return reply.status(500).send({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: config.isProduction ? 'Internal server error' : error.message,
            },
        });
    });

    // Health check
    app.get('/health', {
        schema: {
            description: 'Health check endpoint',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        version: { type: 'string' },
                    },
                },
            },
        },
    }, async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    }));

    // Root endpoint
    app.get('/', async () => ({
        name: 'LabFlow LIMS API',
        version: '1.0.0',
        docs: '/docs',
    }));

    // Register API routes
    // Auth routes are registered at root level (e.g., /auth/login, /portal/auth/login)
    const { authRoutes } = await import('./modules/auth/auth.routes.js');
    await app.register(authRoutes);

    // Master data routes (users, customers, parameters, methods, instruments, etc.)
    const { masterDataRoutes } = await import('./modules/master-data/index.js');
    await app.register(masterDataRoutes);

    // Transaction routes (quotations, work orders, tasks, results)
    const { transactionsModule } = await import('./modules/transactions/index.js');
    await app.register(transactionsModule);

    // Audit routes (change requests, audit logging, entity locks)
    const { auditModule } = await import('./modules/audit/index.js');
    await app.register(auditModule);

    // Portal routes (customer portal)
    const { portalModule } = await import('./modules/portal/index.js');
    await app.register(portalModule);

    // Integrations routes (webhooks, realtime, alerts)
    const { integrationsModule } = await import('./modules/integrations/index.js');
    await app.register(integrationsModule);

    // Search routes (global search, archive)
    const { searchModule } = await import('./modules/search/index.js');
    await app.register(searchModule);

    return app;
}
