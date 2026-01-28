"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import ResultEntryForm from "@/features/testing/components/ResultEntryForm";
import { MOCK_TASKS } from "@/data/mock-db";
import { usePathname } from "next/navigation";

export default function TestingPageWrapper() {
    // Mock ID extraction from URL (since we don't have dynamic routes fully wired in this proto file)
    // For demo: Always load the first IN_PROGRESS task
    const task = MOCK_TASKS[0]; // "task-001" (COD)

    const handleSave = (data: any) => {
        console.log("Saving Result:", data);
        alert("Result Saved! QC Status Checked.");
        window.history.back();
    };

    if (!task) return <div>Task not found</div>;

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title={`Testing: ${task.parameter_name_snapshot}`}
                description={`Sample: ${task.sample_name_snapshot} | Method: ${task.method_id_snapshot}`}
            >
                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded dark:bg-blue-900/30 dark:text-blue-300 font-mono">
                        {task.work_order_id}
                    </span>
                </div>
            </ActionToolbar>

            <div className="max-w-4xl mx-auto">
                <ResultEntryForm task={task} onSave={handleSave} />
            </div>
        </div>
    );
}
