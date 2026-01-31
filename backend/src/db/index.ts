import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

// Create postgres connection
const connectionString = env.DATABASE_URL;
const client = postgres(connectionString, {
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// For testing connection
export async function testConnection() {
    try {
        const result = await client`SELECT NOW()`;
        console.log('✅ Database connected:', result[0].now);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
