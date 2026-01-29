"use client";

import { useState, useMemo } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_WORK_ORDERS, MOCK_CUSTOMERS, MOCK_MATRICES } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ReportStatus = "DRAFT" | "PUBLISHED" | "LOCKED";

interface Report {
    id: string;
    reportNumber: string;
    version: string;
    workOrderId: string;
    workOrderNo: string;
    customerId: string;
    customerName: string;
    matrix: string;
    createdAt: Date;
    publishedAt?: Date;
    status: ReportStatus;
    isLocked: boolean;
}

export default function ReportsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCustomer, setFilterCustomer] = useState("");
    const [filterMatrix, setFilterMatrix] = useState("");
    const [filterStatus, setFilterStatus] = useState<ReportStatus | "">("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Mock published reports
    const mockReports: Report[] = useMemo(() => [
        {
            id: "rpt-001",
            reportNumber: "RPT-2024-0001",
            version: "R01",
            workOrderId: MOCK_WORK_ORDERS[0]?.id || "wo-001",
            workOrderNo: MOCK_WORK_ORDERS[0]?.work_order_no || "WO-24-0001",
            customerId: "cust-001",
            customerName: "PT Industri Maju",
            matrix: "Water",
            createdAt: new Date("2024-01-15"),
            publishedAt: new Date("2024-01-16"),
            status: "LOCKED",
            isLocked: true
        },
        {
            id: "rpt-002",
            reportNumber: "RPT-2024-0002",
            version: "R02",
            workOrderId: MOCK_WORK_ORDERS[1]?.id || "wo-002",
            workOrderNo: MOCK_WORK_ORDERS[1]?.work_order_no || "WO-24-0002",
            customerId: "cust-002",
            customerName: "CV Sejahtera Abadi",
            matrix: "Soil",
            createdAt: new Date("2024-01-20"),
            publishedAt: new Date("2024-01-21"),
            status: "PUBLISHED",
            isLocked: false
        },
        {
            id: "rpt-003",
            reportNumber: "RPT-2024-0003",
            version: "R01",
            workOrderId: MOCK_WORK_ORDERS[2]?.id || "wo-003",
            workOrderNo: MOCK_WORK_ORDERS[2]?.work_order_no || "WO-24-0003",
            customerId: "cust-001",
            customerName: "PT Industri Maju",
            matrix: "Wastewater",
            createdAt: new Date("2024-02-01"),
            status: "DRAFT",
            isLocked: false
        }
    ], []);

    // Pending generation (work orders not yet having reports)
    const pendingOrders = MOCK_WORK_ORDERS.filter(wo => wo.status === "COMPLETED" || wo.status === "IN_PROGRESS");

    // Filter reports
    const filteredReports = useMemo(() => {
        let result = [...mockReports];

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
    }, [mockReports, searchQuery, filterCustomer, filterMatrix, filterStatus, dateFrom, dateTo]);

    const statusColors: Record<ReportStatus, string> = {
        DRAFT: "bg-warning/20 text-warning",
        PUBLISHED: "bg-success/20 text-success",
        LOCKED: "bg-slate-100 text-slate-600 dark:bg-white/10"
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
                            { header: "Order", accessorKey: "work_order_no", className: "font-mono" },
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
                            {MOCK_CUSTOMERS.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <select
                            className="text-sm border border-border-light rounded-md px-3 py-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                            value={filterMatrix}
                            onChange={(e) => setFilterMatrix(e.target.value)}
                        >
                            <option value="">All Matrices</option>
                            {MOCK_MATRICES.map(m => (
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
                            <option value="PUBLISHED">Published</option>
                            <option value="LOCKED">Locked</option>
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
                                            {r.version}
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
                                            <button className="text-primary hover:underline text-xs">View</button>
                                            <button className="text-primary hover:underline text-xs">Download</button>
                                            {!r.isLocked && (
                                                <button className="text-warning hover:underline text-xs">Revise</button>
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
