"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { MOCK_TASKS, MOCK_USERS, MOCK_INSTRUMENTS, MOCK_SUBMISSIONS } from "@/data/mock-db";
import { useMemo } from "react";

export default function DashboardPage() {
    // 1. CALCULATE DYNAMIC METRICS
    const metrics = useMemo(() => {
        const activeTasks = MOCK_TASKS.filter(t => t.status !== "COMPLETED" && t.status !== "CANCELLED");
        const urgentTasks = activeTasks.filter(t => t.priority === "URGENT" || t.priority === "HIGH");
        const pendingReviews = MOCK_SUBMISSIONS.filter(s => s.status === "SUBMITTED").length;

        // Mock Revenue Calculation (Randomized base + active value)
        const mockRevenue = 428000 + (activeTasks.length * 75000);

        // Mock TAT Critical Count (Tasks due today or past due)
        const criticalTAT = activeTasks.filter(t => new Date(t.due_date) <= new Date()).length;

        return {
            totalPending: activeTasks.length,
            urgentCount: urgentTasks.length,
            revenue: mockRevenue,
            criticalTAT,
            pendingReviews
        };
    }, []);

    // 2. PREPARE TABLE DATA (Top 5 Urgent/Recent)
    const recentTasks = [...MOCK_TASKS]
        .sort((a, b) => b.priority === "HIGH" ? -1 : 1) // Simple sort by priority
        .slice(0, 5);

    // 3. INSTRUMENT STATUS LOGIC
    // Simple mock logic: If instrument has an active task assigned, it's "Running"
    const instrumentStatus = MOCK_INSTRUMENTS.map(inst => {
        const activeTask = MOCK_TASKS.find(t =>
            t.instrument_id_snapshot === inst.id && t.status === "IN_PROGRESS"
        );
        return {
            ...inst,
            status: activeTask ? "Running" : "Idle",
            taskName: activeTask?.parameter_name_snapshot,
            timeLeft: activeTask ? "12m remaining" : "(Ready)"
        };
    });

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">Analytics Overview</h2>
                    <p className="mt-1 text-sm text-text-secondary">Real-time laboratory performance metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium text-text-main shadow-sm transition-colors hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white dark:hover:bg-background-dark">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export Report
                    </button>
                    <Link href="/quotations/create">
                        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/30 transition-colors hover:bg-primary-hover">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            New Order
                        </button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards Section */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Revenue Card (Preserved Style) */}
                <div className="rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-border-dark dark:bg-surface-dark">
                    <div className="mb-2 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Est. Revenue (WIP)</p>
                            <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-main dark:text-white">
                                ${metrics.revenue.toLocaleString()}
                            </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span>
                            12.5%
                        </span>
                    </div>
                    <div className="mt-4 h-16 w-full">
                        <svg width="100%" height="100%" viewBox="0 0 300 60" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="gradient-revenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" className="chart-gradient-stop-1" />
                                    <stop offset="100%" className="chart-gradient-stop-2" />
                                </linearGradient>
                            </defs>
                            <path d="M0 45 C50 45, 50 15, 100 15 C150 15, 150 35, 200 25 C250 15, 250 5, 300 5 V 60 H 0 Z" fill="url(#gradient-revenue)" />
                            <path d="M0 45 C50 45, 50 15, 100 15 C150 15, 150 35, 200 25 C250 15, 250 5, 300 5" stroke="#0384c4" strokeWidth="2" fill="none" />
                        </svg>
                    </div>
                    <p className="mt-2 text-xs text-text-secondary">Vs. last month ($380,444)</p>
                </div>

                {/* TAT Warnings Card (Connected to metrics.criticalTAT) */}
                <div className="relative overflow-hidden rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-border-dark dark:bg-surface-dark">
                    <div className="relative z-10 mb-2 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-secondary">TAT Warnings</p>
                            <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-main dark:text-white">
                                {metrics.criticalTAT}
                            </h3>
                        </div>
                        {metrics.criticalTAT > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-1 text-xs font-medium text-danger ring-1 ring-inset ring-danger/20">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                Action Needed
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                On Track
                            </span>
                        )}
                    </div>
                    <div className="relative z-10 mt-4 h-16 w-full">
                        <svg width="100%" height="100%" viewBox="0 0 300 60" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="gradient-tat" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0 30 C40 30, 60 50, 100 45 C140 40, 160 10, 200 15 C240 20, 260 40, 300 35 V 60 H 0 Z" fill="url(#gradient-tat)" />
                            <path d="M0 30 C40 30, 60 50, 100 45 C140 40, 160 10, 200 15 C240 20, 260 40, 300 35" stroke="#ef4444" strokeWidth="2" fill="none" />
                        </svg>
                    </div>
                    <p className="relative z-10 mt-2 text-xs text-text-secondary">Tasks due today or overdue</p>
                </div>

                {/* Pending Orders Card (Connected to metrics.totalPending) */}
                <div className="rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-border-dark dark:bg-surface-dark">
                    <div className="mb-2 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Active Tasks</p>
                            <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-main dark:text-white">
                                {metrics.totalPending}
                            </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning ring-1 ring-inset ring-warning/20">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            {metrics.urgentCount} High Prio
                        </span>
                    </div>
                    <div className="mt-4 h-16 w-full">
                        <svg width="100%" height="100%" viewBox="0 0 300 60" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="gradient-pending" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0 50 C50 45, 80 40, 120 35 C160 30, 180 25, 220 20 C260 15, 280 10, 300 5 V 60 H 0 Z" fill="url(#gradient-pending)" />
                            <path d="M0 50 C50 45, 80 40, 120 35 C160 30, 180 25, 220 20 C260 15, 280 10, 300 5" stroke="#f59e0b" strokeWidth="2" fill="none" />
                        </svg>
                    </div>
                    <p className="mt-2 text-xs text-text-secondary">{metrics.pendingReviews} awaiting Manager Review</p>
                </div>
            </div>

            {/* Urgent Tasks Table Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">Recent / Urgent Tasks</h3>
                    <Link href="/worklist">
                        <button className="text-sm font-medium text-primary hover:text-primary-hover hover:underline">View all tasks</button>
                    </Link>
                </div>
                <div className="overflow-hidden rounded-xl border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-background-light font-medium text-text-secondary dark:bg-black/20">
                                <tr>
                                    <th className="w-[140px] border-b border-border-light px-6 py-3 dark:border-border-dark">Task ID</th>
                                    <th className="border-b border-border-light px-6 py-3 dark:border-border-dark">Test Name</th>
                                    <th className="w-[120px] border-b border-border-light px-6 py-3 dark:border-border-dark">Priority</th>
                                    <th className="border-b border-border-light px-6 py-3 dark:border-border-dark">Assigned Tech</th>
                                    <th className="border-b border-border-light px-6 py-3 dark:border-border-dark">Due Date</th>
                                    <th className="w-[160px] border-b border-border-light px-6 py-3 dark:border-border-dark">Status</th>
                                    <th className="border-b border-border-light px-6 py-3 text-right dark:border-border-dark">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light bg-surface-light dark:divide-border-dark dark:bg-surface-dark">
                                {recentTasks.map((task, idx) => {
                                    const assignedUser = MOCK_USERS.find(u => u.id === task.assigned_to_user_id);

                                    return (
                                        <tr key={task.id} className="group transition-colors hover:bg-primary/5 dark:hover:bg-primary/5">
                                            <td className="px-6 py-3 font-medium tabular-nums text-text-main dark:text-white">{task.id}</td>
                                            <td className="px-6 py-3 text-text-main dark:text-white">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{task.parameter_name_snapshot}</span>
                                                    <span className="text-xs text-text-secondary">{task.matrix_name_snapshot}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                    task.priority === "HIGH" || task.priority === "URGENT" ? "bg-danger/10 text-danger ring-danger/20" :
                                                        task.priority === "NORMAL" ? "bg-primary/10 text-primary ring-primary/20" :
                                                            "bg-slate-100 text-slate-600 ring-slate-200"
                                                )}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {assignedUser ? assignedUser.full_name.substring(0, 2).toUpperCase() : "?"}
                                                    </div>
                                                    <span className="text-text-secondary">{assignedUser?.full_name || "Unassigned"}</span>
                                                </div>
                                            </td>
                                            <td className="tabular-nums text-text-secondary px-6 py-3">
                                                {new Date(task.due_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                                    <span className={cn(
                                                        "h-2 w-2 rounded-full",
                                                        task.status === "IN_PROGRESS" ? "bg-primary animate-pulse" :
                                                            task.status === "ASSIGNED" ? "bg-blue-400" : "bg-slate-300"
                                                    )}></span>
                                                    {task.status.replace("_", " ")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <Link href={`/testing/${task.id}`}>
                                                    <button className="text-sm font-medium text-primary hover:text-primary-hover">
                                                        {task.status === "COMPLETED" ? "Review" : "Open"}
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Secondary Info Section */}
            <div className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-2">
                {/* System Status (Dynamic Instrument List) */}
                <div className="rounded-xl border border-border-light bg-surface-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-bold text-text-main dark:text-white">Instrument Status</h3>
                        <button className="text-text-secondary hover:text-primary">
                            <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                    </div>
                    <div className="space-y-4">
                        {instrumentStatus.slice(0, 4).map(inst => (
                            <div key={inst.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-2.5 w-2.5 rounded-full",
                                        inst.status === "Running" ? "bg-success animate-pulse" :
                                            !inst.is_active ? "bg-danger" : "bg-slate-300"
                                    )}></div>
                                    <span className="text-sm font-medium text-text-main dark:text-white">{inst.name}</span>
                                </div>
                                <span className="text-xs text-text-secondary">
                                    {inst.status} {inst.status === "Running" ? `- ${inst.taskName}` : ""}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions Grid (Preserved) */}
                <div className="rounded-xl bg-gradient-to-br from-primary to-primary-hover p-6 text-white shadow-lg">
                    <h3 className="mb-1 text-lg font-bold">Quick Actions</h3>
                    <p className="mb-6 text-sm text-primary-light">Common administrative tasks</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/quotations/create">
                            <button className="w-full rounded-lg border border-white/10 bg-white/10 p-3 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                                <span className="material-symbols-outlined mb-2 block">add_box</span>
                                <span className="text-sm font-medium">Create Quote</span>
                            </button>
                        </Link>
                        <Link href="/worklist">
                            <button className="w-full rounded-lg border border-white/10 bg-white/10 p-3 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                                <span className="material-symbols-outlined mb-2 block">assignment_ind</span>
                                <span className="text-sm font-medium">Assign Tasks</span>
                            </button>
                        </Link>
                        <Link href="/review">
                            <button className="w-full rounded-lg border border-white/10 bg-white/10 p-3 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                                <span className="material-symbols-outlined mb-2 block">rate_review</span>
                                <span className="text-sm font-medium">Review Data</span>
                            </button>
                        </Link>
                        <Link href="/receiving/create">
                            <button className="w-full rounded-lg border border-white/10 bg-white/10 p-3 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                                <span className="material-symbols-outlined mb-2 block">print</span>
                                <span className="text-sm font-medium">Print Labels</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
