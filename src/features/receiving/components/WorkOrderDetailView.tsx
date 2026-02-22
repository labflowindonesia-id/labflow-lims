"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { useWorkOrder } from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface WorkOrderDetailProps {
    id: string;
}

export default function WorkOrderDetailView({ id }: WorkOrderDetailProps) {
    const { data: wo, isLoading } = useWorkOrder(id);

    if (isLoading) {
        return <div className="animate-pulse space-y-6"><div className="h-48 bg-slate-200 rounded-xl"></div></div>;
    }

    if (!wo) {
        return <div className="p-8 text-center text-red-500">Work Order not found</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content: Info & Sample List */}
            <div className="lg:col-span-2 space-y-6">
                <PremiumCard
                    title={`Work Order ${wo.work_order_number}`}
                    action={
                        <span className={cn(
                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            wo.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 ring-blue-200" :
                                wo.status === "COMPLETED" ? "bg-green-100 text-green-700 ring-green-200" :
                                    "bg-slate-100 text-slate-700 ring-slate-200"
                        )}>
                            {wo.status.replace("_", " ")}
                        </span>
                    }
                >
                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div>
                            <p className="text-text-secondary">Customer</p>
                            <p className="font-semibold text-text-main">{wo.customer_name_snapshot}</p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Received Date</p>
                            <p className="font-medium text-text-main">{new Date(wo.received_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Related Quote</p>
                            <Link href={`/quotations/${wo.quotation_id}`} className="text-primary hover:underline">
                                View Quote
                            </Link>
                        </div>
                        <div>
                            <p className="text-text-secondary">Samples</p>
                            <p className="font-medium text-text-main">{wo.sample_count} Samples Registered</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border-light bg-background-light/50 p-4">
                        <h4 className="text-sm font-bold text-text-main mb-3">Sample List</h4>
                        {/* Mock Sample List - since we haven't seeded specific samples separately yet */}
                        <div className="space-y-2">
                            {[...Array(wo.sample_count)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm border border-border-light">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-main">Sample-{wo.work_order_number}-{i + 1}</p>
                                            <p className="text-[10px] text-text-secondary">Water Waste • 500ml Glass Bottle</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        In Lab
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </PremiumCard>
            </div>

            {/* Sidebar: Documents & Actions */}
            <div className="space-y-6">
                <PremiumCard title="Documents">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-md border border-border-light bg-slate-50">
                            <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                            <div>
                                <p className="text-sm font-medium text-text-main">Chain of Custody.pdf</p>
                                <p className="text-xs text-text-secondary">Uploaded Jan 22, 10:00 AM</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-md border border-border-light bg-slate-50">
                            <span className="material-symbols-outlined text-blue-500">description</span>
                            <div>
                                <p className="text-sm font-medium text-text-main">Sampling_Log.docx</p>
                                <p className="text-xs text-text-secondary">Uploaded Jan 22, 10:05 AM</p>
                            </div>
                        </div>
                    </div>
                </PremiumCard>

                <PremiumCard title="Quick Actions">
                    <div className="grid grid-cols-1 gap-3">
                        <button className="flex items-center gap-3 rounded-lg border border-border-light p-3 text-left hover:bg-slate-50">
                            <span className="material-symbols-outlined text-slate-600">print</span>
                            <div>
                                <p className="text-xs font-bold text-text-main">Print Barcode Labels</p>
                                <p className="text-[10px] text-text-secondary">For {wo.sample_count} samples</p>
                            </div>
                        </button>
                        <button className="flex items-center gap-3 rounded-lg border border-border-light p-3 text-left hover:bg-slate-50">
                            <span className="material-symbols-outlined text-slate-600">receipt_long</span>
                            <div>
                                <p className="text-xs font-bold text-text-main">Print Receipt</p>
                                <p className="text-[10px] text-text-secondary">Client Copy</p>
                            </div>
                        </button>
                    </div>
                </PremiumCard>

                <Link href="/receiving">
                    <button className="w-full mt-2 text-sm text-text-secondary hover:text-primary underline">
                        &larr; Back to Order List
                    </button>
                </Link>
            </div>
        </div>
    );
}
