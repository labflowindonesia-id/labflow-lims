import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_QUOTATIONS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function QuotationsTable() {
    return (
        <PremiumCard
            title="Quotation History"
            subtitle="Manage sales proposals and contracts"
            action={
                <Link href="/quotations/create">
                    <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-hover">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        New Quote
                    </button>
                </Link>
            }
        >
            <DenseTable
                data={MOCK_QUOTATIONS}
                keyExtractor={q => q.id}
                columns={[
                    { header: "Quote No", accessorKey: "quotation_no", className: "font-mono font-medium" },
                    { header: "Customer", accessorKey: "customer_name_snapshot" },
                    {
                        header: "Date",
                        accessorKey: "created_at",
                        cell: q => q.created_at.toLocaleDateString()
                    },
                    {
                        header: "Total",
                        accessorKey: "total_amount",
                        className: "text-right font-mono",
                        cell: q => `IDR ${q.total_amount.toLocaleString()}`
                    },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (q) => (
                            <span className={cn(
                                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                q.status === "APPROVED" ? "bg-green-100 text-green-700" :
                                    q.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                                        q.status === "REJECTED" ? "bg-red-100 text-red-700" :
                                            "bg-slate-100 text-slate-500"
                            )}>
                                {q.status}
                            </span>
                        )
                    },
                    {
                        header: "Action",
                        accessorKey: "id",
                        className: "text-right",
                        cell: (q) => (
                            <Link href={`/quotations/${q.id}`} className="text-primary hover:underline text-xs font-semibold">
                                View
                            </Link>
                        )
                    }
                ]}
                className="border-0"
            />
        </PremiumCard>
    );
}
