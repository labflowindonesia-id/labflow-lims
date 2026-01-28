"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import ResultEntryForm from "@/features/testing/components/ResultEntryForm";
import { MOCK_TASKS } from "@/data/mock-db";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function TestingPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.taskId as string;

    // In real app, fetch task by ID
    // For demo, we use the first mock task or fallback
    const task = MOCK_TASKS.find(t => t.id === taskId) || MOCK_TASKS[0];

    const handleSave = (result: any) => {
        console.log("Saving result:", result);
        // Navigate back to worklist after save
        router.push("/worklist");
    };

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Testing Workspace"
                description={`Task: ${taskId}`}
                actions={
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-text-secondary hover:text-primary"
                    >
                        Back to Worklist
                    </button>
                }
            />

            <div className="mx-auto max-w-4xl">
                <ResultEntryForm task={task} onSave={handleSave} />
            </div>
        </div>
    );
}
