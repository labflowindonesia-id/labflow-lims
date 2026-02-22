"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import ResultEntryForm from "@/features/testing/components/ResultEntryForm";
import { useTestTask } from "@/hooks/use-supabase";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateRow } from "@/lib/services";
import { useAuth } from "@/providers/AuthProvider";
import supabase from "@/lib/supabase";

interface ResultData {
    isND: boolean;
    numericValue: string;
    qcRecovery: string;
    runs: unknown[];
    uploadedFiles: unknown[];
    remarks: string;
    resultType: "NUMERIC" | "QUALITATIVE";
    qualitativeValue: string;
    unitId: string | null;
    loqValue: number | null;
    lodValue: number | null;
    limitMin: number | null;
    limitMax: number | null;
}

export default function TestingPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.taskId as string;
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch task by ID from Supabase
    const { data: task, isLoading } = useTestTask(taskId);

    // Block completed tasks — redirect back to worklist
    useEffect(() => {
        if (!isLoading && task && task.status === "COMPLETED") {
            router.replace("/worklist");
        }
    }, [isLoading, task, router]);

    const handleSave = async (result: ResultData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const numVal = result.numericValue ? parseFloat(result.numericValue) : null;
            const qcVal = result.qcRecovery ? parseFloat(result.qcRecovery) : null;

            // Compute compliance status (DB enum: PASS, FAIL, NOT_EVALUATED)
            let complianceStatus: string = "NOT_EVALUATED";
            if (numVal !== null && !result.isND) {
                const belowMin = result.limitMin !== null && numVal < result.limitMin;
                const aboveMax = result.limitMax !== null && numVal > result.limitMax;
                complianceStatus = (belowMin || aboveMax) ? "FAIL" : "PASS";
            }

            // Compute QC status (DB enum: PASS, FAIL, NONE)
            let qcStatus: string = "NONE";
            if (qcVal !== null) {
                qcStatus = (qcVal >= 80 && qcVal <= 120) ? "PASS" : "FAIL";
            }

            // 1. Save test_results (check existing → update or insert)
            const resultData = {
                parameter_id: task?.parameter_id || null,
                subparameter_id: task?.subparameter_id || null,
                result_value: numVal,
                result_text: result.resultType === "QUALITATIVE" ? result.qualitativeValue : null,
                unit_id: result.unitId,
                is_nd: result.isND,
                lod_value: result.lodValue,
                loq_value: result.loqValue,
                limit_min: result.limitMin,
                limit_max: result.limitMax,
                compliance_status: complianceStatus,
                qc_recovery_percent: qcVal,
                qc_status: qcStatus,
                entered_by: user?.id || null,
                entered_at: new Date().toISOString(),
                version: 1,
            };

            // Check if result already exists for this task
            const { data: existingResult } = await (supabase
                .from("test_results") as any)
                .select("id")
                .eq("task_id", taskId)
                .maybeSingle();

            if (existingResult) {
                // Update existing result
                const { error: updateError } = await (supabase
                    .from("test_results") as any)
                    .update(resultData)
                    .eq("id", existingResult.id);
                if (updateError) throw new Error(`Update failed: ${updateError.message}`);
            } else {
                // Insert new result
                const { error: insertError } = await supabase
                    .from("test_results")
                    .insert({ id: crypto.randomUUID(), ...resultData, task_id: taskId } as any);
                if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
            }

            // 2. Update test_task status to COMPLETED
            try {
                await updateRow("test_tasks", taskId, {
                    status: "COMPLETED",
                    completed_at: new Date().toISOString(),
                });
            } catch (err) {
                console.warn("Task status update failed (RLS), continuing:", err);
            }

            // 3. Find work_order_id via sample and auto-submit to manager
            if (task?.sample_id) {
                const { data: sampleData } = await supabase
                    .from("samples")
                    .select("work_order_id")
                    .eq("id", task.sample_id)
                    .maybeSingle();

                const workOrderId = (sampleData as any)?.work_order_id;
                if (workOrderId) {
                    // Check if a result_submission already exists for this work order
                    const { data: existingSub } = await supabase
                        .from("result_submissions")
                        .select("id")
                        .eq("work_order_id", workOrderId)
                        .maybeSingle();

                    if (!existingSub) {
                        // Create new result_submission (auto-submit to manager)
                        const subNumber = `SUB-${Date.now().toString(36).toUpperCase()}`;

                        const { error: subError } = await supabase
                            .from("result_submissions")
                            .insert({
                                id: crypto.randomUUID(),
                                submission_number: subNumber,
                                work_order_id: workOrderId,
                                sample_id: task.sample_id,
                                status: "SUBMITTED",
                                submitted_by: user?.id || null,
                                submitted_at: new Date().toISOString(),
                                analyst_notes: result.remarks || null,
                            } as any);

                        if (subError) {
                            console.warn("Result submission creation failed:", subError);
                        }
                    }
                }
            }

            // Invalidate caches so worklist reflects the change immediately
            await queryClient.invalidateQueries({ queryKey: ["test_tasks"] });
            await queryClient.invalidateQueries({ queryKey: ["test_results"] });

            // Navigate back to worklist
            router.push("/worklist");
        } catch (err) {
            console.error("Submit result failed:", err);
            alert("Gagal menyimpan hasil. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
            </div>
        );
    }

    // If task is completed, show redirect message (useEffect will redirect)
    if (task?.status === "COMPLETED") {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span className="ml-2 text-text-secondary">Redirecting to worklist...</span>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="text-center py-12">
                <p className="text-text-secondary">Task not found</p>
                <button onClick={() => router.push("/worklist")} className="text-primary hover:underline mt-4">
                    Back to Worklist
                </button>
            </div>
        );
    }

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

            {/* Submitting overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white dark:bg-surface-dark rounded-lg p-6 shadow-xl flex items-center gap-3">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                        <span className="font-medium">Menyimpan hasil...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
