"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";

import { ActionToolbar } from "@/components/ui/Toolbar";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

// Mock archived data - would come from database with 5-year retention
const mockArchivedData = [
    {
        id: "RPT-2019-0001",
        reportNumber: "CoA-19-0001",
        customer: "Legacy Customer A",
        sampleType: "Water",
        completedDate: "2019-05-20",
        retentionEnd: "2024-05-20",
        status: "Active",
        fileSize: "1.2 MB",
    },
    {
        id: "RPT-2020-0155",
        reportNumber: "CoA-20-0155",
        customer: "Old Corporation B",
        sampleType: "Soil",
        completedDate: "2020-08-15",
        retentionEnd: "2025-08-15",
        status: "Active",
        fileSize: "0.8 MB",
    },
    {
        id: "RPT-2021-0089",
        reportNumber: "CoA-21-0089",
        customer: "Historical Client C",
        sampleType: "Air",
        completedDate: "2021-03-22",
        retentionEnd: "2026-03-22",
        status: "Active",
        fileSize: "1.5 MB",
    },
    {
        id: "RPT-2021-0156",
        reportNumber: "CoA-21-0156",
        customer: "PT ABC Industries",
        sampleType: "Water",
        completedDate: "2021-07-10",
        retentionEnd: "2026-07-10",
        status: "Active",
        fileSize: "2.1 MB",
    },
    {
        id: "RPT-2022-0042",
        reportNumber: "CoA-22-0042",
        customer: "Mining Corp Ltd",
        sampleType: "Soil",
        completedDate: "2022-02-28",
        retentionEnd: "2027-02-28",
        status: "Active",
        fileSize: "1.8 MB",
    },
    {
        id: "RPT-2022-0198",
        reportNumber: "CoA-22-0198",
        customer: "Chemical Plant X",
        sampleType: "Water",
        completedDate: "2022-09-14",
        retentionEnd: "2027-09-14",
        status: "Active",
        fileSize: "0.9 MB",
    },
    {
        id: "RPT-2023-0015",
        reportNumber: "CoA-23-0015",
        customer: "Food Processing Y",
        sampleType: "Food",
        completedDate: "2023-01-20",
        retentionEnd: "2028-01-20",
        status: "Active",
        fileSize: "1.4 MB",
    },
    {
        id: "RPT-2023-0087",
        reportNumber: "CoA-23-0087",
        customer: "Pharmaceutical Z",
        sampleType: "Water",
        completedDate: "2023-04-05",
        retentionEnd: "2028-04-05",
        status: "Active",
        fileSize: "2.3 MB",
    },
    {
        id: "RPT-2018-0234",
        reportNumber: "CoA-18-0234",
        customer: "Expired Client",
        sampleType: "Air",
        completedDate: "2018-11-30",
        retentionEnd: "2023-11-30",
        status: "Expired",
        fileSize: "0.6 MB",
    },
    {
        id: "RPT-2019-0089",
        reportNumber: "CoA-19-0089",
        customer: "Soon Expiring Corp",
        sampleType: "Soil",
        completedDate: "2019-06-15",
        retentionEnd: "2024-06-15",
        status: "Expiring Soon",
        fileSize: "1.1 MB",
    },
];

type FilterStatus = "all" | "active" | "expiring" | "expired";

