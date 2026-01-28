import { PremiumCard } from "@/components/ui/PremiumCard";
import { MOCK_QUOTATIONS } from "@/data/mock-db";
import { Quotation } from "@/types/master-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

interface QuotationDetailProps {
    id: string;
}

export default function QuotationDetailView({ id }: QuotationDetailProps) {
    const quotation = MOCK_QUOTATIONS.find(q => q.id === id);
    const [actionStatus, setActionStatus] = useState<"IDLE" | "APPROVED" | "REJECTED">("IDLE");

    if (!quotation) {
        return <div className="p-8 text-center text-red-500">Quotation not found</div>;
    }

    const handleApprove = () => {
        setActionStatus("APPROVED");
        // In real app, this would mutate DB
    };

    const handleReject = () => {
        setActionStatus("REJECTED");
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content: Info & Line Items */}
            <div className="lg:col-span-2 space-y-6">
                <PremiumCard title={`Quotation ${quotation.quotation_no}`}>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div>
                            <p className="text-text-secondary">Customer</p>
                            <p className="font-semibold text-text-main">{quotation.customer_name_snapshot}</p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Created Date</p>
                            <p className="font-medium text-text-main">{quotation.created_at.toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Status</p>
                            <span className={cn(
                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                actionStatus !== "IDLE"
                                    ? (actionStatus === "APPROVED" ? "bg-green-100 text-green-700 ring-green-200" : "bg-red-100 text-red-700 ring-red-200")
                                    : (quotation.status === "APPROVED" ? "bg-green-100 text-green-700 ring-green-200" :
                                        quotation.status === "SUBMITTED" ? "bg-blue-100 text-blue-700 ring-blue-200" : "bg-slate-100 text-slate-700 ring-slate-200")
                            )}>
                                {actionStatus !== "IDLE" ? actionStatus : quotation.status}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border-light overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-background-light text-text-secondary">
                                <tr>
                                    <th className="px-4 py-2 border-b border-border-light">Test Parameter</th>
                                    <th className="px-4 py-2 border-b border-border-light text-right">Qty</th>
                                    <th className="px-4 py-2 border-b border-border-light text-right">Price</th>
                                    <th className="px-4 py-2 border-b border-border-light text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {/* Mock Line Items since we didn't mock Lines in master-data yet, simulating display */}
                                <tr>
                                    <td className="px-4 py-2">COD (Chemical Oxygen Demand)</td>
                                    <td className="px-4 py-2 text-right">5</td>
                                    <td className="px-4 py-2 text-right">75,000</td>
                                    <td className="px-4 py-2 text-right">375,000</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">pH Header</td>
                                    <td className="px-4 py-2 text-right">5</td>
                                    <td className="px-4 py-2 text-right">25,000</td>
                                    <td className="px-4 py-2 text-right">125,000</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 font-medium">
                                <tr>
                                    <td colSpan={3} className="px-4 py-2 text-right border-t border-border-light">Subtotal</td>
                                    <td className="px-4 py-2 text-right border-t border-border-light">500,000</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-4 py-2 text-right">PPN (11%)</td>
                                    <td className="px-4 py-2 text-right">55,000</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-4 py-2 text-right text-base font-bold text-text-main">Total</td>
                                    <td className="px-4 py-2 text-right text-base font-bold text-primary">IDR 555,000</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </PremiumCard>
            </div>

            {/* Sidebar: Actions */}
            <div className="space-y-6">
                <PremiumCard title="Approval Actions">
                    {quotation.status === "SUBMITTED" && actionStatus === "IDLE" ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-text-secondary mb-2">
                                Review the commercial terms above. Once approved, this quotation will be locked and sent to the customer.
                            </p>
                            <button
                                onClick={handleApprove}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-green-700"
                            >
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                Approve Quotation
                            </button>
                            <button
                                onClick={handleReject}
                                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">block</span>
                                Reject & Return
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            {(actionStatus === "APPROVED" || quotation.status === "APPROVED") ? (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-green-500 mb-2">verified</span>
                                    <p className="font-bold text-green-700">Approved</p>
                                    <p className="text-xs text-green-600 mt-1">Ready for receiving</p>
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

                <Link href="/quotations">
                    <button className="w-full mt-2 text-sm text-text-secondary hover:text-primary underline">
                        &larr; Back to List
                    </button>
                </Link>
            </div>
        </div>
    );
}
