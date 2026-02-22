"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/providers/AuthProvider";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { user, role, isLoading, signOut } = useAuth();

    return (
        <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
            <Topbar
                userName={user?.full_name}
                userRole={user?.role}
                userInitials={user?.initials}
                isLoading={isLoading}
                onSignOut={signOut}
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar role={role} className="hidden md:flex" />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10">
                    <div className="mx-auto flex max-w-7xl flex-col gap-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
