"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { MOCK_WORK_ORDERS, MOCK_PARAMETERS, MOCK_USERS, MOCK_RULES, MOCK_MATRICES, MOCK_METHODS, MOCK_INSTRUMENTS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

interface RequestedTest {
    id: string;
    parameter_id: string;
    parameter_name: string;
    matrix_id: string;
    matrix_name: string;
    method: string;
    instrument: string;
    default_tat_days: number;
    due_date_override?: string;
    assigned_analyst_id?: string;
    sample_count: number;
}

interface GeneratedTask {
    id: string;
    sample_name: string;
    parameter_name: string;
    due_date: string;
    assigned_to?: string;
    qualification_warning: boolean;
}

// Mock analyst qualifications
const ANALYST_QUALIFICATIONS: Record<string, string[]> = {
    "usr-003": ["par-001", "par-002", "par-004"], // Analyst Kimia qualified for COD, pH, Cd
};

export default function TaskGeneratorPanel({ onTasksGenerated }: { onTasksGenerated?: (count: number) => void }) {
    const [selectedWO, setSelectedWO] = useState<string>("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
    const [bulkAnalyst, setBulkAnalyst] = useState("");
    const [requestedTests, setRequestedTests] = useState<RequestedTest[]>([]);

    const analysts = MOCK_USERS.filter(u => u.role === "ANALYST");

    const pendingWorkOrders = MOCK_WORK_ORDERS.filter(wo =>
        wo.status === "RECEIVED" || wo.status === "IN_PROGRESS"
    );

    const selectedWorkOrder = pendingWorkOrders.find(wo => wo.id === selectedWO);

    // Load requested tests when WO changes
    const loadRequestedTests = (woId: string) => {
        const wo = MOCK_WORK_ORDERS.find(w => w.id === woId);
        if (!wo) return;

        // Generate mock requested tests based on rules
        const tests: RequestedTest[] = MOCK_RULES.slice(0, 4).map((rule, idx) => {
            const param = MOCK_PARAMETERS.find(p => p.id === rule.parameter_id);
            const matrix = MOCK_MATRICES.find(m => m.id === rule.matrix_id);
            const method = MOCK_METHODS.find(m => m.id === rule.default_method_id);
            const instrument = MOCK_INSTRUMENTS.find(i => i.id === rule.default_instrument_id);

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + rule.default_tat_days);

            return {
                id: `req-${idx}`,
                parameter_id: rule.parameter_id,
                parameter_name: param?.name || "Unknown",
                matrix_id: rule.matrix_id,
                matrix_name: matrix?.name || "Unknown",
                method: method?.code || "N/A",
                instrument: instrument?.name || "N/A",
                default_tat_days: rule.default_tat_days,
                due_date_override: dueDate.toISOString().split('T')[0],
                sample_count: wo.sample_count || 1
            };
        });

        setRequestedTests(tests);
    };

    const handleWOChange = (woId: string) => {
        setSelectedWO(woId);
        if (woId) {
            loadRequestedTests(woId);
        } else {
            setRequestedTests([]);
        }
    };

    const handleDueDateChange = (testId: string, newDate: string) => {
        setRequestedTests(prev =>
            prev.map(t => t.id === testId ? { ...t, due_date_override: newDate } : t)
        );
    };

    const handleAnalystChange = (testId: string, analystId: string) => {
        setRequestedTests(prev =>
            prev.map(t => t.id === testId ? { ...t, assigned_analyst_id: analystId } : t)
        );
    };

    const handleBulkAssign = () => {
        if (!bulkAnalyst) return;
        setRequestedTests(prev =>
            prev.map(t => ({ ...t, assigned_analyst_id: bulkAnalyst }))
        );
    };

    const isAnalystQualified = (analystId: string, parameterId: string): boolean => {
        const qualifications = ANALYST_QUALIFICATIONS[analystId];
        if (!qualifications) return false;
        return qualifications.includes(parameterId);
    };

    const handleGenerateTasks = () => {
        if (!selectedWorkOrder) return;

        const newTasks: GeneratedTask[] = requestedTests.flatMap((test) => {
            const tasks: GeneratedTask[] = [];
            for (let i = 0; i < test.sample_count; i++) {
                const qualificationWarning = test.assigned_analyst_id
                    ? !isAnalystQualified(test.assigned_analyst_id, test.parameter_id)
                    : false;

                tasks.push({
                    id: `task-gen-${Date.now()}-${test.id}-${i}`,
                    sample_name: `Sample-${selectedWorkOrder.work_order_no.split('-').pop()}-${i + 1}`,
                    parameter_name: test.parameter_name,
                    due_date: test.due_date_override || new Date().toISOString().split('T')[0],
                    assigned_to: test.assigned_analyst_id,
                    qualification_warning: qualificationWarning
                });
            }
            return tasks;
        });

        setGeneratedTasks(newTasks);
        setShowConfirmModal(true);
    };

    const handleConfirmGeneration = () => {
        console.log("GENERATING TASKS:", generatedTasks);

        if (onTasksGenerated) {
            onTasksGenerated(generatedTasks.length);
        }

        alert(`${generatedTasks.length} tasks created successfully!`);
        setShowConfirmModal(false);
        setSelectedWO("");
        setRequestedTests([]);
        setGeneratedTasks([]);
    };

    const qualificationWarningCount = useMemo(() => {
        return requestedTests.filter(t =>
            t.assigned_analyst_id && !isAnalystQualified(t.assigned_analyst_id, t.parameter_id)
        ).length;
    }, [requestedTests]);

    return (
        <>
            <PremiumCard
                title="Task Generator"
                subtitle="Create test tasks from confirmed work orders"
            >
                <div className="space-y-4">
                    {/* Work Order & Bulk Assign */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                                Select Work Order
                            </label>
                            <select
                                className="w-full text-sm border border-border-light rounded-lg p-2.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                                value={selectedWO}
                                onChange={(e) => handleWOChange(e.target.value)}
                            >
                                <option value="">Choose a work order...</option>
                                {pendingWorkOrders.map(wo => (
                                    <option key={wo.id} value={wo.id}>
                                        {wo.work_order_no} - {wo.customer_name_snapshot}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                                Bulk Assign Analyst
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 text-sm border border-border-light rounded-lg p-2.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                                    value={bulkAnalyst}
                                    onChange={(e) => setBulkAnalyst(e.target.value)}
                                >
                                    <option value="">Select analyst...</option>
                                    {analysts.map(a => (
                                        <option key={a.id} value={a.id}>{a.full_name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleBulkAssign}
                                    disabled={!bulkAnalyst || requestedTests.length === 0}
                                    className="px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                                >
                                    Apply All
                                </button>
                            </div>
                        </div>

                        {/* Qualification Warning Summary */}
                        <div className="flex items-end">
                            {qualificationWarningCount > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs">
                                    <span className="material-symbols-outlined text-[18px]">warning</span>
                                    <span>{qualificationWarningCount} unqualified assignment(s)</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Requested Tests Table with Overrides */}
                    {selectedWO && requestedTests.length > 0 && (
                        <div className="rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
                            <div className="bg-slate-50 dark:bg-black/20 px-4 py-2 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                                <span className="text-xs font-bold text-text-main dark:text-white">
                                    Requested Tests ({requestedTests.length})
                                </span>
                                <span className="text-xs text-text-secondary">
                                    Override due dates and assign analysts per test
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50/50 dark:bg-black/10">
                                        <tr>
                                            <th className="text-left px-4 py-2 font-medium text-text-secondary">Parameter</th>
                                            <th className="text-left px-4 py-2 font-medium text-text-secondary hidden md:table-cell">Matrix</th>
                                            <th className="text-left px-4 py-2 font-medium text-text-secondary hidden lg:table-cell">Method</th>
                                            <th className="text-center px-4 py-2 font-medium text-text-secondary">Samples</th>
                                            <th className="text-left px-4 py-2 font-medium text-text-secondary">Due Date</th>
                                            <th className="text-left px-4 py-2 font-medium text-text-secondary">Analyst</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                        {requestedTests.map(test => {
                                            const hasQualificationWarning = test.assigned_analyst_id &&
                                                !isAnalystQualified(test.assigned_analyst_id, test.parameter_id);

                                            return (
                                                <tr key={test.id} className={cn(
                                                    "hover:bg-slate-50/50 dark:hover:bg-white/5",
                                                    hasQualificationWarning && "bg-warning/5"
                                                )}>
                                                    <td className="px-4 py-2">
                                                        <span className="font-medium text-text-main dark:text-white">
                                                            {test.parameter_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 hidden md:table-cell">
                                                        <span className="text-xs text-text-secondary">{test.matrix_name}</span>
                                                    </td>
                                                    <td className="px-4 py-2 hidden lg:table-cell">
                                                        <span className="text-xs font-mono text-text-secondary">{test.method}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="text-xs font-medium">{test.sample_count}</span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="date"
                                                            value={test.due_date_override || ""}
                                                            onChange={(e) => handleDueDateChange(test.id, e.target.value)}
                                                            className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                                                            min={new Date().toISOString().split('T')[0]}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-1">
                                                            <select
                                                                value={test.assigned_analyst_id || ""}
                                                                onChange={(e) => handleAnalystChange(test.id, e.target.value)}
                                                                className={cn(
                                                                    "text-xs border rounded px-2 py-1 bg-white dark:bg-surface-dark",
                                                                    hasQualificationWarning
                                                                        ? "border-warning"
                                                                        : "border-border-light dark:border-border-dark"
                                                                )}
                                                            >
                                                                <option value="">Unassigned</option>
                                                                {analysts.map(a => (
                                                                    <option key={a.id} value={a.id}>
                                                                        {a.full_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {hasQualificationWarning && (
                                                                <span
                                                                    className="material-symbols-outlined text-warning text-[16px]"
                                                                    title="Analyst not qualified for this parameter"
                                                                >
                                                                    warning
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="flex justify-end gap-3 pt-2">
                        {selectedWO && (
                            <button
                                onClick={handleGenerateTasks}
                                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-hover"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_task</span>
                                Generate {requestedTests.length * (selectedWorkOrder?.sample_count || 1)} Tasks
                            </button>
                        )}
                    </div>

                    {/* Empty State */}
                    {!selectedWO && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <span className="material-symbols-outlined text-[48px] text-text-secondary/30">
                                playlist_add
                            </span>
                            <p className="mt-2 text-sm text-text-secondary">
                                Select a work order to generate test tasks
                            </p>
                        </div>
                    )}
                </div>
            </PremiumCard>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-surface-dark">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-success">task_alt</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main dark:text-white">
                                    Confirm Task Generation
                                </h3>
                                <p className="text-sm text-text-secondary">
                                    {generatedTasks.length} tasks will be created
                                </p>
                            </div>
                        </div>

                        {generatedTasks.some(t => t.qualification_warning) && (
                            <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">warning</span>
                                <span>Some tasks are assigned to analysts without proper qualifications</span>
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto rounded-lg border border-border-light dark:border-border-dark mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-black/20 sticky top-0">
                                    <tr>
                                        <th className="text-left px-3 py-2">Sample</th>
                                        <th className="text-left px-3 py-2">Parameter</th>
                                        <th className="text-left px-3 py-2">Due Date</th>
                                        <th className="text-left px-3 py-2">Analyst</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {generatedTasks.map(task => (
                                        <tr key={task.id} className={cn(task.qualification_warning && "bg-warning/5")}>
                                            <td className="px-3 py-2">{task.sample_name}</td>
                                            <td className="px-3 py-2 font-medium">{task.parameter_name}</td>
                                            <td className="px-3 py-2 text-xs font-mono">{task.due_date}</td>
                                            <td className="px-3 py-2 text-text-secondary flex items-center gap-1">
                                                {task.assigned_to
                                                    ? analysts.find(a => a.id === task.assigned_to)?.full_name
                                                    : "Unassigned"}
                                                {task.qualification_warning && (
                                                    <span className="material-symbols-outlined text-warning text-[14px]">warning</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-100 rounded-lg dark:hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmGeneration}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg"
                            >
                                <span className="material-symbols-outlined text-[18px]">check</span>
                                Create Tasks
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
