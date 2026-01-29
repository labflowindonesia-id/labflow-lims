"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_QUOTATIONS, MOCK_TEST_PACKAGES } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useMemo } from "react";

// Extended quotation type with review info
interface ReviewQuotation {
    id: string;
    quotation_no: string;
    customer_name_snapshot: string;
    created_at: Date;
    total_amount: number;
    status: string;
    // Additional review fields
    test_count: number;
    max_tat_days: number;
    urgency: "NORMAL" | "RUSH" | "URGENT";
    awaiting_days: number;
}

export default function QuotationsReviewTable() {
    const [selectedFilter, setSelectedFilter] = useState<"ALL" | "URGENT" | "RUSH">("ALL");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Enhance quotations with review metadata
    const reviewQuotations: ReviewQuotation[] = useMemo(() => {
        return MOCK_QUOTATIONS
            .filter(q => q.status === "SUBMITTED")
            .map(q => {
                const awaitingDays = Math.floor((Date.now() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24));
                return {
                    ...q,
                    test_count: Math.floor(Math.random() * 10) + 3,
                    max_tat_days: Math.floor(Math.random() * 7) + 3,
                    urgency: awaitingDays > 3 ? "URGENT" : awaitingDays > 1 ? "RUSH" : "NORMAL",
                    awaiting_days: awaitingDays
                };
            });
    }, []);

    // Filter quotations
    const filteredQuotations = useMemo(() => {
        if (selectedFilter === "ALL") return reviewQuotations;
        return reviewQuotations.filter(q => q.urgency === selectedFilter);
    }, [reviewQuotations, selectedFilter]);

    // Stats
    const urgentCount = reviewQuotations.filter(q => q.urgency === "URGENT").length;
    const rushCount = reviewQuotations.filter(q => q.urgency === "RUSH").length;
    const totalValue = reviewQuotations.reduce((sum, q) => sum + q.total_amount, 0);

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border-light p-4 bg-white dark:bg-surface-dark dark:border-border-dark">
                    <p className="text-xs text-text-secondary">Pending Review</p>
                    <p className="text-2xl font-bold text-text-main dark:text-white">{reviewQuotations.length}</p>
                </div>
                <div className="rounded-lg border border-danger/30 p-4 bg-danger/5">
                    <p className="text-xs text-danger">Urgent (3+ days)</p>
                    <p className="text-2xl font-bold text-danger">{urgentCount}</p>
                </div>
                <div className="rounded-lg border border-warning/30 p-4 bg-warning/5">
                    <p className="text-xs text-warning">Rush (1-3 days)</p>
                    <p className="text-2xl font-bold text-warning">{rushCount}</p>
                </div>
                <div className="rounded-lg border border-primary/30 p-4 bg-primary/5">
                    <p className="text-xs text-primary">Total Value</p>
                    <p className="text-2xl font-bold text-primary">IDR {(totalValue / 1000000).toFixed(1)}M</p>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Filter:</span>
                {(["ALL", "URGENT", "RUSH"] as const).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                            selectedFilter === filter
                                ? "bg-primary text-white border-primary"
                                : "border-border-light text-text-secondary hover:border-primary/50 dark:border-border-dark"
                        )}
                    >
                        {filter === "ALL" ? "All" : filter}
                        {filter === "URGENT" && urgentCount > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{urgentCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Review Queue */}
            <PremiumCard
                title="Contract Review Queue"
                subtitle="Click a row to see turnaround feasibility summary"
            >
                {filteredQuotations.length === 0 ? (
                    <div className="flex bg-slate-50 flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-slate-300 dark:bg-slate-800/50 dark:border-slate-600">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment_turned_in</span>
                        <p className="text-sm font-medium text-slate-500">All caught up!</p>
                        <p className="text-xs text-slate-400">No quotations pending review.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredQuotations.map(q => (
                            <div key={q.id}>
                                {/* Main Row */}
                                <div
                                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                                    className={cn(
                                        "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all",
                                        expandedId === q.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border-light hover:border-primary/30 dark:border-border-dark",
                                        q.urgency === "URGENT" && "border-l-4 border-l-danger"
                                    )}
                                >
                                    {/* Urgency Badge */}
                                    <div className={cn(
                                        "w-2 h-2 rounded-full flex-shrink-0",
                                        q.urgency === "URGENT" ? "bg-danger animate-pulse" :
                                            q.urgency === "RUSH" ? "bg-warning" : "bg-slate-300"
                                    )} />

                                    {/* Quote Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-medium text-sm text-text-main dark:text-white">{q.quotation_no}</span>
                                            {q.urgency === "URGENT" && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger">URGENT</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-secondary truncate">{q.customer_name_snapshot}</p>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="hidden md:flex items-center gap-6 text-xs text-text-secondary">
                                        <div className="text-center">
                                            <p className="font-medium text-text-main dark:text-white">{q.test_count}</p>
                                            <p>Tests</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-text-main dark:text-white">{q.max_tat_days}d</p>
                                            <p>TAT</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-text-main dark:text-white">{q.awaiting_days}d</p>
                                            <p>Waiting</p>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right">
                                        <p className="font-mono font-medium text-sm text-text-main dark:text-white">
                                            IDR {q.total_amount.toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Action */}
                                    <Link href={`/quotations/${q.id}`} onClick={(e) => e.stopPropagation()}>
                                        <button className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover">
                                            Review
                                        </button>
                                    </Link>

                                    {/* Expand Icon */}
                                    <span className={cn(
                                        "material-symbols-outlined text-text-secondary transition-transform",
                                        expandedId === q.id && "rotate-180"
                                    )}>expand_more</span>
                                </div>

                                {/* Expanded Detail: Turnaround Feasibility Summary */}
                                {expandedId === q.id && (
                                    <div className="mt-2 ml-6 p-4 rounded-lg border border-dashed border-primary/30 bg-white dark:bg-surface-dark space-y-3">
                                        <h4 className="text-sm font-bold text-text-main dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                                            Turnaround Feasibility Summary
                                        </h4>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                <p className="text-text-secondary">Requested TAT</p>
                                                <p className="font-bold text-text-main dark:text-white">{q.max_tat_days} working days</p>
                                            </div>
                                            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                <p className="text-text-secondary">Current Capacity</p>
                                                <p className="font-bold text-success">Available</p>
                                            </div>
                                            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                <p className="text-text-secondary">Instruments</p>
                                                <p className="font-bold text-text-main dark:text-white">3 required</p>
                                            </div>
                                            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                <p className="text-text-secondary">Analysts</p>
                                                <p className="font-bold text-text-main dark:text-white">2 qualified</p>
                                            </div>
                                        </div>

                                        {/* Quick Feasibility Checklist */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-success/10 text-success">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                                Lab has capacity
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-success/10 text-success">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                                All methods accredited
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-warning/10 text-warning">
                                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                                Rush fee applicable
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>
        </div>
    );
}
