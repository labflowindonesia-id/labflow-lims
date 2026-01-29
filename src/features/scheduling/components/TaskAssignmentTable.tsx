"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_TASKS, MOCK_USERS, MOCK_INSTRUMENTS, MOCK_WORK_ORDERS } from "@/data/mock-db";
import { TestTask } from "@/types/master-data";
import { cn } from "@/lib/utils";

type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface ExtendedTask extends TestTask {
    priority: TaskPriority;
    dueDate: Date;
}

export default function TaskAssignmentTable() {
    // Add priority and due date to tasks
    const [tasks, setTasks] = useState<ExtendedTask[]>(() =>
        MOCK_TASKS.map(t => ({
            ...t,
            priority: "NORMAL" as TaskPriority,
            dueDate: new Date(t.due_date)
        }))
    );

    // Filters
    const [filterInstrument, setFilterInstrument] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [filterPriority, setFilterPriority] = useState<string>("");
    const [filterWorkOrder, setFilterWorkOrder] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    // Bulk assignment
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [bulkAnalyst, setBulkAnalyst] = useState("");
    const [showBulkPanel, setShowBulkPanel] = useState(false);

    // Only show analysts
    const analysts = MOCK_USERS.filter(u => u.role === "ANALYST");

    const handleAssign = (taskId: string, userId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, assigned_to_user_id: userId, status: userId ? "ASSIGNED" : "PLANNED" } as ExtendedTask : t
        ));
    };

    const handlePriorityChange = (taskId: string, priority: TaskPriority) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, priority } : t
        ));
    };

    const handleDueDateChange = (taskId: string, date: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, dueDate: new Date(date) } : t
        ));
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

    const handleBulkAssign = () => {
        if (!bulkAnalyst || selectedTasks.size === 0) return;
        setTasks(prev => prev.map(t =>
            selectedTasks.has(t.id)
                ? { ...t, assigned_to_user_id: bulkAnalyst, status: "ASSIGNED" }
                : t
        ));
        setSelectedTasks(new Set());
        setBulkAnalyst("");
        setShowBulkPanel(false);
    };

    // Get analyst skills (mock - in real app would come from DB)
    const getAnalystSkills = (userId: string): string[] => {
        const skills: Record<string, string[]> = {
            "user-003": ["HPLC", "GC-MS", "Spectrophotometry"],
            "user-004": ["Titrimetry", "Gravimetry", "pH Measurement"],
            "user-005": ["Microbiology", "BOD Analysis"],
        };
        return skills[userId] || [];
    };

    // Check if analyst is qualified for task
    const isAnalystQualified = (userId: string, task: ExtendedTask): boolean => {
        const skills = getAnalystSkills(userId);
        // Simple mock check - in real app would check instrument/method qualifications
        return skills.length > 0; // All analysts with skills are "qualified"
    };

    // Check for instrument conflicts (same instrument, same day, different task)
    const getInstrumentConflicts = (instrumentId: string | undefined, taskId: string, dueDate: Date): string[] => {
        if (!instrumentId) return [];
        const sameDayTasks = tasks.filter(t =>
            t.id !== taskId &&
            t.instrument_id_snapshot === instrumentId &&
            t.status !== "COMPLETED" &&
            t.dueDate.toDateString() === dueDate.toDateString()
        );
        return sameDayTasks.map(t => t.sample_name_snapshot || "Unknown Sample");
    };

    // Check for analyst conflicts (same analyst, same day, multiple tasks)
    const getAnalystConflicts = (analystId: string | undefined, taskId: string, dueDate: Date): number => {
        if (!analystId) return 0;
        const sameDayTasks = tasks.filter(t =>
            t.id !== taskId &&
            t.assigned_to_user_id === analystId &&
            t.status !== "COMPLETED" &&
            t.dueDate.toDateString() === dueDate.toDateString()
        );
        return sameDayTasks.length;
    };

    // Get workload for an analyst on a given day
    const getAnalystWorkload = (analystId: string, date: Date): { count: number; overloaded: boolean } => {
        const dailyTasks = tasks.filter(t =>
            t.assigned_to_user_id === analystId &&
            t.dueDate.toDateString() === date.toDateString()
        );
        return { count: dailyTasks.length, overloaded: dailyTasks.length >= 5 };
    };

    // Filter work orders that are RECEIVED or IN_PROGRESS only (as per blueprint)
    const confirmedWorkOrders = MOCK_WORK_ORDERS.filter(wo =>
        wo.status === "RECEIVED" || wo.status === "IN_PROGRESS"
    );

    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.sample_name_snapshot?.toLowerCase().includes(q) ||
                t.parameter_name_snapshot?.toLowerCase().includes(q)
            );
        }

        // Instrument filter
        if (filterInstrument) {
            result = result.filter(t => t.instrument_id_snapshot === filterInstrument);
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
            {/* Bulk Assignment Panel */}
            {selectedTasks.size > 0 && (
                <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">check_box</span>
                        <span className="text-sm font-medium text-text-main dark:text-white">
                            {selectedTasks.size} task(s) selected
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            className="text-sm border border-primary/30 rounded-md p-2 bg-white dark:bg-surface-dark"
                            value={bulkAnalyst}
                            onChange={(e) => setBulkAnalyst(e.target.value)}
                        >
                            <option value="">Select Analyst...</option>
                            {analysts.map(a => (
                                <option key={a.id} value={a.id}>{a.full_name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleBulkAssign}
                            disabled={!bulkAnalyst}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                        >
                            Assign Selected
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
                subtitle="Assign requested tests to qualified analysts"
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
                        {MOCK_INSTRUMENTS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>

                    {/* Work Order Filter */}
                    <select
                        className="text-sm border border-border-light rounded-md p-2 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={filterWorkOrder}
                        onChange={(e) => setFilterWorkOrder(e.target.value)}
                    >
                        <option value="">All Work Orders</option>
                        {MOCK_WORK_ORDERS.map(wo => (
                            <option key={wo.id} value={wo.id}>
                                {wo.work_order_no} - {wo.customer_name_snapshot.slice(0, 20)}
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
                                        <span className="font-medium text-text-main dark:text-white">{task.sample_name_snapshot}</span>
                                        <span className="block text-xs text-text-secondary">{task.matrix_name_snapshot}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="font-semibold text-text-main dark:text-white">{task.parameter_name_snapshot}</span>
                                        <span className="block text-xs text-text-secondary italic">{task.method_id_snapshot}</span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <select
                                            className={cn(
                                                "text-xs rounded-full px-2 py-1 font-bold border-0 cursor-pointer",
                                                priorityColors[task.priority]
                                            )}
                                            value={task.priority}
                                            onChange={(e) => handlePriorityChange(task.id, e.target.value as TaskPriority)}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="NORMAL">Normal</option>
                                            <option value="HIGH">High</option>
                                            <option value="URGENT">Urgent</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <input
                                            type="date"
                                            className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                                            value={task.dueDate.toISOString().split('T')[0]}
                                            onChange={(e) => handleDueDateChange(task.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-3">
                                        <select
                                            className={cn(
                                                "w-full text-xs rounded border p-1.5 bg-transparent",
                                                task.assigned_to_user_id ? "border-primary/50 bg-primary/5 text-primary font-medium" : "border-border-light text-text-secondary"
                                            )}
                                            value={task.assigned_to_user_id || ""}
                                            onChange={(e) => handleAssign(task.id, e.target.value)}
                                        >
                                            <option value="">Select Analyst...</option>
                                            {analysts.map(a => (
                                                <option key={a.id} value={a.id}>
                                                    {a.full_name} {isAnalystQualified(a.id, task) ? "✓" : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Conflict Warnings */}
                                        {(() => {
                                            const instrumentConflicts = getInstrumentConflicts(task.instrument_id_snapshot, task.id, task.dueDate);
                                            const analystConflicts = getAnalystConflicts(task.assigned_to_user_id, task.id, task.dueDate);
                                            const hasConflicts = instrumentConflicts.length > 0 || analystConflicts > 0;

                                            return (
                                                <div className="mt-1 space-y-0.5">
                                                    {task.assigned_to_user_id && !hasConflicts && (
                                                        <span className="text-[10px] text-success flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">verified</span>
                                                            Qualified
                                                        </span>
                                                    )}
                                                    {instrumentConflicts.length > 0 && (
                                                        <span className="text-[10px] text-warning flex items-center gap-1" title={`Instrument conflict with: ${instrumentConflicts.join(", ")}`}>
                                                            <span className="material-symbols-outlined text-[12px]">warning</span>
                                                            Instr. busy ({instrumentConflicts.length})
                                                        </span>
                                                    )}
                                                    {analystConflicts > 3 && (
                                                        <span className="text-[10px] text-danger flex items-center gap-1" title={`Analyst has ${analystConflicts} other tasks on this day`}>
                                                            <span className="material-symbols-outlined text-[12px]">error</span>
                                                            Overloaded ({analystConflicts + 1} tasks)
                                                        </span>
                                                    )}
                                                    {analystConflicts > 0 && analystConflicts <= 3 && (
                                                        <span className="text-[10px] text-blue-500 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">info</span>
                                                            +{analystConflicts} same day
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
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
        </div>
    );
}
