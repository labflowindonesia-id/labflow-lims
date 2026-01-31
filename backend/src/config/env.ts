import 'dotenv/config';
import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
    // Supabase
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    // Database
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().optional(),

    // n8n (optional)
    N8N_WEBHOOK_URL: z.string().url().optional(),
    N8N_WEBHOOK_API_KEY: z.string().optional(),

    // Server
    PORT: z.string().default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    API_URL: z.string().url().default('http://localhost:3001'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // PDF Worker
    PDF_WORKER_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;

// Derived config
export const config = {
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
    port: parseInt(env.PORT, 10),
    frontendUrls: [env.FRONTEND_URL, 'http://localhost:3000'],
} as const;
