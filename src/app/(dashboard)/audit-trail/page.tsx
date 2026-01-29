"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { cn } from "@/lib/utils";

type AuditCategory = "ALL" | "RESULT" | "SAMPLE" | "REPORT" | "QC" | "CONFIG";

interface AuditEntry {
    id: string;
    timestamp: Date;
    user: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "SUBMIT";
    category: AuditCategory;
    entityType: string;
    entityId: string;
    entityName: string;
    changes: { field: string; oldValue: string | null; newValue: string | null }[];
    ipAddress: string;
}

interface ReportVersion {
    id: string;
    reportNumber: string;
    version: number;
    createdAt: Date;
    createdBy: string;
    status: "DRAFT" | "APPROVED" | "SUPERSEDED";
    changes: string;
}

// Mock audit log data
const MOCK_AUDIT_LOG: AuditEntry[] = [
    {
        id: "audit-001",
        timestamp: new Date("2025-01-29T10:30:00"),
        user: "Dr. Ahmad Wijaya",
        action: "APPROVE",
        category: "REPORT",
        entityType: "Report",
        entityId: "rpt-001",
        entityName: "RPT-2025-0001",
        changes: [{ field: "status", oldValue: "PENDING", newValue: "APPROVED" }],
        ipAddress: "192.168.1.100"
    },
    {
        id: "audit-002",
        timestamp: new Date("2025-01-29T09:45:00"),
        user: "Siti Rahayu",
        action: "UPDATE",
        category: "RESULT",
        entityType: "Test Result",
        entityId: "result-001",
        entityName: "pH - WO-2025-001-S1",
        changes: [
            { field: "value", oldValue: "7.2", newValue: "7.4" },
            { field: "remarks", oldValue: null, newValue: "Re-tested due to equipment calibration" }
        ],
        ipAddress: "192.168.1.101"
    },
    {
        id: "audit-003",
        timestamp: new Date("2025-01-29T09:15:00"),
        user: "Budi Santoso",
        action: "CREATE",
        category: "SAMPLE",
        entityType: "Sample",
        entityId: "sample-005",
        entityName: "Water Sample A-5",
        changes: [
            { field: "status", oldValue: null, newValue: "RECEIVED" },
            { field: "matrix", oldValue: null, newValue: "Air Minum" }
        ],
        ipAddress: "192.168.1.102"
    },
    {
        id: "audit-004",
        timestamp: new Date("2025-01-28T16:20:00"),
        user: "Maya Putri",
        action: "REJECT",
        category: "QC",
        entityType: "QC Record",
        entityId: "qc-001",
        entityName: "QC Run - Batch 2025-01-28",
        changes: [{ field: "status", oldValue: "PENDING", newValue: "REJECTED" }],
        ipAddress: "192.168.1.103"
    },
    {
        id: "audit-005",
        timestamp: new Date("2025-01-28T14:10:00"),
        user: "Admin",
        action: "UPDATE",
        category: "CONFIG",
        entityType: "Parameter",
        entityId: "param-001",
        entityName: "pH",
        changes: [{ field: "unit", oldValue: "-", newValue: "pH units" }],
        ipAddress: "192.168.1.1"
    },
    {
        id: "audit-006",
        timestamp: new Date("2025-01-28T11:30:00"),
        user: "Dr. Ahmad Wijaya",
        action: "SUBMIT",
        category: "REPORT",
        entityType: "Report",
        entityId: "rpt-002",
        entityName: "RPT-2025-0002",
        changes: [{ field: "status", oldValue: "DRAFT", newValue: "SUBMITTED" }],
        ipAddress: "192.168.1.100"
    },
];

// Mock report versions
const MOCK_REPORT_VERSIONS: ReportVersion[] = [
    { id: "rv-001", reportNumber: "RPT-2025-0001", version: 1, createdAt: new Date("2025-01-25"), createdBy: "Siti Rahayu", status: "SUPERSEDED", changes: "Initial report generation" },
    { id: "rv-002", reportNumber: "RPT-2025-0001", version: 2, createdAt: new Date("2025-01-27"), createdBy: "Dr. Ahmad Wijaya", status: "SUPERSEDED", changes: "Corrected pH values after re-testing" },
    { id: "rv-003", reportNumber: "RPT-2025-0001", version: 3, createdAt: new Date("2025-01-29"), createdBy: "Dr. Ahmad Wijaya", status: "APPROVED", changes: "Final approved version" },
    { id: "rv-004", reportNumber: "RPT-2025-0002", version: 1, createdAt: new Date("2025-01-28"), createdBy: "Budi Santoso", status: "DRAFT", changes: "Initial draft" },
];

