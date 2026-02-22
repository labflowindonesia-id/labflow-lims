"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const ROLE_DISPLAY: Record<string, string> = {
    admin: "Lab Administrator",
    manager: "Lab Manager",
    analyst: "Lab Analyst",
};

interface TopbarProps {
    className?: string;
    userName?: string;
    userRole?: string;
    userInitials?: string;
    isLoading?: boolean;
    onSignOut?: () => void;
}

export function Topbar({
    className,
    userName,
    userRole,
    userInitials,
    isLoading,
    onSignOut,
}: TopbarProps) {
    const displayName = userName ?? "Loading...";
    const displayRole = userRole ? ROLE_DISPLAY[userRole] ?? userRole : "Staff";

    return (
        <header
            className={cn(
                "sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border-light bg-surface-light/85 px-6 backdrop-blur-md dark:bg-background-dark/85 dark:border-border-dark",
                className
            )}
        >
            <div className="flex items-center gap-12">
                {/* Logo Area */}
                <div className="flex items-center gap-3 text-primary">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-2xl">science</span>
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-text-main dark:text-white">
                        LabFlow <span className="font-normal text-primary">LIMS</span>
                    </h1>
                </div>

                {/* Global Search */}
                <div className="hidden items-center md:flex">
                    <label className="relative group">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input
                            type="text"
                            className="block w-96 rounded-lg border-0 bg-background-light py-2 pl-10 pr-12 text-sm text-text-main ring-1 ring-inset ring-border-light placeholder:text-text-secondary focus:bg-white focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-surface-dark dark:text-white dark:ring-border-dark dark:placeholder-slate-500 transition-all"
                            placeholder="Search orders, patients, or tests..."
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <kbd className="inline-flex items-center rounded border border-gray-200 px-1 font-sans text-xs text-gray-400">⌘K</kbd>
                        </div>
                    </label>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <button className="relative text-text-secondary transition-colors hover:text-primary">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-danger dark:border-background-dark"></span>
                </button>
                <button className="text-text-secondary transition-colors hover:text-primary">
                    <span className="material-symbols-outlined">help</span>
                </button>

                <div className="mx-2 h-8 w-px bg-border-light dark:bg-border-dark"></div>

                <div className="group relative flex cursor-pointer items-center gap-3">
                    <div className="hidden text-right sm:block">
                        {isLoading ? (
                            <>
                                <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
                                <div className="mt-1 h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold leading-none text-text-main dark:text-white">{displayName}</p>
                                <p className="mt-1 text-xs text-text-secondary">{displayRole}</p>
                            </>
                        )}
                    </div>
                    <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 shadow-sm ring-2 ring-white transition-all group-hover:ring-primary dark:ring-surface-dark">
                        {userInitials ? (
                            <span className="text-sm font-bold text-primary">{userInitials}</span>
                        ) : (
                            <Image
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXci_Ai2yTGKpH-RxRQ90TjEaOr5DVsXLi2BPVJ0Y7GIT92qNnacyNGvLMVHG549_7338B7kJlteQvGGmCWI0APC88zvL63-YzmexND78f4rnHZNROSWjV3vofmuPUG6LxtxXwaoLSbPZG8OFpUd94FR7xsFgygzd9UMoLkWOyK_fkpdHGuc0-bduVHwLTWDOmlYuE0IROY5Oo93zHZI6mUYIc_PL8D7qKjOpC9d5HfDmGxY5CX3C0Hgo0EXImJ9XyQ3wptZyIe_Q"
                                alt="User avatar"
                                fill
                                className="object-cover"
                                sizes="36px"
                                priority
                            />
                        )}
                    </div>

                    {/* Dropdown on hover */}
                    {onSignOut && (
                        <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-border-light bg-white p-1 opacity-0 shadow-lg transition-all group-hover:pointer-events-auto group-hover:opacity-100 dark:border-border-dark dark:bg-surface-dark">
                            <button
                                onClick={onSignOut}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
