"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { MOCK_QUOTATIONS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

interface QuotationDetailProps {
    id: string;
}

// Contract Review Checklist Items
interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    checked: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
    { id: "capability", label: "Laboratory Capability", description: "Lab has required equipment and accreditation for all tests", checked: false },
    { id: "matrix", label: "Matrix Compatibility", description: "Sample matrix is compatible with selected methods", checked: false },
    { id: "deadline", label: "Deadline Realistic", description: "Requested turnaround time is achievable", checked: false },
    { id: "pricing", label: "Pricing Correct", description: "Pricing matches current price list and any agreements", checked: false },
    { id: "decision_rule", label: "Decision Rule Agreed", description: "Customer's decision rule for pass/fail is documented", checked: false },
];

export default function QuotationDetailView({ id }: QuotationDetailProps) {
    const quotation = MOCK_QUOTATIONS.find(q => q.id === id);

    // State for contract review
    const [actionStatus, setActionStatus] = useState<"IDLE" | "APPROVED" | "REJECTED">("IDLE");
    const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
    const [reviewNotes, setReviewNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionModal, setShowRejectionModal] = useState(false);

    if (!quotation) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-[64px] text-text-secondary/50">search_off</span>
                <p className="mt-4 text-lg font-medium text-text-main dark:text-white">Quotation not found</p>
                <p className="text-sm text-text-secondary">The requested quotation does not exist.</p>
                <Link href="/quotations" className="mt-4 text-primary hover:underline">
                    ← Back to List
                </Link>
            </div>
        );
    }

    // Check if all checklist items are complete
    const allChecked = checklist.every(item => item.checked);
    const checkedCount = checklist.filter(item => item.checked).length;

    const handleCheckItem = (itemId: string) => {
        setChecklist(prev => prev.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        ));
    };

    const handleApprove = () => {
        if (!allChecked) {
            alert("Please complete all checklist items before approving.");
            return;
        }
        setActionStatus("APPROVED");
        console.log("APPROVED:", { id, checklist, reviewNotes });
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            alert("Please provide a rejection reason.");
            return;
        }
        setActionStatus("REJECTED");
        setShowRejectionModal(false);
        console.log("REJECTED:", { id, rejectionReason });
    };

    // Mock expiry date
    const expiryDate = new Date(quotation.created_at);
    expiryDate.setDate(expiryDate.getDate() + 30);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content: Info & Line Items */}
            <div className="lg:col-span-2 space-y-6">
                {/* Quotation Header */}
                <PremiumCard title={`Quotation ${quotation.quotation_no}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                        <div>
                            <p className="text-text-secondary">Customer</p>
                            <p className="font-semibold text-text-main dark:text-white">{quotation.customer_name_snapshot}</p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Created Date</p>
                            <p className="font-medium text-text-main dark:text-white">{new Date(quotation.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Valid Until</p>
                            <p className="font-medium text-text-main dark:text-white">{expiryDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Status</p>
                            <span className={cn(
                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                actionStatus !== "IDLE"
                                    ? (actionStatus === "APPROVED" ? "bg-green-100 text-green-700 ring-green-200" : "bg-red-100 text-red-700 ring-red-200")
                                    : (quotation.status === "APPROVED" ? "bg-green-100 text-green-700 ring-green-200" :
                                        quotation.status === "SUBMITTED" ? "bg-blue-100 text-blue-700 ring-blue-200" :
                                            quotation.status === "REJECTED" ? "bg-red-100 text-red-700 ring-red-200" :
                                                "bg-slate-100 text-slate-700 ring-slate-200")
                            )}>
                                {actionStatus !== "IDLE" ? actionStatus : quotation.status}
                            </span>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="rounded-lg border border-border-light overflow-hidden dark:border-border-dark">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-background-light text-text-secondary dark:bg-black/20">
                                <tr>
                                    <th className="px-4 py-2 border-b border-border-light dark:border-border-dark">Test Parameter</th>
                                    <th className="px-4 py-2 border-b border-border-light text-center dark:border-border-dark">Method</th>
                                    <th className="px-4 py-2 border-b border-border-light text-right dark:border-border-dark">Qty</th>
                                    <th className="px-4 py-2 border-b border-border-light text-right dark:border-border-dark">Unit Price</th>
                                    <th className="px-4 py-2 border-b border-border-light text-right dark:border-border-dark">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {/* Mock Line Items */}
                                <tr className="hover:bg-primary/5">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-text-main dark:text-white">COD (Chemical Oxygen Demand)</span>
                                        <span className="block text-xs text-text-secondary">Water Sample</span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs">SNI 6989.2:2019</td>
                                    <td className="px-4 py-3 text-right tabular-nums">5</td>
                                    <td className="px-4 py-3 text-right tabular-nums">75,000</td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">375,000</td>
                                </tr>
                                <tr className="hover:bg-primary/5">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-text-main dark:text-white">pH Analysis</span>
                                        <span className="block text-xs text-text-secondary">Water Sample</span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs">SNI 06-6989.11</td>
                                    <td className="px-4 py-3 text-right tabular-nums">5</td>
                                    <td className="px-4 py-3 text-right tabular-nums">25,000</td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">125,000</td>
                                </tr>
                                <tr className="hover:bg-primary/5">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-text-main dark:text-white">BOD5</span>
                                        <span className="block text-xs text-text-secondary">Water Sample</span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs">SNI 6989.72:2009</td>
                                    <td className="px-4 py-3 text-right tabular-nums">5</td>
                                    <td className="px-4 py-3 text-right tabular-nums">150,000</td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">750,000</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-medium">
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-right border-t border-border-light dark:border-border-dark">Subtotal</td>
                                    <td className="px-4 py-2 text-right border-t border-border-light tabular-nums dark:border-border-dark">1,250,000</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-right">PPN (11%)</td>
                                    <td className="px-4 py-2 text-right tabular-nums">137,500</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-right text-base font-bold text-text-main dark:text-white">Total</td>
                                    <td className="px-4 py-2 text-right text-base font-bold text-primary tabular-nums">IDR {quotation.total_amount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </PremiumCard>

                {/* Contract Review Checklist */}
                {quotation.status === "SUBMITTED" && actionStatus === "IDLE" && (
                    <PremiumCard
                        title="Contract Review Checklist"
                        subtitle="Complete all items before approval"
                    >
                        <div className="space-y-3">
                            {checklist.map(item => (
                                <label
                                    key={item.id}
                                    className={cn(
                                        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                                        item.checked
                                            ? "border-success/30 bg-success/5"
                                            : "border-border-light hover:border-primary/30 dark:border-border-dark"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleCheckItem(item.id)}
                                        className="mt-1 h-4 w-4 rounded border-border-light text-success focus:ring-success"
                                    />
                                    <div className="flex-1">
                                        <span className={cn(
                                            "text-sm font-medium",
                                            item.checked ? "text-success" : "text-text-main dark:text-white"
                                        )}>
                                            {item.label}
                                        </span>
                                        <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                                    </div>
                                    {item.checked && (
                                        <span className="material-symbols-outlined text-success text-[20px]">check_circle</span>
                                    )}
                                </label>
                            ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                                <span>Review Progress</span>
                                <span>{checkedCount}/{checklist.length} Complete</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className={cn(
                                        "h-2 rounded-full transition-all",
                                        allChecked ? "bg-success" : "bg-primary"
                                    )}
                                    style={{ width: `${(checkedCount / checklist.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </PremiumCard>
                )}

                {/* Review Notes */}
                {quotation.status === "SUBMITTED" && actionStatus === "IDLE" && (
                    <PremiumCard title="Review Notes">
                        <textarea
                            className="w-full rounded-lg border border-border-light p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:bg-white/5 dark:border-white/10"
                            rows={3}
                            placeholder="Add any notes about this review (optional)..."
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                        />
                    </PremiumCard>
                )}
            </div>

            {/* Sidebar: Actions */}
            <div className="space-y-6">
                <PremiumCard title="Approval Actions">
                    {quotation.status === "SUBMITTED" && actionStatus === "IDLE" ? (
                        <div className="flex flex-col gap-3">
                            <div className={cn(
                                "rounded-lg p-3 text-sm",
                                allChecked
                                    ? "bg-success/10 border border-success/20 text-success"
                                    : "bg-warning/10 border border-warning/20 text-warning"
                            )}>
                                {allChecked ? (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                        <span>All checklist items verified</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">warning</span>
                                        <span>{checklist.length - checkedCount} item(s) remaining</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleApprove}
                                disabled={!allChecked}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow transition-all",
                                    allChecked
                                        ? "bg-success hover:bg-success/90 cursor-pointer"
                                        : "bg-slate-300 cursor-not-allowed"
                                )}
                            >
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                Approve Quotation
                            </button>
                            <button
                                onClick={() => setShowRejectionModal(true)}
                                className="w-full flex items-center justify-center gap-2 rounded-lg border border-danger/30 bg-white px-4 py-2.5 text-sm font-bold text-danger shadow-sm hover:bg-danger/5 dark:bg-surface-dark"
                            >
                                <span className="material-symbols-outlined text-[18px]">block</span>
                                Reject & Return
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            {(actionStatus === "APPROVED" || quotation.status === "APPROVED") ? (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-success mb-2">verified</span>
                                    <p className="font-bold text-success">Approved</p>
                                    <p className="text-xs text-text-secondary mt-1">Ready for sample receiving</p>
                                    <button className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
                                        Generate PDF
                                    </button>
                                </>
                            ) : actionStatus === "REJECTED" || quotation.status === "REJECTED" ? (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-danger mb-2">cancel</span>
                                    <p className="font-bold text-danger">Rejected</p>
                                    <p className="text-xs text-text-secondary mt-1">Returned to creator for revision</p>
                                    {rejectionReason && (
                                        <div className="mt-3 p-2 rounded bg-danger/5 border border-danger/20 text-xs text-danger text-left w-full">
                                            <strong>Reason:</strong> {rejectionReason}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">lock</span>
                                    <p className="font-medium text-slate-500">Read Only</p>
                                    <p className="text-xs text-slate-400 mt-1">This quotation is {quotation.status.toLowerCase()}.</p>
                                </>
                            )}
                        </div>
                    )}
                </PremiumCard>

                {/* Quick Info Card */}
                <PremiumCard title="Quick Info">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Quote No</span>
                            <span className="font-mono font-medium text-text-main dark:text-white">{quotation.quotation_no}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Created</span>
                            <span className="text-text-main dark:text-white">{new Date(quotation.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Valid Until</span>
                            <span className="text-text-main dark:text-white">{expiryDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Total</span>
                            <span className="font-bold text-primary">IDR {quotation.total_amount.toLocaleString()}</span>
                        </div>
                    </div>
                </PremiumCard>

                {/* Version History */}
                <PremiumCard title="Version History">
                    <div className="space-y-3">
                        {[
                            { version: "v1.0", date: quotation.created_at, author: "Admin User", status: "DRAFT", note: "Initial draft created" },
                            ...(quotation.status !== "DRAFT" ? [
                                { version: "v1.0", date: new Date(new Date(quotation.created_at).getTime() + 86400000).toISOString(), author: "Admin User", status: "SUBMITTED", note: "Submitted for review" }
                            ] : []),
                            ...(quotation.status === "APPROVED" || actionStatus === "APPROVED" ? [
                                { version: "v1.0", date: new Date().toISOString(), author: "Manager", status: "APPROVED", note: "Contract approved" }
                            ] : []),
                            ...(quotation.status === "REJECTED" || actionStatus === "REJECTED" ? [
                                { version: "v1.0", date: new Date().toISOString(), author: "Manager", status: "REJECTED", note: rejectionReason || "Returned for revision" }
                            ] : []),
                        ].map((entry, idx, arr) => (
                            <div key={idx} className="flex items-start gap-3">
                                {/* Timeline dot */}
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "w-2.5 h-2.5 rounded-full mt-1.5",
                                        entry.status === "APPROVED" ? "bg-success" :
                                            entry.status === "REJECTED" ? "bg-danger" :
                                                entry.status === "SUBMITTED" ? "bg-blue-500" :
                                                    "bg-slate-300"
                                    )} />
                                    {idx < arr.length - 1 && (
                                        <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700" />
                                    )}
                                </div>
                                {/* Content */}
                                <div className="flex-1 -mt-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-medium text-text-main dark:text-white">{entry.version}</span>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-bold",
                                            entry.status === "APPROVED" ? "bg-green-100 text-green-700" :
                                                entry.status === "REJECTED" ? "bg-red-100 text-red-700" :
                                                    entry.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                                                        "bg-slate-100 text-slate-600"
                                        )}>{entry.status}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-0.5">{entry.note}</p>
                                    <p className="text-[10px] text-text-secondary/70 mt-0.5">
                                        {entry.author} • {new Date(entry.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </PremiumCard>

                <Link href="/quotations">
                    <button className="w-full text-sm text-text-secondary hover:text-primary">
                        ← Back to List
                    </button>
                </Link>
            </div>

            {/* Rejection Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-surface-dark">
                        <h3 className="text-lg font-bold text-text-main dark:text-white">Reject Quotation</h3>
                        <p className="mt-2 text-sm text-text-secondary">
                            Please provide a reason for rejection. This will be sent to the quotation creator.
                        </p>
                        <textarea
                            className="mt-4 w-full rounded-lg border border-border-light p-3 text-sm focus:ring-2 focus:ring-danger focus:outline-none dark:bg-white/5 dark:border-white/10"
                            rows={4}
                            placeholder="Enter rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={() => setShowRejectionModal(false)}
                                className="flex-1 rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium text-text-main hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim()}
                                className="flex-1 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50"
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
