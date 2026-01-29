"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call for admin auth
        setTimeout(() => {
            router.push("/dashboard");
        }, 1200);
    };

    return (
        <div className="flex min-h-screen w-full flex-col md:flex-row bg-background-light dark:bg-background-dark">

            {/* LEFT SIDE: Immersive Brand Experience */}
            <div className="relative hidden w-full md:flex md:w-1/2 lg:w-3/5 flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white">
                {/* Abstract Background with Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/90 z-10" />
                    <div className="absolute top-[-20%] left-[-20%] h-[140%] w-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/20 via-slate-900/0 to-transparent blur-3xl" />
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                </div>

                {/* Brand Logo */}
                <div className="relative z-20 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-light shadow-[0_0_15px_rgba(3,132,196,0.3)]">
                        <span className="material-symbols-outlined text-2xl">science</span>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white font-display">LabFlow LIMS</span>
                </div>

                {/* Hero Content */}
                <div className="relative z-20 max-w-lg">
                    <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
                        Precision & Integrity <br />
                        <span className="text-primary-light">In Every Result.</span>
                    </h1>
                    <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                        Secure access for laboratory personnel. Manage workflows, track samples, and generate reports with confidence.
                    </p>
                </div>

                {/* Footer/Copyright */}
                <div className="relative z-20 text-sm text-slate-500">
                    <p>&copy; 2026 LabFlow LIMS. Internal Authorized Access Only.</p>
                </div>
            </div>

            {/* RIGHT SIDE: Login Form */}
            <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-background-dark">
                <div className="mx-auto w-full max-w-sm lg:w-96">

                    {/* Mobile Logo (Visible only on small screens) */}
                    <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
                            <span className="material-symbols-outlined text-xl">science</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">LabFlow</span>
                    </div>

                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Staff Login
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Please enter your credentials to access the dashboard.
                        </p>
                    </div>

                    <div className="mt-10">
                        <form onSubmit={handleLogin} className="space-y-6">

                            {/* Email Field with Floating Label/Focus effect */}
                            <div className="group relative">
                                <label
                                    htmlFor="email"
                                    className={cn(
                                        "block text-sm font-medium transition-colors duration-200",
                                        focusedField === "email" ? "text-primary" : "text-slate-700 dark:text-slate-300"
                                    )}
                                >
                                    Email address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className={cn(
                                            "material-symbols-outlined text-[20px] transition-colors duration-200",
                                            focusedField === "email" ? "text-primary" : "text-slate-400"
                                        )}>mail</span>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        onFocus={() => setFocusedField("email")}
                                        onBlur={() => setFocusedField(null)}
                                        className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all duration-200"
                                        placeholder="admin@labflow.id"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1">
                                <label
                                    htmlFor="password"
                                    className={cn(
                                        "block text-sm font-medium transition-colors duration-200",
                                        focusedField === "password" ? "text-primary" : "text-slate-700 dark:text-slate-300"
                                    )}
                                >
                                    Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className={cn(
                                            "material-symbols-outlined text-[20px] transition-colors duration-200",
                                            focusedField === "password" ? "text-primary" : "text-slate-400"
                                        )}>lock</span>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        onFocus={() => setFocusedField("password")}
                                        onBlur={() => setFocusedField(null)}
                                        className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all duration-200"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-slate-700"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <a href="#" className="font-medium text-primary hover:text-primary-hover hover:underline decoration-2 underline-offset-4 transition-all">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={cn(
                                        "group relative flex w-full justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary-hover hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 active:scale-[0.98]",
                                        isLoading && "opacity-80 cursor-wait"
                                    )}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Authenticating...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span>Sign In to Dashboard</span>
                                            <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-xs text-slate-400">
                                Protected by LabFlow Security System. <br />
                                Unauthorized access is logged and reported.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
