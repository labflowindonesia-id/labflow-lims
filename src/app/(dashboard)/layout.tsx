import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import SearchProvider from "@/components/search/SearchProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SearchProvider>
            <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
                {/* Topbar - Full Width Sticky */}
                <Topbar />

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Collapsed Left */}
                    <Sidebar className="hidden md:flex" />

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10">
                        <div className="mx-auto flex max-w-7xl flex-col gap-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SearchProvider>
    );
}
