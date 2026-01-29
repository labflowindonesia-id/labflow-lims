"use client";

import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_RESULTS, MOCK_TASKS, MOCK_PARAMETERS, MOCK_MATRICES } from "@/data/mock-db";
import { cn } from "@/lib/utils";

interface CorrectiveAction {
    id: string;
    resultId: string;
    action: string;
    timestamp: Date;
    user: string;
}

export default function QCAlertTable() {
    const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
    const [filterParameter, setFilterParameter] = useState("");
    const [filterMatrix, setFilterMatrix] = useState("");
    const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
    const [newAction, setNewAction] = useState("");

    // Filter failures
    const alerts = MOCK_RESULTS.filter(r => r.compliance_status === "FAIL" || r.qc_status === "FAIL").map(r => {
        const task = MOCK_TASKS.find(t => t.id === r.task_id);
        return {
            ...r,
            sample_name: task?.sample_name_snapshot || "Unknown Sample",
            parameter: task?.parameter_name_snapshot || "Unknown Param",
            matrix: task?.matrix_name_snapshot || "Unknown Matrix",
            parameter_id: task?.parameter_id,
            matrix_id: "mat-001" // Mock
        };
    });

    // Apply filters
    const filteredAlerts = alerts.filter(a => {
        if (filterParameter && a.parameter_id !== filterParameter) return false;
        if (filterMatrix && a.matrix_id !== filterMatrix) return false;
        return true;
    });

    const selectedAlertData = alerts.find(a => a.id === selectedAlert);
    const alertActions = correctiveActions.filter(ca => ca.resultId === selectedAlert);

    const handleAddAction = () => {
        if (!newAction.trim() || !selectedAlert) return;
        setCorrectiveActions([...correctiveActions, {
            id: `ca-${Date.now()}`,
            resultId: selectedAlert,
            action: newAction,
            timestamp: new Date(),
            user: "Analyst Kimia"
        }]);
        setNewAction("");
    };

    const predefinedActions = [
        "Repeat analysis requested",
        "Sample re-collection required",
        "Instrument recalibration needed",
        "Method deviation documented",
        "Report to supervisor"
    ];

    return (
        <div className="space-y-4">
            <PremiumCard
                title="QC Alerts"
                subtitle="Action required: Out of Spec (OOS) or QC Failures"
                action={
                    <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        filteredAlerts.length > 0 ? "bg-danger/20 text-danger animate-pulse" : "bg-success/20 text-success"
                    )}>
                        {filteredAlerts.length} Alert{filteredAlerts.length !== 1 ? "s" : ""}
                    </span>
                }
            >
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-border-light dark:border-border-dark">
                    <select
                        className="text-sm border border-border-light rounded-md px-3 py-1.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={filterParameter}
                        onChange={(e) => setFilterParameter(e.target.value)}
                    >
                        <option value="">All Parameters</option>
                        {MOCK_PARAMETERS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <select
                        className="text-sm border border-border-light rounded-md px-3 py-1.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={filterMatrix}
                        onChange={(e) => setFilterMatrix(e.target.value)}
                    >
                        <option value="">All Matrices</option>
                        {MOCK_MATRICES.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <DenseTable
                    data={filteredAlerts}
                    keyExtractor={r => r.id}
                    onRowClick={(row) => setSelectedAlert(row.id)}
                    columns={[
                        {
                            header: "Sample",
                            accessorKey: "sample_name",
                            cell: r => (
                                <div className="flex items-center gap-2">
                                    {selectedAlert === r.id && (
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    )}
                                    <span className="font-medium">{r.sample_name}</span>
                                </div>
                            )
                        },
                        { header: "Parameter", accessorKey: "parameter" },
                        { header: "Matrix", accessorKey: "matrix", className: "text-xs text-text-secondary" },
                        {
                            header: "Value",
                            accessorKey: "numeric_value",
                            className: "font-mono font-bold text-right",
                            cell: r => `${r.numeric_value} mg/L`
                        },
                        {
                            header: "Issue",
                            accessorKey: "compliance_status",
                            cell: r => (
                                <div className="flex flex-col gap-1">
                                    {r.compliance_status === "FAIL" && (
                                        <span className="inline-flex items-center gap-1 rounded bg-danger/20 px-2 py-0.5 text-xs font-bold text-danger">
                                            <span className="material-symbols-outlined text-[12px]">error</span>
                                            OOS: Max Exceeded
                                        </span>
                                    )}
                                    {r.qc_status === "FAIL" && (
                                        <span className="inline-flex items-center gap-1 rounded bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning">
                                            <span className="material-symbols-outlined text-[12px]">warning</span>
                                            QC Failure
                                        </span>
                                    )}
                                </div>
                            )
                        },
                        {
                            header: "Actions",
                            accessorKey: "id",
                            className: "text-right",
                            cell: r => (
                                <span className="text-xs text-text-secondary">
                                    {correctiveActions.filter(ca => ca.resultId === r.id).length} logged
                                </span>
                            )
                        }
                    ]}
                />

                {filteredAlerts.length === 0 && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-[48px] text-success/50">check_circle</span>
                        <p className="mt-2 text-sm text-text-main dark:text-white font-medium">All Clear!</p>
                        <p className="text-xs text-text-secondary">No QC alerts at this time.</p>
                    </div>
                )}
            </PremiumCard>

            {/* Drill-down Panel */}
            {selectedAlertData && (
                <PremiumCard
                    title={`Alert Details: ${selectedAlertData.sample_name}`}
                    subtitle={selectedAlertData.parameter}
                    action={
                        <button
                            onClick={() => setSelectedAlert(null)}
                            className="text-text-secondary hover:text-text-main"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    }
                    className="border-l-4 border-l-danger"
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Alert Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-text-main dark:text-white">Alert Information</h4>
                            <div className="rounded-lg bg-danger/5 border border-danger/20 p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Reported Value:</span>
                                    <span className="font-mono font-bold text-danger">{selectedAlertData.numeric_value} mg/L</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">QC Recovery:</span>
                                    <span className="font-mono">{selectedAlertData.qc_recovery_percent}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Status:</span>
                                    <span className="font-bold text-danger uppercase">
                                        {selectedAlertData.compliance_status === "FAIL" ? "Out of Spec" : "QC Failure"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Recorded:</span>
                                    <span>{selectedAlertData.recorded_at?.toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Sample Chain */}
                            <div className="rounded-lg border border-border-light p-3 dark:border-border-dark">
                                <h5 className="text-xs font-bold text-text-secondary mb-2">Sample Chain</h5>
                                <div className="text-xs space-y-1 font-mono">
                                    <p>Batch: B-2024-001</p>
                                    <p>Run: Initial</p>
                                    <p>Analyst: Analyst Kimia</p>
                                </div>
                            </div>
                        </div>

                        {/* Corrective Actions */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-text-main dark:text-white">Corrective Actions</h4>

                            {/* Logged Actions */}
                            <div className="max-h-[150px] overflow-y-auto space-y-2">
                                {alertActions.map(action => (
                                    <div key={action.id} className="p-2 rounded bg-primary/5 border border-primary/20 text-sm">
                                        <p className="font-medium">{action.action}</p>
                                        <p className="text-xs text-text-secondary">
                                            {action.user} • {action.timestamp.toLocaleTimeString()}
                                        </p>
                                    </div>
                                ))}
                                {alertActions.length === 0 && (
                                    <p className="text-xs text-text-secondary italic">No actions logged yet.</p>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-2">
                                {predefinedActions.map(action => (
                                    <button
                                        key={action}
                                        onClick={() => setNewAction(action)}
                                        className="px-2 py-1 text-xs rounded border border-border-light hover:bg-primary/10 hover:border-primary/50 transition-colors dark:border-border-dark"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>

                            {/* Add Action */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Log corrective action..."
                                    className="flex-1 text-sm border border-border-light rounded-md px-3 py-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                                    value={newAction}
                                    onChange={(e) => setNewAction(e.target.value)}
                                />
                                <button
                                    onClick={handleAddAction}
                                    disabled={!newAction.trim()}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    Log
                                </button>
                            </div>
                        </div>
                    </div>
                </PremiumCard>
            )}
        </div>
    );
}
