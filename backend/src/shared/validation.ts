import { z } from 'zod';

// Common validation schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    perPage: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
    id: z.string().min(1),
});

export const searchQuerySchema = z.object({
    q: z.string().min(1).max(200),
});

export const dateRangeSchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});

// Validation helper
export function validateBody<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
    return schema.parse(data);
}

export function validateQuery<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
    return schema.parse(data);
}

// Common field schemas
export const statusSchema = z.enum([
    'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED',
    'CANCELLED', 'COMPLETED', 'LOCKED', 'RELEASED'
]);

export const prioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export const userRoleSchema = z.enum(['ADMIN', 'MANAGER', 'ANALYST']);

export const taskStatusSchema = z.enum([
    'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_RECHECK', 'COMPLETED', 'CANCELLED'
]);

export const complianceStatusSchema = z.enum(['PASS', 'FAIL', 'NOT_EVALUATED']);

export const limitTypeSchema = z.enum(['MAX', 'MIN', 'RANGE', 'NONE']);
