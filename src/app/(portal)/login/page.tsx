"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            router.push("/portal");
        }, 1000);
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl border border-border-light">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined text-2xl">science</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to LabFlow</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Access your lab results and track samples
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                                placeholder="Email address"
                                defaultValue="budi.s@indofood.co.id"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                                placeholder="Password"
                                defaultValue="password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "group relative flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg shadow-primary/25 transition-all",
                                isLoading && "opacity-75 cursor-wait"
                            )}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
