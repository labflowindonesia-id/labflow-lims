"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { useWorkOrders, useCustomers } from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useMemo } from "react";
import { WorkOrderStatus } from "@/types/master-data";

type FilterStatus = WorkOrderStatus | "all";

export default function ReceivingTable() {
    const { data: workOrders = [], isLoading } = useWorkOrders();
    const { data: customers = [] } = useCustomers();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
    const [customerFilter, setCustomerFilter] = useState<string>("all");
    const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");

    // Get unique customers for filter dropdown
    const uniqueCustomers = useMemo(() => {
        const customerIds = [...new Set(workOrders.map(w => w.customer_id))];
        return customerIds.map(id => {
            const customer = customers.find(c => c.id === id);
            return { id, name: customer?.name || "Unknown" };
        });
    }, [workOrders, customers]);

    // Filter and sort work orders
    const filteredWorkOrders = useMemo(() => {
        let result = [...workOrders];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(wo =>
                wo.work_order_number.toLowerCase().includes(q) ||
                (wo.customer_name_snapshot || "").toLowerCase().includes(q)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter(wo => wo.status === statusFilter);
        }

        // Customer filter
        if (customerFilter !== "all") {
            result = result.filter(wo => wo.customer_id === customerFilter);
        }

        // Date range filter
        if (dateFrom) {
            const from = new Date(dateFrom).getTime();
            result = result.filter(wo => new Date(wo.received_date).getTime() >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo).getTime() + 86400000;
            result = result.filter(wo => new Date(wo.received_date).getTime() <= to);
        }

        // Date sort
        result.sort((a, b) => {
            const dateA = new Date(a.received_date).getTime();
            const dateB = new Date(b.received_date).getTime();
            return dateSort === "desc" ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [workOrders, searchQuery, statusFilter, customerFilter, dateSort, dateFrom, dateTo]);

    const statusOptions: { value: FilterStatus; label: string; color: string }[] = [
        { value: "all", label: "All Status", color: "" },
        { value: "RECEIVED", label: "Received", color: "bg-blue-100 text-blue-600" },
        { value: "IN_PROGRESS", label: "In Progress", color: "bg-primary/10 text-primary" },
        { value: "COMPLETED", label: "Completed", color: "bg-success/10 text-success" },
        { value: "CANCELLED", label: "Cancelled", color: "bg-slate-100 text-slate-600" },
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

                {/* Customer Filter */}
                <select
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    className="rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-text-main dark:border-border-dark dark:bg-background-dark dark:text-white"
                >
                    <option value="all">All Customers</option>
                    {uniqueCustomers.map(cust => (
                        <option key={cust.id} value={cust.id}>{cust.name}</option>
                    ))}
                </select>

                {/* Date Range Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">From:</span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-lg border border-border-light bg-white px-2 py-1.5 text-sm text-text-main dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                    <span className="text-xs text-text-secondary">To:</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-lg border border-border-light bg-white px-2 py-1.5 text-sm text-text-main dark:border-border-dark dark:bg-background-dark dark:text-white"
                    />
                    {(dateFrom || dateTo) && (
                        <button
                            onClick={() => { setDateFrom(""); setDateTo(""); }}
                            className="text-xs text-text-secondary hover:text-primary"
                        >
                            Clear
                        </button>
                    )}
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
                {isLoading ? "Loading..." : `Showing ${filteredWorkOrders.length} of ${workOrders.length} work orders`}
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
                        { header: "Work Order", accessorKey: "work_order_number", className: "font-mono font-medium text-primary" },
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
                                        w.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                            w.status === "RECEIVED" ? "bg-primary/10 text-primary" :
                                                w.status === "CANCELLED" ? "bg-slate-100 text-slate-500" :
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
