"use client";

import { useState, useMemo } from "react";
import { useWorkOrders, useCustomers } from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { WorkOrder } from "@/types/database";

// Define the order of statuses for sorting
const STATUS_ORDER: Record<string, number> = {
    DRAFT: 0,
    QUOTATION_PENDING: 1,
    QUOTATION_APPROVED: 2,
    RECEIVED_CONFIRMED: 3,
    IN_ANALYSIS: 4,
    COMPLETED: 5,
    CANCELLED: 6
};

// Helper for status badge formatting
const getStatusBadge = (status: string) => {
    switch (status) {
        case "DRAFT":
            return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Draft</span>;
        case "QUOTATION_PENDING":
        case "QUOTATION_APPROVED":
            return <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{status.replace("_", " ")}</span>;
        case "RECEIVED_CONFIRMED":
            return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">Confirmed (Sample Received)</span>;
        case "IN_ANALYSIS":
            return <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">In Analysis</span>;
        case "COMPLETED":
            return <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success dark:bg-success/20">Completed</span>;
        case "CANCELLED":
            return <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-1 text-xs font-semibold text-danger dark:bg-danger/20">Cancelled</span>;
        default:
            return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{status}</span>;
    }
};

export default function WorkOrderListTable() {
    const { data: workOrders, isLoading: woLoading } = useWorkOrders();
    const { data: customers, isLoading: customersLoading } = useCustomers();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const isLoading = woLoading || customersLoading;

    // Filter and sort the data
    const filteredOrders = useMemo(() => {
        if (!workOrders) return [];

        let result = [...workOrders];

        // Apply Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(wo => {
                const customerName = wo.customer_name_snapshot?.toLowerCase() || '';
                return wo.work_order_number.toLowerCase().includes(q) || customerName.includes(q);
            });
        }

        // Apply Status Filter
        if (statusFilter !== "ALL") {
            result = result.filter(wo => wo.status === statusFilter);
        }

        // Sort: Draft -> Quoted -> Received -> Analysis -> Completed -> Cancelled
        // And then by creation date, newest first
        result.sort((a, b) => {
            const statusDiff = (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
            if (statusDiff !== 0) return statusDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        return result;
    }, [workOrders, searchQuery, statusFilter]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark">
                <p className="text-text-secondary">Loading work orders data...</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Filters Row */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-secondary">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search by WO Number or Customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-border-light bg-surface-light py-2 pl-10 pr-4 text-sm text-text-main shadow-sm placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-surface-dark dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border border-border-light bg-surface-light py-2 pl-3 pr-8 text-sm text-text-main shadow-sm focus:border-primary focus:outline-none dark:border-border-dark dark:bg-surface-dark dark:text-white"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="QUOTATION_PENDING">Quotation Pending</option>
                        <option value="QUOTATION_APPROVED">Quotation Approved</option>
                        <option value="RECEIVED_CONFIRMED">Sample Received</option>
                        <option value="IN_ANALYSIS">In Analysis</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-background-light font-medium text-text-secondary dark:bg-black/20">
                            <tr>
                                <th className="border-b border-border-light px-6 py-4 dark:border-border-dark">Work Order #</th>
                                <th className="border-b border-border-light px-6 py-4 dark:border-border-dark">Date Created</th>
                                <th className="border-b border-border-light px-6 py-4 dark:border-border-dark">Customer</th>
                                <th className="border-b border-border-light px-6 py-4 text-center dark:border-border-dark">Status</th>
                                <th className="w-[100px] border-b border-border-light px-6 py-4 text-right dark:border-border-dark">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                                        No work orders found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((wo) => {
                                    // Derive where to look at this WO. If Quoted -> Quotes page view.
                                    // Normally the source of truth is Quotation page or Receiving.
                                    // For Master List, we can route to Quotation view since it contains WO details.
                                    const actionLink = wo.quotation_id ? `/quotations/${wo.quotation_id}` : `/work-orders`;

                                    return (
                                        <tr key={wo.id} className="group transition-colors hover:bg-background-light dark:hover:bg-background-dark">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors">
                                                    {wo.work_order_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                    {new Date(wo.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-text-main dark:text-white">
                                                    {wo.customer_name_snapshot || "Unknown Customer"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(wo.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={actionLink}>
                                                    <button className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-white hover:text-primary dark:hover:bg-surface-light">
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
