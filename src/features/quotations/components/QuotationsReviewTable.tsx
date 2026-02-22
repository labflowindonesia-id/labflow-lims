"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { useQuotations } from "@/hooks/use-supabase";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useMemo } from "react";

interface ReviewQuotation {
    id: string;
    quotation_number: string;
    customer_name_snapshot: string | null;
    created_at: string;
    subtotal: number | null;
    tax_amount: number | null;
    grand_total: number | null;
    tat_days?: number | null;
    status: string;
    urgency: "NORMAL" | "RUSH" | "URGENT";
    awaiting_days: number;
}

export default function QuotationsReviewTable() {
    const { data: allQuotations = [] } = useQuotations();
    const { user } = useAuth();
    const isManager = user?.role === "manager";

    const [selectedFilter, setSelectedFilter] = useState<"ALL" | "URGENT" | "RUSH">("ALL");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Enhance quotations with review metadata from real DB fields
    const reviewQuotations: ReviewQuotation[] = useMemo(() => {
        return allQuotations
            .filter(q => q.status === "SUBMITTED")
            .map(q => {
                const awaitingDays = Math.floor((Date.now() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24));
                return {
                    ...q,
                    urgency: (awaitingDays > 3 ? "URGENT" : awaitingDays > 1 ? "RUSH" : "NORMAL") as "NORMAL" | "RUSH" | "URGENT",
                    awaiting_days: awaitingDays,
                };
            })
            .sort((a, b) => b.awaiting_days - a.awaiting_days);
    }, [allQuotations]);

    // Filter
    const filteredQuotations = useMemo(() => {
        if (selectedFilter === "ALL") return reviewQuotations;
        return reviewQuotations.filter(q => q.urgency === selectedFilter);
    }, [reviewQuotations, selectedFilter]);

    // Stats
    const urgentCount = reviewQuotations.filter(q => q.urgency === "URGENT").length;
    const rushCount = reviewQuotations.filter(q => q.urgency === "RUSH").length;
    const totalValue = reviewQuotations.reduce((sum, q) => sum + (q.grand_total || ((q.subtotal || 0) + (q.tax_amount || 0))), 0);

    // Non-manager view
    if (!isManager) {
        return (
            <div className="space-y-6">
                <PremiumCard title="Contract Review Queue">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-amber-400 mb-3">lock</span>
                        <p className="text-lg font-bold text-slate-600 dark:text-slate-300">Manager Access Required</p>
                        <p className="text-sm text-slate-400 mt-1">Only managers can review and approve quotations.</p>
                    </div>
                </PremiumCard>
            </div>
        );
    }

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
                    <p className="text-2xl font-bold text-primary">Rp {(totalValue / 1000000).toFixed(1)}M</p>
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
                subtitle="Click a row to expand details"
            >
                {filteredQuotations.length === 0 ? (
                    <div className="flex bg-slate-50 flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-slate-300 dark:bg-slate-800/50 dark:border-slate-600">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment_turned_in</span>
                        <p className="text-sm font-medium text-slate-500">All caught up!</p>
                        <p className="text-xs text-slate-400">No quotations pending review.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredQuotations.map(q => {
                            const total = q.grand_total || ((q.subtotal || 0) + (q.tax_amount || 0));
                            return (
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
                                                <span className="font-mono font-medium text-sm text-text-main dark:text-white">{q.quotation_number}</span>
                                                {q.urgency === "URGENT" && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger">URGENT</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-secondary truncate">{q.customer_name_snapshot}</p>
                                        </div>

                                        {/* Meta Info */}
                                        <div className="hidden md:flex items-center gap-6 text-xs text-text-secondary">
                                            <div className="text-center">
                                                <p className="font-medium text-text-main dark:text-white">{q.tat_days || 0}d</p>
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
                                                Rp {Math.round(total).toLocaleString()}
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

                                    {/* Expanded Detail */}
                                    {expandedId === q.id && (
                                        <div className="mt-2 ml-6 p-4 rounded-lg border border-dashed border-primary/30 bg-white dark:bg-surface-dark space-y-3">
                                            <h4 className="text-sm font-bold text-text-main dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                                                Quotation Summary
                                            </h4>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                    <p className="text-text-secondary">TAT</p>
                                                    <p className="font-bold text-text-main dark:text-white">{q.tat_days || 0} working days</p>
                                                </div>
                                                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                    <p className="text-text-secondary">Subtotal</p>
                                                    <p className="font-bold text-text-main dark:text-white">Rp {(q.subtotal || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                    <p className="text-text-secondary">Tax</p>
                                                    <p className="font-bold text-text-main dark:text-white">Rp {Math.round(q.tax_amount || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                    <p className="text-text-secondary">Grand Total</p>
                                                    <p className="font-bold text-primary">Rp {Math.round(total).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                                Created: {new Date(q.created_at).toLocaleDateString("id-ID")}
                                                <span className="mx-1">•</span>
                                                Waiting: {q.awaiting_days} days
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </PremiumCard>
        </div>
    );
}
