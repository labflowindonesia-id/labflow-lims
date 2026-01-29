"use client";

import { useState, useMemo } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { Label } from "@/components/ui/Label";
import { MOCK_WORK_ORDERS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

type CRType = "ADD_TEST" | "CANCEL_TEST" | "CHANGE_DUE_DATE" | "EDIT_METADATA";
type CRStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

interface ChangeRequest {
    id: string;
    crNumber: string;
    workOrderId: string;
    workOrderNo: string;
    type: CRType;
    description: string;
    requestedBy: string;
    requestedAt: Date;
    status: CRStatus;
    managerNotes?: string;
    approvedBy?: string;
    approvedAt?: Date;
    history: { action: string; user: string; timestamp: Date; notes?: string }[];
}

export default function ChangeRequestsPage() {
    const [filterStatus, setFilterStatus] = useState<CRStatus | "">("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCR, setSelectedCR] = useState<string | null>(null);
    const [approvalNotes, setApprovalNotes] = useState("");

    // New CR form state
    const [newCR, setNewCR] = useState({
        workOrderId: "",
        type: "ADD_TEST" as CRType,
        description: ""
    });

    // Mock CRs
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([
        {
            id: "cr-001",
            crNumber: "CR-2024-0001",
            workOrderId: "wo-001",
            workOrderNo: "WO-24-0001",
            type: "ADD_TEST",
            description: "Add additional heavy metals panel (Pb, Cd, Hg) to sample S-001",
            requestedBy: "Analyst Kimia",
            requestedAt: new Date("2024-02-01"),
            status: "APPROVED",
            managerNotes: "Approved - customer confirmed additional testing",
            approvedBy: "Technical Manager",
            approvedAt: new Date("2024-02-02"),
            history: [
                { action: "Created", user: "Analyst Kimia", timestamp: new Date("2024-02-01") },
                { action: "Submitted", user: "Analyst Kimia", timestamp: new Date("2024-02-01") },
                { action: "Approved", user: "Technical Manager", timestamp: new Date("2024-02-02"), notes: "Customer confirmed" }
            ]
        },
        {
            id: "cr-002",
            crNumber: "CR-2024-0002",
            workOrderId: "wo-002",
            workOrderNo: "WO-24-0002",
            type: "CHANGE_DUE_DATE",
            description: "Extend due date by 3 days due to instrument maintenance",
            requestedBy: "Lab Supervisor",
            requestedAt: new Date("2024-02-05"),
            status: "SUBMITTED",
            history: [
                { action: "Created", user: "Lab Supervisor", timestamp: new Date("2024-02-05") },
                { action: "Submitted", user: "Lab Supervisor", timestamp: new Date("2024-02-05") }
            ]
        },
        {
            id: "cr-003",
            crNumber: "CR-2024-0003",
            workOrderId: "wo-003",
            workOrderNo: "WO-24-0003",
            type: "CANCEL_TEST",
            description: "Cancel BOD test - insufficient sample volume",
            requestedBy: "Analyst Biologi",
            requestedAt: new Date("2024-02-10"),
            status: "REJECTED",
            managerNotes: "Rejected - please request re-sampling from customer instead",
            approvedBy: "Technical Manager",
            approvedAt: new Date("2024-02-11"),
            history: [
                { action: "Created", user: "Analyst Biologi", timestamp: new Date("2024-02-10") },
                { action: "Submitted", user: "Analyst Biologi", timestamp: new Date("2024-02-10") },
                { action: "Rejected", user: "Technical Manager", timestamp: new Date("2024-02-11"), notes: "Request re-sampling" }
            ]
        }
    ]);

    // Filter CRs
    const filteredCRs = useMemo(() => {
        let result = [...changeRequests];

        if (filterStatus) result = result.filter(cr => cr.status === filterStatus);

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(cr =>
                cr.crNumber.toLowerCase().includes(q) ||
                cr.workOrderNo.toLowerCase().includes(q) ||
                cr.description.toLowerCase().includes(q)
            );
        }

        return result.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    }, [changeRequests, filterStatus, searchQuery]);

    const selectedCRData = changeRequests.find(cr => cr.id === selectedCR);

    const statusColors: Record<CRStatus, string> = {
        DRAFT: "bg-slate-100 text-slate-600",
        SUBMITTED: "bg-warning/20 text-warning",
        APPROVED: "bg-success/20 text-success",
        REJECTED: "bg-danger/20 text-danger"
    };

    const typeLabels: Record<CRType, { label: string; icon: string }> = {
        ADD_TEST: { label: "Add Test", icon: "add_circle" },
        CANCEL_TEST: { label: "Cancel Test", icon: "remove_circle" },
        CHANGE_DUE_DATE: { label: "Change Due Date", icon: "event" },
        EDIT_METADATA: { label: "Edit Metadata", icon: "edit_note" }
    };

    const handleCreateCR = () => {
        if (!newCR.workOrderId || !newCR.description.trim()) return;

        const wo = MOCK_WORK_ORDERS.find(w => w.id === newCR.workOrderId);
        const newRequest: ChangeRequest = {
            id: `cr-${Date.now()}`,
            crNumber: `CR-2024-${String(changeRequests.length + 1).padStart(4, "0")}`,
            workOrderId: newCR.workOrderId,
            workOrderNo: wo?.work_order_no || "Unknown",
            type: newCR.type,
            description: newCR.description,
            requestedBy: "Current User",
            requestedAt: new Date(),
            status: "DRAFT",
            history: [{ action: "Created", user: "Current User", timestamp: new Date() }]
        };

        setChangeRequests([newRequest, ...changeRequests]);
        setNewCR({ workOrderId: "", type: "ADD_TEST", description: "" });
        setShowCreateModal(false);
    };

    const handleSubmit = (crId: string) => {
        setChangeRequests(prev => prev.map(cr =>
            cr.id === crId
                ? {
                    ...cr,
                    status: "SUBMITTED" as CRStatus,
                    history: [...cr.history, { action: "Submitted", user: "Current User", timestamp: new Date() }]
                }
                : cr
        ));
    };

    const handleApprove = (crId: string) => {
        setChangeRequests(prev => prev.map(cr =>
            cr.id === crId
                ? {
                    ...cr,
                    status: "APPROVED" as CRStatus,
                    managerNotes: approvalNotes,
                    approvedBy: "Technical Manager",
                    approvedAt: new Date(),
                    history: [...cr.history, { action: "Approved", user: "Technical Manager", timestamp: new Date(), notes: approvalNotes }]
                }
                : cr
        ));
        setApprovalNotes("");
        setSelectedCR(null);
    };

    const handleReject = (crId: string) => {
        setChangeRequests(prev => prev.map(cr =>
            cr.id === crId
                ? {
                    ...cr,
                    status: "REJECTED" as CRStatus,
                    managerNotes: approvalNotes,
                    approvedBy: "Technical Manager",
                    approvedAt: new Date(),
                    history: [...cr.history, { action: "Rejected", user: "Technical Manager", timestamp: new Date(), notes: approvalNotes }]
                }
                : cr
        ));
        setApprovalNotes("");
        setSelectedCR(null);
    };

    const statusCounts = {
        DRAFT: changeRequests.filter(cr => cr.status === "DRAFT").length,
        SUBMITTED: changeRequests.filter(cr => cr.status === "SUBMITTED").length,
        APPROVED: changeRequests.filter(cr => cr.status === "APPROVED").length,
        REJECTED: changeRequests.filter(cr => cr.status === "REJECTED").length,
    };

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Change Requests"
                description="Manage test modifications, due date changes, and metadata edits"
                actions={
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
                    >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        New Request
                    </button>
                }
            />

            <div className="mx-auto max-w-6xl space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as CRStatus[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(filterStatus === status ? "" : status)}
                            className={cn(
                                "p-4 rounded-xl border transition-all text-left",
                                filterStatus === status
                                    ? "border-primary bg-primary/5"
                                    : "border-border-light bg-white hover:border-primary/50 dark:border-border-dark dark:bg-surface-dark"
                            )}
                        >
                            <p className="text-2xl font-bold text-text-main dark:text-white">{statusCounts[status]}</p>
                            <p className={cn("text-xs font-medium", statusColors[status].split(" ")[1])}>{status}</p>
                        </button>
                    ))}
                </div>

                {/* CR List */}
                <PremiumCard
                    title="All Change Requests"
                    action={
                        <div className="flex items-center gap-2 rounded-lg border border-border-light bg-white px-3 py-1.5 dark:border-border-dark dark:bg-background-dark">
                            <span className="material-symbols-outlined text-[16px] text-text-secondary">search</span>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-32 bg-transparent text-sm focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    }
                >
                    <DenseTable
                        data={filteredCRs}
                        keyExtractor={cr => cr.id}
                        onRowClick={(row) => setSelectedCR(row.id === selectedCR ? null : row.id)}
                        columns={[
                            {
                                header: "CR #",
                                accessorKey: "crNumber",
                                className: "font-mono font-medium",
                                cell: cr => (
                                    <div className="flex items-center gap-2">
                                        {selectedCR === cr.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                                        {cr.crNumber}
                                    </div>
                                )
                            },
                            { header: "Work Order", accessorKey: "workOrderNo", className: "font-mono text-xs" },
                            {
                                header: "Type",
                                accessorKey: "type",
                                cell: cr => (
                                    <span className="flex items-center gap-1 text-xs">
                                        <span className="material-symbols-outlined text-[14px]">{typeLabels[cr.type].icon}</span>
                                        {typeLabels[cr.type].label}
                                    </span>
                                )
                            },
                            {
                                header: "Description",
                                accessorKey: "description",
                                className: "max-w-[200px] truncate text-sm"
                            },
                            { header: "Requested By", accessorKey: "requestedBy", className: "text-sm" },
                            {
                                header: "Date",
                                accessorKey: "requestedAt",
                                cell: cr => cr.requestedAt.toLocaleDateString()
                            },
                            {
                                header: "Status",
                                accessorKey: "status",
                                cell: cr => (
                                    <span className={cn("px-2 py-0.5 rounded text-xs font-bold", statusColors[cr.status])}>
                                        {cr.status}
                                    </span>
                                )
                            }
                        ]}
                    />

                    {filteredCRs.length === 0 && (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-[48px] text-text-secondary/50">assignment</span>
                            <p className="mt-2 text-sm font-medium text-text-main dark:text-white">No change requests found</p>
                        </div>
                    )}
                </PremiumCard>

                {/* CR Detail Panel */}
                {selectedCRData && (
                    <PremiumCard
                        title={`Change Request: ${selectedCRData.crNumber}`}
                        subtitle={`Work Order: ${selectedCRData.workOrderNo}`}
                        action={
                            <button onClick={() => setSelectedCR(null)} className="text-text-secondary hover:text-text-main">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        }
                        className={cn(
                            "border-l-4",
                            selectedCRData.status === "APPROVED" ? "border-l-success" :
                                selectedCRData.status === "REJECTED" ? "border-l-danger" :
                                    selectedCRData.status === "SUBMITTED" ? "border-l-warning" : "border-l-slate-300"
                        )}
                    >
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Details */}
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-slate-50 dark:bg-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-[20px] text-primary">{typeLabels[selectedCRData.type].icon}</span>
                                        <span className="font-bold text-text-main dark:text-white">{typeLabels[selectedCRData.type].label}</span>
                                    </div>
                                    <p className="text-sm text-text-secondary">{selectedCRData.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-text-secondary">Requested By</p>
                                        <p className="font-medium text-text-main dark:text-white">{selectedCRData.requestedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Requested At</p>
                                        <p className="font-medium text-text-main dark:text-white">{selectedCRData.requestedAt.toLocaleString()}</p>
                                    </div>
                                    {selectedCRData.approvedBy && (
                                        <>
                                            <div>
                                                <p className="text-text-secondary">{selectedCRData.status === "APPROVED" ? "Approved By" : "Rejected By"}</p>
                                                <p className="font-medium text-text-main dark:text-white">{selectedCRData.approvedBy}</p>
                                            </div>
                                            <div>
                                                <p className="text-text-secondary">Decision Date</p>
                                                <p className="font-medium text-text-main dark:text-white">{selectedCRData.approvedAt?.toLocaleString()}</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {selectedCRData.managerNotes && (
                                    <div className={cn(
                                        "p-3 rounded-lg border",
                                        selectedCRData.status === "APPROVED" ? "bg-success/10 border-success/30" : "bg-danger/10 border-danger/30"
                                    )}>
                                        <p className="text-xs font-bold text-text-secondary mb-1">Manager Notes</p>
                                        <p className="text-sm">{selectedCRData.managerNotes}</p>
                                    </div>
                                )}
                            </div>

                            {/* History & Actions */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-text-main dark:text-white">Audit Trail</h4>
                                <div className="max-h-[200px] overflow-y-auto space-y-2">
                                    {selectedCRData.history.map((entry, i) => (
                                        <div key={i} className="flex items-start gap-3 p-2 rounded bg-slate-50 dark:bg-white/5">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-xs font-bold text-primary">{i + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{entry.action}</p>
                                                <p className="text-xs text-text-secondary">{entry.user} • {entry.timestamp.toLocaleString()}</p>
                                                {entry.notes && <p className="text-xs text-text-secondary mt-1 italic">"{entry.notes}"</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                {selectedCRData.status === "DRAFT" && (
                                    <button
                                        onClick={() => handleSubmit(selectedCRData.id)}
                                        className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium"
                                    >
                                        Submit for Approval
                                    </button>
                                )}

                                {selectedCRData.status === "SUBMITTED" && (
                                    <div className="space-y-3 pt-4 border-t border-border-light dark:border-border-dark">
                                        <h4 className="text-sm font-bold text-text-main dark:text-white">Manager Decision</h4>
                                        <textarea
                                            placeholder="Add notes (optional)..."
                                            className="w-full border border-border-light rounded-lg p-2 text-sm dark:border-border-dark dark:bg-background-dark"
                                            rows={2}
                                            value={approvalNotes}
                                            onChange={(e) => setApprovalNotes(e.target.value)}
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleReject(selectedCRData.id)}
                                                className="flex-1 py-2 border border-danger text-danger rounded-lg text-sm font-medium hover:bg-danger/10"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(selectedCRData.id)}
                                                className="flex-1 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/80"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </PremiumCard>
                )}
            </div>

            {/* Create CR Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">New Change Request</h3>

                        <div className="space-y-4">
                            <div>
                                <Label>Work Order</Label>
                                <select
                                    className="w-full border border-border-light rounded-lg p-2 text-sm mt-1 dark:border-border-dark dark:bg-background-dark"
                                    value={newCR.workOrderId}
                                    onChange={(e) => setNewCR({ ...newCR, workOrderId: e.target.value })}
                                >
                                    <option value="">Select work order...</option>
                                    {MOCK_WORK_ORDERS.map(wo => (
                                        <option key={wo.id} value={wo.id}>{wo.work_order_no}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Request Type</Label>
                                <select
                                    className="w-full border border-border-light rounded-lg p-2 text-sm mt-1 dark:border-border-dark dark:bg-background-dark"
                                    value={newCR.type}
                                    onChange={(e) => setNewCR({ ...newCR, type: e.target.value as CRType })}
                                >
                                    {Object.entries(typeLabels).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <textarea
                                    className="w-full border border-border-light rounded-lg p-2 text-sm mt-1 dark:border-border-dark dark:bg-background-dark"
                                    rows={3}
                                    placeholder="Describe the change request..."
                                    value={newCR.description}
                                    onChange={(e) => setNewCR({ ...newCR, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 text-text-secondary hover:text-text-main"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCR}
                                disabled={!newCR.workOrderId || !newCR.description.trim()}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                Create Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
