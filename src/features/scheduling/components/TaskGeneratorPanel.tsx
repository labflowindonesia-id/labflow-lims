"use client";

import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { MOCK_WORK_ORDERS, MOCK_QUOTATIONS, MOCK_PARAMETERS, MOCK_MATRICES, MOCK_USERS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

interface RequestedTest {
    parameter_id: string;
    parameter_name: string;
    matrix_name: string;
    method: string;
}

interface GeneratedTask {
    id: string;
    sample_name: string;
    parameter_name: string;
    assigned_to?: string;
}

export default function TaskGeneratorPanel({ onTasksGenerated }: { onTasksGenerated?: (count: number) => void }) {
    const [selectedWO, setSelectedWO] = useState<string>("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
    const [defaultAnalyst, setDefaultAnalyst] = useState("");

    const analysts = MOCK_USERS.filter(u => u.role === "ANALYST");

    // Work orders that are confirmed (RECEIVED) but may need task generation
    const pendingWorkOrders = MOCK_WORK_ORDERS.filter(wo =>
        wo.status === "RECEIVED" || wo.status === "IN_PROGRESS"
    );

    const selectedWorkOrder = pendingWorkOrders.find(wo => wo.id === selectedWO);

    // Mock requested tests from quotation (in real app, would come from WO.requested_tests)
    const getRequestedTests = (woId: string): RequestedTest[] => {
        const wo = MOCK_WORK_ORDERS.find(w => w.id === woId);
        if (!wo) return [];

        // Generate mock requested tests based on quotation
        return [
            { parameter_id: "param-001", parameter_name: "pH", matrix_name: "Water", method: "SNI 06-6989.11" },
            { parameter_id: "param-002", parameter_name: "COD", matrix_name: "Water", method: "SNI 6989.2:2019" },
            { parameter_id: "param-003", parameter_name: "BOD5", matrix_name: "Water", method: "SNI 6989.72:2009" },
            { parameter_id: "param-004", parameter_name: "TSS", matrix_name: "Water", method: "SNI 06-6989.3" },
        ];
    };

    const requestedTests = selectedWO ? getRequestedTests(selectedWO) : [];

    const handleGenerateTasks = () => {
        if (!selectedWorkOrder) return;

        // Simulate task generation
        const newTasks: GeneratedTask[] = requestedTests.map((test, idx) => ({
            id: `task-gen-${Date.now()}-${idx}`,
            sample_name: `Sample-${selectedWorkOrder.work_order_no.split('-').pop()}`,
            parameter_name: test.parameter_name,
            assigned_to: defaultAnalyst || undefined
        }));

        setGeneratedTasks(newTasks);
        setShowConfirmModal(true);
    };

    const handleConfirmGeneration = () => {
        // In real app, would POST to API
        console.log("GENERATING TASKS:", generatedTasks);

        if (onTasksGenerated) {
            onTasksGenerated(generatedTasks.length);
        }

        alert(`${generatedTasks.length} tasks created successfully!`);
        setShowConfirmModal(false);
        setSelectedWO("");
        setGeneratedTasks([]);
    };

    return (
        <>
            <PremiumCard
                title="Task Generator"
                subtitle="Create test tasks from confirmed work orders"
            >
                <div className="space-y-4">
                    {/* Work Order Selector */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                                Select Work Order
                            </label>
                            <select
                                className="w-full text-sm border border-border-light rounded-lg p-2.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                                value={selectedWO}
                                onChange={(e) => setSelectedWO(e.target.value)}
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
                                Default Analyst (Optional)
                            </label>
                            <select
                                className="w-full text-sm border border-border-light rounded-lg p-2.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                                value={defaultAnalyst}
                                onChange={(e) => setDefaultAnalyst(e.target.value)}
                            >
                                <option value="">Auto-assign later...</option>
                                {analysts.map(a => (
                                    <option key={a.id} value={a.id}>{a.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Requested Tests Preview */}
                    {selectedWO && (
                        <div className="rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
                            <div className="bg-slate-50 dark:bg-black/20 px-4 py-2 border-b border-border-light dark:border-border-dark">
                                <span className="text-xs font-bold text-text-main dark:text-white">
                                    Requested Tests ({requestedTests.length})
                                </span>
                            </div>
                            <div className="divide-y divide-border-light dark:divide-border-dark">
                                {requestedTests.map((test, idx) => (
                                    <div key={idx} className="px-4 py-2 flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-medium text-text-main dark:text-white">
                                                {test.parameter_name}
                                            </span>
                                            <span className="text-xs text-text-secondary ml-2">
                                                ({test.matrix_name})
                                            </span>
                                        </div>
                                        <span className="text-xs text-text-secondary font-mono">
                                            {test.method}
                                        </span>
                                    </div>
                                ))}
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
                                Generate {requestedTests.length} Tasks
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

                        <div className="max-h-60 overflow-y-auto rounded-lg border border-border-light dark:border-border-dark mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-black/20 sticky top-0">
                                    <tr>
                                        <th className="text-left px-3 py-2">Sample</th>
                                        <th className="text-left px-3 py-2">Parameter</th>
                                        <th className="text-left px-3 py-2">Assigned To</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {generatedTasks.map(task => (
                                        <tr key={task.id}>
                                            <td className="px-3 py-2">{task.sample_name}</td>
                                            <td className="px-3 py-2 font-medium">{task.parameter_name}</td>
                                            <td className="px-3 py-2 text-text-secondary">
                                                {task.assigned_to
                                                    ? analysts.find(a => a.id === task.assigned_to)?.full_name
                                                    : "Unassigned"}
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