export default function ArchivePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [filterYear, setFilterYear] = useState<string>("all");
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // Get unique years
    const years = useMemo(() => {
        const yearSet = new Set(mockArchivedData.map((item) => item.completedDate.split("-")[0]));
        return Array.from(yearSet).sort().reverse();
    }, []);

    // Filtered data
    const filteredData = useMemo(() => {
        return mockArchivedData.filter((item) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (
                    !item.reportNumber.toLowerCase().includes(query) &&
                    !item.customer.toLowerCase().includes(query) &&
                    !item.id.toLowerCase().includes(query)
                ) {
                    return false;
                }
            }

            // Status filter
            if (filterStatus !== "all") {
                const statusMap: Record<string, string> = {
                    active: "Active",
                    expiring: "Expiring Soon",
                    expired: "Expired",
                };
                if (item.status !== statusMap[filterStatus]) return false;
            }

            // Year filter
            if (filterYear !== "all") {
                if (!item.completedDate.startsWith(filterYear)) return false;
            }

            return true;
        });
    }, [searchQuery, filterStatus, filterYear]);

    // Stats
    const stats = useMemo(() => {
        const total = mockArchivedData.length;
        const active = mockArchivedData.filter((i) => i.status === "Active").length;
        const expiring = mockArchivedData.filter((i) => i.status === "Expiring Soon").length;
        const expired = mockArchivedData.filter((i) => i.status === "Expired").length;
        const totalSize = mockArchivedData.reduce((sum, i) => sum + parseFloat(i.fileSize), 0).toFixed(1);

        return { total, active, expiring, expired, totalSize };
    }, []);

    const handleDownload = (ids: string[]) => {
        alert(`Downloading ${ids.length} archived report(s): ${ids.join(", ")}`);
    };

    const handleExtendRetention = (ids: string[]) => {
        alert(`Extending retention for ${ids.length} report(s): ${ids.join(", ")}`);
    };



    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Document Archive"
                description="5-year retention archive for audit compliance (ISO 17025)"
                actions={
                    <div className="flex items-center gap-2">
                        {selectedItems.length > 0 && (
                            <>
                                <button
                                    onClick={() => handleDownload(selectedItems)}
                                    className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg flex items-center gap-1 hover:bg-primary-hover"
                                >
                                    <span className="material-symbols-outlined text-[16px]">download</span>
                                    Download ({selectedItems.length})
                                </button>
                                <button
                                    onClick={() => handleExtendRetention(selectedItems)}
                                    className="px-3 py-1.5 text-sm border border-primary text-primary rounded-lg flex items-center gap-1 hover:bg-primary/10"
                                >
                                    <span className="material-symbols-outlined text-[16px]">update</span>
                                    Extend
                                </button>
                            </>
                        )}
                    </div>
                }
            />

            <div className="mx-auto max-w-6xl space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
                        <p className="text-xs text-text-secondary">Total Archived</p>
                        <p className="text-2xl font-bold text-text-main dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
                        <p className="text-xs text-text-secondary">Active</p>
                        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
                        <p className="text-xs text-text-secondary">Expiring Soon</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.expiring}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
                        <p className="text-xs text-text-secondary">Expired</p>
                        <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
                        <p className="text-xs text-text-secondary">Total Size</p>
                        <p className="text-2xl font-bold text-text-main dark:text-white">{stats.totalSize} MB</p>
                    </div>
                </div>

                {/* Filters */}
                <PremiumCard>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Search by report #, customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                icon="search"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-text-secondary">Status:</span>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                                className="text-sm border border-border-light rounded-lg px-3 py-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="expiring">Expiring Soon</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-text-secondary">Year:</span>
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="text-sm border border-border-light rounded-lg px-3 py-2 bg-white dark:bg-surface-dark dark:border-border-dark"
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
                                setFilterStatus("all");
                                setFilterYear("all");
                            }}
                            className="text-sm text-text-secondary hover:text-text-main flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[16px]">clear_all</span>
                            Clear
                        </button>
                    </div>
                </PremiumCard>

                {/* Archive Info Banner */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <span className="material-symbols-outlined text-blue-600">info</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            Document Retention Policy: 5 Years
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            All test reports are retained for 5 years per ISO/IEC 17025:2017 requirements. Documents approaching
                            expiration can be extended or exported.
                        </p>
                    </div>
                </div>

                {/* Archive Table */}
                <PremiumCard title="Archived Documents" subtitle={`${filteredData.length} documents found`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-black/20">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-text-secondary w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedItems(filteredData.map((i) => i.id));
                                                } else {
                                                    setSelectedItems([]);
                                                }
                                            }}
                                            className="rounded border-slate-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Report #</th>
                                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Customer</th>
                                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Matrix</th>
                                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Completed</th>
                                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Retention Until</th>
                                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Size</th>
                                    <th className="px-4 py-3 text-left font-medium text-text-secondary w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-text-secondary">
                                            No archived documents match your filters
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(row.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedItems([...selectedItems, row.id]);
                                                        } else {
                                                            setSelectedItems(selectedItems.filter((id) => id !== row.id));
                                                        }
                                                    }}
                                                    className="rounded border-slate-300"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm font-bold text-primary">{row.reportNumber}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{row.customer}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 rounded dark:bg-white/10">{row.sampleType}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">{row.completedDate}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{row.retentionEnd}</span>
                                                    {row.status === "Expiring Soon" && (
                                                        <span className="material-symbols-outlined text-[14px] text-warning">warning</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full font-medium",
                                                        row.status === "Active"
                                                            ? "bg-green-100 text-green-700"
                                                            : row.status === "Expiring Soon"
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-red-100 text-red-700"
                                                    )}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">{row.fileSize}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDownload([row.id])}
                                                        className="p-1 hover:bg-slate-100 rounded dark:hover:bg-white/10"
                                                        title="Download"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px] text-text-secondary">download</span>
                                                    </button>
                                                    <button
                                                        onClick={() => alert(`Viewing ${row.reportNumber}`)}
                                                        className="p-1 hover:bg-slate-100 rounded dark:hover:bg-white/10"
                                                        title="View"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px] text-text-secondary">visibility</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}
