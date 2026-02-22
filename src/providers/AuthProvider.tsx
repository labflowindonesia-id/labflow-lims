"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type AppRole = "admin" | "manager" | "analyst";

interface AppUser {
    id: string;
    full_name: string;
    email: string;
    role: AppRole;
    initials: string;
}

interface AuthContextValue {
    user: AppUser | null;
    supabaseUser: SupabaseUser | null;
    role: AppRole;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    supabaseUser: null,
    role: "admin",
    isLoading: true,
    signOut: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

function mapDbRoleToAppRole(dbRole: string): AppRole {
    switch (dbRole) {
        case "MANAGER":
            return "manager";
        case "ANALYST":
            return "analyst";
        case "ADMIN":
        default:
            return "admin";
    }
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const lookupAppUser = useCallback(async (authUser: SupabaseUser) => {
        const { data, error } = await supabase
            .from("users")
            .select("id, full_name, email, role")
            .eq("id", authUser.id)
            .single<{ id: string; full_name: string; email: string; role: string }>();

        if (error || !data) {
            console.error("Failed to lookup app user:", error);
            return null;
        }

        return {
            id: data.id,
            full_name: data.full_name,
            email: data.email,
            role: mapDbRoleToAppRole(data.role),
            initials: getInitials(data.full_name),
        } as AppUser;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                const { data: { user: authUser }, error } = await supabase.auth.getUser();

                if (error) {
                    console.warn("Auth init: session invalid or expired, clearing state.");
                    if (mounted) {
                        setUser(null);
                        setSupabaseUser(null);
                        setIsLoading(false);
                    }
                    return;
                }

                if (authUser && mounted) {
                    setSupabaseUser(authUser);
                    const appUser = await lookupAppUser(authUser);
                    setUser(appUser);
                }
            } catch (err) {
                console.warn("Auth init failed:", err);
                if (mounted) {
                    setUser(null);
                    setSupabaseUser(null);
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
                    setSupabaseUser(session.user);
                    const appUser = await lookupAppUser(session.user);
                    if (mounted) setUser(appUser);
                } else if (event === "SIGNED_OUT") {
                    setUser(null);
                    setSupabaseUser(null);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lookupAppUser]);

    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.warn("Sign out error (proceeding anyway):", err);
        }
        setUser(null);
        setSupabaseUser(null);
        window.location.href = "/admin/login";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                supabaseUser,
                role: user?.role ?? "admin",
                isLoading,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
