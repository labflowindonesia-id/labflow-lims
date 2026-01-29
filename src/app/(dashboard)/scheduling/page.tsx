"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import TaskAssignmentTable from "@/features/scheduling/components/TaskAssignmentTable";
import TaskGeneratorPanel from "@/features/scheduling/components/TaskGeneratorPanel";
import ScheduleTimelineView from "@/features/scheduling/components/ScheduleTimelineView";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ViewTab = "timeline" | "assignment";

export default function SchedulingPage() {
    const [activeTab, setActiveTab] = useState<ViewTab>("timeline");

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Resource Planning"
                description="Assign tasks and manage laboratory workload"
                actions={
                    <div className="flex items-center gap-2 bg-white/80 dark:bg-surface-dark rounded-lg p-1 border border-border-light dark:border-border-dark">
                        <button
                            onClick={() => setActiveTab("timeline")}
                            className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                activeTab === "timeline"
                                    ? "bg-primary text-white"
                                    : "text-text-secondary hover:text-text-main hover:bg-slate-100 dark:hover:bg-white/10"
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                            Timeline
                        </button>
                        <button
                            onClick={() => setActiveTab("assignment")}
                            className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                activeTab === "assignment"
                                    ? "bg-primary text-white"
                                    : "text-text-secondary hover:text-text-main hover:bg-slate-100 dark:hover:bg-white/10"
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px]">assignment_ind</span>
                            Assignment
                        </button>
                    </div>
                }
            />
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Timeline View - Visual workload overview */}
                {activeTab === "timeline" && (
                    <>
                        <ScheduleTimelineView />
                        {/* Task Generator Panel */}
                        <TaskGeneratorPanel />
                    </>
                )}

                {/* Assignment View - Table-based task assignment */}
                {activeTab === "assignment" && (
                    <>
                        <TaskGeneratorPanel />
                        <TaskAssignmentTable />
                    </>
                )}
            </div>
        </div>
    );
}
