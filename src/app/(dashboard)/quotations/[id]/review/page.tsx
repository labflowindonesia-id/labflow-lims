"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useQuotation, useCustomers } from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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

export default function QuotationReviewPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: quotation, isLoading } = useQuotation(id);
    const { data: customers = [] } = useCustomers();
    const customer = customers.find(c => c.id === quotation?.customer_id);

    // State for contract review
    const [actionStatus, setActionStatus] = useState<"IDLE" | "APPROVED" | "REJECTED">("IDLE");
    const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
    const [reviewNotes, setReviewNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [managerSignature, setManagerSignature] = useState("");

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-16 bg-slate-200 rounded-xl"></div>
                <div className="h-64 bg-slate-200 rounded-xl"></div>
            </div>
        );
    }

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

    // Check if quotation is reviewable
    if (quotation.status !== "SUBMITTED") {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-[64px] text-warning/50">warning</span>
                <p className="mt-4 text-lg font-medium text-text-main dark:text-white">Cannot Review</p>
                <p className="text-sm text-text-secondary">This quotation is not in SUBMITTED status.</p>
                <Link href={`/quotations/${id}`} className="mt-4 text-primary hover:underline">
                    ← View Quotation
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
        if (!managerSignature.trim()) {
            alert("Please enter your signature to approve.");
            return;
        }
        setActionStatus("APPROVED");
        console.log("APPROVED:", { id, checklist, reviewNotes, managerSignature });
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

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Contract Review"
                description={`Quotation ${quotation.quotation_number}`}
                backHref={`/quotations/${id}`}
                actions={
                    actionStatus === "IDLE" ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowRejectionModal(true)}
                                className="flex items-center gap-2 rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={!allChecked || !managerSignature.trim()}
                                className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[18px]">check</span>
                                Approve Contract
                            </button>
                        </div>
                    ) : (
                        <span className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold",
                            actionStatus === "APPROVED" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                        )}>
                            {actionStatus}
                        </span>
                    )
                }
            />

            <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Quotation Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quotation Info */}
                    <PremiumCard title="Quotation Summary">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-text-secondary">Customer</p>
                                <p className="font-semibold text-text-main dark:text-white">{quotation.customer_name_snapshot}</p>
                            </div>
                            <div>
                                <p className="text-text-secondary">Created Date</p>
                                <p className="font-medium text-text-main dark:text-white">{new Date(quotation.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-text-secondary">Total Amount</p>
                                <p className="font-bold text-primary">Rp {((quotation.subtotal || 0) + (quotation.tax_amount || 0)).toLocaleString("id-ID")}</p>
                            </div>
                            <div>
                                <p className="text-text-secondary">Status</p>
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-warning/20 text-warning">
                                    {quotation.status}
                                </span>
                            </div>
                        </div>

                        {customer && (
                            <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                                <h4 className="text-sm font-semibold text-text-main dark:text-white mb-2">Customer Contact</h4>
                                <div className="text-sm text-text-secondary">
                                    <p>{customer.address}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            <Link
                                href={`/quotations/${id}`}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                View Full Details
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </Link>
                        </div>
                    </PremiumCard>

                    {/* Review Notes */}
                    <PremiumCard title="Review Notes">
                        <textarea
                            placeholder="Add notes about this contract review..."
                            className="w-full min-h-[120px] p-3 text-sm border border-border-light rounded-lg bg-transparent dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            disabled={actionStatus !== "IDLE"}
                        />
                    </PremiumCard>

                    {/* Manager Signature */}
                    <PremiumCard title="Approval Signature">
                        <div className="space-y-3">
                            <p className="text-sm text-text-secondary">
                                Enter your full name to digitally sign this contract approval.
                            </p>
                            <input
                                type="text"
                                placeholder="Enter your full name..."
                                className="w-full p-3 text-sm border border-border-light rounded-lg bg-transparent dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={managerSignature}
                                onChange={(e) => setManagerSignature(e.target.value)}
                                disabled={actionStatus !== "IDLE"}
                            />
                            {managerSignature && (
                                <div className="p-4 bg-background-light dark:bg-black/20 rounded-lg">
                                    <p className="text-xs text-text-secondary mb-1">Signature Preview</p>
                                    <p className="text-2xl font-signature italic text-primary">{managerSignature}</p>
                                    <p className="text-xs text-text-secondary mt-2">
                                        {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </PremiumCard>
                </div>

                {/* Right: Review Checklist */}
                <div className="space-y-6">
                    <PremiumCard
                        title="Review Checklist"
                        subtitle={`${checkedCount}/${checklist.length} completed`}
                    >
                        <div className="space-y-3">
                            {checklist.map(item => (
                                <label
                                    key={item.id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                        item.checked
                                            ? "border-success/50 bg-success/10"
                                            : "border-border-light dark:border-border-dark hover:border-primary/50",
                                        actionStatus !== "IDLE" && "cursor-default opacity-75"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleCheckItem(item.id)}
                                        disabled={actionStatus !== "IDLE"}
                                        className="mt-0.5 rounded border-border-light"
                                    />
                                    <div>
                                        <p className={cn(
                                            "text-sm font-medium",
                                            item.checked ? "text-success" : "text-text-main dark:text-white"
                                        )}>
                                            {item.label}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            {item.description}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {!allChecked && actionStatus === "IDLE" && (
                            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
                                <p className="text-xs text-warning flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">info</span>
                                    Complete all items to approve
                                </p>
                            </div>
                        )}

                        {allChecked && actionStatus === "IDLE" && (
                            <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30">
                                <p className="text-xs text-success flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    All checks passed - Ready to approve
                                </p>
                            </div>
                        )}
                    </PremiumCard>

                    {/* Success/Rejection Status */}
                    {actionStatus !== "IDLE" && (
                        <PremiumCard>
                            <div className={cn(
                                "flex flex-col items-center justify-center py-6 text-center",
                                actionStatus === "APPROVED" ? "text-success" : "text-danger"
                            )}>
                                <span className="material-symbols-outlined text-[48px]">
                                    {actionStatus === "APPROVED" ? "verified" : "cancel"}
                                </span>
                                <p className="mt-2 text-lg font-bold">
                                    {actionStatus === "APPROVED" ? "Contract Approved" : "Contract Rejected"}
                                </p>
                                <p className="text-sm text-text-secondary mt-1">
                                    {actionStatus === "APPROVED"
                                        ? `Signed by ${managerSignature}`
                                        : "This quotation has been returned to the admin."
                                    }
                                </p>
                                <Link
                                    href="/quotations"
                                    className="mt-4 text-sm text-primary hover:underline"
                                >
                                    ← Back to Quotations
                                </Link>
                            </div>
                        </PremiumCard>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-[24px] text-danger">warning</span>
                            <h3 className="text-lg font-bold text-text-main dark:text-white">Reject Quotation</h3>
                        </div>
                        <p className="text-sm text-text-secondary mb-4">
                            Please provide a reason for rejection. This will be sent back to the admin for revision.
                        </p>
                        <textarea
                            placeholder="Enter rejection reason..."
                            className="w-full min-h-[100px] p-3 text-sm border border-border-light rounded-lg bg-transparent dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-danger/30"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowRejectionModal(false)}
                                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-main"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-danger/90"
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
