import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_WORK_ORDERS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

interface Props {
    onSelectWO?: (woId: string) => void;
}

export default function ResultsReviewTable({ onSelectWO }: Props) {
    // Mock Logic: In real app, we filter WOs where all tests are complete but status IS NOT 'COMPLETED'
    // For demo, we just show IN_PROGRESS ones
    const reviewQueue = MOCK_WORK_ORDERS.filter(w => w.status === "IN_PROGRESS");

    return (
        <PremiumCard
            title="Results Review Queue"
            subtitle="Batch approval for completed analysis"
            action={
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> In Progress
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Ready
                    </span>
                </div>
            }
        >
            {reviewQueue.length === 0 ? (
                <div className="flex bg-slate-50 flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-slate-300">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">done_all</span>
                    <p className="text-sm font-medium text-slate-500">All Clear!</p>
                    <p className="text-xs text-slate-400">No results pending review.</p>
                </div>
            ) : (
                <DenseTable
                    data={reviewQueue}
                    keyExtractor={w => w.id}
                    columns={[
                        { header: "Order #", accessorKey: "work_order_no", className: "font-mono font-medium" },
                        { header: "Customer", accessorKey: "customer_name_snapshot" },
                        {
                            header: "Received",
                            accessorKey: "received_date",
                            cell: w => w.received_date.toLocaleDateString()
                        },
                        {
                            header: "Progress",
                            accessorKey: "sample_count",
                            cell: (w) => (
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[80%]"></div> {/* Mock Progress */}
                                    </div>
                                    <span className="text-[10px] font-medium text-text-secondary">80%</span>
                                </div>
                            )
                        },
                        {
                            header: "QC Status",
                            accessorKey: "id",
                            cell: () => (
                                <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                    PASS
                                </span>
                            )
                        },
                        {
                            header: "Action",
                            accessorKey: "id",
                            className: "text-right",
                            cell: (w) => (
                                <button
                                    onClick={() => onSelectWO?.(w.id)}
                                    className="rounded bg-white border border-border-light px-3 py-1 text-xs font-bold text-text-secondary shadow-sm hover:bg-slate-50 hover:text-primary hover:border-primary"
                                >
                                    Review Details
                                </button>
                            )
                        }
                    ]}
                    className="border-0"
                />
            )}
        </PremiumCard>
    );
}

