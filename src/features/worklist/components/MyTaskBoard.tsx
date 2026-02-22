"use client";

import { useState, useMemo } from "react";
import { useTestTasks, useParameters, useSamples, useSampleMatrices, useTestResults, useTestRunsAll } from "@/hooks/use-supabase";
import { TestTask } from "@/types/database";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
import { updateRow } from "@/lib/services";
import { useQuery } from "@tanstack/react-query";

type TabType = "ACTIVE" | "OVERDUE" | "COMPLETED";
type SortType = "due_date" | "priority" | "parameter";

export default function MyTaskBoard() {
    const router = useRouter();
    // Auth — get real logged-in user
    const { user } = useAuth();

    // Look up analyst record for this user (assigned_to_id stores analysts.id)
    const { data: myAnalyst } = useQuery<{ id: string; user_id: string } | null>({
        queryKey: ["analyst", "byUser", user?.id] as const,
        queryFn: async () => {
            if (!user?.id) return null;
            const { data, error } = await supabase
                .from("analysts")
                .select("id, user_id")
                .eq("user_id", user.id)
                .maybeSingle();
            if (error) { console.error("Analyst lookup error:", error); return null; }
            return data as { id: string; user_id: string } | null;
        },
        enabled: !!user?.id,
    });

    // Supabase data
    const { data: allTasks = [] } = useTestTasks();
    const { data: parameters = [] } = useParameters();
    const { data: samples = [] } = useSamples();
    const { data: matrices = [] } = useSampleMatrices();
    const { data: testResults = [] } = useTestResults();
    const { data: testRuns = [] } = useTestRunsAll();

    // Helper functions to get names from IDs
    const getParameterName = (id: string | null) => {
        if (!id) return "Unknown Parameter";
        return (parameters || []).find(p => p.id === id)?.name || "Unknown Parameter";
    };
    const getSampleName = (id: string | null) => {
        if (!id) return "Unknown Sample";
        const sample = (samples || []).find(s => s.id === id);
        return sample?.sample_lab_id || sample?.sample_name || "Unknown Sample";
    };
    const getMatrixName = (sampleId: string | null) => {
        if (!sampleId) return "Unknown Matrix";
        const sample = (samples || []).find(s => s.id === sampleId);
        const matrix = sample ? (matrices || []).find(m => m.id === sample.matrix_id) : null;
        return matrix?.name || "Unknown Matrix";
    };

    // Filter tasks by actual analyst ID (not user ID)
    const myAnalystId = myAnalyst?.id;
    const searchParams = useSearchParams();
    const filterParam = searchParams.get("filter");

    const myTasks = (allTasks || []).filter(t => myAnalystId && t.assigned_to_id === myAnalystId && t.status !== "CANCELLED");

    const [activeTab, setActiveTab] = useState<TabType>(
        filterParam === "overdue" ? "OVERDUE" : "ACTIVE"
    );
    const [sortBy, setSortBy] = useState<SortType>("due_date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = myTasks.filter(t =>
        t.status !== "COMPLETED" && t.due_date && new Date(t.due_date) < now
    );
    const activeTasks = myTasks.filter(t =>
        t.status !== "COMPLETED" && (!t.due_date || new Date(t.due_date) >= now)
    );
    const completedTasks = myTasks.filter(t => t.status === "COMPLETED");

    // Real QC status from test_results
    const getQCStatus = (taskId: string): "PASS" | "FAIL" | "PENDING" | null => {
        const results = (testResults || []).filter((r: any) => r.task_id === taskId);
        if (results.length === 0) return null;
        if (results.some((r: any) => r.qc_status === "FAIL")) return "FAIL";
        if (results.some((r: any) => r.qc_status === "PENDING")) return "PENDING";
        return "PASS";
    };

    // Get result data for a task
    const getTaskResult = (taskId: string) => {
        return (testResults || []).find((r: any) => r.task_id === taskId) as any | undefined;
    };

    // Real raw data check from test_runs
    const requiresRawData = (_taskId: string): boolean => {
        // All tasks potentially require raw data — show indicator if task has runs
        return true;
    };

    const hasRawData = (taskId: string): boolean => {
        return (testRuns || []).some((r: any) => r.test_task_id === taskId && r.raw_data_path);
    };

    // Check if task has result recorded - simplified check (could be enhanced with separate query)
    const hasResult = (taskId: string): boolean => {
        // In production, this would query test_results table
        // For now, we'll assume any completed task has results
        const task = myTasks.find(t => t.id === taskId);
        return task?.status === "COMPLETED";
    };

    // Priority order for sorting
    const priorityOrder: Record<string, number> = {
        "URGENT": 0,
        "HIGH": 1,
        "NORMAL": 2,
        "LOW": 3,
    };

    const displayedTasks = useMemo(() => {
        let tasks: TestTask[] = [];

        switch (activeTab) {
            case "OVERDUE":
                tasks = [...overdueTasks];
                break;
            case "COMPLETED":
                tasks = [...completedTasks];
                break;
            default:
                tasks = [...activeTasks];
        }

        // Sort tasks
        tasks.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "due_date":
                    comparison = new Date(a.due_date || "").getTime() - new Date(b.due_date || "").getTime();
                    break;
                case "priority":
                    comparison = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
                    break;
                case "parameter":
                    comparison = getParameterName(a.parameter_id).localeCompare(getParameterName(b.parameter_id));
                    break;
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return tasks;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, activeTasks, overdueTasks, completedTasks, sortBy, sortOrder, parameters]);

    const tabs: { value: TabType; label: string; count: number; color?: string }[] = [
        { value: "ACTIVE", label: "Active", count: activeTasks.length },
        { value: "OVERDUE", label: "Overdue", count: overdueTasks.length, color: "text-danger" },
        { value: "COMPLETED", label: "Completed", count: completedTasks.length },
    ];



    return (
        <div className="space-y-6">
            {/* TABS & CONTROLS */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-light dark:border-border-dark">
                <div className="flex gap-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                activeTab === tab.value
                                    ? `border-primary ${tab.color || "text-primary"}`
                                    : "border-transparent text-text-secondary hover:text-text-main"
                            )}
                        >
                            {tab.label}
                            <span className={cn(
                                "rounded-full px-2 py-0.5 text-xs",
                                activeTab === tab.value
                                    ? tab.value === "OVERDUE" ? "bg-danger/20 text-danger" : "bg-primary/20 text-primary"
                                    : "bg-slate-100 text-slate-500 dark:bg-white/10"
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">Sort by:</span>
                    <select
                        className="text-xs border border-border-light rounded-md px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortType)}
                    >
                        <option value="due_date">Due Date</option>
                        <option value="priority">Priority</option>
                        <option value="parameter">Parameter</option>
                    </select>
                    <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="p-1 rounded border border-border-light hover:bg-background-light dark:border-border-dark"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                    </button>
                </div>
            </div>



            {/* Overdue Alert Banner */}
            {activeTab !== "OVERDUE" && overdueTasks.length > 0 && (
                <button
                    onClick={() => setActiveTab("OVERDUE")}
                    className="w-full rounded-lg bg-danger/10 border border-danger/30 p-3 flex items-center justify-between hover:bg-danger/15 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-danger animate-pulse">warning</span>
                        <span className="text-sm font-medium text-danger">
                            {overdueTasks.length} overdue task(s) require immediate attention
                        </span>
                    </div>
                    <span className="material-symbols-outlined text-danger text-[18px]">arrow_forward</span>
                </button>
            )}


            {/* COMPLETED TAB — Table View */}
            {activeTab === "COMPLETED" && (
                <>
                    {displayedTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-[48px] text-text-secondary/50">inbox</span>
                            <p className="mt-2 text-text-main dark:text-white font-medium">No completed tasks</p>
                            <p className="text-sm text-text-secondary">Completed tasks will appear here.</p>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-border-light dark:border-border-dark">
                                            <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Parameter</th>
                                            <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Sample</th>
                                            <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Matrix</th>
                                            <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Result</th>
                                            <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Compliance</th>
                                            <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">QC Status</th>
                                            <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Completed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                        {displayedTasks.map(task => {
                                            const taskResult = getTaskResult(task.id);
                                            const qcStatus = getQCStatus(task.id);

                                            return (
                                                <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-text-main dark:text-white">
                                                            {getParameterName(task.parameter_id)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-text-secondary">
                                                        {getSampleName(task.sample_id)}
                                                    </td>
                                                    <td className="px-4 py-3 text-text-secondary">
                                                        {getMatrixName(task.sample_id)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-text-main dark:text-white">
                                                            {taskResult
                                                                ? taskResult.is_nd
                                                                    ? "ND"
                                                                    : (taskResult.result_text || taskResult.result_value) ?? "—"
                                                                : "—"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {taskResult?.compliance_status ? (
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold",
                                                                taskResult.compliance_status === "PASS" ? "bg-success/15 text-success" :
                                                                    taskResult.compliance_status === "FAIL" ? "bg-danger/15 text-danger" :
                                                                        "bg-slate-100 text-slate-500"
                                                            )}>
                                                                <span className="material-symbols-outlined text-[13px]">
                                                                    {taskResult.compliance_status === "PASS" ? "check_circle" :
                                                                        taskResult.compliance_status === "FAIL" ? "cancel" : "remove"}
                                                                </span>
                                                                {taskResult.compliance_status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-text-secondary">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {qcStatus ? (
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold",
                                                                qcStatus === "PASS" ? "bg-success/15 text-success" :
                                                                    qcStatus === "FAIL" ? "bg-danger/15 text-danger" :
                                                                        "bg-warning/15 text-warning"
                                                            )}>
                                                                <span className="material-symbols-outlined text-[13px]">
                                                                    {qcStatus === "PASS" ? "check_circle" : qcStatus === "FAIL" ? "cancel" : "pending"}
                                                                </span>
                                                                {qcStatus}
                                                            </span>
                                                        ) : (
                                                            <span className="text-text-secondary">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-text-secondary text-xs">
                                                        {task.completed_at
                                                            ? new Date(task.completed_at).toLocaleDateString()
                                                            : "—"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ACTIVE / OVERDUE TABS — Card Grid */}
            {activeTab !== "COMPLETED" && (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {displayedTasks.map(task => {
                            const isOverdue = task.due_date ? new Date(task.due_date) < now && task.status !== "COMPLETED" : false;
                            const qcStatus = getQCStatus(task.id);
                            const needsRawData = requiresRawData(task.id);

                            return (
                                <Link href={`/testing/${task.id}`} key={task.id}>
                                    <div className={cn(
                                        "group relative rounded-lg border p-4 shadow-sm hover:shadow-md transition-all dark:bg-surface-dark",
                                        isOverdue
                                            ? "border-danger/50 bg-danger/5 hover:border-danger"
                                            : "border-border-light bg-surface-light hover:border-primary/50 dark:border-white/10"
                                    )}>
                                        {/* Header — Priority Badge */}
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded",
                                                task.priority === "URGENT" ? "bg-danger/20 text-danger" :
                                                    task.priority === "HIGH" ? "bg-warning/20 text-warning" :
                                                        "bg-slate-100 text-slate-500"
                                            )}>
                                                {task.priority}
                                            </span>
                                        </div>

                                        {/* Parameter Name */}
                                        <h3 className="font-display font-semibold text-lg text-text-main mb-1 group-hover:text-primary transition-colors dark:text-white">
                                            {getParameterName(task.parameter_id)}
                                        </h3>

                                        {/* Sample Name */}
                                        <p className="text-sm text-text-secondary line-clamp-1 mb-3" title={getSampleName(task.sample_id)}>
                                            {getSampleName(task.sample_id)}
                                        </p>

                                        {/* Status Indicators */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {qcStatus && (
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold",
                                                    qcStatus === "PASS" ? "bg-success/20 text-success" :
                                                        qcStatus === "FAIL" ? "bg-danger/20 text-danger" :
                                                            "bg-warning/20 text-warning"
                                                )}>
                                                    <span className="material-symbols-outlined text-[12px]">
                                                        {qcStatus === "PASS" ? "check_circle" : qcStatus === "FAIL" ? "cancel" : "pending"}
                                                    </span>
                                                    QC: {qcStatus}
                                                </span>
                                            )}
                                            {needsRawData && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">
                                                    <span className="material-symbols-outlined text-[12px]">description</span>
                                                    Raw Data Required
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-xs space-y-1 text-slate-500 dark:text-slate-400 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px]">science</span>
                                                {getMatrixName(task.sample_id)}
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-2",
                                                isOverdue && "text-danger font-medium"
                                            )}>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {isOverdue ? "warning" : "calendar_today"}
                                                </span>
                                                {isOverdue ? "OVERDUE: " : "Due: "}
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex gap-2 pt-3 border-t border-border-light dark:border-border-dark">
                                            {(task.status === "ASSIGNED" || task.status === "PLANNED") && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        try {
                                                            await updateRow("test_tasks", task.id, { status: "IN_PROGRESS", started_at: new Date().toISOString() });
                                                        } catch (err) {
                                                            console.error("Failed to update task status:", err);
                                                        }
                                                        router.push(`/testing/${task.id}`);
                                                    }}
                                                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium rounded-md bg-primary text-white hover:bg-primary-hover transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                                                    Start Run
                                                </button>
                                            )}
                                            {task.status === "IN_PROGRESS" && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        router.push(`/testing/${task.id}`);
                                                    }}
                                                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium rounded-md bg-primary text-white hover:bg-primary-hover transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                                                    Continue Testing
                                                </button>
                                            )}
                                        </div>

                                        {/* Hover Arrow */}
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-primary">arrow_forward</span>
                                        </div>

                                        {/* Overdue Indicator */}
                                        {isOverdue && (
                                            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-danger animate-pulse" />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {displayedTasks.length === 0 && (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-[48px] text-text-secondary/50">
                                {activeTab === "OVERDUE" ? "check_circle" : "inbox"}
                            </span>
                            <p className="mt-2 text-text-main dark:text-white font-medium">
                                {activeTab === "OVERDUE" ? "No overdue tasks!" : "No tasks found"}
                            </p>
                            <p className="text-sm text-text-secondary">
                                {activeTab === "OVERDUE"
                                    ? "All your tasks are on schedule."
                                    : "No tasks in this category."}
                            </p>
                        </div>
                    )}
                </>
            )}

        </div >
    );
}
