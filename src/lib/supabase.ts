import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

// Create a single supabase client for the browser
// Uses createBrowserClient from @supabase/ssr for proper cookie-based auth
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper to set session context for RLS
// Uses PostgreSQL set_config function to set session-level variables
export async function setSessionContext(userId: string) {
    const { error } = await supabase.rpc("set_config" as never, {
        setting: "app.current_user_id",
        value: userId,
    } as never);
    if (error) {
        console.error("Failed to set session context:", error);
    }
}

// Helper to set portal session context for RLS
export async function setPortalSessionContext(portalAccountId: string) {
    const { error } = await supabase.rpc("set_config" as never, {
        setting: "app.current_portal_account_id",
        value: portalAccountId,
    } as never);
    if (error) {
        console.error("Failed to set portal session context:", error);
    }
}

export default supabase;
