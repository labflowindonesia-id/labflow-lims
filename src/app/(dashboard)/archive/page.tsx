"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { Input } from "@/components/ui/Input";
import { DenseTable } from "@/components/ui/DenseTable";
import { useWorkOrders, useReports } from "@/hooks/use-supabase";
import type { ReportStatus } from "@/types/database";

interface ArchivedReportView {
    id: string;
    reportNumber: string;
    version: number;
    workOrderId: string;
    workOrderNo: string;
    customerId: string;
    customerName: string;
    matrix: string;
    completedDate: Date;
    status: ReportStatus;
}

export default function ArchivePage() {
    const { data: workOrders = [] } = useWorkOrders();
    const { data: dbReports = [] } = useReports();

    const [searchQuery, setSearchQuery] = useState("");
    const [filterYear, setFilterYear] = useState<string>("all");

    // Filtered data to only include "archived" (i.e. finalized / released)
    // We assume RELEASED is the final state. We also check for LOCKED or if WorkOrder is COMPLETED.
    const archivedReports = useMemo(() => {
        return dbReports
            .filter((r) => r.status === "RELEASED" || r.status === "LOCKED")
            .map((r) => {
                const wo = workOrders.find((w) => w.id === r.work_order_id);
                return {
                    id: r.id,
                    reportNumber: r.report_number,
                    version: r.revision_number || 1,
                    workOrderId: r.work_order_id,
                    workOrderNo: wo?.work_order_number || "-",
                    customerId: wo?.customer_id || "-",
                    customerName: wo?.customer_name_snapshot || "-",
                    matrix: "—", // typically sample details are inner nested
                    completedDate: new Date(r.updated_at || r.created_at),
                    status: r.status,
                };
            })
            // Sort by most recent completed date
            .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
    }, [dbReports, workOrders]);

    // Unique years for the filter dropdown
    const years = useMemo(() => {
        const yearSet = new Set(
            archivedReports.map((item) => item.completedDate.getFullYear().toString())
        );
        return Array.from(yearSet).sort().reverse();
    }, [archivedReports]);

    // Final filtered view data
    const filteredData = useMemo(() => {
        let result = [...archivedReports];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
                    item.reportNumber.toLowerCase().includes(query) ||
                    item.workOrderNo.toLowerCase().includes(query) ||
                    item.customerName.toLowerCase().includes(query)
            );
        }

        if (filterYear !== "all") {
            result = result.filter(
                (item) => item.completedDate.getFullYear().toString() === filterYear
            );
        }

        return result;
    }, [archivedReports, searchQuery, filterYear]);

    // Simple handler for placeholder download buttons
    const handleDownloadDocument = (docType: string, reportNo: string) => {
        alert(`Generating/Downloading ${docType} for report ${reportNo}...`);
    };

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Document Archive"
                description="Finalized reports and supporting documents"
            />

            <div className="mx-auto max-w-6xl space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
                        <p className="text-xs text-text-secondary">Total Archived Reports</p>
                        <p className="text-2xl font-bold text-text-main dark:text-white">
                            {archivedReports.length}
                        </p>
                    </div>
                    {/* Placeholder for future sizing implementations */}
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark col-span-2 md:col-span-3 flex items-center">
                        <span className="material-symbols-outlined text-success mr-2">check_circle</span>
                        <p className="text-sm text-text-secondary">
                            All documents are secured and finalized.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <PremiumCard>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Search Report #, Work Order, Customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                icon="search"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-text-secondary">Year:</span>
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="text-sm border border-border-light rounded-lg px-3 py-2 bg-white dark:bg-surface-dark dark:border-border-dark focus:outline-none focus:border-primary"
                            >
                                <option value="all">All Years</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setFilterYear("all");
                            }}
                            className="text-sm text-text-secondary hover:text-text-main flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[16px]">clear_all</span>
                            Clear
                        </button>
                    </div>
                </PremiumCard>

                {/* Archive Table */}
                <PremiumCard title="Archived Documents" subtitle={`${filteredData.length} records found`}>
                    <DenseTable
                        data={filteredData}
                        keyExtractor={(r) => r.id}
                        columns={[
                            {
                                header: "Report #",
                                accessorKey: "reportNumber",
                                className: "font-mono font-medium text-primary",
                            },
                            {
                                header: "Version",
                                accessorKey: "version",
                                cell: (r) => (
                                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">
                                        R{r.version.toString().padStart(2, "0")}
                                    </span>
                                )
                            },
                            {
                                header: "Work Order",
                                accessorKey: "workOrderNo",
                                className: "font-mono text-xs",
                            },
                            {
                                header: "Customer",
                                accessorKey: "customerName",
                            },
                            {
                                header: "Completed Date",
                                accessorKey: "completedDate",
                                cell: (r) => r.completedDate.toLocaleDateString(),
                            },
                            {
                                header: "Documents to Download",
                                className: "w-[300px]",
                                cell: (row) => (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadDocument("Sample Form", row.reportNumber);
                                            }}
                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded border border-transparent hover:border-border-light dark:hover:border-border-dark flex items-center gap-1 text-xs text-text-secondary transition-colors"
                                            title="Download Sample Submission Form"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">science</span>
                                            <span>Sample</span>
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadDocument("Quotation Form", row.reportNumber);
                                            }}
                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded border border-transparent hover:border-border-light dark:hover:border-border-dark flex items-center gap-1 text-xs text-text-secondary transition-colors"
                                            title="Download Quotation Form"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">request_quote</span>
                                            <span>Quote</span>
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadDocument("Test Result Form", row.reportNumber);
                                            }}
                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded border border-transparent hover:border-border-light dark:hover:border-border-dark flex items-center gap-1 text-xs text-text-secondary transition-colors"
                                            title="Download Test Result Worksheet"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">fact_check</span>
                                            <span>Results</span>
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadDocument("Final Report CoA", row.reportNumber);
                                            }}
                                            className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded border border-transparent hover:border-primary/30 flex items-center gap-1 text-xs font-semibold transition-colors"
                                            title="Download Final Report (CoA)"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">verified</span>
                                            <span>CoA</span>
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </PremiumCard>
            </div>
        </div>
    );
}
