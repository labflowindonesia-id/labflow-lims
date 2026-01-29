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

            {/* Draft CoA Preview Modal - Full Featured */}
            {showDraftPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-4xl h-[85vh] shadow-xl flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-blue-600">picture_as_pdf</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main dark:text-white">
                                        Draft CoA Preview
                                    </h3>
                                    <p className="text-xs text-text-secondary">
                                        WO: {workOrderId} • Review before approval
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-main flex items-center gap-1 border border-border-light rounded-lg hover:bg-slate-50"
                                >
                                    <span className="material-symbols-outlined text-[16px]">print</span>
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowDraftPreview(false)}
                                    className="p-1.5 text-text-secondary hover:text-text-main hover:bg-slate-100 rounded-lg"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* PDF Preview Container with Watermark */}
                        <div className="flex-1 overflow-auto bg-slate-100 rounded-lg p-6 dark:bg-black/20 relative">
                            {/* Watermark Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="transform rotate-[-30deg] text-red-500/20 font-black text-[80px] tracking-widest whitespace-nowrap select-none">
                                    DRAFT - NOT FINAL
                                </div>
                            </div>

                            {/* CoA Document Content */}
                            <div className="bg-white rounded-lg shadow-lg p-8 relative z-0 max-w-3xl mx-auto">
                                {/* Header */}
                                <div className="border-b-2 border-primary pb-4 mb-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h1 className="text-2xl font-bold text-primary">LabFlow Testing Laboratory</h1>
                                            <p className="text-sm text-text-secondary">ISO/IEC 17025:2017 Accredited</p>
                                            <p className="text-xs text-text-secondary mt-1">Jl. Lab Utama No. 123, Jakarta</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-danger bg-danger/10 px-2 py-1 rounded font-bold mb-2">
                                                DRAFT PREVIEW
                                            </div>
                                            <p className="text-sm font-bold">Report: RPT-2024-{workOrderId.slice(-4)}</p>
                                            <p className="text-xs text-text-secondary">Version: R01 (Draft)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sample Info */}
                                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                    <div>
                                        <p className="text-text-secondary">Customer</p>
                                        <p className="font-medium">PT Maju Jaya Industries</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Sample Name</p>
                                        <p className="font-medium">Inlet Water - Process Unit A</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Received Date</p>
                                        <p className="font-medium">2024-01-25</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Analysis Date</p>
                                        <p className="font-medium">2024-01-26</p>
                                    </div>
                                </div>

                                {/* Test Results Table */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-text-main mb-3 border-b pb-2">TEST RESULTS</h3>
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium">Parameter</th>
                                                <th className="px-3 py-2 text-center font-medium">Result</th>
                                                <th className="px-3 py-2 text-center font-medium">Unit</th>
                                                <th className="px-3 py-2 text-center font-medium">Method</th>
                                                <th className="px-3 py-2 text-center font-medium">Limit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="px-3 py-2">pH</td>
                                                <td className="px-3 py-2 text-center font-mono">7.2</td>
                                                <td className="px-3 py-2 text-center">-</td>
                                                <td className="px-3 py-2 text-center text-xs">APHA 4500-H⁺</td>
                                                <td className="px-3 py-2 text-center text-xs">6.0 - 9.0</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-3 py-2">BOD₅</td>
                                                <td className="px-3 py-2 text-center font-mono">45</td>
                                                <td className="px-3 py-2 text-center">mg/L</td>
                                                <td className="px-3 py-2 text-center text-xs">APHA 5210B</td>
                                                <td className="px-3 py-2 text-center text-xs">&lt;50</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-3 py-2">COD</td>
                                                <td className="px-3 py-2 text-center font-mono">98</td>
                                                <td className="px-3 py-2 text-center">mg/L</td>
                                                <td className="px-3 py-2 text-center text-xs">APHA 5220B</td>
                                                <td className="px-3 py-2 text-center text-xs">&lt;100</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-3 py-2">TSS</td>
                                                <td className="px-3 py-2 text-center font-mono">28</td>
                                                <td className="px-3 py-2 text-center">mg/L</td>
                                                <td className="px-3 py-2 text-center text-xs">APHA 2540D</td>
                                                <td className="px-3 py-2 text-center text-xs">&lt;50</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* QC Summary */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-blue-600 text-[18px]">verified</span>
                                        <span className="text-sm font-bold text-blue-800">QC Summary</span>
                                    </div>
                                    <p className="text-xs text-blue-700">
                                        All control standards within acceptance limits. Duplicate analysis RPD: 3.2% (limit: &lt;20%).
                                        Spike recovery: 98.5% (acceptance: 80-120%).
                                    </p>
                                </div>

                                {/* Footer Note */}
                                <div className="text-[10px] text-text-secondary border-t pt-4">
                                    <p>* Results apply only to the sample(s) tested.</p>
                                    <p>* This is a DRAFT document - NOT FOR OFFICIAL USE.</p>
                                    <p className="mt-2 font-bold text-danger">
                                        WATERMARKED DRAFT - Pending Manager Approval
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between pt-4 border-t mt-4">
                            <span className="text-xs text-text-secondary flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                This is a preview only. Final CoA will be generated after approval.
                            </span>
                            <button
                                onClick={() => setShowDraftPreview(false)}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
