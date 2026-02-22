"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTestTasks, useUsers, useInstruments, useCustomers, useReports, useSamples, useParameters } from "@/hooks/use-supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useMemo, useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

type SearchResult = {
    type: "task" | "customer" | "sample";
    id: string;
    title: string;
    subtitle: string;
    href: string;
};

export default function DashboardPage() {
    const { data: tasks, isLoading: tasksLoading } = useTestTasks();
    const { data: users } = useUsers();
    const { data: instruments } = useInstruments();
    const { data: customers } = useCustomers();
    const { data: reports } = useReports();
    const { data: samples } = useSamples();
    const { data: parameters } = useParameters();
    const { user } = useAuth();

    // Fetch analysts to map analyst ID → user ID
    const { data: analysts = [] } = useQuery<{ id: string; user_id: string }[]>({
        queryKey: ["analysts", "all"],
        queryFn: async () => {
            const { data, error } = await supabase.from("analysts").select("id, user_id");
            if (error) throw error;
            return (data || []) as { id: string; user_id: string }[];
        },
    });

    // Analyst lookup: assigned_to_id (analyst.id) → analyst.user_id → user.full_name
    const getAnalystName = (analystId: string | null) => {
        if (!analystId) return null;
        const analyst = analysts.find(a => a.id === analystId);
        if (!analyst) return null;
        const u = users?.find(usr => usr.id === analyst.user_id);
        return u?.full_name || null;
    };

    // Sample lookup helper
    const getSampleDisplay = (sampleId: string | null) => {
        if (!sampleId) return { id: "N/A", name: "Unknown" };
        const s = samples?.find(sm => sm.id === sampleId);
        return { id: s?.sample_lab_id || sampleId.slice(0, 8), name: s?.sample_name || "" };
    };

    // Parameter lookup helper
    const getParameterName = (parameterId: string | null) => {
        if (!parameterId) return "Unknown";
        return parameters?.find(p => p.id === parameterId)?.name || parameterId.slice(0, 8);
    };
    const isManager = user?.role === "manager";

    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close search dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 1. CALCULATE DYNAMIC METRICS
    const metrics = useMemo(() => {
        if (!tasks) return {
            totalPending: 0,
            urgentCount: 0,
            revenue: 0,
            criticalTAT: 0,
            pendingReviews: 0,
            overdueTasks: []
        };

        const activeTasks = tasks.filter(t => t.status !== "COMPLETED" && t.status !== "CANCELLED");
        const urgentTasks = activeTasks.filter(t => t.priority === "URGENT" || t.priority === "HIGH");
        const pendingReviews = reports?.filter(r => r.status === "SUBMITTED").length || 0;
        const mockRevenue = 428000 + (activeTasks.length * 75000);
        const now = new Date();
        const overdueTasks = activeTasks.filter(t => t.due_date && new Date(t.due_date) < now);
        const criticalTAT = overdueTasks.length;

        return {
            totalPending: activeTasks.length,
            urgentCount: urgentTasks.length,
            revenue: mockRevenue,
            criticalTAT,
            pendingReviews,
            overdueTasks
        };
    }, [tasks, reports]);

    // 2. SEARCH RESULTS
    const searchResults = useMemo<SearchResult[]>(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        const results: SearchResult[] = [];

        // Search tasks
        tasks?.forEach(task => {
            if (task.id.toLowerCase().includes(q)) {
                results.push({
                    type: "task",
                    id: task.id,
                    title: `Task ${task.task_number}`,
                    subtitle: `${task.status.replace("_", " ")}`,
                    href: `/testing/${task.id}`
                });
            }
        });

        // Search customers
        customers?.forEach(cust => {
            if (cust.name.toLowerCase().includes(q)) {
                results.push({
                    type: "customer",
                    id: cust.id,
                    title: cust.name,
                    subtitle: cust.address || "Customer",
                    href: `/quotations?customer=${cust.id}`
                });
            }
        });

        return results.slice(0, 8);
    }, [searchQuery, tasks, customers]);

    // 3. PREPARE TABLE DATA (Top 5 Urgent/Recent) — exclude cancelled/completed
    const recentTasks = useMemo(() => {
        if (!tasks) return [];
        return [...tasks]
            .filter(t => t.status !== "CANCELLED" && t.status !== "COMPLETED")
            .sort((a, b) => {
                const pOrder: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
                return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
            })
            .slice(0, 5);
    }, [tasks]);

    // 4. INSTRUMENT STATUS LOGIC
    const instrumentStatus = useMemo(() => {
        if (!instruments || !tasks) return [];
        return instruments.map(inst => {
            const activeTask = tasks.find(t =>
                t.status === "IN_PROGRESS"
            );
            return {
                ...inst,
                statusText: activeTask ? "Running" : "Idle",
                taskName: activeTask ? `Task ${activeTask.task_number}` : undefined,
                timeLeft: activeTask ? "~12m remaining" : "(Ready)"
            };
        });
    }, [instruments, tasks]);

    return (
        <>
            {/* Page Header with Search */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">Analytics Overview</h2>
                    <p className="mt-1 text-sm text-text-secondary">Real-time laboratory performance metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Working Search Bar */}
                    <div ref={searchRef} className="relative">
                        <div className="flex items-center gap-2 rounded-lg border border-border-light bg-white px-3 py-2 shadow-sm dark:border-border-dark dark:bg-surface-dark">
                            <span className="material-symbols-outlined text-[18px] text-text-secondary">search</span>
                            <input
                                type="text"
                                placeholder="Search tasks, customers..."
                                className="w-48 bg-transparent text-sm text-text-main placeholder:text-text-secondary focus:outline-none dark:text-white"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSearchResults(true);
                                }}
                                onFocus={() => setShowSearchResults(true)}
                            />
                        </div>
                        {/* Search Results Dropdown */}
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-border-light bg-white shadow-lg dark:border-border-dark dark:bg-surface-dark">
                                <div className="p-2">
                                    {searchResults.map(result => (
                                        <Link
                                            key={`${result.type}-${result.id}`}
                                            href={result.href}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-background-light dark:hover:bg-background-dark"
                                            onClick={() => setShowSearchResults(false)}
                                        >
                                            <span className={cn(
                                                "material-symbols-outlined text-[18px]",
                                                result.type === "task" ? "text-primary" :
                                                    result.type === "customer" ? "text-success" : "text-warning"
                                            )}>
                                                {result.type === "task" ? "science" :
                                                    result.type === "customer" ? "business" : "inventory_2"}
                                            </span>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="truncate text-sm font-medium text-text-main dark:text-white">{result.title}</p>
                                                <p className="truncate text-xs text-text-secondary">{result.subtitle}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                        {showSearchResults && searchQuery && searchResults.length === 0 && (
                            <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-border-light bg-white p-4 shadow-lg dark:border-border-dark dark:bg-surface-dark">
                                <p className="text-center text-sm text-text-secondary">No results found</p>
                            </div>
                        )}
                    </div>
                    <button className="flex items-center gap-2 rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium text-text-main shadow-sm transition-colors hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white dark:hover:bg-background-dark">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export Report
                    </button>
                    {!isManager && (
                        <Link href="/quotations/create">
                            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/30 transition-colors hover:bg-primary-hover">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                New Order
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {/* KPI Cards Section - Now Clickable */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Revenue Card - Links to Reports */}
                <Link href="/reports" className="block">
                    <div className="group rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30 dark:border-border-dark dark:bg-surface-dark">
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
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-text-secondary">Vs. last month ($380,444)</p>
                            <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">View Reports →</span>
                        </div>
                    </div>
                </Link>

                {/* TAT Warnings Card - Links to Worklist with Overdue Filter */}
                <Link href="/worklist?filter=overdue" className="block">
                    <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-all hover:shadow-md hover:border-danger/30 dark:border-border-dark dark:bg-surface-dark">
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
                        <div className="relative z-10 mt-2 flex items-center justify-between">
                            <p className="text-xs text-text-secondary">Tasks due today or overdue</p>
                            <span className="text-xs font-medium text-danger opacity-0 transition-opacity group-hover:opacity-100">View Overdue →</span>
                        </div>
                    </div>
                </Link>

                {/* Active Tasks Card - Links to Worklist */}
                <Link href="/worklist" className="block">
                    <div className="group rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-all hover:shadow-md hover:border-warning/30 dark:border-border-dark dark:bg-surface-dark">
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
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-text-secondary">{metrics.pendingReviews} awaiting Manager Review</p>
                            <span className="text-xs font-medium text-warning opacity-0 transition-opacity group-hover:opacity-100">View Tasks →</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Overdue/Critical Tasks Alert Section */}
            {metrics.overdueTasks.length > 0 && (
                <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                            <span className="material-symbols-outlined text-danger">priority_high</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-danger">Critical: {metrics.overdueTasks.length} Overdue Task(s)</h4>
                            <p className="text-sm text-text-secondary">
                                {metrics.overdueTasks.map(t => t.task_number).join(", ")}
                            </p>
                        </div>
                        <Link href="/worklist?filter=overdue">
                            <button className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-danger/90">
                                View All
                            </button>
                        </Link>
                    </div>
                </div>
            )}

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
                                    <th className="border-b border-border-light px-6 py-3 dark:border-border-dark">Sample</th>
                                    <th className="border-b border-border-light px-6 py-3 dark:border-border-dark">Parameter</th>
                                    <th className="w-[100px] border-b border-border-light px-6 py-3 text-center dark:border-border-dark">Priority</th>
                                    <th className="border-b border-border-light px-6 py-3 text-center dark:border-border-dark">Due Date</th>
                                    <th className="border-b border-border-light px-6 py-3 dark:border-border-dark">Analyst</th>
                                    <th className="w-[120px] border-b border-border-light px-6 py-3 text-center dark:border-border-dark">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light bg-surface-light dark:divide-border-dark dark:bg-surface-dark">
                                {recentTasks.map((task) => {
                                    const analystName = getAnalystName(task.assigned_to_id);
                                    const sampleInfo = getSampleDisplay(task.sample_id);
                                    const isOverdue = task.due_date && new Date(task.due_date) < new Date();

                                    return (
                                        <tr key={task.id} className={cn(
                                            "group transition-colors hover:bg-primary/5 dark:hover:bg-primary/5",
                                            isOverdue && "bg-danger/5"
                                        )}>
                                            <td className="px-6 py-3">
                                                <span className="font-medium text-text-main dark:text-white">{sampleInfo.id}</span>
                                                <span className="block text-xs text-text-secondary">{sampleInfo.name}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="font-semibold text-text-main dark:text-white">{getParameterName(task.parameter_id)}</span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={cn(
                                                    "text-xs rounded-full px-2.5 py-1 font-bold",
                                                    task.priority === "HIGH" || task.priority === "URGENT" ? "bg-danger/10 text-danger" :
                                                        task.priority === "NORMAL" ? "bg-primary/10 text-primary" :
                                                            "bg-slate-100 text-slate-600"
                                                )}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className={cn(
                                                "tabular-nums px-6 py-3 text-center",
                                                isOverdue ? "font-medium text-danger" : "text-text-secondary"
                                            )}>
                                                {isOverdue && <span className="material-symbols-outlined mr-1 text-[14px] align-middle">schedule</span>}
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}
                                            </td>
                                            <td className="px-6 py-3">
                                                {task.assigned_to_id ? (
                                                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                                                        {analystName || "Analyst"}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-text-secondary italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={cn(
                                                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                                    task.status === "ASSIGNED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                                        task.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                                            "bg-slate-100 text-slate-500"
                                                )}>
                                                    {task.status.replace(/_/g, " ")}
                                                </span>
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
                {/* Instrument Status (Interactive) */}
                <div className="rounded-xl border border-border-light bg-surface-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-bold text-text-main dark:text-white">Instrument Status</h3>
                        <Link href="/settings?tab=instruments" className="text-text-secondary hover:text-primary">
                            <span className="material-symbols-outlined">settings</span>
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {instrumentStatus.slice(0, 4).map(inst => (
                            <div key={inst.id}>
                                <button
                                    onClick={() => setSelectedInstrument(selectedInstrument === inst.id ? null : inst.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between rounded-lg p-2 transition-colors",
                                        selectedInstrument === inst.id
                                            ? "bg-primary/10 border border-primary/20"
                                            : "hover:bg-background-light dark:hover:bg-background-dark"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-2.5 w-2.5 rounded-full",
                                            inst.statusText === "Running" ? "bg-success animate-pulse" :
                                                !inst.is_active ? "bg-danger" : "bg-slate-300"
                                        )}></div>
                                        <span className="text-sm font-medium text-text-main dark:text-white">{inst.name}</span>
                                    </div>
                                    <span className="text-xs text-text-secondary">
                                        {inst.statusText}
                                    </span>
                                </button>
                                {/* Expanded Details Popover */}
                                {selectedInstrument === inst.id && (
                                    <div className="ml-5 mt-2 rounded-lg border border-border-light bg-background-light p-3 dark:border-border-dark dark:bg-background-dark">
                                        {inst.statusText === "Running" ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-text-secondary">Current Test:</span>
                                                    <span className="text-xs font-medium text-text-main dark:text-white">{inst.taskName}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-text-secondary">Est. Time:</span>
                                                    <span className="text-xs font-medium text-success">{inst.timeLeft}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-text-secondary">
                                                {inst.is_active ? "Instrument ready for assignment" : "Instrument offline or under maintenance"}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="rounded-xl bg-gradient-to-br from-primary to-primary-hover p-6 text-white shadow-lg">
                    <h3 className="mb-1 text-lg font-bold">Quick Actions</h3>
                    <p className="mb-6 text-sm text-primary-light">Common administrative tasks</p>
                    <div className="grid grid-cols-2 gap-3">
                        {!isManager && (
                            <Link href="/quotations/create">
                                <button className="w-full rounded-lg border border-white/10 bg-white/10 p-3 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                                    <span className="material-symbols-outlined mb-2 block">add_box</span>
                                    <span className="text-sm font-medium">Create Quote</span>
                                </button>
                            </Link>
                        )}
                        {isManager && (
                            <Link href="/quotations?tab=review">
                                <button className="w-full rounded-lg border border-white/10 bg-white/10 p-3 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                                    <span className="material-symbols-outlined mb-2 block">rate_review</span>
                                    <span className="text-sm font-medium">Review Quotes</span>
                                </button>
                            </Link>
                        )}
                        <Link href="/scheduling">
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
