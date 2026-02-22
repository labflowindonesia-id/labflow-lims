"use client";

import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import {
    useQCAlerts,
    useParameters,
    useSampleMatrices,
    useSamples,
    useTestTasks,
    useUsers,
    useTestRunsAll,
    useUnits,
    useQCCorrectiveActions,
    useAddCorrectiveAction,
} from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";



interface EnrichedAlert {
    id: string;
    compliance_status: string | null;
    qc_status: string | null;
    sample_name: string;
    parameter: string;
    matrix: string;
    parameter_id: string | null;
    matrix_id: string | null;
    numeric_value: number | null;
    unit_symbol: string;
    qc_recovery_percent: number | null;
    recorded_at: Date | null;
    limit_min: number | null;
    limit_max: number | null;
    analyst_name: string;
    run_number: number | null;
    task_number: string;
}

export default function QCAlertTable() {
    const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
    const [filterParameter, setFilterParameter] = useState("");
    const [filterMatrix, setFilterMatrix] = useState("");
    const [newAction, setNewAction] = useState("");

    // Real data from Supabase
    const { data: alerts = [], isLoading } = useQCAlerts();
    const { data: parameters = [] } = useParameters();
    const { data: matrices = [] } = useSampleMatrices();
    const { data: samples = [] } = useSamples();
    const { data: tasks = [] } = useTestTasks();
    const { data: users = [] } = useUsers();
    const { data: testRuns = [] } = useTestRunsAll();
    const { data: units = [] } = useUnits();

    // DB-backed corrective actions for selected alert
    const { data: dbActions = [] } = useQCCorrectiveActions(selectedAlert || "");
    const addActionMutation = useAddCorrectiveAction();

    // Helper functions for ID-to-name lookups
    const getParameterName = (id: string | null) => {
        if (!id) return "Unknown Param";
        return parameters.find(p => p.id === id)?.name || "Unknown Param";
    };

    const getSampleName = (sampleId: string | null) => {
        if (!sampleId) return "Unknown Sample";
        const sample = samples.find(s => s.id === sampleId);
        return sample?.sample_name || sample?.sample_lab_id || "Unknown Sample";
    };

    const getMatrixName = (sampleId: string | null) => {
        if (!sampleId) return "Unknown Matrix";
        const sample = samples.find(s => s.id === sampleId);
        if (!sample?.matrix_id) return "Unknown Matrix";
        return matrices.find(m => m.id === sample.matrix_id)?.name || "Unknown Matrix";
    };

    const getMatrixId = (sampleId: string | null) => {
        if (!sampleId) return null;
        const sample = samples.find(s => s.id === sampleId);
        return sample?.matrix_id || null;
    };

    const getUnitSymbol = (unitId: string | null) => {
        if (!unitId) return "";
        return units.find(u => u.id === unitId)?.symbol || "";
    };

    // Enrich alerts with lookup data
    const enrichedAlerts: EnrichedAlert[] = alerts.map(result => {
        const task = tasks.find(t => t.id === result.task_id);
        const sampleId = task?.sample_id || null;
        const analyst = task?.assigned_to_id
            ? users.find(u => u.id === task.assigned_to_id)
            : null;
        const run = result.run_id
            ? testRuns.find(r => r.id === result.run_id)
            : null;

        return {
            id: result.id,
            compliance_status: result.compliance_status,
            qc_status: result.qc_status,
            sample_name: getSampleName(sampleId),
            parameter: getParameterName(result.parameter_id),
            matrix: getMatrixName(sampleId),
            parameter_id: result.parameter_id,
            matrix_id: getMatrixId(sampleId),
            numeric_value: result.result_value,
            unit_symbol: getUnitSymbol(result.unit_id),
            qc_recovery_percent: result.qc_recovery_percent,
            recorded_at: result.entered_at
                ? new Date(result.entered_at)
                : result.created_at
                    ? new Date(result.created_at)
                    : null,
            limit_min: result.limit_min,
            limit_max: result.limit_max,
            analyst_name: analyst?.full_name || "Unknown Analyst",
            run_number: run?.run_number ?? null,
            task_number: task?.task_number || "-",
        };
    });

    // Apply filters
    const filteredAlerts = enrichedAlerts.filter(a => {
        if (filterParameter && a.parameter_id !== filterParameter) return false;
        if (filterMatrix && a.matrix_id !== filterMatrix) return false;
        return true;
    });

    const selectedAlertData = enrichedAlerts.find(a => a.id === selectedAlert);

    const handleAddAction = () => {
        if (!newAction.trim() || !selectedAlert) return;
        const currentUser = users.find(u => u.role === "MANAGER" || u.role === "ADMIN");
        addActionMutation.mutate({
            result_id: selectedAlert,
            action: newAction,
            performed_by: currentUser?.id || null,
        });
        setNewAction("");
    };

    const predefinedActions = [
        "Repeat analysis requested",
        "Sample re-collection required",
        "Instrument recalibration needed",
        "Method deviation documented",
        "Report to supervisor",
    ];

    const formatValue = (value: number | null, unit: string) => {
        if (value === null || value === undefined) return "-";
        return `${value}${unit ? ` ${unit}` : ""}`;
    };

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
                        {parameters.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <select
                        className="text-sm border border-border-light rounded-md px-3 py-1.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={filterMatrix}
                        onChange={(e) => setFilterMatrix(e.target.value)}
                    >
                        <option value="">All Matrices</option>
                        {matrices.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="mt-2 text-sm text-text-secondary">Loading QC data...</p>
                    </div>
                ) : (
                    <DenseTable
                        data={filteredAlerts}
                        keyExtractor={r => r.id}
                        onRowClick={(row) => setSelectedAlert(row.id)}
                        columns={[
                            {
                                header: "Sample",
                                accessorKey: "sample_name",
                                cell: (r: EnrichedAlert) => (
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
                                cell: (r: EnrichedAlert) => formatValue(r.numeric_value, r.unit_symbol)
                            },
                            {
                                header: "QC Recovery",
                                accessorKey: "qc_recovery_percent",
                                className: "font-mono text-right",
                                cell: (r: EnrichedAlert) => r.qc_recovery_percent !== null
                                    ? `${r.qc_recovery_percent.toFixed(1)}%`
                                    : "-"
                            },
                            {
                                header: "Issue",
                                accessorKey: "compliance_status",
                                cell: (r: EnrichedAlert) => (
                                    <div className="flex flex-col gap-1">
                                        {r.compliance_status === "FAIL" && (
                                            <span className="inline-flex items-center gap-1 rounded bg-danger/20 px-2 py-0.5 text-xs font-bold text-danger">
                                                <span className="material-symbols-outlined text-[12px]">error</span>
                                                OOS{r.limit_max ? `: >${r.limit_max}` : ""}
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
                                cell: (r: EnrichedAlert) => (
                                    <span className="text-xs text-text-secondary">
                                        {selectedAlert === r.id ? `${dbActions.length} logged` : "—"}
                                    </span>
                                )
                            }
                        ]}
                    />
                )}

                {!isLoading && filteredAlerts.length === 0 && (
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
                                    <span className="font-mono font-bold text-danger">
                                        {formatValue(selectedAlertData.numeric_value, selectedAlertData.unit_symbol)}
                                    </span>
                                </div>
                                {selectedAlertData.limit_min !== null && selectedAlertData.limit_max !== null && (
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Limit Range:</span>
                                        <span className="font-mono">
                                            {selectedAlertData.limit_min} – {selectedAlertData.limit_max} {selectedAlertData.unit_symbol}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">QC Recovery:</span>
                                    <span className="font-mono">
                                        {selectedAlertData.qc_recovery_percent !== null
                                            ? `${selectedAlertData.qc_recovery_percent.toFixed(1)}%`
                                            : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Status:</span>
                                    <span className="font-bold text-danger uppercase">
                                        {selectedAlertData.compliance_status === "FAIL" ? "Out of Spec" : "QC Failure"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Recorded:</span>
                                    <span>{selectedAlertData.recorded_at?.toLocaleDateString() || "-"}</span>
                                </div>
                            </div>

                            {/* Sample Chain — Real Data */}
                            <div className="rounded-lg border border-border-light p-3 dark:border-border-dark">
                                <h5 className="text-xs font-bold text-text-secondary mb-2">Sample Chain</h5>
                                <div className="text-xs space-y-1 font-mono">
                                    <p>Task: {selectedAlertData.task_number}</p>
                                    <p>Run: {selectedAlertData.run_number !== null ? `#${selectedAlertData.run_number}` : "N/A"}</p>
                                    <p>Analyst: {selectedAlertData.analyst_name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Corrective Actions */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-text-main dark:text-white">Corrective Actions</h4>

                            {/* Logged Actions */}
                            <div className="max-h-[150px] overflow-y-auto space-y-2">
                                {dbActions.map(action => (
                                    <div key={action.id} className="p-2 rounded bg-primary/5 border border-primary/20 text-sm">
                                        <p className="font-medium">{action.action}</p>
                                        <p className="text-xs text-text-secondary">
                                            {users.find(u => u.id === action.performed_by)?.full_name || "Unknown"} • {new Date(action.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                ))}
                                {dbActions.length === 0 && (
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
