"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_RESULTS, MOCK_TASKS, MOCK_SUBMISSIONS, MOCK_USERS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

interface SmartReviewDetailProps {
    submissionId: string;
    onApprove: () => void;
    onReject: (reason: string) => void;
}

type Tab = "RESULTS" | "REVISIONS" | "HISTORY";

interface RevisionRequest {
    id: string;
    task_id: string;
    parameter_name: string;
    issue: string;
    requested_by: string;
    requested_at: Date;
    status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
    resolved_at?: Date;
    resolution_note?: string;
}

interface HistoryEntry {
    id: string;
    action: string;
    user: string;
    timestamp: Date;
    details?: string;
    version?: number;
}

export default function SmartReviewDetail({ submissionId, onApprove, onReject }: SmartReviewDetailProps) {
    const submission = MOCK_SUBMISSIONS.find(s => s.id === submissionId);

    const results = MOCK_RESULTS.filter(r => {
        const task = MOCK_TASKS.find(t => t.id === r.task_id);
        return task?.work_order_id === submission?.work_order_id;
    });

    const [activeTab, setActiveTab] = useState<Tab>("RESULTS");
    const [rejectReason, setRejectReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [newIssue, setNewIssue] = useState("");

    // Mock revision requests
    const [revisionRequests, setRevisionRequests] = useState<RevisionRequest[]>([
        {
            id: "rev-001",
            task_id: "task-001",
            parameter_name: "COD",
            issue: "QC recovery out of range (78%). Please recheck.",
            requested_by: "Technical Manager",
            requested_at: new Date(Date.now() - 86400000),
            status: "PENDING"
        }
    ]);

    // Mock history
    const history: HistoryEntry[] = useMemo(() => [
        { id: "h-001", action: "Submitted for Review", user: "Analyst Kimia", timestamp: new Date(Date.now() - 172800000), version: 1 },
        { id: "h-002", action: "Revision Requested", user: "Technical Manager", timestamp: new Date(Date.now() - 86400000), details: "COD QC out of range" },
        { id: "h-003", action: "Task Marked In Progress", user: "Analyst Kimia", timestamp: new Date(Date.now() - 43200000) },
        { id: "h-004", action: "Re-submitted for Review", user: "Analyst Kimia", timestamp: new Date(), version: 2 }
    ], []);

    const pendingRevisions = revisionRequests.filter(r => r.status !== "RESOLVED").length;

    const handleRequestRevision = () => {
        if (!selectedTaskId || !newIssue.trim()) return;
        const task = MOCK_TASKS.find(t => t.id === selectedTaskId);

        setRevisionRequests([...revisionRequests, {
            id: `rev-${Date.now()}`,
            task_id: selectedTaskId,
            parameter_name: task?.parameter_name_snapshot || "Unknown",
            issue: newIssue,
            requested_by: "Current User",
            requested_at: new Date(),
            status: "PENDING"
        }]);

        setNewIssue("");
        setSelectedTaskId(null);
    };

    const handleResolveRevision = (revId: string, note: string) => {
        setRevisionRequests(prev =>
            prev.map(r => r.id === revId ? {
                ...r,
                status: "RESOLVED" as const,
                resolved_at: new Date(),
                resolution_note: note
            } : r)
        );
    };

    const handleMarkInProgress = (revId: string) => {
        setRevisionRequests(prev =>
            prev.map(r => r.id === revId ? { ...r, status: "IN_PROGRESS" as const } : r)
        );
    };

    if (!submission) return <div>Submission not found</div>;

    const tabs: { key: Tab; label: string; count?: number }[] = [
        { key: "RESULTS", label: "Results" },
        { key: "REVISIONS", label: "Revisions", count: pendingRevisions },
        { key: "HISTORY", label: "History" }
    ];

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <PremiumCard title={`Review: ${submission.work_order_id}`} className="sticky top-4 z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-sm">
                            <span className="text-text-secondary">Analyst:</span>{" "}
                            <span className="font-semibold">Analyst Kimia</span>
                        </div>
                        {pendingRevisions > 0 && (
                            <span className="px-2 py-1 rounded-full bg-warning/20 text-warning text-xs font-bold">
                                {pendingRevisions} Pending Revision(s)
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {isRejecting ? (
                            <div className="flex gap-2 animate-in slide-in-from-right">
                                <input
                                    className="text-sm border rounded px-2 py-1 w-64"
                                    placeholder="Reason for rejection..."
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    onClick={() => onReject(rejectReason)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                    Confirm Reject
                                </button>
                                <button
                                    onClick={() => setIsRejecting(false)}
                                    className="px-3 py-1 bg-slate-200 rounded text-sm hover:bg-slate-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsRejecting(true)}
                                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                                >
                                    Request Revision
                                </button>
                                <button
                                    onClick={onApprove}
                                    disabled={pendingRevisions > 0}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Approve & Sign
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </PremiumCard>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg dark:bg-black/20">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                            activeTab === tab.key
                                ? "bg-white shadow text-primary dark:bg-surface-dark"
                                : "text-text-secondary hover:text-text-main"
                        )}
                    >
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-warning text-white text-[10px] font-bold">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Results Tab */}
            {activeTab === "RESULTS" && (
                <div className="space-y-4">
                    {results.map(res => {
                        const task = MOCK_TASKS.find(t => t.id === res.task_id);
                        const hasRevision = revisionRequests.some(r => r.task_id === res.task_id && r.status !== "RESOLVED");

                        return (
                            <div key={res.id} className={cn(
                                "bg-white dark:bg-surface-dark border rounded-lg p-4 shadow-sm flex items-center justify-between",
                                hasRevision ? "border-warning border-l-4" : "border-border-light"
                            )}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-lg">{task?.parameter_name_snapshot}</h4>
                                        <span className="text-xs text-text-secondary bg-slate-100 px-2 rounded">{task?.method_id_snapshot}</span>
                                        {hasRevision && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/20 text-warning">
                                                RECHECK PENDING
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div>
                                            <span className="text-text-secondary text-xs block">Result</span>
                                            <span className="font-mono font-semibold text-base">{res.numeric_value} <span className="text-xs text-text-secondary">mg/L</span></span>
                                        </div>
                                        <div>
                                            <span className="text-text-secondary text-xs block">Limit</span>
                                            <span className="text-text-secondary">{res.formatted_limit_text}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Traffic Lights */}
                                <div className="flex gap-4">
                                    <div className={cn(
                                        "px-3 py-1 rounded text-xs font-bold text-center w-24 border",
                                        res.compliance_status === "PASS" ? "bg-green-50 border-green-200 text-green-700" :
                                            res.compliance_status === "FAIL" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                    )}>
                                        <span className="block text-[10px] uppercase font-normal opacity-70">Compliance</span>
                                        {res.compliance_status}
                                    </div>

                                    <div className={cn(
                                        "px-3 py-1 rounded text-xs font-bold text-center w-24 border",
                                        res.qc_status === "PASS" ? "bg-blue-50 border-blue-200 text-blue-700" :
                                            res.qc_status === "FAIL" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                    )}>
                                        <span className="block text-[10px] uppercase font-normal opacity-70">QC Check</span>
                                        {res.qc_status} ({res.qc_recovery}%)
                                    </div>

                                    {/* Quick Revision Button */}
                                    <button
                                        onClick={() => setSelectedTaskId(res.task_id)}
                                        className="px-2 py-1 border border-border-light rounded text-xs text-text-secondary hover:text-warning hover:border-warning"
                                        title="Request revision for this result"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">flag</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Quick Revision Request Form */}
                    {selectedTaskId && (
                        <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
                            <h4 className="text-sm font-bold text-warning mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">flag</span>
                                Request Revision: {MOCK_TASKS.find(t => t.id === selectedTaskId)?.parameter_name_snapshot}
                            </h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Describe the issue..."
                                    value={newIssue}
                                    onChange={(e) => setNewIssue(e.target.value)}
                                    className="flex-1 text-sm border border-border-light rounded-md px-3 py-2 bg-white"
                                />
                                <button
                                    onClick={handleRequestRevision}
                                    disabled={!newIssue.trim()}
                                    className="px-4 py-2 bg-warning text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    Submit
                                </button>
                                <button
                                    onClick={() => setSelectedTaskId(null)}
                                    className="px-3 py-2 text-text-secondary hover:text-text-main"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Revisions Tab */}
            {activeTab === "REVISIONS" && (
                <PremiumCard title="Revision Requests" subtitle="Track and resolve pending revisions">
                    {revisionRequests.length === 0 ? (
                        <div className="text-center py-8 text-text-secondary">
                            <span className="material-symbols-outlined text-[48px] text-success/50">check_circle</span>
                            <p className="mt-2 text-sm">No revision requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {revisionRequests.map(rev => (
                                <div key={rev.id} className={cn(
                                    "p-4 rounded-lg border",
                                    rev.status === "RESOLVED" ? "border-success/30 bg-success/5" :
                                        rev.status === "IN_PROGRESS" ? "border-primary/30 bg-primary/5" :
                                            "border-warning/30 bg-warning/5"
                                )}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-text-main dark:text-white">{rev.parameter_name}</span>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                                    rev.status === "RESOLVED" ? "bg-success/20 text-success" :
                                                        rev.status === "IN_PROGRESS" ? "bg-primary/20 text-primary" :
                                                            "bg-warning/20 text-warning"
                                                )}>
                                                    {rev.status.replace("_", " ")}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-secondary">{rev.issue}</p>
                                            <p className="text-xs text-text-secondary mt-1">
                                                Requested by {rev.requested_by} • {rev.requested_at.toLocaleDateString()}
                                            </p>
                                            {rev.resolution_note && (
                                                <p className="text-xs text-success mt-2 italic">
                                                    ✓ {rev.resolution_note}
                                                </p>
                                            )}
                                        </div>
                                        {rev.status !== "RESOLVED" && (
                                            <div className="flex gap-2">
                                                {rev.status === "PENDING" && (
                                                    <button
                                                        onClick={() => handleMarkInProgress(rev.id)}
                                                        className="px-3 py-1.5 text-xs font-medium rounded bg-primary/10 text-primary hover:bg-primary/20"
                                                    >
                                                        Mark In Progress
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleResolveRevision(rev.id, "Issue corrected and verified")}
                                                    className="px-3 py-1.5 text-xs font-medium rounded bg-success text-white hover:bg-success/90"
                                                >
                                                    Resolve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PremiumCard>
            )}

            {/* History Tab */}
            {activeTab === "HISTORY" && (
                <PremiumCard title="Review History" subtitle="Complete audit trail for this submission">
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-light dark:bg-border-dark" />
                        <div className="space-y-4">
                            {history.map((entry, idx) => (
                                <div key={entry.id} className="relative pl-10">
                                    <div className={cn(
                                        "absolute left-2 w-4 h-4 rounded-full border-2 bg-white dark:bg-surface-dark",
                                        idx === history.length - 1 ? "border-primary" : "border-border-light dark:border-border-dark"
                                    )} />
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-black/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm text-text-main dark:text-white">
                                                {entry.action}
                                                {entry.version && (
                                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                                                        v{entry.version}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-xs text-text-secondary">
                                                {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary">By: {entry.user}</p>
                                        {entry.details && (
                                            <p className="text-xs text-text-secondary italic mt-1">{entry.details}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PremiumCard>
            )}
        </div>
    );
}
