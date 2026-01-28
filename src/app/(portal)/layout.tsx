"use client";

import "@/app/globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <div className={cn(inter.className, "min-h-screen bg-slate-50 flex flex-col")}>
            {/* Simple Top Navigation */}
            {!isLoginPage && (
                <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900 text-white shadow-md backdrop-blur">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                                <span className="material-symbols-outlined text-lg">science</span>
                            </div>
                            <span className="text-lg font-bold tracking-tight">LabFlow Portal</span>
                        </div>

                        <nav className="flex items-center gap-6 text-sm font-medium">
                            <Link href="/portal" className="text-slate-300 hover:text-white transition-colors">
                                My Orders
                            </Link>
                            <Link href="/portal/profile" className="text-slate-300 hover:text-white transition-colors">
                                Profile
                            </Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-right">
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium">Budi Santoso</p>
                                    <p className="text-xs text-slate-400">PT. Indofood Sukses Makmur</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/50">
                                    BS
                                </div>
                            </div>
                            <Link href="/login">
                                <button className="text-slate-400 hover:text-white">
                                    <span className="material-symbols-outlined">logout</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </header>
            )}

            <main className="flex-1 container mx-auto px-4 py-8">
                {children}
            </main>

            <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
                <p>&copy; 2026 LabFlow LIMS. All rights reserved.</p>
            </footer>
        </div>
    );
}
