"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { useQuotation } from "@/hooks/use-supabase";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
    updateQuotationStatus,
    insertContractReview,
    logAuditEvent,
} from "../services/quotationService";
import { supabase } from "@/lib/supabase";

interface QuotationDetailProps {
    id: string;
}

// Contract Review Checklist Items
interface ChecklistItem {
    id: string;
    dbField: string; // maps to contract_reviews column
    label: string;
    description: string;
    checked: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
    { id: "capability", dbField: "laboratory_capability_ok", label: "Laboratory Capability", description: "Lab has required equipment and accreditation for all tests", checked: false },
    { id: "resource", dbField: "resource_availability_ok", label: "Resource Availability", description: "Personnel and resources available for the testing scope", checked: false },
    { id: "sample", dbField: "sample_requirements_ok", label: "Sample Requirements", description: "Sample matrix is compatible with selected methods", checked: false },
    { id: "method", dbField: "method_availability_ok", label: "Method Availability", description: "All required test methods are available and validated", checked: false },
    { id: "subcontracting", dbField: "subcontracting_ok", label: "Subcontracting", description: "Any subcontracting requirements have been reviewed", checked: false },
    { id: "delivery", dbField: "delivery_timeline_ok", label: "Delivery Timeline", description: "Requested turnaround time is achievable", checked: false },
];

