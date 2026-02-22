"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
    role?: "admin" | "analyst" | "manager";
    className?: string;
}

export function Sidebar({ role = "admin", className }: SidebarProps) {
    const pathname = usePathname();
    const filteredNavItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

    return (
        <aside
            className={cn(
                "z-40 flex w-16 flex-col items-center gap-6 border-r border-border-light bg-surface-light py-6 dark:bg-surface-dark dark:border-border-dark",
                className
            )}
        >
            <nav className="flex w-full flex-col gap-2 px-2">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center justify-center rounded-lg p-2 transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary" // Active
                                    : "text-text-secondary hover:bg-background-light hover:text-primary dark:hover:bg-background-dark" // Inactive
                            )}
                        >
                            <span className="material-symbols-outlined">
                                {item.icon}
                            </span>
                            {/* Tooltip */}
                            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                {item.title}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
