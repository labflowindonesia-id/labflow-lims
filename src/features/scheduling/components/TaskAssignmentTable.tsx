import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_TASKS, MOCK_USERS, MOCK_INSTRUMENTS } from "@/data/mock-db";
import { TestTask, User } from "@/types/master-data";
import { cn } from "@/lib/utils";

export default function TaskAssignmentTable() {
    const [tasks, setTasks] = useState<TestTask[]>(MOCK_TASKS);
    const [filterInstrument, setFilterInstrument] = useState<string>("");

    // Only show analysts
    const analysts = MOCK_USERS.filter(u => u.role === "ANALYST");

    const handleAssign = (taskId: string, userId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, assigned_to_user_id: userId, status: "ASSIGNED" } : t
        ));
    };

    const filteredTasks = filterInstrument
        ? tasks.filter(t => t.instrument_id_snapshot === filterInstrument)
        : tasks;

    return (
        <PremiumCard
            title="Pending Assignments"
            subtitle="Assign requested tests to qualified analysts"
            action={
                <select
                    className="text-sm border border-border-light rounded-md p-1 bg-white dark:bg-white/5"
                    value={filterInstrument}
                    onChange={(e) => setFilterInstrument(e.target.value)}
                >
                    <option value="">All Instruments</option>
                    {MOCK_INSTRUMENTS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
            }
        >
            <DenseTable
                data={filteredTasks}
                keyExtractor={(t) => t.id}
                columns={[
                    { header: "Sample", accessorKey: "sample_name_snapshot", className: "font-medium" },
                    { header: "Matrix", accessorKey: "matrix_name_snapshot", className: "text-xs text-text-secondary" },
                    { header: "Parameter", accessorKey: "parameter_name_snapshot", className: "font-semibold" },
                    { header: "Method", accessorKey: "method_id_snapshot", className: "text-xs italic" },
                    {
                        header: "Assigned Analyst",
                        accessorKey: "assigned_to_user_id",
                        cell: (task) => (
                            <select
                                className={cn(
                                    "w-full text-xs rounded border p-1 bg-transparent",
                                    task.assigned_to_user_id ? "border-primary/50 bg-primary/5 text-primary" : "border-border-light text-text-secondary"
                                )}
                                value={task.assigned_to_user_id || ""}
                                onChange={(e) => handleAssign(task.id, e.target.value)}
                            >
                                <option value="">Select Analyst...</option>
                                {analysts.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                            </select>
                        )
                    },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (task) => (
                            <span className={cn(
                                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                task.status === "ASSIGNED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                    task.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                        "bg-slate-100 text-slate-500"
                            )}>
                                {task.status.replace("_", " ")}
                            </span>
                        )
                    }
                ]}
                className="border-0"
            />
        </PremiumCard>
    );
}
