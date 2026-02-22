"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { ClientSelector } from "./ClientSelector";
import { LineItemManager } from "./LineItemManager";
import { QuotationLineItem } from "../types";
import { useParameters, useSampleMatrices } from "@/hooks/use-supabase";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import {
    createQuotation,
    insertQuotationLines,
    updateQuotationStatus,
    logAuditEvent,
    generateQuotationNumber,
} from "../services/quotationService";

// Fixed validity: 30 days
const VALIDITY_DAYS = 30;

// Default Terms and Conditions
const DEFAULT_TERMS = `1. Quotation valid for 30 days from the date of issue.
2. Payment terms: 50% upfront, 50% upon completion.
3. Lead times are estimates and may vary based on sample complexity.
4. Samples must be submitted in appropriate containers with proper labeling.
5. Rush testing available at additional cost.
6. Results will be provided in electronic format unless otherwise specified.`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCustomer = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyContact = any;

export default function QuotationForm() {
    const router = useRouter();
    const { user } = useAuth();

    // Supabase data for PDF preview
    const { data: parameters = [] } = useParameters();
    const { data: matrices = [] } = useSampleMatrices();

    // Helper functions for PDF preview
    const getParameterName = (id: string) => {
        return (parameters || []).find(p => p.id === id)?.name || "Unknown Parameter";
    };
    const getMatrixName = (id: string) => {
        return (matrices || []).find(m => m.id === id)?.name || "";
    };

    // FORM STATE
    const [customer, setCustomer] = useState<AnyCustomer | undefined>();
    const [contact, setContact] = useState<AnyContact | undefined>();
    const [lineItems, setLineItems] = useState<QuotationLineItem[]>([]);
    const [remarks, setRemarks] = useState("");

    // Version & Expiry (validity is now fixed at 30 days)
    const [version] = useState(1);
    const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_TERMS);
    const [showTermsEditor, setShowTermsEditor] = useState(false);
    const [showPdfPreview, setShowPdfPreview] = useState(false);

    // Status & Workflow
    const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED">("DRAFT");
    const [saving, setSaving] = useState(false);
    const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);

    // DERIVED TOTALS
    const subtotal = lineItems.reduce((acc, item) => acc + item.total_price, 0);
    const discountPercent = 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxRate = 0.11;
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const grandTotal = subtotal - discountAmount + taxAmount;

    // Auto-generated ID placeholder (will be replaced when saving)
    const [quoteNo, setQuoteNo] = useState("QT-NEW");
    const fullQuoteNo = version > 1 ? `${quoteNo}-R${version}` : quoteNo;

    // Fixed expiry date calculation
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + VALIDITY_DAYS);

    // Max TAT from line items
    const maxTat = lineItems.length > 0 ? Math.max(...lineItems.map(i => i.lead_time_days || 0)) : 0;

    // ============================================
    // SAVE DRAFT
    // ============================================
    const handleSaveDraft = useCallback(async () => {
        if (!customer || !user) {
            alert("Please select a customer first.");
            return;
        }

        setSaving(true);
        try {
            // Generate quotation number if new
            let currentQuoteNo = quoteNo;
            if (quoteNo === "QT-NEW") {
                currentQuoteNo = await generateQuotationNumber();
                setQuoteNo(currentQuoteNo);
            }

            // Use the first line item's matrix_id, or a placeholder
            const primaryMatrixId = lineItems.length > 0
                ? lineItems[0].matrix_id
                : (matrices.length > 0 ? matrices[0].id : "default");

            if (savedQuotationId) {
                // UPDATE existing draft
                await updateQuotationStatus(savedQuotationId, {
                    customer_id: customer.id,
                    contact_id: contact?.id || null,
                    customer_name_snapshot: customer.name,
                    customer_address_snapshot: customer.address || "",
                    subtotal,
                    discount: discountAmount,
                    tax_rate: taxRate,
                    tax_amount: Math.round(taxAmount),
                    grand_total: Math.round(grandTotal),
                    internal_notes: remarks || null,
                    terms_conditions: termsAndConditions,
                    valid_until: expiryDate.toISOString(),
                    tat_days: maxTat,
                    matrix_id: primaryMatrixId,
                    sample_count: lineItems.length,
                });

                // Replace line items
                const { deleteQuotationLines } = await import("../services/quotationService");
                await deleteQuotationLines(savedQuotationId);
                if (lineItems.length > 0) {
                    await insertQuotationLines(
                        lineItems.map((item, idx) => ({
                            quotation_id: savedQuotationId,
                            line_number: idx + 1,
                            parameter_id: item.parameter_id || null,
                            subparameter_id: item.subparameter_id || null,
                            package_id: item.package_id || null,
                            method_id: item.method_id || null,
                            instrument_id: item.instrument_id || null,
                            parameter_name_snapshot: getParameterName(item.parameter_id),
                            unit_price: item.unit_price,
                            quantity: item.qty,
                            line_total: item.total_price,
                            tat_days: item.lead_time_days || 0,
                        }))
                    );
                }

                await logAuditEvent({
                    entity_type: "quotation",
                    entity_id: savedQuotationId,
                    action: "UPDATE",
                    user_id: user.id,
                    user_email: user.email,
                    user_role: user.role,
                    new_values: { status: "DRAFT", grand_total: Math.round(grandTotal) },
                });
            } else {
                // CREATE new quotation
                const row = await createQuotation({
                    quotation_number: currentQuoteNo,
                    revision_number: version,
                    customer_id: customer.id,
                    contact_id: contact?.id || undefined,
                    customer_name_snapshot: customer.name,
                    customer_address_snapshot: customer.address || "",
                    matrix_id: primaryMatrixId,
                    sample_count: lineItems.length,
                    valid_until: expiryDate.toISOString(),
                    tat_days: maxTat,
                    status: "DRAFT",
                    subtotal,
                    discount: discountAmount,
                    tax_rate: taxRate,
                    tax_amount: Math.round(taxAmount),
                    grand_total: Math.round(grandTotal),
                    currency: "IDR",
                    internal_notes: remarks || undefined,
                    terms_conditions: termsAndConditions,
                    created_by: user.id,
                });

                setSavedQuotationId(row.id);

                // Insert line items
                if (lineItems.length > 0) {
                    await insertQuotationLines(
                        lineItems.map((item, idx) => ({
                            quotation_id: row.id,
                            line_number: idx + 1,
                            parameter_id: item.parameter_id || null,
                            subparameter_id: item.subparameter_id || null,
                            package_id: item.package_id || null,
                            method_id: item.method_id || null,
                            instrument_id: item.instrument_id || null,
                            parameter_name_snapshot: getParameterName(item.parameter_id),
                            unit_price: item.unit_price,
                            quantity: item.qty,
                            line_total: item.total_price,
                            tat_days: item.lead_time_days || 0,
                        }))
                    );
                }

                await logAuditEvent({
                    entity_type: "quotation",
                    entity_id: row.id,
                    action: "CREATE",
                    user_id: user.id,
                    user_email: user.email,
                    user_role: user.role,
                    new_values: { quotation_number: currentQuoteNo, status: "DRAFT", grand_total: Math.round(grandTotal) },
                });
            }

            alert("✅ Quotation saved as draft!");
        } catch (err) {
            console.error("Save draft failed:", err);
            alert("❌ Failed to save draft. Check console for details.");
        } finally {
            setSaving(false);
        }
    }, [customer, contact, lineItems, user, quoteNo, savedQuotationId, subtotal, discountAmount, taxRate, taxAmount, grandTotal, remarks, termsAndConditions, expiryDate, maxTat, version, matrices, getParameterName]);

    // ============================================
    // SUBMIT FOR REVIEW
    // ============================================
    const handleSubmitForReview = useCallback(async () => {
        if (!customer || !user) {
            alert("Please select a customer first.");
            return;
        }
        if (lineItems.length === 0) {
            alert("Please add at least one line item.");
            return;
        }

        setSaving(true);
        try {
            // Save first if not saved yet
            if (!savedQuotationId) {
                await handleSaveDraft();
            }

            const qId = savedQuotationId;
            if (!qId) {
                throw new Error("Quotation must be saved before submitting.");
            }

            await updateQuotationStatus(qId, {
                status: "SUBMITTED",
                submitted_at: new Date().toISOString(),
                submitted_by: user.id,
            });

            await logAuditEvent({
                entity_type: "quotation",
                entity_id: qId,
                action: "SUBMIT",
                user_id: user.id,
                user_email: user.email,
                user_role: user.role,
                old_values: { status: "DRAFT" },
                new_values: { status: "SUBMITTED" },
            });

            setStatus("SUBMITTED");
            alert("✅ Quotation submitted for contract review!");
        } catch (err) {
            console.error("Submit failed:", err);
            alert("❌ Failed to submit. Check console for details.");
        } finally {
            setSaving(false);
        }
    }, [customer, user, lineItems, savedQuotationId, handleSaveDraft]);

    // ============================================
    // PDF DOWNLOAD (client-side)
    // ============================================
    const handleDownloadPdf = useCallback(() => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("Please allow pop-ups to download PDF.");
            return;
        }

        const lineItemsHtml = lineItems.map((item, idx) => {
            const paramName = getParameterName(item.parameter_id);
            const matrixName = getMatrixName(item.matrix_id);
            return `<tr>
                <td style="padding:8px;border:1px solid #e2e8f0">${idx + 1}</td>
                <td style="padding:8px;border:1px solid #e2e8f0">${paramName}${matrixName ? `<br><small style="color:#64748b">${matrixName}</small>` : ""}</td>
                <td style="padding:8px;border:1px solid #e2e8f0;text-align:right">${item.qty}</td>
                <td style="padding:8px;border:1px solid #e2e8f0;text-align:right">Rp ${item.unit_price.toLocaleString()}</td>
                <td style="padding:8px;border:1px solid #e2e8f0;text-align:right">Rp ${item.total_price.toLocaleString()}</td>
            </tr>`;
        }).join("");

        const html = `<!DOCTYPE html>
<html><head><title>Quotation ${fullQuoteNo}</title>
<style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #0f172a; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f1f5f9; padding: 10px 8px; border: 1px solid #e2e8f0; text-align: left; font-size: 13px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0ea5e9; padding-bottom: 16px; margin-bottom: 24px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 14px; }
    .total-row { font-weight: bold; font-size: 16px; color: #0ea5e9; }
    .terms { font-size: 12px; color: #64748b; white-space: pre-wrap; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { margin: 20px; } }
</style></head><body>
<div class="header">
    <div>
        <h1>QUOTATION</h1>
        <p style="color:#64748b;margin:4px 0">${fullQuoteNo}</p>
    </div>
    <div style="text-align:right">
        <p style="font-weight:bold;color:#0ea5e9;margin:0">LabFlow LIMS</p>
        <p style="font-size:12px;color:#64748b;margin:4px 0">Laboratory Information Management System</p>
    </div>
</div>

<div class="meta">
    <div>
        <p style="color:#64748b;margin:0 0 4px">Bill To:</p>
        <p style="font-weight:600;margin:0">${customer?.name || "-"}</p>
        <p style="margin:4px 0">${customer?.address || ""}</p>
        ${contact ? `<p style="margin:4px 0">Attn: ${contact.name}</p>` : ""}
    </div>
    <div style="text-align:right">
        <p style="margin:4px 0">Date: ${new Date().toLocaleDateString("id-ID")}</p>
        <p style="margin:4px 0">Valid Until: ${expiryDate.toLocaleDateString("id-ID")}</p>
        <p style="margin:4px 0">Validity: ${VALIDITY_DAYS} days</p>
    </div>
</div>

<table>
    <thead>
        <tr>
            <th style="width:40px">#</th>
            <th>Description</th>
            <th style="text-align:right;width:60px">Qty</th>
            <th style="text-align:right;width:120px">Unit Price</th>
            <th style="text-align:right;width:120px">Total</th>
        </tr>
    </thead>
    <tbody>
        ${lineItemsHtml || '<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;border:1px solid #e2e8f0">No items</td></tr>'}
    </tbody>
    <tfoot>
        <tr>
            <td colspan="4" style="padding:8px;text-align:right;border:1px solid #e2e8f0">Subtotal</td>
            <td style="padding:8px;text-align:right;border:1px solid #e2e8f0">Rp ${subtotal.toLocaleString()}</td>
        </tr>
        <tr>
            <td colspan="4" style="padding:8px;text-align:right;border:1px solid #e2e8f0">PPN (11%)</td>
            <td style="padding:8px;text-align:right;border:1px solid #e2e8f0">Rp ${Math.round(taxAmount).toLocaleString()}</td>
        </tr>
        <tr class="total-row">
            <td colspan="4" style="padding:10px 8px;text-align:right;border:1px solid #e2e8f0">Grand Total</td>
            <td style="padding:10px 8px;text-align:right;border:1px solid #e2e8f0">Rp ${Math.round(grandTotal).toLocaleString()}</td>
        </tr>
    </tfoot>
</table>

<div class="terms">
    <p style="font-weight:600;color:#334155;margin-bottom:8px">Terms & Conditions:</p>
    ${termsAndConditions}
</div>
</body></html>`;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    }, [lineItems, customer, contact, fullQuoteNo, expiryDate, subtotal, taxAmount, grandTotal, termsAndConditions, getParameterName, getMatrixName]);

    // ============================================
    // CREATE REVISION (placeholder — only for approved/rejected)
    // ============================================
    const handleCreateRevision = () => {
        alert("Revision creation would happen here. For now, create a new quotation.");
        router.push("/quotations/create");
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
                        {/* PDF Preview Button - Always visible */}
                        <button
                            onClick={() => setShowPdfPreview(true)}
                            className="flex items-center gap-1 rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium text-text-main shadow-sm hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white"
                        >
                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                            Preview PDF
                        </button>
                        {status === "DRAFT" && (
                            <>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={saving}
                                    className="rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium text-text-main shadow-sm hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white dark:hover:bg-background-dark disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Draft"}
                                </button>
                                <button
                                    onClick={handleSubmitForReview}
                                    disabled={lineItems.length === 0 || !customer || saving}
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
                                    <Label>Validity</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-mono font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {VALIDITY_DAYS} hari
                                        </span>
                                        <span className="text-xs text-text-secondary">
                                            (s/d {expiryDate.toLocaleDateString("id-ID")})
                                        </span>
                                    </div>
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
                                    Max Lead Time: <span className="font-mono font-bold">{maxTat} days</span> working days.
                                </div>
                            )}

                            <div className="mt-6 space-y-2">
                                {status === "DRAFT" && (
                                    <>
                                        <button
                                            onClick={handleSaveDraft}
                                            disabled={saving}
                                            className="w-full rounded-lg border border-border-light bg-white py-2.5 text-text-main font-medium hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save Draft"}
                                        </button>
                                        <button
                                            onClick={handleSubmitForReview}
                                            disabled={lineItems.length === 0 || !customer || saving}
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
                                        <button
                                            onClick={handleDownloadPdf}
                                            className="mt-3 w-full rounded-lg bg-success py-2 text-white font-medium hover:bg-success/90"
                                        >
                                            Download PDF
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

            {/* PDF Preview Modal */}
            {showPdfPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl dark:bg-surface-dark max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-main dark:text-white">PDF Preview</h3>
                            <button
                                onClick={() => setShowPdfPreview(false)}
                                className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <span className="material-symbols-outlined text-[24px] text-text-secondary">close</span>
                            </button>
                        </div>

                        {/* Mock PDF Preview Content */}
                        <div className="border border-border-light rounded-lg p-6 bg-white dark:bg-slate-900">
                            {/* Header */}
                            <div className="border-b border-slate-200 pb-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-900">QUOTATION</h1>
                                        <p className="text-sm text-slate-500">{fullQuoteNo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">LabFlow LIMS</p>
                                        <p className="text-xs text-slate-500">Laboratory Information Management System</p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div>
                                    <p className="text-slate-500">Bill To:</p>
                                    <p className="font-medium text-slate-900">{customer?.name || "No customer selected"}</p>
                                    <p className="text-slate-600">{customer?.address || ""}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500">Date: {new Date().toLocaleDateString("id-ID")}</p>
                                    <p className="text-slate-500">Valid Until: {expiryDate.toLocaleDateString("id-ID")}</p>
                                    <p className="text-slate-500">Validity: {VALIDITY_DAYS} hari</p>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="border rounded-lg overflow-hidden mb-4">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="text-left px-3 py-2 border-b">Description</th>
                                            <th className="text-right px-3 py-2 border-b">Qty</th>
                                            <th className="text-right px-3 py-2 border-b">Unit Price</th>
                                            <th className="text-right px-3 py-2 border-b">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineItems.length > 0 ? lineItems.map((item, idx) => {
                                            const paramName = getParameterName(item.parameter_id);
                                            const matrixName = getMatrixName(item.matrix_id);
                                            return (
                                                <tr key={idx} className="border-b">
                                                    <td className="px-3 py-2">
                                                        <span className="font-medium">{paramName}</span>
                                                        {matrixName && <span className="block text-xs text-slate-500">{matrixName}</span>}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">{item.qty}</td>
                                                    <td className="px-3 py-2 text-right">Rp {item.unit_price.toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right font-medium">Rp {item.total_price.toLocaleString()}</td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={4} className="px-3 py-4 text-center text-slate-400">No items added yet</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-50">
                                        <tr className="font-medium">
                                            <td colSpan={3} className="px-3 py-2 text-right">Subtotal</td>
                                            <td className="px-3 py-2 text-right">Rp {subtotal.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3} className="px-3 py-2 text-right">PPN (11%)</td>
                                            <td className="px-3 py-2 text-right">Rp {Math.round(taxAmount).toLocaleString()}</td>
                                        </tr>
                                        <tr className="font-bold text-primary">
                                            <td colSpan={3} className="px-3 py-2 text-right">Grand Total</td>
                                            <td className="px-3 py-2 text-right">Rp {Math.round(grandTotal).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Terms */}
                            <div className="text-xs text-slate-500">
                                <p className="font-medium text-slate-700 mb-1">Terms & Conditions:</p>
                                <pre className="whitespace-pre-wrap">{termsAndConditions}</pre>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowPdfPreview(false)}
                                className="rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium text-text-main hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleDownloadPdf}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
