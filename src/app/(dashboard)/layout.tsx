import { AuthProvider } from "@/providers/AuthProvider";
import { DashboardShell } from "@/components/layout/DashboardShell";
import SearchProvider from "@/components/search/SearchProvider";

// Force dynamic rendering for all dashboard routes to avoid prerendering errors
export const dynamic = "force-dynamic";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <SearchProvider>
                <DashboardShell>{children}</DashboardShell>
            </SearchProvider>
        </AuthProvider>
    );
}
