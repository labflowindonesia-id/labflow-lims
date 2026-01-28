import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_WORK_ORDERS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ReceivingTable() {
    return (
        <PremiumCard
            title="Receiving Log"
            subtitle="Track incoming samples and work orders"
            action={
                <Link href="/receiving/create">
                    <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-hover">
                        <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                        Accession Samples
                    </button>
                </Link>
            }
        >
            <DenseTable
                data={MOCK_WORK_ORDERS}
                keyExtractor={w => w.id}
                columns={[
                    { header: "Work Order", accessorKey: "work_order_no", className: "font-mono font-medium text-primary" },
                    { header: "Customer", accessorKey: "customer_name_snapshot" },
                    {
                        header: "Received",
                        accessorKey: "received_date",
                        cell: w => w.received_date.toLocaleDateString()
                    },
                    { header: "Samples", accessorKey: "sample_count", className: "text-center" },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (w) => (
                            <span className={cn(
                                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                w.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 animate-pulse" :
                                    w.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                        "bg-slate-100 text-slate-500"
                            )}>
                                {w.status.replace("_", " ")}
                            </span>
                        )
                    },
                    {
                        header: "Action",
                        accessorKey: "id",
                        className: "text-right",
                        cell: (w) => (
                            <Link href={`/receiving/${w.id}`} className="text-primary hover:underline text-xs font-semibold">
                                Details
                            </Link>
                        )
                    }
                ]}
                className="border-0"
            />
        </PremiumCard>
    );
}
