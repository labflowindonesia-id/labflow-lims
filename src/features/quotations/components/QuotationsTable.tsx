"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_QUOTATIONS, MOCK_CUSTOMERS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useMemo } from "react";

type QuotationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "all";

export default function QuotationsTable() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<QuotationStatus>("all");
    const [customerFilter, setCustomerFilter] = useState<string>("all");
    const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");

    // Get unique customers for filter dropdown
    const uniqueCustomers = useMemo(() => {
        const customerIds = [...new Set(MOCK_QUOTATIONS.map(q => q.customer_id))];
        return customerIds.map(id => {
            const customer = MOCK_CUSTOMERS.find(c => c.id === id);
            return { id, name: customer?.name || "Unknown" };
        });
    }, []);

    // Filter and sort quotations
    const filteredQuotations = useMemo(() => {
        let result = [...MOCK_QUOTATIONS];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(quote =>
                quote.quotation_no.toLowerCase().includes(q) ||
                quote.customer_name_snapshot.toLowerCase().includes(q)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter(quote => quote.status === statusFilter);
        }

        // Customer filter
        if (customerFilter !== "all") {
            result = result.filter(quote => quote.customer_id === customerFilter);
        }

        // Date sort
        result.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateSort === "desc" ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [searchQuery, statusFilter, customerFilter, dateSort]);

    const statusOptions: { value: QuotationStatus; label: string }[] = [
        { value: "all", label: "All Status" },
        { value: "DRAFT", label: "Draft" },
        { value: "SUBMITTED", label: "Submitted" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
    ];

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
            {/* Search and Filter Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-background-dark">
                    <span className="material-symbols-outlined text-[18px] text-text-secondary">search</span>
                    <input
                        type="text"
                        placeholder="Search quote number or customer..."
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

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as QuotationStatus)}
                    className="rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-text-main dark:border-border-dark dark:bg-background-dark dark:text-white"
                >
                    {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

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

                {/* Date Sort Toggle */}
                <button
                    onClick={() => setDateSort(dateSort === "desc" ? "asc" : "desc")}
                    className="flex items-center gap-1 rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-text-main transition-colors hover:bg-background-light dark:border-border-dark dark:bg-background-dark dark:text-white dark:hover:bg-surface-dark"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {dateSort === "desc" ? "arrow_downward" : "arrow_upward"}
                    </span>
                    Date
                </button>
            </div>

            {/* Results Count */}
            <div className="mb-3 text-xs text-text-secondary">
                Showing {filteredQuotations.length} of {MOCK_QUOTATIONS.length} quotations
            </div>

            {/* Table */}
            {filteredQuotations.length > 0 ? (
                <DenseTable
                    data={filteredQuotations}
                    keyExtractor={q => q.id}
                    onRowClick={(q) => {
                        window.location.href = `/quotations/${q.id}`;
                    }}
                    columns={[
                        { header: "Quote No", accessorKey: "quotation_no", className: "font-mono font-medium" },
                        { header: "Customer", accessorKey: "customer_name_snapshot" },
                        {
                            header: "Date",
                            accessorKey: "created_at",
                            cell: q => new Date(q.created_at).toLocaleDateString()
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
                                <Link
                                    href={`/quotations/${q.id}`}
                                    className="text-primary hover:underline text-xs font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View
                                </Link>
                            )
                        }
                    ]}
                    className="border-0"
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-[48px] text-text-secondary/50">search_off</span>
                    <p className="mt-2 text-sm font-medium text-text-main dark:text-white">No quotations found</p>
                    <p className="text-xs text-text-secondary">Try adjusting your search or filter criteria</p>
                </div>
            )}
        </PremiumCard>
    );
}