export default function AuditTrailPage() {
    const [activeTab, setActiveTab] = useState<"history" | "versions">("history");
    const [categoryFilter, setCategoryFilter] = useState<AuditCategory>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

    // Filter audit entries
    const filteredEntries = useMemo(() => {
        let entries = [...MOCK_AUDIT_LOG];

        if (categoryFilter !== "ALL") {
            entries = entries.filter(e => e.category === categoryFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            entries = entries.filter(e =>
                e.entityName.toLowerCase().includes(q) ||
                e.user.toLowerCase().includes(q) ||
                e.entityId.toLowerCase().includes(q)
            );
        }

        if (dateFrom) {
            const from = new Date(dateFrom);
            entries = entries.filter(e => e.timestamp >= from);
        }

        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            entries = entries.filter(e => e.timestamp <= to);
        }

        return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [categoryFilter, searchQuery, dateFrom, dateTo]);

    const actionColors: Record<string, string> = {
        CREATE: "bg-success/20 text-success",
        UPDATE: "bg-primary/20 text-primary",
        DELETE: "bg-danger/20 text-danger",
        APPROVE: "bg-success/20 text-success",
        REJECT: "bg-danger/20 text-danger",
        SUBMIT: "bg-warning/20 text-warning",
    };

    const categoryIcons: Record<string, string> = {
        RESULT: "science",
        SAMPLE: "inventory_2",
        REPORT: "description",
        QC: "verified",
        CONFIG: "settings",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-main dark:text-white">Audit Trail</h1>
                <p className="text-sm text-text-secondary">Complete change history and compliance tracking</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border-light dark:border-border-dark">
                <button
                    onClick={() => setActiveTab("history")}
                    className={cn(
                        "pb-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === "history"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text-main"
                    )}
                >
                    Change History
                </button>
                <button
                    onClick={() => setActiveTab("versions")}
                    className={cn(
                        "pb-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === "versions"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text-main"
                    )}
                >
                    Report Versions
                </button>
            </div>

            {/* Change History Tab */}
            {activeTab === "history" && (
                <PremiumCard
                    title="Consolidated Change History"
                    subtitle="All system changes with full traceability"
                    action={
                        <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-text-main rounded-lg text-sm font-medium hover:bg-slate-50">
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            Export CSV
                        </button>
                    }
                >
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                        <select
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as AuditCategory)}
                        >
                            <option value="ALL">All Categories</option>
                            <option value="RESULT">Results</option>
                            <option value="SAMPLE">Samples</option>
                            <option value="REPORT">Reports</option>
                            <option value="QC">QC Records</option>
                            <option value="CONFIG">Configuration</option>
                        </select>

                        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder="Search by entity, user, or ID..."
                                className="w-full min-w-[150px] bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">From:</span>
                            <input type="date" className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">To:</span>
                            <input type="date" className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                    </div>

                    {/* Audit Log */}
                    <div className="space-y-2">
                        {filteredEntries.map(entry => (
                            <div
                                key={entry.id}
                                className={cn(
                                    "rounded-lg border border-slate-200 p-4 hover:border-primary/30 transition-colors cursor-pointer",
                                    expandedEntry === entry.id && "border-primary bg-primary/5"
                                )}
                                onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[16px] text-slate-600">
                                                {categoryIcons[entry.category] || "history"}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-text-main dark:text-white">{entry.user}</span>
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", actionColors[entry.action])}>
                                                    {entry.action}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-secondary mt-0.5">
                                                {entry.entityType}: <span className="font-medium text-text-main dark:text-white">{entry.entityName}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-text-secondary">
                                            {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString()}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">IP: {entry.ipAddress}</p>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedEntry === entry.id && entry.changes.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs font-bold text-text-secondary mb-2">Changes:</p>
                                        <div className="space-y-1">
                                            {entry.changes.map((change, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs">
                                                    <span className="font-medium text-slate-600 min-w-[80px]">{change.field}:</span>
                                                    {change.oldValue && (
                                                        <span className="line-through text-slate-400">{change.oldValue}</span>
                                                    )}
                                                    <span className="material-symbols-outlined text-[12px] text-slate-400">arrow_forward</span>
                                                    <span className="text-primary font-medium">{change.newValue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {filteredEntries.length === 0 && (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-[48px] text-slate-300">history</span>
                                <p className="mt-2 text-sm font-medium text-slate-900">No audit entries found</p>
                                <p className="text-xs text-slate-500">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                </PremiumCard>
            )}

            {/* Report Versions Tab */}
            {activeTab === "versions" && (
                <PremiumCard
                    title="Report Version History"
                    subtitle="Track all report revisions and approvals"
                >
                    <DenseTable
                        data={MOCK_REPORT_VERSIONS}
                        keyExtractor={v => v.id}
                        columns={[
                            {
                                header: "Report #",
                                accessorKey: "reportNumber",
                                className: "font-mono font-medium"
                            },
                            {
                                header: "Version",
                                accessorKey: "version",
                                className: "text-center",
                                cell: v => (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                                        v{v.version}
                                    </span>
                                )
                            },
                            {
                                header: "Created",
                                accessorKey: "createdAt",
                                cell: v => v.createdAt.toLocaleDateString()
                            },
                            {
                                header: "Created By",
                                accessorKey: "createdBy"
                            },
                            {
                                header: "Status",
                                accessorKey: "status",
                                cell: v => (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-bold",
                                        v.status === "APPROVED" ? "bg-success/20 text-success" :
                                            v.status === "SUPERSEDED" ? "bg-slate-100 text-slate-500" :
                                                "bg-warning/20 text-warning"
                                    )}>
                                        {v.status}
                                    </span>
                                )
                            },
                            {
                                header: "Changes",
                                accessorKey: "changes",
                                className: "max-w-[200px] truncate"
                            },
                            {
                                header: "Actions",
                                accessorKey: "id",
                                className: "text-right",
                                cell: v => (
                                    <div className="flex gap-2 justify-end">
                                        <button className="text-primary hover:underline text-xs">View</button>
                                        <button className="text-text-secondary hover:underline text-xs">Download</button>
                                    </div>
                                )
                            }
                        ]}
                    />
                </PremiumCard>
            )}
        </div>
    );
}
