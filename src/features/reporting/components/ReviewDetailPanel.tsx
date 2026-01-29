"use client";

import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { cn } from "@/lib/utils";

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    passed: boolean;
    required: boolean;
}

interface RevisionEntry {
    version: string;
    date: string;
    author: string;
    action: "SUBMITTED" | "APPROVED" | "REJECTED" | "REVISED";
    note: string;
}

interface Props {
    workOrderId: string;
    onApprove?: () => void;
    onReject?: (reason: string) => void;
}

export default function ReviewDetailPanel({ workOrderId, onApprove, onReject }: Props) {
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDraftPreview, setShowDraftPreview] = useState(false);

    // Automated checklist items for Smart Review
    const [checklist] = useState<ChecklistItem[]>([
        { id: "1", label: "All tests finalized", description: "All assigned test tasks have results entered", passed: true, required: true },
        { id: "2", label: "QC criteria met", description: "Control chart values within limits", passed: true, required: true },
        { id: "3", label: "No QC flags", description: "No exceedance alerts on any parameter", passed: false, required: false },
        { id: "4", label: "Raw data attached", description: "Chromatograms and instrument data linked", passed: true, required: true },
        { id: "5", label: "Metadata complete", description: "Sample info, analyst, timestamps recorded", passed: true, required: true },
        { id: "6", label: "Method validation", description: "Correct methods applied per matrix", passed: true, required: true },
    ]);

    // Revision history
    const [revisions] = useState<RevisionEntry[]>([
        { version: "v1.0", date: "2024-01-25 09:00", author: "Analyst A", action: "SUBMITTED", note: "Initial results submitted" },
        { version: "v1.0", date: "2024-01-25 14:30", author: "Manager B", action: "REJECTED", note: "pH value needs verification - check calibration" },
        { version: "v1.1", date: "2024-01-25 16:00", author: "Analyst A", action: "REVISED", note: "Recalibrated and re-tested pH" },
        { version: "v1.1", date: "2024-01-26 10:00", author: "Manager B", action: "SUBMITTED", note: "Re-submitted for approval" },
    ]);

    const passedRequired = checklist.filter(c => c.required && c.passed).length;
    const totalRequired = checklist.filter(c => c.required).length;
    const allRequiredPassed = passedRequired === totalRequired;

    const handleApprove = () => {
        if (!allRequiredPassed) return;
        onApprove?.();
    };

    const handleReject = () => {
        if (rejectionReason.trim()) {
            onReject?.(rejectionReason);
            setShowRejectModal(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Automated Checklist */}
            <PremiumCard
                title="Smart Review Checklist"
                subtitle={`${passedRequired}/${totalRequired} required checks passed`}
                action={
                    <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-bold",
                        allRequiredPassed
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                    )}>
                        {allRequiredPassed ? "READY" : "PENDING"}
                    </span>
                }
            >
                <div className="space-y-2">
                    {checklist.map(item => (
                        <div
                            key={item.id}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                item.passed
                                    ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10"
                                    : item.required
                                        ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10"
                                        : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-900/10"
                            )}
                        >
                            <span className={cn(
                                "material-symbols-outlined text-[20px]",
                                item.passed ? "text-green-600" : item.required ? "text-red-500" : "text-amber-500"
                            )}>
                                {item.passed ? "check_circle" : item.required ? "error" : "warning"}
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-text-main dark:text-white">
                                    {item.label}
                                    {item.required && <span className="text-danger ml-1">*</span>}
                                </p>
                                <p className="text-xs text-text-secondary">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </PremiumCard>

            {/* Revision History Timeline */}
            <PremiumCard title="Revision History">
                <div className="space-y-4">
                    {revisions.map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center">
                                <div className={cn(
                                    "w-3 h-3 rounded-full mt-1",
                                    entry.action === "APPROVED" ? "bg-green-500" :
                                        entry.action === "REJECTED" ? "bg-red-500" :
                                            entry.action === "REVISED" ? "bg-blue-500" :
                                                "bg-slate-400"
                                )} />
                                {idx < revisions.length - 1 && (
                                    <div className="w-0.5 flex-1 min-h-[40px] bg-slate-200 dark:bg-slate-700" />
                                )}
                            </div>
                            {/* Content */}
                            <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-text-main dark:text-white">
                                        {entry.version}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                        entry.action === "APPROVED" ? "bg-green-100 text-green-700" :
                                            entry.action === "REJECTED" ? "bg-red-100 text-red-700" :
                                                entry.action === "REVISED" ? "bg-blue-100 text-blue-700" :
                                                    "bg-slate-100 text-slate-600"
                                    )}>
                                        {entry.action}
                                    </span>
                                </div>
                                <p className="text-sm text-text-main dark:text-white mt-1">{entry.note}</p>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                    {entry.author} • {entry.date}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </PremiumCard>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => setShowDraftPreview(true)}
                    className="flex-1 py-3 border border-border-light rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 dark:border-border-dark dark:hover:bg-white/5"
                >
                    <span className="material-symbols-outlined text-[18px]">preview</span>
                    Preview Draft CoA
                </button>
                <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-6 py-3 border border-danger text-danger rounded-lg text-sm font-bold hover:bg-danger/10"
                >
                    Reject
                </button>
                <button
                    onClick={handleApprove}
                    disabled={!allRequiredPassed}
                    className={cn(
                        "px-6 py-3 rounded-lg text-sm font-bold text-white flex items-center gap-2 shadow-lg",
                        allRequiredPassed
                            ? "bg-success hover:bg-success/90"
                            : "bg-slate-300 cursor-not-allowed"
                    )}
                >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Approve
                </button>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600">undo</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main dark:text-white">
                                    Reject & Request Revision
                                </h3>
                                <p className="text-sm text-text-secondary">
                                    WO: {workOrderId}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-text-main dark:text-white block mb-1">
                                    Reason for Rejection *
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    placeholder="Specify which results need revision and why..."
                                    className="w-full border border-border-light rounded-lg p-3 text-sm dark:border-border-dark dark:bg-background-dark resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 px-4 py-2 text-text-secondary hover:text-text-main"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim()}
                                className="flex-1 px-4 py-2 bg-danger text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                Submit Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Draft Preview Modal (placeholder) */}
            {showDraftPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-4xl h-[80vh] shadow-xl flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-main dark:text-white">
                                Draft CoA Preview
                            </h3>
                            <button
                                onClick={() => setShowDraftPreview(false)}
                                className="text-text-secondary hover:text-text-main"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-lg flex items-center justify-center dark:bg-black/20">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-[64px] text-slate-300">description</span>
                                <p className="text-sm text-text-secondary mt-2">
                                    PDF Preview would render here
                                </p>
                                <p className="text-xs text-text-secondary">
                                    (Connects to CoAPreview component)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