export default function QuotationDetailView({ id }: QuotationDetailProps) {
    const { data: quotation, isLoading, refetch } = useQuotation(id);
    const { user } = useAuth();

    // Role check
    const isManager = user?.role === "manager";

    // State for contract review
    const [actionStatus, setActionStatus] = useState<"IDLE" | "APPROVED" | "REJECTED">("IDLE");
    const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
    const [reviewNotes, setReviewNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Line items from DB
    const [lineItems, setLineItems] = useState<Array<{
        parameter_name_snapshot: string;
        method_code_snapshot: string;
        quantity: number;
        unit_price: number;
        line_total: number;
    }>>([]);
    const [lineItemsLoaded, setLineItemsLoaded] = useState(false);

    // Fetch line items when quotation loads
    if (quotation && !lineItemsLoaded) {
        supabase
            .from("quotation_lines")
            .select("*")
            .eq("quotation_id", id)
            .order("line_number")
            .then(({ data }) => {
                if (data) setLineItems(data);
                setLineItemsLoaded(true);
            });
    }

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-48 bg-slate-200 rounded-xl"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
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

    // Check if all checklist items are complete
    const allChecked = checklist.every(item => item.checked);
    const checkedCount = checklist.filter(item => item.checked).length;

    const handleCheckItem = (itemId: string) => {
        setChecklist(prev => prev.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        ));
    };

    // ============================================
    // APPROVE — Manager only, persists to DB
    // ============================================
    const handleApprove = async () => {
        if (!allChecked) {
            alert("Please complete all checklist items before approving.");
            return;
        }
        if (!user) return;

        setProcessing(true);
        try {
            // Update quotation status
            await updateQuotationStatus(id, {
                status: "APPROVED",
                approved_at: new Date().toISOString(),
                approved_by: user.id,
            });

            // Insert contract review record
            const checklistData: Record<string, boolean> = {};
            checklist.forEach(item => {
                checklistData[item.dbField] = item.checked;
            });

            await insertContractReview({
                quotation_id: id,
                ...checklistData,
                status: "APPROVED",
                notes: reviewNotes || undefined,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
            });

            // Audit trail
            await logAuditEvent({
                entity_type: "quotation",
                entity_id: id,
                action: "APPROVE",
                user_id: user.id,
                user_email: user.email,
                user_role: user.role,
                old_values: { status: "SUBMITTED" },
                new_values: { status: "APPROVED" },
            });

            setActionStatus("APPROVED");
            refetch();
            alert("✅ Quotation approved successfully!");
        } catch (err) {
            console.error("Approve failed:", err);
            alert("❌ Failed to approve quotation.");
        } finally {
            setProcessing(false);
        }
    };

    // ============================================
    // REJECT — Manager only, persists to DB
    // ============================================
    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert("Please provide a rejection reason.");
            return;
        }
        if (!user) return;

        setProcessing(true);
        try {
            // Update quotation status
            await updateQuotationStatus(id, {
                status: "REJECTED",
                rejected_at: new Date().toISOString(),
                rejected_by: user.id,
                rejection_reason: rejectionReason,
            });

            // Insert contract review record
            const checklistData: Record<string, boolean> = {};
            checklist.forEach(item => {
                checklistData[item.dbField] = item.checked;
            });

            await insertContractReview({
                quotation_id: id,
                ...checklistData,
                status: "REJECTED",
                notes: rejectionReason,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
            });

            // Audit trail
            await logAuditEvent({
                entity_type: "quotation",
                entity_id: id,
                action: "REJECT",
                user_id: user.id,
                user_email: user.email,
                user_role: user.role,
                old_values: { status: "SUBMITTED" },
                new_values: { status: "REJECTED", rejection_reason: rejectionReason },
                reason: rejectionReason,
            });

            setActionStatus("REJECTED");
            setShowRejectionModal(false);
            refetch();
            alert("Quotation rejected.");
        } catch (err) {
            console.error("Reject failed:", err);
            alert("❌ Failed to reject quotation.");
        } finally {
            setProcessing(false);
        }
    };

    // Valid Until — use from DB if available, else calculate from created_at + 30 days
    const validUntil = quotation.valid_until
        ? new Date(quotation.valid_until)
        : (() => {
            const d = new Date(quotation.created_at);
            d.setDate(d.getDate() + 30);
            return d;
        })();

    // Grand total from DB
    const displayTotal = quotation.grand_total || ((quotation.subtotal || 0) + (quotation.tax_amount || 0));

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content: Info & Line Items */}
            <div className="lg:col-span-2 space-y-6">
                {/* Quotation Header */}
                <PremiumCard title={`Quotation ${quotation.quotation_number}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                        <div>
                            <p className="text-text-secondary">Customer</p>
                            <p className="font-semibold text-text-main dark:text-white">{quotation.customer_name_snapshot}</p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Created Date</p>
                            <p className="font-medium text-text-main dark:text-white">{new Date(quotation.created_at).toLocaleDateString("id-ID")}</p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Valid Until</p>
                            <p className="font-medium text-text-main dark:text-white">{validUntil.toLocaleDateString("id-ID")}</p>
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

                    {/* Line Items Table — from DB */}
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
                                {lineItems.length > 0 ? lineItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-primary/5">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-text-main dark:text-white">{item.parameter_name_snapshot || "—"}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs">{item.method_code_snapshot || "—"}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">Rp {item.unit_price?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium tabular-nums">Rp {item.line_total?.toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                                            {lineItemsLoaded ? "No line items found" : "Loading line items..."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-medium">
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-right border-t border-border-light dark:border-border-dark">Subtotal</td>
                                    <td className="px-4 py-2 text-right border-t border-border-light tabular-nums dark:border-border-dark">Rp {(quotation.subtotal || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-right">PPN (11%)</td>
                                    <td className="px-4 py-2 text-right tabular-nums">Rp {Math.round(quotation.tax_amount || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-right text-base font-bold text-text-main dark:text-white">Total</td>
                                    <td className="px-4 py-2 text-right text-base font-bold text-primary tabular-nums">Rp {Math.round(displayTotal).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </PremiumCard>

                {/* Contract Review Checklist — Manager only */}
                {quotation.status === "SUBMITTED" && actionStatus === "IDLE" && isManager && (
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

                {/* Non-manager notice */}
                {quotation.status === "SUBMITTED" && !isManager && (
                    <PremiumCard title="Contract Review">
                        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
                            <span className="material-symbols-outlined text-amber-600 text-[24px]">lock</span>
                            <div>
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Manager Access Required</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">Only managers can review and approve quotations.</p>
                            </div>
                        </div>
                    </PremiumCard>
                )}

                {/* Review Notes — Manager only */}
                {quotation.status === "SUBMITTED" && actionStatus === "IDLE" && isManager && (
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
                    {quotation.status === "SUBMITTED" && actionStatus === "IDLE" && isManager ? (
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
                                disabled={!allChecked || processing}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow transition-all",
                                    allChecked && !processing
                                        ? "bg-success hover:bg-success/90 cursor-pointer"
                                        : "bg-slate-300 cursor-not-allowed"
                                )}
                            >
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                {processing ? "Processing..." : "Approve Quotation"}
                            </button>
                            <button
                                onClick={() => setShowRejectionModal(true)}
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 rounded-lg border border-danger/30 bg-white px-4 py-2.5 text-sm font-bold text-danger shadow-sm hover:bg-danger/5 dark:bg-surface-dark disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">block</span>
                                Reject & Return
                            </button>
                        </div>
                    ) : quotation.status === "SUBMITTED" && !isManager ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <span className="material-symbols-outlined text-4xl text-amber-400 mb-2">lock</span>
                            <p className="font-medium text-slate-500">Manager Access Required</p>
                            <p className="text-xs text-slate-400 mt-1">Only managers can approve or reject.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            {(actionStatus === "APPROVED" || quotation.status === "APPROVED") ? (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-success mb-2">verified</span>
                                    <p className="font-bold text-success">Approved</p>
                                    <p className="text-xs text-text-secondary mt-1">Ready for sample receiving</p>
                                </>
                            ) : actionStatus === "REJECTED" || quotation.status === "REJECTED" ? (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-danger mb-2">cancel</span>
                                    <p className="font-bold text-danger">Rejected</p>
                                    <p className="text-xs text-text-secondary mt-1">Returned to creator for revision</p>
                                    {(rejectionReason || quotation.rejection_reason) && (
                                        <div className="mt-3 p-2 rounded bg-danger/5 border border-danger/20 text-xs text-danger text-left w-full">
                                            <strong>Reason:</strong> {rejectionReason || quotation.rejection_reason}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">lock</span>
                                    <p className="font-medium text-slate-500">Read Only</p>
                                    <p className="text-xs text-slate-400 mt-1">This quotation is {quotation.status?.toLowerCase()}.</p>
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
                            <span className="font-mono font-medium text-text-main dark:text-white">{quotation.quotation_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Created</span>
                            <span className="text-text-main dark:text-white">{new Date(quotation.created_at).toLocaleDateString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Valid Until</span>
                            <span className="text-text-main dark:text-white">{validUntil.toLocaleDateString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">TAT</span>
                            <span className="text-text-main dark:text-white">{quotation.tat_days || 0} days</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Total</span>
                            <span className="font-bold text-primary">Rp {Math.round(displayTotal).toLocaleString()}</span>
                        </div>
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
                                disabled={processing}
                                className="flex-1 rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium text-text-main hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || processing}
                                className="flex-1 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50"
                            >
                                {processing ? "Processing..." : "Confirm Rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
