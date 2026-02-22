"use client";

import { useState, useMemo } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { useWorkOrders, useCustomers, useSampleMatrices, useReports } from "@/hooks/use-supabase";
import type { ReportStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Map db reports to the view model
interface ReportView {
    id: string;
    reportNumber: string;
    version: number;
    workOrderId: string;
    workOrderNo: string;
    customerId: string;
    customerName: string;
    matrix: string;
    createdAt: Date;
    status: ReportStatus;
    isLocked: boolean;
}

export default function ReportsPage() {
    const { data: workOrders = [] } = useWorkOrders();
    const { data: customers = [] } = useCustomers();
    const { data: matrices = [] } = useSampleMatrices();
    const { data: dbReports = [] } = useReports();

    const [searchQuery, setSearchQuery] = useState("");
    const [filterCustomer, setFilterCustomer] = useState("");
    const [filterMatrix, setFilterMatrix] = useState("");
    const [filterStatus, setFilterStatus] = useState<ReportStatus | "">("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Map dbReports to view model
    const mappedReports: ReportView[] = useMemo(() => {
        return dbReports.map(r => {
            const wo = workOrders.find(w => w.id === r.work_order_id);
            return {
                id: r.id,
                reportNumber: r.report_number,
                version: r.revision_number,
                workOrderId: r.work_order_id,
                workOrderNo: wo?.work_order_number || "-",
                customerId: wo?.customer_id || "-",
                customerName: wo?.customer_name_snapshot || "-",
                matrix: "—", // Details normally at sample level
                createdAt: new Date(r.created_at),
                status: r.status,
                isLocked: r.is_locked
            };
        });
    }, [dbReports, workOrders]);

    // Pending generation (work orders not yet having reports)
    const pendingOrders = useMemo(() => {
        return workOrders.filter(wo =>
            (wo.status === "COMPLETED") &&
            !dbReports.some(r => r.work_order_id === wo.id)
        );
    }, [workOrders, dbReports]);

    // Filter reports
    const filteredReports = useMemo(() => {
        let result = [...mappedReports];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.reportNumber.toLowerCase().includes(q) ||
                r.workOrderNo.toLowerCase().includes(q) ||
                r.customerName.toLowerCase().includes(q)
            );
        }

        if (filterCustomer) result = result.filter(r => r.customerId === filterCustomer);
        if (filterMatrix) result = result.filter(r => r.matrix.toLowerCase() === filterMatrix.toLowerCase());
        if (filterStatus) result = result.filter(r => r.status === filterStatus);

        if (dateFrom) {
            const from = new Date(dateFrom);
            result = result.filter(r => r.createdAt >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            result = result.filter(r => r.createdAt <= to);
        }

        return result;
    }, [mappedReports, searchQuery, filterCustomer, filterMatrix, filterStatus, dateFrom, dateTo]);

    const statusColors: Record<ReportStatus, string> = {
        DRAFT: "bg-slate-100 text-slate-600 dark:bg-white/10",
        SUBMITTED: "bg-info/20 text-info",
        REVISION_REQUESTED: "bg-warning/20 text-warning",
        APPROVED: "bg-success/20 text-success",
        LOCKED: "bg-slate-200 text-slate-700 dark:bg-white/20",
        RELEASED: "bg-success/20 text-success"
    };

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Reports & Certificates"
                description="Manage official certificates of analysis"
                actions={
                    <div className="flex gap-2">
                        <button className="rounded-lg bg-white border border-border-light px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-slate-50 dark:bg-surface-dark dark:border-border-dark">
                            <span className="material-symbols-outlined text-[14px] mr-1 align-middle">download</span>
                            Export List
                        </button>
                    </div>
                }
            />

            <div className="mx-auto max-w-6xl space-y-6">
                {/* Pending Generation Block */}
                <PremiumCard
                    title="Pending Generation"
                    subtitle="Work orders ready for report creation"
                    className="border-l-4 border-l-primary"
                    action={
                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold">
                            {pendingOrders.length} pending
                        </span>
                    }
                >
                    <DenseTable
                        data={pendingOrders.slice(0, 5)}
                        keyExtractor={w => w.id}
                        columns={[
                            { header: "Order", accessorKey: "work_order_number", className: "font-mono" },
                            { header: "Customer", accessorKey: "customer_name_snapshot" },
                            {
                                header: "Status",
                                accessorKey: "status",
                                cell: w => (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-bold",
                                        w.status === "COMPLETED" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
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
                                    <Link href={`/reports/create/${w.id}`}>
                                        <button className="rounded bg-primary px-3 py-1 text-xs font-bold text-white shadow hover:bg-primary-hover">
                                            Generate CoA
                                        </button>
                                    </Link>
                                )
                            }
                        ]}
                    />
                </PremiumCard>

                {/* Report History with Search/Filter */}
                <PremiumCard
                    title="Report History"
                    subtitle="Published and draft reports"
                >
                    {/* Search & Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border-light dark:border-border-dark">
                        {/* Search */}
                        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-background-dark">
                            <span className="material-symbols-outlined text-[18px] text-text-secondary">search</span>
                            <input
                                type="text"
                                placeholder="Search report number, order, customer..."
                                className="w-full min-w-[150px] bg-transparent text-sm text-text-main placeholder:text-text-secondary focus:outline-none dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <select
                            className="text-sm border border-border-light rounded-md px-3 py-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                            value={filterCustomer}
                            onChange={(e) => setFilterCustomer(e.target.value)}
                        >
                            <option value="">All Customers</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <select
                            className="text-sm border border-border-light rounded-md px-3 py-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                            value={filterMatrix}
                            onChange={(e) => setFilterMatrix(e.target.value)}
                        >
                            <option value="">All Matrices</option>
                            {matrices.map(m => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                        </select>

                        <select
                            className="text-sm border border-border-light rounded-md px-3 py-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as ReportStatus | "")}
                        >
                            <option value="">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="REVISION_REQUESTED">Revision Req.</option>
                            <option value="APPROVED">Approved</option>
                            <option value="LOCKED">Locked</option>
                            <option value="RELEASED">Released</option>
                        </select>

                        {/* Date Range */}
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="text-sm border border-border-light rounded-md px-2 py-1.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <span className="text-xs text-text-secondary">to</span>
                            <input
                                type="date"
                                className="text-sm border border-border-light rounded-md px-2 py-1.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>

                    {filteredReports.length > 0 ? (
                        <DenseTable
                            data={filteredReports}
                            keyExtractor={r => r.id}
                            columns={[
                                {
                                    header: "Report #",
                                    accessorKey: "reportNumber",
                                    className: "font-mono font-medium",
                                    cell: r => (
                                        <div className="flex items-center gap-2">
                                            {r.isLocked && (
                                                <span className="material-symbols-outlined text-[14px] text-text-secondary">lock</span>
                                            )}
                                            {r.reportNumber}
                                        </div>
                                    )
                                },
                                {
                                    header: "Version",
                                    accessorKey: "version",
                                    cell: r => (
                                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">
                                            R{r.version.toString().padStart(2, "0")}
                                        </span>
                                    )
                                },
                                { header: "Work Order", accessorKey: "workOrderNo", className: "font-mono text-xs" },
                                { header: "Customer", accessorKey: "customerName" },
                                { header: "Matrix", accessorKey: "matrix", className: "text-sm" },
                                {
                                    header: "Date",
                                    accessorKey: "createdAt",
                                    cell: r => r.createdAt.toLocaleDateString()
                                },
                                {
                                    header: "Status",
                                    accessorKey: "status",
                                    cell: r => (
                                        <span className={cn("px-2 py-0.5 rounded text-xs font-bold", statusColors[r.status])}>
                                            {r.status}
                                        </span>
                                    )
                                },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    className: "text-right",
                                    cell: r => (
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/portal/reports/${r.id}`}>
                                                <button className="text-primary hover:underline text-xs">View</button>
                                            </Link>
                                            <button className="text-primary hover:underline text-xs">Download</button>
                                            {!r.isLocked && (
                                                <Link href={`/reports/create/${r.workOrderId}`}>
                                                    <button className="text-warning hover:underline text-xs">Revise</button>
                                                </Link>
                                            )}
                                        </div>
                                    )
                                }
                            ]}
                        />
                    ) : (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-[48px] text-text-secondary/50">description</span>
                            <p className="mt-2 text-sm font-medium text-text-main dark:text-white">No reports found</p>
                            <p className="text-xs text-text-secondary">Try adjusting your filters</p>
                        </div>
                    )}
                </PremiumCard>
            </div>
        </div>
    );
}
