"use client";

import { useState, useMemo, useCallback } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { insertRow, updateRow } from "@/lib/services";
import { useAuth } from "@/providers/AuthProvider";
import {
    useWorkOrder,
    useSamplesByWorkOrder,
    useTestTasks,
    useTestResults,
    useTestRunsAll,
    useResultSubmissionsByWorkOrder,
    useReviewAuditLogs,
    useParameters,
    useUnits,
    useUsers,
} from "@/hooks/use-supabase";

interface Props {
    workOrderId: string;
    onApprove?: () => void;
    onReject?: (reason: string) => void;
}

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    passed: boolean;
    required: boolean;
    detail?: string;
}

export default function ReviewDetailPanel({ workOrderId, onApprove, onReject }: Props) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch real data
    const { data: workOrder } = useWorkOrder(workOrderId);
    const { data: samples = [] } = useSamplesByWorkOrder(workOrderId);
    const { data: allTasks = [] } = useTestTasks();
    const { data: allResults = [] } = useTestResults();
    const { data: allRuns = [] } = useTestRunsAll();
    const { data: submissions = [] } = useResultSubmissionsByWorkOrder(workOrderId);
    const { data: auditLogs = [] } = useReviewAuditLogs(workOrderId);
    const { data: parameters = [] } = useParameters();
    const { data: units = [] } = useUnits();
    const { data: users = [] } = useUsers();

    // Derived data
    const sampleIds = useMemo(() => samples.map((s) => s.id), [samples]);
    const woTasks = useMemo(
        () => allTasks.filter((t) => t.sample_id && sampleIds.includes(t.sample_id) && t.status !== "CANCELLED"),
        [allTasks, sampleIds]
    );
    const totalTasks = woTasks.length;
    const completedTasks = useMemo(() => woTasks.filter((t) => t.status === "COMPLETED"), [woTasks]);
    const taskIds = useMemo(() => woTasks.map((t) => t.id), [woTasks]);
    const woResults = useMemo(
        () => allResults.filter((r) => taskIds.includes(r.task_id)),
        [allResults, taskIds]
    );
    const woRuns = useMemo(
        () => allRuns.filter((r) => taskIds.includes(r.task_id)),
        [allRuns, taskIds]
    );

    // Helper lookups
    const paramMap = useMemo(() => {
        const m: Record<string, string> = {};
        parameters.forEach((p) => (m[p.id] = p.name));
        return m;
    }, [parameters]);
    const unitMap = useMemo(() => {
        const m: Record<string, string> = {};
        units.forEach((u) => (m[u.id] = u.symbol));
        return m;
    }, [units]);
    const userMap = useMemo(() => {
        const m: Record<string, string> = {};
        users.forEach((u) => (m[u.id] = u.full_name));
        return m;
    }, [users]);

    // ─── SMART REVIEW CHECKLIST ───
    const checklist = useMemo<ChecklistItem[]>(() => {
        const allTestsFinalized = totalTasks > 0 && completedTasks.length === totalTasks;
        const allResultsEntered = completedTasks.length > 0 &&
            completedTasks.every((t) => woResults.some((r) => r.task_id === t.id));
        const qcStatuses = woResults.map((r) => r.qc_status).filter(Boolean);
        const qcMet = qcStatuses.length > 0 && !qcStatuses.some((s) => s === "FAIL");
        const compStatuses = woResults.map((r) => r.compliance_status).filter(Boolean);
        const complianceEval = compStatuses.length > 0 && !compStatuses.some((s) => s === "NOT_EVALUATED");
        const hasSubmission = submissions.some((s) => s.status === "SUBMITTED");

        return [
            {
                id: "tests_finalized",
                label: "All tests finalized",
                description: "All assigned test tasks have status COMPLETED",
                passed: allTestsFinalized,
                required: true,
                detail: `${completedTasks.length}/${totalTasks} tasks completed`,
            },
            {
                id: "results_entered",
                label: "All results entered",
                description: "Every completed task has a matching test result record",
                passed: allResultsEntered,
                required: true,
                detail: `${woResults.length} results for ${completedTasks.length} completed tasks`,
            },
            {
                id: "qc_criteria",
                label: "QC criteria met",
                description: "No test result has QC status = FAIL",
                passed: qcMet,
                required: true,
                detail: qcStatuses.length === 0
                    ? "No QC data available"
                    : `${qcStatuses.filter((s) => s === "PASS").length}/${qcStatuses.length} passed`,
            },
            {
                id: "compliance",
                label: "Compliance evaluated",
                description: "All results have been evaluated against regulatory limits",
                passed: complianceEval,
                required: true,
                detail: compStatuses.length === 0
                    ? "No compliance data"
                    : `${compStatuses.filter((s) => s !== "NOT_EVALUATED").length}/${compStatuses.length} evaluated`,
            },
            {
                id: "submitted",
                label: "Results submitted for review",
                description: "At least one result submission exists with SUBMITTED status",
                passed: hasSubmission,
                required: true,
                detail: `${submissions.length} submission(s)`,
            },
        ];
    }, [totalTasks, completedTasks, woResults, submissions]);

    const passedRequired = checklist.filter((c) => c.required && c.passed).length;
    const totalRequired = checklist.filter((c) => c.required).length;
    const allRequiredPassed = passedRequired === totalRequired;

    // ─── RESULTS TABLE ───
    const resultRows = useMemo(() => {
        return woResults.map((r) => {
            const task = woTasks.find((t) => t.id === r.task_id);
            const sample = samples.find((s) => s.id === task?.sample_id);
            return {
                id: r.id,
                sampleLabId: sample?.sample_lab_id || "—",
                parameter: r.parameter_id ? paramMap[r.parameter_id] || "—" : "—",
                value: r.is_nd ? "ND" : r.result_value !== null ? String(r.result_value) : r.result_text || "—",
                unit: r.unit_id ? unitMap[r.unit_id] || "" : "",
                compliance: r.compliance_status || "NOT_EVALUATED",
                qcStatus: r.qc_status || "NONE",
            };
        });
    }, [woResults, woTasks, samples, paramMap, unitMap]);

    // ─── ACTIONS ───
    const handleApprove = useCallback(async () => {
        if (!allRequiredPassed || isSubmitting) return;
        setIsSubmitting(true);

        try {
            // 1. Log audit
            await insertRow("review_audit_logs", {
                work_order_id: workOrderId,
                submission_id: submissions[0]?.id || null,
                action: "APPROVED",
                performed_by: user?.id || null,
                notes: `Approved by ${user?.full_name || "Manager"}`,
            });

            // 2. Update result_submissions → APPROVED
            for (const sub of submissions.filter((s) => s.status === "SUBMITTED")) {
                await updateRow("result_submissions", sub.id, {
                    status: "APPROVED",
                });
            }

            // 3. Update work_orders.status → COMPLETED
            await updateRow("work_orders", workOrderId, {
                status: "COMPLETED",
            });

            // 4. Invalidate caches
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["resultSubmissions"] }),
                queryClient.invalidateQueries({ queryKey: ["reviewAuditLogs"] }),
                queryClient.invalidateQueries({ queryKey: ["reports"] }),
                queryClient.invalidateQueries({ queryKey: ["workOrders"] }),
            ]);

            onApprove?.();
        } catch (err) {
            console.error("Approve failed:", err);
            alert("Failed to approve. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [allRequiredPassed, isSubmitting, workOrderId, submissions, user, workOrder, queryClient, onApprove]);

    const handleReject = useCallback(async () => {
        if (!rejectionReason.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            // 1. Log audit
            await insertRow("review_audit_logs", {
                work_order_id: workOrderId,
                submission_id: submissions[0]?.id || null,
                action: "REJECTED",
                performed_by: user?.id || null,
                notes: rejectionReason,
            });

            // 2. Update result_submissions → RETURNED
            for (const sub of submissions.filter((s) => s.status === "SUBMITTED")) {
                await updateRow("result_submissions", sub.id, {
                    status: "RETURNED",
                });
            }

            // 3. Return tasks to analyst worklist (IN_PROGRESS)
            for (const task of completedTasks) {
                await updateRow("test_tasks", task.id, {
                    status: "IN_PROGRESS",
                });
            }

            // 4. Invalidate caches
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["resultSubmissions"] }),
                queryClient.invalidateQueries({ queryKey: ["reviewAuditLogs"] }),
                queryClient.invalidateQueries({ queryKey: ["testTasks"] }),
                queryClient.invalidateQueries({ queryKey: ["workOrders"] }),
            ]);

            setShowRejectModal(false);
            onReject?.(rejectionReason);
        } catch (err) {
            console.error("Reject failed:", err);
            alert("Failed to reject. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [rejectionReason, isSubmitting, workOrderId, submissions, completedTasks, user, queryClient, onReject]);

    // ─── RENDER ───
    return (
        <div className="space-y-4">
            {/* Work Order Header */}
            <PremiumCard
                title={`Review: ${workOrder?.work_order_number || "Loading..."}`}
                subtitle={workOrder ? `${workOrder.customer_name_snapshot} · ${samples.length} sample(s) · ${totalTasks} test(s)` : "Loading details..."}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                    <div>
                        <p className="text-xs text-text-tertiary uppercase tracking-wider">Status</p>
                        <p className="text-sm font-semibold mt-0.5">{workOrder?.status || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-text-tertiary uppercase tracking-wider">Priority</p>
                        <p className="text-sm font-semibold mt-0.5">{workOrder?.priority || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-text-tertiary uppercase tracking-wider">Received</p>
                        <p className="text-sm font-semibold mt-0.5">
                            {workOrder?.received_date
                                ? new Date(workOrder.received_date).toLocaleDateString("id-ID")
                                : "—"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-tertiary uppercase tracking-wider">Due Date</p>
                        <p className="text-sm font-semibold mt-0.5">
                            {workOrder?.due_date
                                ? new Date(workOrder.due_date).toLocaleDateString("id-ID")
                                : "—"}
                        </p>
                    </div>
                </div>
            </PremiumCard>

            {/* Smart Review Checklist */}
            <PremiumCard
                title="Smart Review Checklist"
                subtitle={`${passedRequired}/${totalRequired} required checks passed`}
                action={
                    <span
                        className={cn(
                            "text-xs font-bold px-2.5 py-1 rounded-full",
                            allRequiredPassed
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        )}
                    >
                        {allRequiredPassed ? "✓ READY" : "⏳ PENDING"}
                    </span>
                }
            >
                <div className="divide-y divide-border">
                    {checklist.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 py-3">
                            <div
                                className={cn(
                                    "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                    item.passed
                                        ? "bg-emerald-500/15 text-emerald-600"
                                        : "bg-red-500/10 text-red-500"
                                )}
                            >
                                <span className="material-symbols-outlined text-[14px]">
                                    {item.passed ? "check" : "close"}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{item.label}</p>
                                    {item.required && (
                                        <span className="text-[10px] text-red-400 font-bold uppercase">Required</span>
                                    )}
                                </div>
                                <p className="text-xs text-text-tertiary mt-0.5">{item.description}</p>
                                {item.detail && (
                                    <p className="text-xs text-text-secondary mt-1 font-mono">{item.detail}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </PremiumCard>

            {/* Results Summary */}
            <PremiumCard
                title="Test Results Summary"
                subtitle={`${resultRows.length} result(s) from ${completedTasks.length} completed task(s)`}
            >
                {resultRows.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-6">
                        No test results available yet
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    <th className="py-2 px-2 text-xs font-semibold text-text-tertiary uppercase">Sample</th>
                                    <th className="py-2 px-2 text-xs font-semibold text-text-tertiary uppercase">Parameter</th>
                                    <th className="py-2 px-2 text-xs font-semibold text-text-tertiary uppercase text-right">Value</th>
                                    <th className="py-2 px-2 text-xs font-semibold text-text-tertiary uppercase text-center">Compliance</th>
                                    <th className="py-2 px-2 text-xs font-semibold text-text-tertiary uppercase text-center">QC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {resultRows.map((row) => (
                                    <tr key={row.id} className="hover:bg-surface-secondary/50 dark:hover:bg-surface-dark/50">
                                        <td className="py-2 px-2 font-mono text-xs">{row.sampleLabId}</td>
                                        <td className="py-2 px-2">{row.parameter}</td>
                                        <td className="py-2 px-2 text-right font-mono">
                                            {row.value} {row.unit && <span className="text-text-tertiary">{row.unit}</span>}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <span
                                                className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    row.compliance === "PASS"
                                                        ? "bg-emerald-500/10 text-emerald-600"
                                                        : row.compliance === "FAIL"
                                                            ? "bg-red-500/10 text-red-600"
                                                            : "bg-gray-500/10 text-gray-500"
                                                )}
                                            >
                                                {row.compliance}
                                            </span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <span
                                                className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    row.qcStatus === "PASS"
                                                        ? "bg-emerald-500/10 text-emerald-600"
                                                        : row.qcStatus === "FAIL"
                                                            ? "bg-red-500/10 text-red-600"
                                                            : "bg-gray-500/10 text-gray-500"
                                                )}
                                            >
                                                {row.qcStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </PremiumCard>

            {/* Audit History Timeline */}
            <PremiumCard
                title="Review History"
                subtitle="Audit trail of all review actions"
            >
                {auditLogs.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-6">
                        No review history yet
                    </p>
                ) : (
                    <div className="space-y-3">
                        {auditLogs.map((log, idx) => {
                            const actionConfig: Record<string, { icon: string; color: string }> = {
                                SUBMITTED: { icon: "send", color: "text-blue-500" },
                                APPROVED: { icon: "check_circle", color: "text-emerald-500" },
                                REJECTED: { icon: "cancel", color: "text-red-500" },
                                REVISION_REQUESTED: { icon: "edit_note", color: "text-amber-500" },
                            };
                            const config = actionConfig[log.action] || { icon: "info", color: "text-gray-500" };

                            return (
                                <div key={log.id} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <span className={cn("material-symbols-outlined text-[20px]", config.color)}>
                                            {config.icon}
                                        </span>
                                        {idx < auditLogs.length - 1 && (
                                            <div className="w-px h-full bg-border mt-1" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">{log.action}</span>
                                            <span className="text-xs text-text-tertiary">
                                                by {log.performed_by ? userMap[log.performed_by] || "Unknown" : "System"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-tertiary mt-0.5">
                                            {new Date(log.created_at).toLocaleString("id-ID")}
                                        </p>
                                        {log.notes && (
                                            <p className="text-sm text-text-secondary mt-1 bg-surface-secondary dark:bg-surface-dark rounded px-2 py-1">
                                                {log.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </PremiumCard>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
                <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-[18px]">block</span>
                    Reject / Return
                </button>
                <button
                    onClick={handleApprove}
                    disabled={!allRequiredPassed || isSubmitting}
                    className={cn(
                        "px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                        allRequiredPassed && !isSubmitting
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? (
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    )}
                    {isSubmitting ? "Processing..." : "Approve & Generate Report"}
                </button>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-red-500 text-2xl">report</span>
                            <div>
                                <h3 className="font-semibold text-lg">Reject Submission</h3>
                                <p className="text-sm text-text-secondary">
                                    This will return results to the analyst for revision
                                </p>
                            </div>
                        </div>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection..."
                            className="w-full h-28 px-3 py-2 rounded-lg border border-border bg-surface-secondary dark:bg-surface-dark text-sm resize-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectionReason(""); }}
                                className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-secondary dark:hover:bg-surface-dark"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || isSubmitting}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting && (
                                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                )}
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submitting overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 z-40 bg-black/10" />
            )}
        </div>
    );
}
