import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Supabase client for auth and storage
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: false,
    },
});

// Admin client for backend operations (if service role key is available)
export const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : supabase;
