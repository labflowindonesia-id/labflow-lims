"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useParameters, useUsers, useMatrixParameterRules, useSampleMatrices, useMethods, useInstruments, useAnalystQualifications, useConfirmedSamples, queryKeys } from "@/hooks/use-supabase";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface RequestedTest {
    id: string;
    parameter_id: string;
    parameter_name: string;
    matrix_id: string;
    matrix_name: string;
    method: string;
    method_id: string | null;
    instrument: string;
    instrument_id: string | null;
    default_tat_days: number;
    due_date_override?: string;
    assigned_analyst_id?: string;
}

interface GeneratedTask {
    id: string;
    sample_id_display: string;
    parameter_name: string;
    due_date: string;
    assigned_to?: string;
    qualification_warning: boolean;
}

export default function TaskGeneratorPanel({ onTasksGenerated }: { onTasksGenerated?: (count: number) => void }) {
    const [selectedSampleUUID, setSelectedSampleUUID] = useState<string>("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
    const [bulkAnalyst, setBulkAnalyst] = useState("");
    const [requestedTests, setRequestedTests] = useState<RequestedTest[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryClient = useQueryClient();

    // Supabase data
    const { data: confirmedSamples = [] } = useConfirmedSamples();
    const { data: parameters = [] } = useParameters();
    const { data: users = [] } = useUsers();
    const { data: rules = [] } = useMatrixParameterRules();
    const { data: matrices = [] } = useSampleMatrices();
    const { data: methods = [] } = useMethods();
    const { data: instruments = [] } = useInstruments();
    const { data: qualificationMap = {} } = useAnalystQualifications();

    const analysts = (users || []).filter(u => u.role === "ANALYST");

    const selectedSample = confirmedSamples.find(s => s.id === selectedSampleUUID);

    // Load requested tests based on sample's requested_tests in DB
    const loadRequestedTests = async (sampleUUID: string) => {
        const sample = confirmedSamples.find(s => s.id === sampleUUID);
        if (!sample || !sample.matrix_id) {
            setRequestedTests([]);
            return;
        }

        try {
            // Get actual requested tests for this sample
            const { data, error: reqError } = await supabase
                .from("requested_tests" as any)
                .select("*")
                .eq("sample_id", sampleUUID);
            const dbRequests = data as any[];

            if (reqError) throw reqError;
            if (!dbRequests || dbRequests.length === 0) {
                setRequestedTests([]);
                return;
            }

            // Get existing active tasks to filter out already-generated ones
            const { data: existingTasksData, error: taskError } = await (supabase as any)
                .from("test_tasks")
                .select("requested_test_id")
                .eq("sample_id", sampleUUID)
                .neq("status", "CANCELLED");

            if (taskError) throw taskError;

            const existingTasks = existingTasksData as any[];
            const existingReqTestIds = new Set((existingTasks || []).map(t => t.requested_test_id));
            const availableRequests = dbRequests.filter(req => !existingReqTestIds.has(req.id));

            const tests: RequestedTest[] = availableRequests.map((req) => {
                const param = (parameters || []).find(p => p.id === req.parameter_id);
                const matrix = (matrices || []).find(m => m.id === sample.matrix_id);
                const method = (methods || []).find(m => m.id === req.method_id);
                const instrument = (instruments || []).find(i => i.id === req.instrument_id);

                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + (req.tat_days || 5));

                return {
                    id: req.id, // Use actual requested_test.id
                    parameter_id: req.parameter_id,
                    parameter_name: param?.name || "Unknown",
                    matrix_id: sample.matrix_id as string,
                    matrix_name: matrix?.name || "Unknown",
                    method: method?.code || "N/A",
                    method_id: req.method_id || null,
                    instrument: instrument?.name || "N/A",
                    instrument_id: req.instrument_id || null,
                    default_tat_days: req.tat_days || 5,
                    due_date_override: req.due_date ? new Date(req.due_date).toISOString().split('T')[0] : dueDate.toISOString().split('T')[0],
                };
            });

            setRequestedTests(tests);
        } catch (err) {
            console.error("Failed to load requested tests:", err);
            setRequestedTests([]);
        }
    };

    const handleSampleChange = (sampleUUID: string) => {
        setSelectedSampleUUID(sampleUUID);
        if (sampleUUID) {
            loadRequestedTests(sampleUUID);
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
        const qualifiedParams = qualificationMap[analystId];
        if (!qualifiedParams || qualifiedParams.length === 0) return false;
        return qualifiedParams.includes(parameterId);
    };

    const handleGenerateTasks = () => {
        if (!selectedSample) return;

        // 1 sample = 1 task per parameter (no more sample_count loop)
        const newTasks: GeneratedTask[] = requestedTests.map((test) => {
            const qualificationWarning = test.assigned_analyst_id
                ? !isAnalystQualified(test.assigned_analyst_id, test.parameter_id)
                : false;

            return {
                id: `task-gen-${Date.now()}-${test.id}`,
                sample_id_display: selectedSample.sample_id,
                parameter_name: test.parameter_name,
                due_date: test.due_date_override || new Date().toISOString().split('T')[0],
                assigned_to: test.assigned_analyst_id,
                qualification_warning: qualificationWarning,
            };
        });

        setGeneratedTasks(newTasks);
        setShowConfirmModal(true);
    };

    const handleConfirmGeneration = async () => {
        if (isSubmitting || !selectedSample) return;
        setIsSubmitting(true);

        try {
            const now = new Date().toISOString();
            const sampleId = selectedSample.id; // UUID of the selected sample

            // Step 1: Look up analyst IDs (test_tasks.assigned_to_id FK → analysts.id, not users.id)
            const uniqueUserIds = [...new Set(requestedTests.map(t => t.assigned_analyst_id).filter(Boolean))] as string[];
            const analystIdMap: Record<string, string> = {};

            if (uniqueUserIds.length > 0) {
                const { data: analystRows } = await (supabase
                    .from("analysts" as any)
                    .select("id, user_id")
                    .in("user_id", uniqueUserIds) as any) as { data: { id: string; user_id: string }[] | null; error: any };

                (analystRows || []).forEach((a: { id: string; user_id: string }) => {
                    analystIdMap[a.user_id] = a.id;
                });
            }

            // Step 2: Build test_tasks rows
            const taskRows: any[] = [];

            requestedTests.forEach((test, testIdx) => {
                const requestedTestId = test.id; // Already the actual requested_test.id
                const taskId = crypto.randomUUID();
                const taskNumber = `TSK-${Date.now()}-${testIdx}`;
                const analystId = test.assigned_analyst_id ? (analystIdMap[test.assigned_analyst_id] || null) : null;

                // Child row: test_tasks (references requested_test_id)
                taskRows.push({
                    id: taskId,
                    task_number: taskNumber,
                    requested_test_id: requestedTestId,
                    sample_id: sampleId,
                    work_plan_id: null, // this gets filled by the database or left null
                    parameter_id: test.parameter_id,
                    method_id: test.method_id,
                    instrument_id: test.instrument_id,
                    assigned_to_id: analystId,
                    status: analystId ? "ASSIGNED" : "PLANNED",
                    priority: "NORMAL",
                    due_date: test.due_date_override ? new Date(test.due_date_override).toISOString() : null,
                    planned_date: now,
                    is_overdue: false,
                    is_urgent: false,
                    assigned_at: analystId ? now : null,
                });
            });

            // Step 3: Insert test_tasks (child FK)
            const { error } = await supabase
                .from("test_tasks")
                .insert(taskRows as any);

            if (error) {
                console.error("Failed to insert tasks:", error);
                alert(`Error creating tasks: ${error.message}`);
                return;
            }

            // Invalidate cache so Pending Assignments refreshes
            await queryClient.invalidateQueries({ queryKey: queryKeys.testTasks.all });

            if (onTasksGenerated) {
                onTasksGenerated(taskRows.length);
            }

            alert(`${taskRows.length} tasks created successfully for ${selectedSample.sample_id}!`);
            setShowConfirmModal(false);
            setSelectedSampleUUID("");
            setRequestedTests([]);
            setGeneratedTasks([]);
        } catch (err) {
            console.error("Task generation error:", err);
            alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
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
                subtitle="Create test tasks from confirmed samples"
            >
                <div className="space-y-4">
                    {/* Sample ID & Bulk Assign */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                                Select Sample ID
                            </label>
                            <select
                                className="w-full text-sm border border-border-light rounded-lg p-2.5 bg-white dark:bg-surface-dark dark:border-border-dark"
                                value={selectedSampleUUID}
                                onChange={(e) => handleSampleChange(e.target.value)}
                            >
                                <option value="">Choose a sample...</option>
                                {confirmedSamples.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.sample_id} — {s.sample_name || "Unnamed"} ({s.work_order_number})
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

                    {/* Sample Info Card */}
                    {selectedSample && (
                        <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">science</span>
                                <span className="text-sm font-bold text-primary">{selectedSample.sample_id}</span>
                            </div>
                            <div className="text-xs text-text-secondary">
                                <span className="font-medium">{selectedSample.sample_name || "—"}</span>
                                {" · "}
                                WO: {selectedSample.work_order_number}
                                {selectedSample.customer_name && ` · ${selectedSample.customer_name}`}
                            </div>
                        </div>
                    )}

                    {/* Requested Tests Table with Overrides */}
                    {selectedSampleUUID && requestedTests.length > 0 && (
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

                    {/* No Tests Found for Sample */}
                    {selectedSampleUUID && requestedTests.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <span className="material-symbols-outlined text-[36px] text-warning/50">info</span>
                            <p className="mt-2 text-sm text-text-secondary">
                                No matching test rules found for this sample&apos;s matrix.
                            </p>
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="flex justify-end gap-3 pt-2">
                        {selectedSampleUUID && requestedTests.length > 0 && (
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
                    {!selectedSampleUUID && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <span className="material-symbols-outlined text-[48px] text-text-secondary/30">
                                playlist_add
                            </span>
                            <p className="mt-2 text-sm text-text-secondary">
                                Select a sample ID to generate test tasks
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
                                    {generatedTasks.length} tasks will be created for {selectedSample?.sample_id}
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
                                        <th className="text-left px-3 py-2">Sample ID</th>
                                        <th className="text-left px-3 py-2">Parameter</th>
                                        <th className="text-left px-3 py-2">Due Date</th>
                                        <th className="text-left px-3 py-2">Analyst</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {generatedTasks.map(task => (
                                        <tr key={task.id} className={cn(task.qualification_warning && "bg-warning/5")}>
                                            <td className="px-3 py-2 font-mono text-xs">{task.sample_id_display}</td>
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
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[18px]">{isSubmitting ? "hourglass_empty" : "check"}</span>
                                {isSubmitting ? "Creating..." : "Create Tasks"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
