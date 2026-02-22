"use client";

import { useState, useMemo, useEffect } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { useTestTasks, useUsers, useInstruments, useWorkOrders, useSamples, useParameters, useMethods } from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useQueryClient, useQuery } from "@tanstack/react-query";

type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

// Interface compatible with Supabase task data + extended fields
interface ExtendedTask {
    id: string;
    priority: TaskPriority;
    dueDate: Date;
    sample_id: string | null;
    parameter_id: string | null;
    method_id: string | null;
    instrument_id: string | null;
    assigned_to_id: string | null;
    status: string;
    due_date: string | null;
    work_order_id?: string | null;
    task_number: string;
}

export default function TaskAssignmentTable() {
    const queryClient = useQueryClient();

    // Supabase data
    const { data: supabaseTasks = [] } = useTestTasks();
    const { data: users = [] } = useUsers();
    const { data: instruments = [] } = useInstruments();
    const { data: workOrders = [] } = useWorkOrders();
    const { data: samples = [] } = useSamples();
    const { data: parameters = [] } = useParameters();
    const { data: allMethods = [] } = useMethods();

    // Fetch analysts to map analyst ID → user ID
    const { data: analysts = [] } = useQuery<{ id: string; user_id: string }[]>({
        queryKey: ["analysts", "all"],
        queryFn: async () => {
            const { data, error } = await supabase.from("analysts").select("id, user_id");
            if (error) throw error;
            return (data || []) as { id: string; user_id: string }[];
        },
    });

    // Lookup helpers
    const getSampleDisplay = (sampleUUID: string | null) => {
        if (!sampleUUID) return { id: "—", name: "Unknown" };
        const s = (samples || []).find(s => s.id === sampleUUID);
        return { id: s?.sample_lab_id || sampleUUID.slice(0, 8), name: s?.sample_name || "" };
    };
    const getParameterName = (id: string | null) => {
        if (!id) return "Unknown";
        return (parameters || []).find(p => p.id === id)?.name || id.slice(0, 8);
    };
    const getMethodName = (id: string | null) => {
        if (!id) return "";
        const m = (allMethods || []).find(m => m.id === id);
        return m?.code || m?.name || "";
    };

    // Add priority and due date to tasks
    const [tasks, setTasks] = useState<ExtendedTask[]>([]);

    // Update tasks when supabaseTasks changes
    useEffect(() => {
        if (supabaseTasks && supabaseTasks.length > 0) {
            setTasks(supabaseTasks
                .filter(t => t.status !== "CANCELLED" && t.status !== "COMPLETED")
                .map(t => ({
                    id: t.id,
                    sample_id: t.sample_id,
                    parameter_id: t.parameter_id,
                    method_id: t.method_id,
                    instrument_id: t.instrument_id,
                    assigned_to_id: t.assigned_to_id,
                    status: t.status,
                    due_date: t.due_date,
                    work_order_id: t.work_plan_id,
                    task_number: t.task_number,
                    priority: (t.priority as TaskPriority) || "NORMAL",
                    dueDate: new Date(t.due_date || new Date().toISOString())
                })));
        }
    }, [supabaseTasks]);

    // Filters
    const [filterInstrument, setFilterInstrument] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [filterPriority, setFilterPriority] = useState<string>("");
    const [filterWorkOrder, setFilterWorkOrder] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    // Selection for delete
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; ids: string[]; type: "single" | "batch" }>({ show: false, ids: [], type: "single" });
    const [isDeleting, setIsDeleting] = useState(false);

    // Analyst lookup: assigned_to_id (analyst.id) → analyst.user_id → user.full_name
    const getAnalystName = (analystId: string | null) => {
        if (!analystId) return null;
        const analyst = analysts.find(a => a.id === analystId);
        if (!analyst) return analystId.slice(0, 8);
        const user = (users || []).find(u => u.id === analyst.user_id);
        return user?.full_name || analystId.slice(0, 8);
    };

    const handleSelectTask = (taskId: string) => {
        setSelectedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedTasks.size === filteredTasks.length) {
            setSelectedTasks(new Set());
        } else {
            setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
        }
    };

    const handleDeleteTasks = async (taskIds: string[]) => {
        if (taskIds.length === 0) return;
        setIsDeleting(true);
        try {
            const { error } = await (supabase as any)
                .from("test_tasks")
                .update({ status: "CANCELLED" })
                .in("id", taskIds);
            if (error) throw error;

            setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
            setSelectedTasks(prev => {
                const newSet = new Set(prev);
                taskIds.forEach(id => newSet.delete(id));
                return newSet;
            });
            queryClient.invalidateQueries({ queryKey: ["testTasks"] });
        } catch (err: any) {
            console.error("Failed to delete tasks:", err?.message || err);
        } finally {
            setIsDeleting(false);
            setDeleteConfirm({ show: false, ids: [], type: "single" });
        }
    };

    const openDeleteConfirm = (ids: string[], type: "single" | "batch") => {
        setDeleteConfirm({ show: true, ids, type });
    };



    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.sample_id?.toLowerCase().includes(q) ||
                t.parameter_id?.toLowerCase().includes(q)
            );
        }

        // Instrument filter
        if (filterInstrument) {
            result = result.filter(t => t.instrument_id === filterInstrument);
        }

        // Status filter
        if (filterStatus) {
            result = result.filter(t => t.status === filterStatus);
        }

        // Priority filter
        if (filterPriority) {
            result = result.filter(t => t.priority === filterPriority);
        }

        // Work Order filter
        if (filterWorkOrder) {
            result = result.filter(t => t.work_order_id === filterWorkOrder);
        }

        return result;
    }, [tasks, searchQuery, filterInstrument, filterStatus, filterPriority, filterWorkOrder]);

    const priorityColors: Record<TaskPriority, string> = {
        LOW: "bg-slate-100 text-slate-600",
        NORMAL: "bg-blue-100 text-blue-600",
        HIGH: "bg-warning/20 text-warning",
        URGENT: "bg-danger/20 text-danger"
    };

    return (
        <div className="space-y-4">
            {/* Bulk Action Panel */}
            {selectedTasks.size > 0 && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-danger">check_box</span>
                        <span className="text-sm font-medium text-text-main dark:text-white">
                            {selectedTasks.size} task(s) selected
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => openDeleteConfirm(Array.from(selectedTasks), "batch")}
                            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/80 flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Delete Selected
                        </button>
                        <button
                            onClick={() => setSelectedTasks(new Set())}
                            className="text-text-secondary hover:text-text-main"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                </div>
            )}

            <PremiumCard
                title="Pending Assignments"
                subtitle="Overview of generated test tasks and their assignments"
                action={
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary">
                            {filteredTasks.length} tasks
                        </span>
                    </div>
                }
            >
                {/* Advanced Filters Toolbar */}
                <div className="mb-4 flex flex-wrap items-center gap-3 pb-4 border-b border-border-light dark:border-border-dark">
                    {/* Search */}
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-background-dark">
                        <span className="material-symbols-outlined text-[18px] text-text-secondary">search</span>
                        <input
                            type="text"
                            placeholder="Search sample or parameter..."
                            className="w-full min-w-[150px] bg-transparent text-sm text-text-main placeholder:text-text-secondary focus:outline-none dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        className="text-sm border border-border-light rounded-md p-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="PLANNED">Planned</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                        className="text-sm border border-border-light rounded-md p-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                    >
                        <option value="">All Priority</option>
                        <option value="URGENT">🔴 Urgent</option>
                        <option value="HIGH">🟠 High</option>
                        <option value="NORMAL">🔵 Normal</option>
                        <option value="LOW">⚪ Low</option>
                    </select>

                    {/* Instrument Filter */}
                    <select
                        className="text-sm border border-border-light rounded-md p-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={filterInstrument}
                        onChange={(e) => setFilterInstrument(e.target.value)}
                    >
                        <option value="">All Instruments</option>
                        {(instruments || []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>

                    {/* Work Order Filter */}
                    <select
                        className="text-sm border border-border-light rounded-md p-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={filterWorkOrder}
                        onChange={(e) => setFilterWorkOrder(e.target.value)}
                    >
                        <option value="">All Work Orders</option>
                        {(workOrders || []).map(wo => (
                            <option key={wo.id} value={wo.id}>
                                {wo.work_order_number} - {(wo.customer_name_snapshot || "").slice(0, 20)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-background-light text-text-secondary dark:bg-black/20">
                            <tr>
                                <th className="px-3 py-2 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-border-light"
                                    />
                                </th>
                                <th className="px-3 py-2 text-left">Sample</th>
                                <th className="px-3 py-2 text-left">Parameter</th>
                                <th className="px-3 py-2 text-center">Priority</th>
                                <th className="px-3 py-2 text-center">Due Date</th>
                                <th className="px-3 py-2 text-left">Analyst</th>
                                <th className="px-3 py-2 text-center">Status</th>
                                <th className="px-3 py-2 text-center w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                            {filteredTasks.map(task => (
                                <tr key={task.id} className="hover:bg-primary/5">
                                    <td className="px-3 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTasks.has(task.id)}
                                            onChange={() => handleSelectTask(task.id)}
                                            className="rounded border-border-light"
                                        />
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="font-medium text-text-main dark:text-white">{getSampleDisplay(task.sample_id).id}</span>
                                        <span className="block text-xs text-text-secondary">{getSampleDisplay(task.sample_id).name}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="font-semibold text-text-main dark:text-white">{getParameterName(task.parameter_id)}</span>
                                        <span className="block text-xs text-text-secondary italic">{getMethodName(task.method_id)}</span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <span className={cn(
                                            "text-xs rounded-full px-2.5 py-1 font-bold",
                                            priorityColors[task.priority]
                                        )}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <span className="text-xs text-text-main dark:text-white">
                                            {task.dueDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        {task.assigned_to_id ? (
                                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                                                {getAnalystName(task.assigned_to_id)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-text-secondary italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <span className={cn(
                                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                            task.status === "ASSIGNED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                                task.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                                    "bg-slate-100 text-slate-500"
                                        )}>
                                            {task.status.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <button
                                            onClick={() => openDeleteConfirm([task.id], "single")}
                                            className="p-1 rounded-md text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                                            title="Delete task"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="material-symbols-outlined text-[48px] text-text-secondary/50">assignment_ind</span>
                        <p className="mt-2 text-sm font-medium text-text-main dark:text-white">No tasks found</p>
                        <p className="text-xs text-text-secondary">Try adjusting your filters</p>
                    </div>
                )}
            </PremiumCard>

            {/* Delete Confirmation Dialog */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 border border-border-light dark:border-border-dark">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-danger/10">
                                <span className="material-symbols-outlined text-danger text-[24px]">warning</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-main dark:text-white">Delete Task{deleteConfirm.ids.length > 1 ? "s" : ""}?</h3>
                                <p className="text-sm text-text-secondary">
                                    {deleteConfirm.ids.length === 1
                                        ? "This task will be permanently deleted."
                                        : `${deleteConfirm.ids.length} tasks will be permanently deleted.`}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-text-secondary mb-6">
                            This action cannot be undone. All related assignments will be removed.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, ids: [], type: "single" })}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-border-light text-text-main hover:bg-background-light dark:text-white dark:border-border-dark dark:hover:bg-black/20 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteTasks(deleteConfirm.ids)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-danger text-white hover:bg-danger/80 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        Delete{deleteConfirm.ids.length > 1 ? ` ${deleteConfirm.ids.length} Tasks` : ""}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
