"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_WORK_ORDERS, MOCK_CUSTOMERS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useMemo } from "react";

type WorkOrderStatus = "DRAFT" | "RECEIVED_CONFIRMED" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "all";

export default function ReceivingTable() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus>("all");
    const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");

    // Filter and sort work orders
    const filteredWorkOrders = useMemo(() => {
        let result = [...MOCK_WORK_ORDERS];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(wo =>
                wo.work_order_no.toLowerCase().includes(q) ||
                wo.customer_name_snapshot.toLowerCase().includes(q)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter(wo => wo.status === statusFilter);
        }

        // Date sort
        result.sort((a, b) => {
            const dateA = new Date(a.received_date).getTime();
            const dateB = new Date(b.received_date).getTime();
            return dateSort === "desc" ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [searchQuery, statusFilter, dateSort]);

    const statusOptions: { value: WorkOrderStatus; label: string; color: string }[] = [
        { value: "all", label: "All Status", color: "" },
        { value: "DRAFT", label: "Draft", color: "bg-slate-100 text-slate-600" },
        { value: "RECEIVED_CONFIRMED", label: "Confirmed", color: "bg-blue-100 text-blue-600" },
        { value: "IN_PROGRESS", label: "In Analysis", color: "bg-primary/10 text-primary" },
        { value: "IN_REVIEW", label: "In Review", color: "bg-warning/10 text-warning" },
        { value: "COMPLETED", label: "Completed", color: "bg-success/10 text-success" },
    ];

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
            {/* Search and Filter Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-background-dark">
                    <span className="material-symbols-outlined text-[18px] text-text-secondary">search</span>
                    <input
                        type="text"
                        placeholder="Search work order or customer..."
                        className="w-full min-w-[200px] bg-transparent text-sm text-text-main placeholder:text-text-secondary focus:outline-none dark:text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="text-text-secondary hover:text-text-main"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>

                {/* Status Filter - Pills */}
                <div className="flex items-center gap-1">
                    {statusOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-medium transition-all",
                                statusFilter === opt.value
                                    ? opt.value === "all"
                                        ? "bg-primary text-white"
                                        : opt.color
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Date Sort Toggle */}
                <button
                    onClick={() => setDateSort(dateSort === "desc" ? "asc" : "desc")}
                    className="flex items-center gap-1 rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-text-main transition-colors hover:bg-background-light dark:border-border-dark dark:bg-background-dark dark:text-white"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {dateSort === "desc" ? "arrow_downward" : "arrow_upward"}
                    </span>
                    Date
                </button>
            </div>

            {/* Results Count */}
            <div className="mb-3 text-xs text-text-secondary">
                Showing {filteredWorkOrders.length} of {MOCK_WORK_ORDERS.length} work orders
            </div>

            {/* Table */}
            {filteredWorkOrders.length > 0 ? (
                <DenseTable
                    data={filteredWorkOrders}
                    keyExtractor={w => w.id}
                    onRowClick={(w) => {
                        window.location.href = `/receiving/${w.id}`;
                    }}
                    columns={[
                        { header: "Work Order", accessorKey: "work_order_no", className: "font-mono font-medium text-primary" },
                        { header: "Customer", accessorKey: "customer_name_snapshot" },
                        {
                            header: "Received",
                            accessorKey: "received_date",
                            cell: w => new Date(w.received_date).toLocaleDateString()
                        },
                        { header: "Samples", accessorKey: "sample_count", className: "text-center" },
                        {
                            header: "Status",
                            accessorKey: "status",
                            cell: (w) => (
                                <span className={cn(
                                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                    w.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                                        w.status === "IN_REVIEW" ? "bg-warning/10 text-warning" :
                                            w.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                                w.status === "RECEIVED_CONFIRMED" ? "bg-primary/10 text-primary" :
                                                    "bg-slate-100 text-slate-500"
                                )}>
                                    {w.status.replace(/_/g, " ")}
                                </span>
                            )
                        },
                        {
                            header: "Action",
                            accessorKey: "id",
                            className: "text-right",
                            cell: (w) => (
                                <Link
                                    href={`/receiving/${w.id}`}
                                    className="text-primary hover:underline text-xs font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Details
                                </Link>
                            )
                        }
                    ]}
                    className="border-0"
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-[48px] text-text-secondary/50">inventory_2</span>
                    <p className="mt-2 text-sm font-medium text-text-main dark:text-white">No work orders found</p>
                    <p className="text-xs text-text-secondary">Try adjusting your search or filter criteria</p>
                </div>
            )}
        </PremiumCard>
    );
}
