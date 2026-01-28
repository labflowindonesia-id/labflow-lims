"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import TaskAssignmentTable from "@/features/scheduling/components/TaskAssignmentTable";

export default function SchedulingPage() {
    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Resource Planning"
                description="Assign tasks and manage laboratory workload"
            />
            <div className="mx-auto max-w-6xl">
                <TaskAssignmentTable />
            </div>
        </div>
    );
}
