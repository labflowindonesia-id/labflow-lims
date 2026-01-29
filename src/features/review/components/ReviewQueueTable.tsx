"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_SUBMISSIONS, MOCK_TASKS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ReviewStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";

interface RevisionEntry {
    id: string;
    submissionId: string;
    version: number;
    reason: string;
    requestedBy: string;
    timestamp: Date;
}

export default function ReviewQueueTable() {
    const [filterStatus, setFilterStatus] = useState<ReviewStatus | "">("");
    const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [revisions, setRevisions] = useState<RevisionEntry[]>([]);

    // Approval state
    const [approvalStates, setApprovalStates] = useState<Record<string, {
        status: ReviewStatus;
        notes: string;
        signedAt?: Date;
    }>>({});

    // Modal state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [revisionReason, setRevisionReason] = useState("");

    // Submissions with enhanced data
    const submissions = useMemo(() =>
        MOCK_SUBMISSIONS.map(sub => {
            const sampleName = MOCK_TASKS.find(t => t.sample_id === sub.sample_id)?.sample_name_snapshot || "Unknown Sample";
            const taskCount = MOCK_TASKS.filter(t => t.sample_id === sub.sample_id).length;
            const completedTasks = Math.floor(taskCount * 0.8); // Mock 80% complete
            const state = approvalStates[sub.id];
            return {
                ...sub,
                sampleName,
                taskCount,
                completedTasks,
                completionPercent: taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0,
                status: state?.status || "PENDING_REVIEW",
                notes: state?.notes || "",
                signedAt: state?.signedAt
            };
        }), [approvalStates]
    );

    // Apply filters
    const filteredSubmissions = useMemo(() => {
        let result = [...submissions];

        if (filterStatus) {
            result = result.filter(s => s.status === filterStatus);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.sampleName.toLowerCase().includes(q) ||
                s.work_order_id.toLowerCase().includes(q)
            );
        }

        return result;
    }, [submissions, filterStatus, searchQuery]);

    const selectedData = submissions.find(s => s.id === selectedSubmission);
    const submissionRevisions = revisions.filter(r => r.submissionId === selectedSubmission);

    const handleApprove = () => {
        if (!selectedSubmission) return;
        setApprovalStates(prev => ({
            ...prev,
            [selectedSubmission]: {
                status: "APPROVED",
                notes: "Approved by Technical Manager",
                signedAt: new Date()
            }
        }));
        setSelectedSubmission(null);
    };

    const handleReject = () => {
        if (!selectedSubmission || !rejectReason.trim()) return;
        setApprovalStates(prev => ({
            ...prev,
            [selectedSubmission]: {
                status: "REJECTED",
                notes: rejectReason,
            }
        }));
        setShowRejectModal(false);
        setRejectReason("");
        setSelectedSubmission(null);
    };

    const handleRequestRevision = () => {
        if (!selectedSubmission || !revisionReason.trim()) return;

        const newRevision: RevisionEntry = {
            id: `rev-${Date.now()}`,
            submissionId: selectedSubmission,
            version: submissionRevisions.length + 1,
            reason: revisionReason,
            requestedBy: "Technical Manager",
            timestamp: new Date()
        };
        setRevisions([...revisions, newRevision]);

        setApprovalStates(prev => ({
            ...prev,
            [selectedSubmission]: {
                status: "REVISION_REQUESTED",
                notes: revisionReason,
            }
        }));
        setRevisionReason("");
    };

    const statusColors: Record<ReviewStatus, string> = {
        PENDING_REVIEW: "bg-warning/20 text-warning",
        APPROVED: "bg-success/20 text-success",
        REJECTED: "bg-danger/20 text-danger",
        REVISION_REQUESTED: "bg-primary/20 text-primary"
    };

    const revisionReasonOptions = [
        "Incomplete test results",
        "Missing raw data attachment",
        "QC recovery out of range",
        "Method deviation not documented",
        "Sample metadata incorrect",
        "Calculation error detected"
    ];

    const statusCounts = {
        PENDING_REVIEW: submissions.filter(s => s.status === "PENDING_REVIEW").length,
        APPROVED: submissions.filter(s => s.status === "APPROVED").length,
        REJECTED: submissions.filter(s => s.status === "REJECTED").length,
        REVISION_REQUESTED: submissions.filter(s => s.status === "REVISION_REQUESTED").length,
    };

    return (
        <div className="space-y-4">
            <PremiumCard
                title="Review Queue"
                subtitle="Review and sign-off on analytical results"
                action={
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-warning/20 text-warning font-bold">{statusCounts.PENDING_REVIEW} Pending</span>
                        <span className="px-2 py-0.5 rounded bg-success/20 text-success font-bold">{statusCounts.APPROVED} Approved</span>
                    </div>
                }
            >
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border-light dark:border-border-dark">
                    {/* Search */}
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-background-dark">
                        <span className="material-symbols-outlined text-[18px] text-text-secondary">search</span>
                        <input
                            type="text"
                            placeholder="Search sample or work order..."
                            className="w-full min-w-[150px] bg-transparent text-sm text-text-main placeholder:text-text-secondary focus:outline-none dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter Pills */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus("")}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                !filterStatus ? "bg-primary text-white" : "bg-slate-100 text-text-secondary hover:bg-slate-200 dark:bg-white/10"
                            )}
                        >
                            All
                        </button>
                        {(["PENDING_REVIEW", "APPROVED", "REJECTED", "REVISION_REQUESTED"] as ReviewStatus[]).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                    filterStatus === status ? statusColors[status] : "bg-slate-100 text-text-secondary hover:bg-slate-200 dark:bg-white/10"
                                )}
                            >
                                {status.replace(/_/g, " ")}
                            </button>
                        ))}
                    </div>
                </div>

                <DenseTable
                    data={filteredSubmissions}
                    keyExtractor={s => s.id}
                    onRowClick={(row) => setSelectedSubmission(row.id)}
                    columns={[
                        {
                            header: "Work Order",
                            accessorKey: "work_order_id",
                            className: "font-mono",
                            cell: s => (
                                <div className="flex items-center gap-2">
                                    {selectedSubmission === s.id && (
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    )}
                                    {s.work_order_id}
                                </div>
                            )
                        },
                        { header: "Sample", accessorKey: "sampleName", className: "font-medium" },
                        {
                            header: "Completion",
                            accessorKey: "completionPercent",
                            cell: s => (
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                s.completionPercent === 100 ? "bg-success" : "bg-primary"
                                            )}
                                            style={{ width: `${s.completionPercent}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-text-secondary">{s.completionPercent}%</span>
                                </div>
                            )
                        },
                        {
                            header: "QC Status",
                            accessorKey: "qc_failure_count",
                            cell: (s) => (
                                <span className={cn(
                                    "text-xs font-bold px-2 py-0.5 rounded-full flex w-fit items-center gap-1",
                                    s.qc_failure_count > 0
                                        ? "bg-danger/20 text-danger"
                                        : "bg-success/20 text-success"
                                )}>
                                    {s.qc_failure_count > 0 ? (
                                        <><span className="material-symbols-outlined text-[12px]">warning</span> {s.qc_failure_count} Alert(s)</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-[12px]">check_circle</span> Clean</>
                                    )}
                                </span>
                            )
                        },
                        {
                            header: "Status",
                            accessorKey: "status",
                            cell: s => (
                                <span className={cn("text-xs font-bold px-2 py-0.5 rounded", statusColors[s.status])}>
                                    {s.status.replace(/_/g, " ")}
                                </span>
                            )
                        },
                        {
                            header: "Revisions",
                            accessorKey: "id",
                            cell: s => {
                                const count = revisions.filter(r => r.submissionId === s.id).length;
                                return count > 0 ? (
                                    <span className="text-xs text-primary font-medium">v{count + 1}</span>
                                ) : (
                                    <span className="text-xs text-text-secondary">v1</span>
                                );
                            }
                        }
                    ]}
                    className="border-0"
                />

                {filteredSubmissions.length === 0 && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-[48px] text-text-secondary/50">inbox</span>
                        <p className="mt-2 text-sm font-medium text-text-main dark:text-white">No submissions found</p>
                    </div>
                )}
            </PremiumCard>

            {/* Detail Panel */}
            {selectedData && (
                <PremiumCard
                    title={`Review: ${selectedData.sampleName}`}
                    subtitle={selectedData.work_order_id}
                    action={
                        <button onClick={() => setSelectedSubmission(null)} className="text-text-secondary hover:text-text-main">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    }
                    className={cn(
                        "border-l-4",
                        selectedData.status === "APPROVED" ? "border-l-success" :
                            selectedData.status === "REJECTED" ? "border-l-danger" : "border-l-primary"
                    )}
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Checklist */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-text-main dark:text-white">Review Checklist</h4>
                            <div className="space-y-2">
                                {[
                                    { label: "All tests completed", checked: selectedData.completionPercent === 100 },
                                    { label: "No QC failures", checked: selectedData.qc_failure_count === 0 },
                                    { label: "Raw data attached", checked: true },
                                    { label: "Metadata complete", checked: true },
                                    { label: "Method deviations documented", checked: true },
                                ].map((item, i) => (
                                    <div key={i} className={cn(
                                        "flex items-center gap-2 p-2 rounded",
                                        item.checked ? "bg-success/10" : "bg-danger/10"
                                    )}>
                                        <span className={cn(
                                            "material-symbols-outlined text-[16px]",
                                            item.checked ? "text-success" : "text-danger"
                                        )}>
                                            {item.checked ? "check_circle" : "cancel"}
                                        </span>
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Revision History */}
                            {submissionRevisions.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                                    <h4 className="text-sm font-bold text-text-main dark:text-white mb-2">Revision History</h4>
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                        {submissionRevisions.map(rev => (
                                            <div key={rev.id} className="p-2 rounded bg-primary/5 border border-primary/20 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="font-bold">Revision v{rev.version + 1}</span>
                                                    <span className="text-text-secondary">{rev.timestamp.toLocaleString()}</span>
                                                </div>
                                                <p className="text-text-secondary mt-1">{rev.reason}</p>
                                                <p className="text-text-secondary italic">By: {rev.requestedBy}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-text-main dark:text-white">Actions</h4>

                            {selectedData.status === "APPROVED" ? (
                                <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
                                    <span className="material-symbols-outlined text-success text-[32px]">verified</span>
                                    <p className="text-sm font-bold text-success mt-2">Approved & Signed</p>
                                    <p className="text-xs text-text-secondary">
                                        {selectedData.signedAt?.toLocaleString()}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Request Revision */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-main dark:text-white">Request Revision</label>
                                        <div className="flex flex-wrap gap-2">
                                            {revisionReasonOptions.map(reason => (
                                                <button
                                                    key={reason}
                                                    onClick={() => setRevisionReason(reason)}
                                                    className={cn(
                                                        "px-2 py-1 text-xs rounded border transition-colors",
                                                        revisionReason === reason
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-border-light hover:border-primary/50 dark:border-border-dark"
                                                    )}
                                                >
                                                    {reason}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleRequestRevision}
                                            disabled={!revisionReason}
                                            className="w-full px-3 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 disabled:opacity-50"
                                        >
                                            Request Revision
                                        </button>
                                    </div>

                                    {/* Approve / Reject */}
                                    <div className="flex gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            className="flex-1 px-4 py-2 border border-danger text-danger rounded-lg text-sm font-medium hover:bg-danger/10"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            className="flex-1 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/80"
                                        >
                                            Approve & Sign
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </PremiumCard>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-surface-dark rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Reject Submission</h3>
                        <textarea
                            className="w-full border border-border-light rounded-lg p-3 text-sm dark:border-border-dark dark:bg-background-dark"
                            rows={4}
                            placeholder="Enter rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 px-4 py-2 text-text-secondary hover:text-text-main"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim()}
                                className="flex-1 px-4 py-2 bg-danger text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
