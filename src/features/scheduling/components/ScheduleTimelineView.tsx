"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { MOCK_TASKS, MOCK_INSTRUMENTS, MOCK_USERS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

type ViewMode = "instrument" | "analyst";

export default function ScheduleTimelineView() {
    const [viewMode, setViewMode] = useState<ViewMode>("instrument");
    const [weekOffset, setWeekOffset] = useState(0);

    // Generate dates for the week
    const weekDays = useMemo(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)); // Monday

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            return date;
        });
    }, [weekOffset]);

    // Get analysts only
    const analysts = MOCK_USERS.filter(u => u.role === "ANALYST");

    // Calculate workload per resource per day
    const getWorkload = (resourceId: string, date: Date, type: ViewMode): number => {
        return MOCK_TASKS.filter(t => {
            const taskDate = new Date(t.due_date);
            const sameDay = taskDate.toDateString() === date.toDateString();
            if (type === "instrument") {
                return t.instrument_id_snapshot === resourceId && sameDay;
            } else {
                return t.assigned_to_user_id === resourceId && sameDay;
            }
        }).length;
    };

    // Get status for workload cell
    const getWorkloadStatus = (count: number): { color: string; label: string } => {
        if (count === 0) return { color: "bg-slate-100 dark:bg-white/5", label: "-" };
        if (count <= 2) return { color: "bg-success/20 text-success", label: `${count}` };
        if (count <= 4) return { color: "bg-warning/20 text-warning", label: `${count}` };
        return { color: "bg-danger/20 text-danger", label: `${count}!` };
    };

    // Total tasks per day
    const dailyTotals = weekDays.map(day =>
        MOCK_TASKS.filter(t => new Date(t.due_date).toDateString() === day.toDateString()).length
    );

    return (
        <PremiumCard
            title="Workload Timeline"
            subtitle="Weekly resource utilization view"
            action={
                <div className="flex items-center gap-3">
                    {/* Week Navigation */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setWeekOffset(w => w - 1)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button
                            onClick={() => setWeekOffset(0)}
                            className="px-2 py-1 text-xs font-medium text-primary hover:underline"
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setWeekOffset(w => w + 1)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex rounded-lg border border-border-light dark:border-border-dark">
                        <button
                            onClick={() => setViewMode("instrument")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium transition-colors",
                                viewMode === "instrument"
                                    ? "bg-primary text-white rounded-l-lg"
                                    : "text-text-secondary hover:text-text-main"
                            )}
                        >
                            By Instrument
                        </button>
                        <button
                            onClick={() => setViewMode("analyst")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium transition-colors",
                                viewMode === "analyst"
                                    ? "bg-primary text-white rounded-r-lg"
                                    : "text-text-secondary hover:text-text-main"
                            )}
                        >
                            By Analyst
                        </button>
                    </div>
                </div>
            }
        >
            {/* Timeline Grid */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border-light dark:border-border-dark">
                            <th className="px-3 py-2 text-left font-medium text-text-secondary w-40">
                                {viewMode === "instrument" ? "Instrument" : "Analyst"}
                            </th>
                            {weekDays.map((day, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        "px-2 py-2 text-center min-w-[70px]",
                                        day.toDateString() === new Date().toDateString()
                                            ? "bg-primary/10"
                                            : ""
                                    )}
                                >
                                    <div className="text-xs font-bold text-text-main dark:text-white">
                                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                                    </div>
                                    <div className="text-[10px] text-text-secondary">
                                        {day.getDate()}/{day.getMonth() + 1}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Resource rows */}
                        {(viewMode === "instrument" ? MOCK_INSTRUMENTS : analysts).map(resource => (
                            <tr key={resource.id} className="border-b border-border-light/50 dark:border-border-dark/50 hover:bg-slate-50 dark:hover:bg-white/5">
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-text-secondary">
                                            {viewMode === "instrument" ? "science" : "person"}
                                        </span>
                                        <span className="font-medium text-text-main dark:text-white truncate max-w-[120px]">
                                            {viewMode === "instrument"
                                                ? (resource as typeof MOCK_INSTRUMENTS[0]).name
                                                : (resource as typeof MOCK_USERS[0]).full_name
                                            }
                                        </span>
                                    </div>
                                </td>
                                {weekDays.map((day, i) => {
                                    const count = getWorkload(resource.id, day, viewMode);
                                    const status = getWorkloadStatus(count);
                                    return (
                                        <td
                                            key={i}
                                            className={cn(
                                                "px-2 py-2 text-center",
                                                day.toDateString() === new Date().toDateString()
                                                    ? "bg-primary/5"
                                                    : ""
                                            )}
                                        >
                                            <div className={cn(
                                                "rounded-full w-8 h-8 mx-auto flex items-center justify-center text-xs font-bold",
                                                status.color
                                            )}>
                                                {status.label}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {/* Totals Row */}
                        <tr className="bg-slate-50 dark:bg-white/5 font-bold">
                            <td className="px-3 py-2 text-text-main dark:text-white">Daily Total</td>
                            {dailyTotals.map((total, i) => (
                                <td key={i} className="px-2 py-2 text-center text-primary">
                                    {total}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                <span className="text-xs text-text-secondary">Workload:</span>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-success/20" />
                    <span className="text-xs text-text-secondary">Low (1-2)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-warning/20" />
                    <span className="text-xs text-text-secondary">Medium (3-4)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-danger/20" />
                    <span className="text-xs text-text-secondary">High (5+)</span>
                </div>
            </div>
        </PremiumCard>
    );
}
