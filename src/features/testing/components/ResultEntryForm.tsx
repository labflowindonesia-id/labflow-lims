import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { MOCK_RULES } from "@/data/mock-db";
import { TestTask } from "@/types/master-data";
import { cn } from "@/lib/utils";

interface ResultEntryFormProps {
    task: TestTask;
    onSave: (result: any) => void;
}

export default function ResultEntryForm({ task, onSave }: ResultEntryFormProps) {
    // 1. Fetch Rule Logic (Simulating DB Lookup)
    // Find rule matching matrix + param
    const rule = MOCK_RULES.find(r =>
        r.parameter_id === task.parameter_id &&
        // In real app we check matrix_id, but here simple find is enough for demo
        r.matrix_id === "mat-001"
    );

    // FORM STATE
    const [isND, setIsND] = useState(false);
    const [numericValue, setNumericValue] = useState<string>("");
    const [qcRecovery, setQcRecovery] = useState<string>("");

    // VALIDATION LOGIC
    const numVal = parseFloat(numericValue);
    const recoveryVal = parseFloat(qcRecovery);

    // Check Compliance (Max Rule)
    let complianceStatus: "PASS" | "FAIL" | "NONE" = "NONE";
    if (!isND && !isNaN(numVal) && rule?.limit_type === "MAX" && rule.limit_max) {
        complianceStatus = numVal <= rule.limit_max ? "PASS" : "FAIL";
    }

    // Check QC (80-120% Rule)
    let qcStatus: "PASS" | "FAIL" | "NONE" = "NONE";
    if (!isNaN(recoveryVal)) {
        qcStatus = (recoveryVal >= 80 && recoveryVal <= 120) ? "PASS" : "FAIL";
    }

    return (
        <PremiumCard title="Result Entry" className={cn(
            "border-l-4 transition-all",
            complianceStatus === "PASS" ? "border-l-success" :
                complianceStatus === "FAIL" ? "border-l-danger" : "border-l-primary"
        )}>
            <div className="grid gap-6 md:grid-cols-2">

                {/* LEFT: MAIN RESULT */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <Label>Test Result</Label>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-text-secondary cursor-pointer">Not Detected (ND)</label>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={isND}
                                onChange={(e) => setIsND(e.target.checked)}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <Input
                            type="number"
                            placeholder={isND ? `< LOD (${rule?.lod_default})` : "Enter numeric value..."}
                            value={isND ? "" : numericValue}
                            onChange={(e) => setNumericValue(e.target.value)}
                            disabled={isND}
                            className={cn(
                                "pr-16 text-lg font-mono",
                                complianceStatus === "FAIL" ? "border-danger text-danger bg-danger/5" :
                                    complianceStatus === "PASS" ? "border-success text-success bg-success/5" : ""
                            )}
                        />
                        <span className="absolute right-3 top-3 text-sm text-text-secondary font-bold">mg/L</span>
                    </div>

                    {/* LOGIC FEEDBACK */}
                    {isND && (
                        <div className="text-xs text-text-secondary bg-slate-100 dark:bg-white/5 p-2 rounded">
                            <span className="font-bold">Logic:</span> Stored as ND=true. Report will show <span className="font-mono">&lt; {rule?.lod_default} mg/L</span>.
                        </div>
                    )}

                    {!isND && complianceStatus === "FAIL" && (
                        <div className="flex items-center gap-2 text-xs font-bold text-danger bg-danger/10 p-2 rounded animate-pulse">
                            <span className="material-symbols-outlined text-[16px]">warning</span>
                            Exceeds Limit ({rule?.limit_max})
                        </div>
                    )}
                </div>

                {/* RIGHT: QC & METADATA */}
                <div className="space-y-4 border-l border-border-light pl-6 dark:border-white/10">
                    <div className="space-y-2">
                        <Label>QC Recovery (%)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="e.g. 98.5"
                                className={cn(
                                    qcStatus === "FAIL" ? "border-danger ring-danger/20" :
                                        qcStatus === "PASS" ? "border-success ring-success/20" : ""
                                )}
                                value={qcRecovery}
                                onChange={(e) => setQcRecovery(e.target.value)}
                            />
                            {qcStatus === "FAIL" && (
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-danger">OUT OF RANGE</span>
                            )}
                        </div>
                        <p className="text-[10px] text-text-secondary">Acceptance: 80% - 120%</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Remarks</Label>
                        <textarea
                            className="w-full text-sm rounded-lg border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            rows={2}
                            placeholder="Optional lab notes..."
                        ></textarea>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <button className="px-4 py-2 text-text-secondary hover:underline text-sm">Cancel</button>
                <button
                    onClick={() => onSave({ isND, numericValue, qcRecovery })}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20 font-medium"
                >
                    Save & Complete
                </button>
            </div>
        </PremiumCard>
    );
}
