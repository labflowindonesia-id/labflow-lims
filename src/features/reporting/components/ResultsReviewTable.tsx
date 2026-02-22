"use client";

import { useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { cn } from "@/lib/utils";
import {
    useWorkOrders,
    useTestTasks,
    useTestResults,
    useSamples,
    useResultSubmissions,
} from "@/hooks/use-supabase";

interface Props {
    onSelectWO?: (workOrderId: string) => void;
}

export default function ResultsReviewTable({ onSelectWO }: Props) {
    const { data: workOrders = [] } = useWorkOrders();
    const { data: allTasks = [] } = useTestTasks();
    const { data: allResults = [] } = useTestResults();
    const { data: allSamples = [] } = useSamples();
    const { data: allSubmissions = [] } = useResultSubmissions();

    // Filter WOs that are in review-eligible statuses AND have a SUBMITTED submission
    const reviewQueue = useMemo(() => {
        const eligible = workOrders.filter(
            (w) => {
                const isReviewStatus = w.status === "IN_ANALYSIS" || w.status === "IN_REVIEW";
                const hasSubmitted = allSubmissions.some(
                    (s) => s.work_order_id === w.id && s.status === "SUBMITTED"
                );
                return isReviewStatus && hasSubmitted;
            }
        );

        return eligible.map((wo) => {
            // Get samples for this WO
            const woSamples = allSamples.filter((s) => s.work_order_id === wo.id);
            const sampleIds = woSamples.map((s) => s.id);

            // Get tasks for these samples
            const woTasks = allTasks.filter(
                (t) => t.sample_id && sampleIds.includes(t.sample_id) && t.status !== "CANCELLED"
            );
            const totalTasks = woTasks.length;
            const completedTasks = woTasks.filter((t) => t.status === "COMPLETED").length;
            const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Get results for completed tasks
            const taskIds = woTasks.map((t) => t.id);
            const woResults = allResults.filter((r) => taskIds.includes(r.task_id));
            const qcStatuses = woResults.map((r) => r.qc_status).filter(Boolean);
            const hasQCFail = qcStatuses.some((s) => s === "FAIL");
            const allQCPass = qcStatuses.length > 0 && qcStatuses.every((s) => s === "PASS");
            const aggregateQC: string = hasQCFail ? "FAIL" : allQCPass ? "PASS" : "PENDING";

            // Submission status
            const woSubs = allSubmissions.filter((s) => s.work_order_id === wo.id);
            const hasSubmission = woSubs.length > 0;
            const submissionStatus = hasSubmission ? woSubs[0].status : null;

            return {
                ...wo,
                totalTasks,
                completedTasks,
                progressPercent,
                aggregateQC,
                hasSubmission,
                submissionStatus,
                sampleCount: woSamples.length,
            };
        });
    }, [workOrders, allTasks, allResults, allSamples, allSubmissions]);

    const qcBadge = (qc: string) => {
        switch (qc) {
            case "PASS":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        PASS
                    </span>
                );
            case "FAIL":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        FAIL
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined text-[14px]">pending</span>
                        PENDING
                    </span>
                );
        }
    };

    return (
        <PremiumCard
            title="Results Review Queue"
            subtitle="Batch approval for completed analysis"
        >
            {reviewQueue.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">
                        fact_check
                    </span>
                    <p className="font-medium">No work orders pending review</p>
                    <p className="text-sm mt-1 opacity-70">
                        Work orders will appear here when analysis is complete
                    </p>
                </div>
            ) : (
                <DenseTable
                    data={reviewQueue}
                    keyExtractor={(w) => w.id}
                    columns={[
                        {
                            header: "Order #",
                            accessorKey: "work_order_number",
                            cell: (w) => (
                                <span className="font-mono text-sm font-semibold text-primary">
                                    {w.work_order_number}
                                </span>
                            ),
                        },
                        {
                            header: "Customer",
                            accessorKey: "customer_name_snapshot",
                            cell: (w) => (
                                <span className="text-sm truncate max-w-[160px] block">
                                    {w.customer_name_snapshot || "—"}
                                </span>
                            ),
                        },
                        {
                            header: "Samples",
                            accessorKey: "sample_count",
                            className: "text-center",
                            cell: (w) => (
                                <span className="text-sm font-medium">{w.sampleCount}</span>
                            ),
                        },
                        {
                            header: "Progress",
                            accessorKey: "id",
                            cell: (w) => (
                                <div className="flex items-center gap-2 min-w-[120px]">
                                    <div className="flex-1 h-2 bg-surface-secondary dark:bg-surface-dark rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                w.progressPercent === 100
                                                    ? "bg-emerald-500"
                                                    : w.progressPercent >= 50
                                                        ? "bg-primary"
                                                        : "bg-amber-500"
                                            )}
                                            style={{ width: `${w.progressPercent}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-text-secondary font-mono w-10 text-right">
                                        {w.progressPercent}%
                                    </span>
                                </div>
                            ),
                        },
                        {
                            header: "QC",
                            accessorKey: "priority",
                            className: "text-center",
                            cell: (w) => qcBadge(w.aggregateQC),
                        },
                        {
                            header: "Submission",
                            accessorKey: "status",
                            className: "text-center",
                            cell: (w) => {
                                if (!w.hasSubmission) {
                                    return (
                                        <span className="text-xs text-text-tertiary">Not submitted</span>
                                    );
                                }
                                const color =
                                    w.submissionStatus === "APPROVED"
                                        ? "text-emerald-600 bg-emerald-500/10"
                                        : w.submissionStatus === "RETURNED"
                                            ? "text-red-600 bg-red-500/10"
                                            : "text-blue-600 bg-blue-500/10";
                                return (
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", color)}>
                                        {w.submissionStatus}
                                    </span>
                                );
                            },
                        },
                        {
                            header: "Action",
                            accessorKey: "id",
                            className: "text-right",
                            cell: (w) => (
                                <button
                                    onClick={() => onSelectWO?.(w.id)}
                                    className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 ml-auto"
                                >
                                    <span className="material-symbols-outlined text-[16px]">
                                        rate_review
                                    </span>
                                    Review
                                </button>
                            ),
                        },
                    ]}
                    className="border-0"
                />
            )}
        </PremiumCard>
    );
}
