import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_QUOTATIONS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function QuotationsReviewTable() {
    // Filter only SUBMITTED quotes
    const submittedQuotes = MOCK_QUOTATIONS.filter(q => q.status === "SUBMITTED");

    return (
        <PremiumCard
            title="Contract Review Queue"
            subtitle="Pending approval for sales quotations"
        >
            {submittedQuotes.length === 0 ? (
                <div className="flex bg-slate-50 flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-slate-300">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment_turned_in</span>
                    <p className="text-sm font-medium text-slate-500">All caught up!</p>
                    <p className="text-xs text-slate-400">No quotations pending review.</p>
                </div>
            ) : (
                <DenseTable
                    data={submittedQuotes}
                    keyExtractor={q => q.id}
                    columns={[
                        { header: "Quote No", accessorKey: "quotation_no", className: "font-mono font-medium" },
                        { header: "Customer", accessorKey: "customer_name_snapshot" },
                        {
                            header: "Submitted",
                            accessorKey: "created_at",
                            cell: q => q.created_at.toLocaleDateString()
                        },
                        {
                            header: "Total Value",
                            accessorKey: "total_amount",
                            className: "text-right font-mono font-medium text-text-main",
                            cell: q => `IDR ${q.total_amount.toLocaleString()}`
                        },
                        {
                            header: "Action",
                            accessorKey: "id",
                            className: "text-right",
                            cell: (q) => (
                                <Link href={`/quotations/${q.id}`}>
                                    <button className="rounded bg-primary px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-primary-hover">
                                        Review
                                    </button>
                                </Link>
                            )
                        }
                    ]}
                    className="border-0"
                />
            )}
        </PremiumCard>
    );
}
