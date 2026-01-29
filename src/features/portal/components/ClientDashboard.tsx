"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_WORK_ORDERS, MOCK_TASKS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

type OrderStatus = "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED";

interface SampleProgress {
    id: string;
    name: string;
    testsTotal: number;
    testsCompleted: number;
    status: "received" | "in_analysis" | "in_review" | "completed";
}

export default function ClientDashboard() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<"all" | "report" | "sample" | "date">("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [matrixFilter, setMatrixFilter] = useState<string>("");
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
    const [selectedForDownload, setSelectedForDownload] = useState<Set<string>>(new Set());

    // Matrix types for filter
    const matrixTypes = [
        { value: "", label: "All Matrix Types" },
        { value: "WATER", label: "Water" },
        { value: "SOIL", label: "Soil" },
        { value: "AIR", label: "Air" },
        { value: "FOOD", label: "Food" },
        { value: "OTHER", label: "Other" },
    ];

    // Mock matrix type mapping for orders
    const getMatrixType = (orderId: string): string => {
        const matrixMap: Record<string, string> = {
            "wo-001": "WATER",
            "wo-002": "FOOD",
            "wo-003": "AIR",
            "wo-004": "SOIL",
            "wo-005": "WATER",
        };
        return matrixMap[orderId] || "OTHER";
    };

    // Mock report numbers for completed orders
    const getReportNumber = (orderId: string): string | null => {
        const reportMap: Record<string, string> = {
            "wo-001": "RPT-2025-0001",
            "wo-002": "RPT-2025-0002",
            "wo-003": "RPT-2025-0003",
        };
        return reportMap[orderId] || null;
    };

    // Mock sample names for orders
    const getSampleNames = (orderId: string): string[] => {
        const sampleMap: Record<string, string[]> = {
            "wo-001": ["Water Sample A-1", "Water Sample A-2", "Soil Sample B-1"],
            "wo-002": ["Food Sample F-1", "Food Sample F-2"],
            "wo-003": ["Air Sample X-1"],
        };
        return sampleMap[orderId] || [`Sample ${orderId}`];
    };

    // Filter for logged in customer (Mock: cust-001)
    const myOrders = useMemo(() => {
        let orders = MOCK_WORK_ORDERS.filter(w => w.customer_id === "cust-001");

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            orders = orders.filter(w => {
                switch (searchType) {
                    case "report":
                        const reportNo = getReportNumber(w.id);
                        return reportNo?.toLowerCase().includes(q);
                    case "sample":
                        const samples = getSampleNames(w.id);
                        return samples.some(s => s.toLowerCase().includes(q));
                    default:
                        // Search all fields
                        const report = getReportNumber(w.id);
                        const sampleNames = getSampleNames(w.id);
                        return (
                            w.work_order_no.toLowerCase().includes(q) ||
                            w.id.toLowerCase().includes(q) ||
                            (report && report.toLowerCase().includes(q)) ||
                            sampleNames.some(s => s.toLowerCase().includes(q))
                        );
                }
            });
        }

        if (dateFrom) {
            const from = new Date(dateFrom);
            orders = orders.filter(w => w.received_date >= from);
        }

        if (dateTo) {
            const to = new Date(dateTo);
            orders = orders.filter(w => w.received_date <= to);
        }

        // Matrix filter
        if (matrixFilter) {
            orders = orders.filter(w => getMatrixType(w.id) === matrixFilter);
        }

        return orders;
    }, [searchQuery, searchType, dateFrom, dateTo, matrixFilter]);

    // Get samples for selected order (mock generated)
    const orderSamples = useMemo((): SampleProgress[] => {
        if (!selectedOrder) return [];
        const order = MOCK_WORK_ORDERS.find(w => w.id === selectedOrder);
        if (!order) return [];

        // Generate mock samples based on order's sample_count
        const mockSamples: SampleProgress[] = [];
        const sampleCount = order.sample_count || 3;

        for (let i = 0; i < sampleCount; i++) {
            const tasks = MOCK_TASKS.filter(t => t.work_order_id === selectedOrder);
            const completed = Math.floor(Math.random() * 5);
            const total = 5;
            let status: SampleProgress["status"] = "received";
            if (completed >= total) status = "completed";
            else if (completed > 0) status = "in_analysis";

            mockSamples.push({
                id: `sample-${selectedOrder}-${i}`,
                name: `Sample ${i + 1}`,
                testsTotal: total,
                testsCompleted: completed,
                status
            });
        }
        return mockSamples;
    }, [selectedOrder]);

    const toggleDownloadSelect = (orderId: string) => {
        const next = new Set(selectedForDownload);
        if (next.has(orderId)) {
            next.delete(orderId);
        } else {
            next.add(orderId);
        }
        setSelectedForDownload(next);
    };

    const handleBulkDownload = () => {
        alert(`Downloading ${selectedForDownload.size} report(s) as ZIP...`);
        setSelectedForDownload(new Set());
    };

    const stats = {
        active: myOrders.filter(w => w.status !== "COMPLETED").length,
        completed: myOrders.filter(w => w.status === "COMPLETED").length,
        totalSpent: "12.5M"
    };

    const progressSteps = ["Received", "Lab Analysis", "Review", "Completed"];

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Active Orders</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stats.active}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Completed</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Total Spent (YTD)</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">IDR {stats.totalSpent}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Reports Available</p>
                    <p className="mt-2 text-3xl font-bold text-primary">{stats.completed}</p>
                </div>
            </div>

            {/* Orders Table */}
            <PremiumCard
                title="My Orders"
                subtitle="Track progress and download reports"
                action={
                    selectedForDownload.size > 0 && (
                        <button
                            onClick={handleBulkDownload}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[16px]">folder_zip</span>
                            Download {selectedForDownload.size} as ZIP
                        </button>
                    )
                }
            >
                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <select
                            className="text-sm border border-slate-200 rounded-lg px-2 py-2 bg-white"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as typeof searchType)}
                        >
                            <option value="all">All Fields</option>
                            <option value="report">Report Number</option>
                            <option value="sample">Sample Name</option>
                        </select>
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder={
                                searchType === "report" ? "Search by report number (e.g., RPT-2025-0001)..." :
                                    searchType === "sample" ? "Search by sample name..." :
                                        "Search by order ID, report, or sample name..."
                            }
                            className="w-full min-w-[200px] bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">From:</span>
                        <input
                            type="date"
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">To:</span>
                        <input
                            type="date"
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                    {/* Matrix Filter */}
                    <select
                        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                        value={matrixFilter}
                        onChange={(e) => setMatrixFilter(e.target.value)}
                    >
                        {matrixTypes.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    {(searchQuery || dateFrom || dateTo || matrixFilter) && (
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setDateFrom("");
                                setDateTo("");
                                setSearchType("all");
                                setMatrixFilter("");
                            }}
                            className="text-xs text-primary hover:underline"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>

                <DenseTable
                    data={myOrders}
                    keyExtractor={w => w.id}
                    onRowClick={(row) => setSelectedOrder(row.id === selectedOrder ? null : row.id)}
                    columns={[
                        {
                            header: "",
                            accessorKey: "id",
                            className: "w-8",
                            cell: w => w.status === "COMPLETED" && (
                                <input
                                    type="checkbox"
                                    checked={selectedForDownload.has(w.id)}
                                    onChange={() => toggleDownloadSelect(w.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded border-slate-300"
                                />
                            )
                        },
                        {
                            header: "Order ID",
                            accessorKey: "work_order_no",
                            className: "font-mono font-medium",
                            cell: w => (
                                <div className="flex items-center gap-2">
                                    {selectedOrder === w.id && (
                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                    {w.work_order_no}
                                </div>
                            )
                        },
                        {
                            header: "Report #",
                            accessorKey: "id",
                            cell: w => {
                                const reportNo = getReportNumber(w.id);
                                return reportNo ? (
                                    <span className="font-mono text-primary">{reportNo}</span>
                                ) : (
                                    <span className="text-slate-400 italic">Pending</span>
                                );
                            }
                        },
                        {
                            header: "Date Received",
                            accessorKey: "received_date",
                            cell: w => w.received_date.toLocaleDateString()
                        },
                        {
                            header: "Progress",
                            accessorKey: "status",
                            cell: (w) => {
                                const stepIndex = w.status === "COMPLETED" ? 3 :
                                    w.status === "IN_PROGRESS" ? 1 : 0;
                                return (
                                    <div className="flex items-center gap-1">
                                        {progressSteps.map((step, i) => (
                                            <div key={step} className="flex items-center">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                    i <= stepIndex
                                                        ? "bg-green-500 text-white"
                                                        : "bg-slate-100 text-slate-400"
                                                )}>
                                                    {i <= stepIndex ? "✓" : i + 1}
                                                </div>
                                                {i < progressSteps.length - 1 && (
                                                    <div className={cn(
                                                        "w-3 h-0.5",
                                                        i < stepIndex ? "bg-green-500" : "bg-slate-200"
                                                    )} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                        },
                        {
                            header: "Samples",
                            accessorKey: "sample_count",
                            className: "text-center"
                        },
                        {
                            header: "Action",
                            accessorKey: "id",
                            className: "text-right",
                            cell: (w) => (
                                <div className="flex justify-end gap-2">
                                    {w.status === "COMPLETED" ? (
                                        <button className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-green-700">
                                            <span className="material-symbols-outlined text-[14px]">download</span>
                                            CoA
                                        </button>
                                    ) : (
                                        <span className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                            Processing
                                        </span>
                                    )}
                                </div>
                            )
                        }
                    ]}
                    className="border-0"
                />

                {myOrders.length === 0 && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-[48px] text-slate-300">inbox</span>
                        <p className="mt-2 text-sm font-medium text-slate-900">No orders found</p>
                        <p className="text-xs text-slate-500">Try adjusting your search or date filters</p>
                    </div>
                )}
            </PremiumCard>

            {/* Order Detail Panel */}
            {selectedOrder && (
                <PremiumCard
                    title={`Order Details: ${MOCK_WORK_ORDERS.find(w => w.id === selectedOrder)?.work_order_no}`}
                    subtitle="Sample-level progress tracking"
                    action={
                        <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    }
                >
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-700">Samples in this Order</h4>
                        {orderSamples.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {orderSamples.map(sample => {
                                    const progressPercent = Math.round((sample.testsCompleted / sample.testsTotal) * 100);
                                    return (
                                        <div
                                            key={sample.id}
                                            className="rounded-lg border border-slate-200 p-4 hover:border-primary/50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h5 className="font-medium text-slate-900">{sample.name}</h5>
                                                    <p className="text-xs text-slate-500">{sample.testsCompleted}/{sample.testsTotal} tests complete</p>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-xs font-bold",
                                                    sample.status === "completed" ? "bg-green-100 text-green-700" :
                                                        sample.status === "in_review" ? "bg-blue-100 text-blue-700" :
                                                            sample.status === "in_analysis" ? "bg-yellow-100 text-yellow-700" :
                                                                "bg-slate-100 text-slate-600"
                                                )}>
                                                    {sample.status.replace("_", " ").toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-3">
                                                <div className="w-full h-2 rounded-full bg-slate-100">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all",
                                                            progressPercent === 100 ? "bg-green-500" : "bg-primary"
                                                        )}
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 text-right">{progressPercent}%</p>
                                            </div>

                                            {/* Progress Steps */}
                                            <div className="mt-4 flex justify-between">
                                                {progressSteps.map((step, i) => {
                                                    const stepIndex = sample.status === "completed" ? 3 :
                                                        sample.status === "in_review" ? 2 :
                                                            sample.status === "in_analysis" ? 1 : 0;
                                                    return (
                                                        <div key={step} className="flex flex-col items-center">
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px]",
                                                                i <= stepIndex
                                                                    ? "bg-green-500 text-white"
                                                                    : "bg-slate-100 text-slate-400"
                                                            )}>
                                                                {i <= stepIndex ? "✓" : i + 1}
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 mt-1">{step}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No samples found for this order.</p>
                        )}

                        {/* QC Flags Alert */}
                        <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-amber-600">info</span>
                                <div>
                                    <h5 className="font-medium text-amber-800">Quality Notes</h5>
                                    <p className="text-sm text-amber-700 mt-1">
                                        All samples in this order have passed QC requirements.
                                        No anomalies detected during analysis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PremiumCard>
            )}
        </div>
    );
}
