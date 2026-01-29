"use client";

import { cn } from "@/lib/utils";

interface TimelineItem {
    id: string;
    title: string;
    description?: string;
    timestamp: Date;
    status: "completed" | "current" | "pending";
    icon?: string;
    user?: string;
}

interface StatusTimelineProps {
    items: TimelineItem[];
    title?: string;
}

export function StatusTimeline({ items, title }: StatusTimelineProps) {
    return (
        <div className="space-y-4">
            {title && (
                <h4 className="text-sm font-semibold text-text-main dark:text-white">{title}</h4>
            )}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border-light dark:bg-border-dark" />

                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={item.id} className="relative flex gap-4">
                            {/* Icon */}
                            <div className={cn(
                                "relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white",
                                item.status === "completed" ? "bg-success" :
                                    item.status === "current" ? "bg-primary" :
                                        "bg-slate-300 dark:bg-slate-600"
                            )}>
                                <span className="material-symbols-outlined text-[14px]">
                                    {item.status === "completed" ? "check" :
                                        item.status === "current" ? "radio_button_checked" :
                                            item.icon || "circle"}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-2">
                                <div className="flex items-center justify-between">
                                    <p className={cn(
                                        "text-sm font-medium",
                                        item.status === "pending"
                                            ? "text-text-secondary"
                                            : "text-text-main dark:text-white"
                                    )}>
                                        {item.title}
                                    </p>
                                    <span className="text-xs text-text-secondary">
                                        {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {item.description && (
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        {item.description}
                                    </p>
                                )}
                                {item.user && (
                                    <p className="text-xs text-primary mt-0.5">
                                        by {item.user}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Revision History specific component
interface RevisionItem {
    version: number;
    date: Date;
    user: string;
    changes: string;
    status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
}

interface RevisionHistoryProps {
    revisions: RevisionItem[];
}

export function RevisionHistory({ revisions }: RevisionHistoryProps) {
    if (revisions.length === 0) {
        return (
            <div className="text-center py-6 text-text-secondary text-sm">
                No revision history available.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {revisions.map((rev, index) => (
                <div
                    key={rev.version}
                    className={cn(
                        "p-3 rounded-lg border",
                        index === 0
                            ? "border-primary/30 bg-primary/5"
                            : "border-border-light dark:border-border-dark"
                    )}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-text-main dark:text-white">
                            Version {rev.version}
                            {index === 0 && (
                                <span className="ml-2 text-xs font-normal text-primary">(Current)</span>
                            )}
                        </span>
                        <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full",
                            rev.status === "APPROVED" ? "bg-success/20 text-success" :
                                rev.status === "REJECTED" ? "bg-danger/20 text-danger" :
                                    rev.status === "SUBMITTED" ? "bg-warning/20 text-warning" :
                                        "bg-slate-100 text-slate-600"
                        )}>
                            {rev.status}
                        </span>
                    </div>
                    <p className="text-xs text-text-secondary">
                        {rev.date.toLocaleDateString()} • {rev.user}
                    </p>
                    <p className="text-xs text-text-secondary mt-1 italic">
                        {rev.changes}
                    </p>
                </div>
            ))}
        </div>
    );
}
