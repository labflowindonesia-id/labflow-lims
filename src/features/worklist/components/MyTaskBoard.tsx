import { useState } from "react";
import { TestTask } from "@/types/master-data";
import { MOCK_TASKS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function MyTaskBoard() {
    // Mock logged-in user: "usr-003" (Analyst Kimia)
    const MY_ID = "usr-003";
    const myTasks = MOCK_TASKS.filter(t => t.assigned_to_user_id === MY_ID);

    const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");

    const displayedTasks = activeTab === "ACTIVE"
        ? myTasks.filter(t => t.status !== "COMPLETED")
        : myTasks.filter(t => t.status === "COMPLETED");

    return (
        <div className="space-y-6">
            {/* TABS */}
            <div className="flex gap-4 border-b border-border-light">
                <button
                    onClick={() => setActiveTab("ACTIVE")}
                    className={cn(
                        "pb-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === "ACTIVE" ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-main"
                    )}
                >
                    My Active Tasks ({myTasks.filter(t => t.status !== "COMPLETED").length})
                </button>
                <button
                    onClick={() => setActiveTab("COMPLETED")}
                    className={cn(
                        "pb-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === "COMPLETED" ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-main"
                    )}
                >
                    Completed
                </button>
            </div>

            {/* TASK GRID */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayedTasks.map(task => (
                    <Link href={`/testing/${task.id}`} key={task.id}>
                        <div className="group relative rounded-lg border border-border-light bg-surface-light p-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all dark:bg-surface-dark dark:border-white/10">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{task.id}</span>
                                <span className={cn(
                                    "px-2 py-0.5 text-[10px] font-bold rounded",
                                    task.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
                                )}>
                                    {task.priority}
                                </span>
                            </div>

                            <h3 className="font-display font-semibold text-lg text-text-main mb-1 group-hover:text-primary transition-colors">
                                {task.parameter_name_snapshot}
                            </h3>

                            <p className="text-sm text-text-secondary line-clamp-1 mb-4" title={task.sample_name_snapshot}>
                                {task.sample_name_snapshot}
                            </p>

                            <div className="text-xs space-y-1 text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">science</span>
                                    {task.matrix_name_snapshot}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                    Due: {task.due_date.toLocaleDateString()}
                                </div>
                            </div>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-primary">arrow_forward</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {displayedTasks.length === 0 && (
                <div className="text-center py-12 text-text-secondary">
                    <p>No tasks found in this view.</p>
                </div>
            )}
        </div>
    );
}
