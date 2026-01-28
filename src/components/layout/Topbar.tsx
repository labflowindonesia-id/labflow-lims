"use client";

import { cn } from "@/lib/utils";

interface TopbarProps {
    className?: string;
}

export function Topbar({ className }: TopbarProps) {
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

                <div className="group flex cursor-pointer items-center gap-3">
                    <div className="hidden text-right sm:block">
                        <p className="text-sm font-semibold leading-none text-text-main dark:text-white">Dr. Sarah Chen</p>
                        <p className="mt-1 text-xs text-text-secondary">Lab Administrator</p>
                    </div>
                    <div
                        className="h-9 w-9 rounded-full bg-cover bg-center shadow-sm ring-2 ring-white transition-all group-hover:ring-primary dark:ring-surface-dark"
                        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBXci_Ai2yTGKpH-RxRQ90TjEaOr5DVsXLi2BPVJ0Y7GIT92qNnacyNGvLMVHG549_7338B7kJlteQvGGmCWI0APC88zvL63-YzmexND78f4rnHZNROSWjV3vofmuPUG6LxtxXwaoLSbPZG8OFpUd94FR7xsFgygzd9UMoLkWOyK_fkpdHGuc0-bduVHwLTWDOmlYuE0IROY5Oo93zHZI6mUYIc_PL8D7qKjOpC9d5HfDmGxY5CX3C0Hgo0EXImJ9XyQ3wptZyIe_Q')" }}
                    ></div>
                </div>
            </div>
        </header>
    );
}
