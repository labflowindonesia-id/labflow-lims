"use client";

import { useState } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { ClientSelector } from "./ClientSelector";
import { LineItemManager } from "./LineItemManager";
import { QuotationLineItem } from "../types";
import { Customer, CustomerContact } from "@/types/master-data";
import { cn } from "@/lib/utils";

// Default Terms and Conditions
const DEFAULT_TERMS = `1. Quotation valid for 30 days from the date of issue.
2. Payment terms: 50% upfront, 50% upon completion.
3. Lead times are estimates and may vary based on sample complexity.
4. Samples must be submitted in appropriate containers with proper labeling.
5. Rush testing available at additional cost.
6. Results will be provided in electronic format unless otherwise specified.`;

export default function QuotationForm() {
    // FORM STATE
    const [customer, setCustomer] = useState<Customer | undefined>();
    const [contact, setContact] = useState<CustomerContact | undefined>();
    const [lineItems, setLineItems] = useState<QuotationLineItem[]>([]);
    const [remarks, setRemarks] = useState("");

    // NEW: Version & Expiry
    const [version, setVersion] = useState(1);
    const [expiryDays, setExpiryDays] = useState(30);
    const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_TERMS);
    const [showTermsEditor, setShowTermsEditor] = useState(false);

    // NEW: Status & Workflow
    const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED">("DRAFT");

    // DERIVED TOTALS
    const subtotal = lineItems.reduce((acc, item) => acc + item.total_price, 0);
    const discountPercent = 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxRate = 0.11;
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const grandTotal = subtotal - discountAmount + taxAmount;

    // Auto-generated ID (Mock)
    const quoteNo = `QT-2026-001`;
    const fullQuoteNo = version > 1 ? `${quoteNo}-R${version}` : quoteNo;

    // Expiry date calculation
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const handleSaveDraft = () => {
        console.log("SAVING DRAFT:", {
            quoteNo: fullQuoteNo,
            customer_id: customer?.id,
            contact_id: contact?.id,
            items: lineItems,
            grandTotal,
            termsAndConditions,
            expiryDate
        });
        alert("Quotation Saved as Draft!");
    };

    const handleSubmitForReview = () => {
        setStatus("SUBMITTED");
        console.log("SUBMITTING FOR REVIEW:", fullQuoteNo);
        alert("Quotation submitted for contract review!");
    };

    const handleCreateRevision = () => {
        setVersion(v => v + 1);
        setStatus("DRAFT");
        alert(`New revision R${version + 1} created!`);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* TOOLBAR */}
            <ActionToolbar
                title={`Quotation: ${fullQuoteNo}`}
                description={
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold",
                            status === "DRAFT" ? "bg-slate-100 text-slate-600" :
                                status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                                    status === "APPROVED" ? "bg-green-100 text-green-700" :
                                        "bg-red-100 text-red-700"
                        )}>
                            {status}
                        </span>
                        {version > 1 && (
                            <span className="text-xs text-text-secondary">
                                Revision {version}
                            </span>
                        )}
                    </div>
                }
                actions={
                    <div className="flex gap-2">
                        {status === "DRAFT" && (
                            <>
                                <button
                                    onClick={handleSaveDraft}
                                    className="rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium text-text-main shadow-sm hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white dark:hover:bg-background-dark"
                                >
                                    Save Draft
                                </button>
                                <button
                                    onClick={handleSubmitForReview}
                                    disabled={lineItems.length === 0 || !customer}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/30 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit for Review
                                </button>
                            </>
                        )}
                        {(status === "APPROVED" || status === "REJECTED") && (
                            <button
                                onClick={handleCreateRevision}
                                className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary/5"
                            >
                                Create Revision
                            </button>
                        )}
                    </div>
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* LEFT COLUMN: INPUTS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Client Info */}
                    <PremiumCard title="Client Information">
                        <ClientSelector
                            selectedCustomerId={customer?.id}
                            selectedContactId={contact?.id}
                            onCustomerChange={setCustomer}
                            onContactChange={setContact}
                        />
                    </PremiumCard>

                    {/* 2. Line Items */}
                    <PremiumCard
                        title="Analysis Request"
                        subtitle="Parameters will auto-select Method & Price based on Matrix Rules"
                    >
                        <LineItemManager
                            items={lineItems}
                            onItemsChange={setLineItems}
                        />
                    </PremiumCard>

                    {/* 3. Terms & Conditions */}
                    <PremiumCard
                        title="Terms & Conditions"
                        action={
                            <button
                                onClick={() => setShowTermsEditor(!showTermsEditor)}
                                className="text-xs text-primary hover:underline"
                            >
                                {showTermsEditor ? "Collapse" : "Edit Terms"}
                            </button>
                        }
                    >
                        {showTermsEditor ? (
                            <div className="space-y-3">
                                <textarea
                                    className="w-full rounded-lg border border-border-light p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:bg-white/5 dark:border-white/10"
                                    rows={8}
                                    value={termsAndConditions}
                                    onChange={(e) => setTermsAndConditions(e.target.value)}
                                />
                                <button
                                    onClick={() => setTermsAndConditions(DEFAULT_TERMS)}
                                    className="text-xs text-text-secondary hover:underline"
                                >
                                    Reset to defaults
                                </button>
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap text-xs text-text-secondary leading-relaxed">
                                {termsAndConditions}
                            </pre>
                        )}
                    </PremiumCard>

                    {/* 4. Notes */}
                    <PremiumCard title="Internal Remarks">
                        <div className="space-y-2">
                            <Label>Notes (not shown on quote)</Label>
                            <textarea
                                className="w-full rounded-lg border border-border-light p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:bg-white/5 dark:border-white/10"
                                rows={3}
                                placeholder="Add notes for the lab manager..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            ></textarea>
                        </div>
                    </PremiumCard>
                </div>

                {/* RIGHT COLUMN: STICKY SUMMARY */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        {/* Quotation Meta */}
                        <PremiumCard title="Quote Settings">
                            <div className="space-y-4">
                                <div>
                                    <Label>Quote Number</Label>
                                    <Input
                                        value={fullQuoteNo}
                                        disabled
                                        className="font-mono bg-slate-50 dark:bg-slate-900"
                                    />
                                </div>
                                <div>
                                    <Label>Validity (Days)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={90}
                                        value={expiryDays}
                                        onChange={(e) => setExpiryDays(Number(e.target.value))}
                                    />
                                    <p className="mt-1 text-xs text-text-secondary">
                                        Expires: {expiryDate.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </PremiumCard>

                        {/* Pricing Summary */}
                        <PremiumCard title="Quotation Summary" className="bg-slate-50 dark:bg-slate-900/50">
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Subtotal</span>
                                    <span className="font-mono tabular-nums">Rp {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Discount ({discountPercent}%)</span>
                                    <span className="font-mono tabular-nums text-danger">-Rp {discountAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">PPN (11%)</span>
                                    <span className="font-mono tabular-nums">Rp {Math.round(taxAmount).toLocaleString()}</span>
                                </div>
                                <div className="border-t border-border-light pt-4 flex justify-between items-center">
                                    <span className="font-bold text-lg">Total</span>
                                    <span className="font-bold text-2xl text-primary font-display">Rp {Math.round(grandTotal).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* TAT ESTIMATE HELPER */}
                            {lineItems.length > 0 && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                                    <div className="font-semibold mb-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">calendar_clock</span>
                                        Est. Completion
                                    </div>
                                    Max Lead Time: <span className="font-mono font-bold">{Math.max(...lineItems.map(i => i.lead_time_days))} days</span> working days.
                                </div>
                            )}

                            <div className="mt-6 space-y-2">
                                {status === "DRAFT" && (
                                    <>
                                        <button
                                            onClick={handleSaveDraft}
                                            className="w-full rounded-lg border border-border-light bg-white py-2.5 text-text-main font-medium hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white"
                                        >
                                            Save Draft
                                        </button>
                                        <button
                                            onClick={handleSubmitForReview}
                                            disabled={lineItems.length === 0 || !customer}
                                            className="w-full rounded-lg bg-primary py-3 text-white font-medium shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Submit for Review
                                        </button>
                                    </>
                                )}
                                {status === "SUBMITTED" && (
                                    <div className="text-center py-4">
                                        <span className="material-symbols-outlined text-[32px] text-blue-500">hourglass_empty</span>
                                        <p className="text-sm font-medium text-text-main dark:text-white mt-2">Awaiting Review</p>
                                        <p className="text-xs text-text-secondary">Contract review in progress</p>
                                    </div>
                                )}
                                {status === "APPROVED" && (
                                    <div className="text-center py-4">
                                        <span className="material-symbols-outlined text-[32px] text-success">check_circle</span>
                                        <p className="text-sm font-medium text-success mt-2">Approved</p>
                                        <button className="mt-3 w-full rounded-lg bg-success py-2 text-white font-medium hover:bg-success/90">
                                            Generate PDF
                                        </button>
                                    </div>
                                )}
                                {status === "REJECTED" && (
                                    <div className="text-center py-4">
                                        <span className="material-symbols-outlined text-[32px] text-danger">cancel</span>
                                        <p className="text-sm font-medium text-danger mt-2">Rejected</p>
                                        <p className="text-xs text-text-secondary">Please create a revision</p>
                                    </div>
                                )}
                            </div>
                        </PremiumCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
