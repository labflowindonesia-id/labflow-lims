"use client";

import { useState, useMemo } from "react";
import { TestTask } from "@/types/master-data";
import { MOCK_TASKS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type TabType = "ACTIVE" | "OVERDUE" | "COMPLETED";
type SortType = "due_date" | "priority" | "parameter";

export default function MyTaskBoard() {
    // Mock logged-in user: "usr-003" (Analyst Kimia)
    const MY_ID = "usr-003";
    const searchParams = useSearchParams();
    const filterParam = searchParams.get("filter");

    const myTasks = MOCK_TASKS.filter(t => t.assigned_to_user_id === MY_ID);

    const [activeTab, setActiveTab] = useState<TabType>(
        filterParam === "overdue" ? "OVERDUE" : "ACTIVE"
    );
    const [sortBy, setSortBy] = useState<SortType>("due_date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = myTasks.filter(t =>
        t.status !== "COMPLETED" && new Date(t.due_date) < now
    );
    const activeTasks = myTasks.filter(t =>
        t.status !== "COMPLETED" && new Date(t.due_date) >= now
    );
    const completedTasks = myTasks.filter(t => t.status === "COMPLETED");

    // Mock QC status for tasks
    const getQCStatus = (taskId: string): "PASS" | "FAIL" | "PENDING" | null => {
        const statuses: Record<string, "PASS" | "FAIL" | "PENDING"> = {
            "task-001": "PASS",
            "task-002": "FAIL",
            "task-003": "PENDING",
        };
        return statuses[taskId] || null;
    };

    // Mock raw data requirement
    const requiresRawData = (taskId: string): boolean => {
        // Tasks with certain parameters require raw data upload
        return ["task-001", "task-003"].includes(taskId);
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
                    comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                    break;
                case "priority":
                    comparison = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
                    break;
                case "parameter":
                    comparison = (a.parameter_name_snapshot || "").localeCompare(b.parameter_name_snapshot || "");
                    break;
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return tasks;
    }, [activeTab, activeTasks, overdueTasks, completedTasks, sortBy, sortOrder]);

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

            {/* TASK GRID */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayedTasks.map(task => {
                    const isOverdue = new Date(task.due_date) < now && task.status !== "COMPLETED";
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
                                {/* Header */}
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{task.id}</span>
                                    <div className="flex items-center gap-1">
                                        {/* Priority Badge */}
                                        <span className={cn(
                                            "px-2 py-0.5 text-[10px] font-bold rounded",
                                            task.priority === "URGENT" ? "bg-danger/20 text-danger" :
                                                task.priority === "HIGH" ? "bg-warning/20 text-warning" :
                                                    "bg-slate-100 text-slate-500"
                                        )}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>

                                {/* Parameter Name */}
                                <h3 className="font-display font-semibold text-lg text-text-main mb-1 group-hover:text-primary transition-colors dark:text-white">
                                    {task.parameter_name_snapshot}
                                </h3>

                                {/* Sample Name */}
                                <p className="text-sm text-text-secondary line-clamp-1 mb-3" title={task.sample_name_snapshot}>
                                    {task.sample_name_snapshot}
                                </p>

                                {/* Status Indicators */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {/* QC Status */}
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

                                    {/* Raw Data Indicator */}
                                    {needsRawData && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">
                                            <span className="material-symbols-outlined text-[12px]">description</span>
                                            Raw Data Required
                                        </span>
                                    )}
                                </div>

                                {/* Meta Info */}
                                <div className="text-xs space-y-1 text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[14px]">science</span>
                                        {task.matrix_name_snapshot}
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-2",
                                        isOverdue && "text-danger font-medium"
                                    )}>
                                        <span className="material-symbols-outlined text-[14px]">
                                            {isOverdue ? "warning" : "calendar_today"}
                                        </span>
                                        {isOverdue ? "OVERDUE: " : "Due: "}
                                        {new Date(task.due_date).toLocaleDateString()}
                                    </div>
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
        </div>
    );
}
