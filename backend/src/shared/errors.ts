import type { FastifyReply } from 'fastify';

// Custom error class for API errors
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
    }

    static badRequest(message: string, code?: string, details?: Record<string, unknown>) {
        return new ApiError(400, message, code ?? 'BAD_REQUEST', details);
    }

    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message, 'UNAUTHORIZED');
    }

    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message, 'FORBIDDEN');
    }

    static notFound(resource = 'Resource') {
        return new ApiError(404, `${resource} not found`, 'NOT_FOUND');
    }

    static conflict(message: string) {
        return new ApiError(409, message, 'CONFLICT');
    }

    static unprocessable(message: string, details?: Record<string, unknown>) {
        return new ApiError(422, message, 'UNPROCESSABLE_ENTITY', details);
    }

    static internal(message = 'Internal server error') {
        return new ApiError(500, message, 'INTERNAL_ERROR');
    }
}

// Standard API response format
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta?: {
        page?: number;
        perPage?: number;
        total?: number;
        totalPages?: number;
    };
}

export function successResponse<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
    return { success: true, data, meta };
}

export function errorResponse(error: ApiError): ApiResponse {
    return {
        success: false,
        error: {
            code: error.code ?? 'ERROR',
            message: error.message,
            details: error.details,
        },
    };
}

export function sendError(reply: FastifyReply, error: ApiError) {
    return reply.status(error.statusCode).send(errorResponse(error));
}
