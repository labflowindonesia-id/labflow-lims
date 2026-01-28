"use client";

import { useState } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { ClientSelector } from "./ClientSelector";
import { LineItemManager } from "./LineItemManager";
import { QuotationLineItem } from "../types";
import { Customer, CustomerContact } from "@/types/master-data";

export default function QuotationForm() {
    // FORM STATE
    const [customer, setCustomer] = useState<Customer | undefined>();
    const [contact, setContact] = useState<CustomerContact | undefined>();
    const [lineItems, setLineItems] = useState<QuotationLineItem[]>([]);
    const [remarks, setRemarks] = useState("");

    // DERIVED TOTALS
    const subtotal = lineItems.reduce((acc, item) => acc + item.total_price, 0);
    // Optional: Discount logic could go here
    const taxRate = 0.11;
    const taxAmount = subtotal * taxRate;
    const grandTotal = subtotal + taxAmount;

    // Auto-generated ID (Mock)
    const quoteNo = "Q-2026-001";

    const handleSave = () => {
        console.log("SAVING QUOTATION:", {
            quoteNo,
            customer_id: customer?.id,
            contact_id: contact?.id,
            items: lineItems,
            grandTotal
        });
        alert("Quotation Saved as Draft!");
    };

    return (
        <div className="space-y-6 pb-20">
            {/* TOOLBAR */}
            <ActionToolbar
                title={`New Quotation: ${quoteNo}`}
                description="Drafting proposal based on Master Data Rules"
                actions={
                    <div className="flex gap-2">
                        <button className="rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium text-text-main shadow-sm hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-white dark:hover:bg-background-dark">
                            Save Draft
                        </button>
                        <button
                            onClick={handleSave}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/30 hover:bg-primary-hover"
                        >
                            Generate Preview
                        </button>
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

                    {/* 3. Notes */}
                    <PremiumCard title="Notes & Terms">
                        <div className="space-y-2">
                            <Label>Internal Remarks</Label>
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
                        <PremiumCard title="Quotation Summary" className="bg-slate-50 dark:bg-slate-900/50">
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Subtotal</span>
                                    <span className="font-mono tabular-nums">Rp {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Discount (0%)</span>
                                    <span className="font-mono tabular-nums text-danger">-Rp 0</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">PPN (11%)</span>
                                    <span className="font-mono tabular-nums">Rp {taxAmount.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-border-light pt-4 flex justify-between items-center">
                                    <span className="font-bold text-lg">Total</span>
                                    <span className="font-bold text-2xl text-primary font-display">Rp {grandTotal.toLocaleString()}</span>
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

                            <div className="mt-6">
                                <button className="w-full rounded-lg bg-primary py-3 text-white font-medium shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all transform active:scale-[0.98]">
                                    Finalize Quotation
                                </button>
                            </div>
                        </PremiumCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
