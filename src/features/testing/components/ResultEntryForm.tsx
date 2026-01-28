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
    const rule = MOCK_RULES.find(r =>
        r.parameter_id === task.parameter_id &&
        r.matrix_id === "mat-001" // Simplified lookup
    );

    // FORM STATE
    const [isND, setIsND] = useState(false);
    const [resultType, setResultType] = useState<"NUMERIC" | "QUALITATIVE">("NUMERIC");
    const [numericValue, setNumericValue] = useState<string>("");
    const [qualitativeValue, setQualitativeValue] = useState<string>("");
    const [qcRecovery, setQcRecovery] = useState<string>("");
    const [fileUploaded, setFileUploaded] = useState(false);

    // VALIDATION LOGIC
    const numVal = parseFloat(numericValue);
    const recoveryVal = parseFloat(qcRecovery);

    // Check Compliance (Max Rule)
    let complianceStatus: "PASS" | "FAIL" | "NONE" = "NONE";
    if (resultType === "NUMERIC" && !isND && !isNaN(numVal) && rule?.limit_type === "MAX" && rule.limit_max) {
        complianceStatus = numVal <= rule.limit_max ? "PASS" : "FAIL";
    }

    // Check QC (80-120% Rule)
    let qcStatus: "PASS" | "FAIL" | "NONE" = "NONE";
    if (!isNaN(recoveryVal)) {
        qcStatus = (recoveryVal >= 80 && recoveryVal <= 120) ? "PASS" : "FAIL";
    }

    return (
        <PremiumCard
            title={`Result Entry: ${task.parameter_name_snapshot}`}
            subtitle={`${task.sample_name_snapshot} (${task.matrix_name_snapshot})`}
            action={
                <span className="text-xs font-mono text-text-secondary">{task.id}</span>
            }
            className={cn(
                "border-l-4 transition-all",
                complianceStatus === "PASS" ? "border-l-success" :
                    complianceStatus === "FAIL" ? "border-l-danger" : "border-l-primary"
            )}>
            <div className="grid gap-8 lg:grid-cols-2">

                {/* LEFT: MAIN RESULT & FILE UPLOAD */}
                <div className="space-y-6">
                    {/* File Upload Dropzone */}
                    <div
                        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setFileUploaded(true)}
                    >
                        {fileUploaded ? (
                            <div className="flex items-center justify-center gap-3 text-green-600">
                                <span className="material-symbols-outlined text-2xl">description</span>
                                <div className="text-left">
                                    <p className="text-sm font-bold">raw_data_icp.csv</p>
                                    <p className="text-xs opacity-75">Uploaded just now</p>
                                </div>
                                <span className="material-symbols-outlined text-xl">check</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
                                <p className="text-sm font-medium text-slate-500">Upload Raw Data (CSV/PDF)</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Result Type</Label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", resultType === "NUMERIC" ? "bg-white shadow text-primary" : "text-text-secondary")}
                                    onClick={() => setResultType("NUMERIC")}
                                >
                                    Numeric
                                </button>
                                <button
                                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", resultType === "QUALITATIVE" ? "bg-white shadow text-primary" : "text-text-secondary")}
                                    onClick={() => setResultType("QUALITATIVE")}
                                >
                                    Qualitative
                                </button>
                            </div>
                        </div>

                        {resultType === "NUMERIC" ? (
                            <>
                                <div className="flex justify-between items-center">
                                    <Label>Numeric Value</Label>
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
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label>Observation</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={qualitativeValue}
                                    onChange={(e) => setQualitativeValue(e.target.value)}
                                >
                                    <option value="">Select Observation...</option>
                                    <option value="POSITIVE">Positive</option>
                                    <option value="NEGATIVE">Negative</option>
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                </select>
                            </div>
                        )}

                        {!isND && complianceStatus === "FAIL" && (
                            <div className="flex items-center gap-2 text-xs font-bold text-danger bg-danger/10 p-2 rounded animate-pulse">
                                <span className="material-symbols-outlined text-[16px]">warning</span>
                                Exceeds Limit ({rule?.limit_max})
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: QC & METADATA */}
                <div className="space-y-4 lg:border-l border-border-light lg:pl-6 dark:border-white/10">
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
                        <Label>Analyst Remarks</Label>
                        <textarea
                            className="w-full text-sm rounded-lg border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none"
                            rows={3}
                            placeholder="Add notes about method deviation or observation..."
                        ></textarea>
                    </div>

                    <div className="pt-4 border-t border-border-light">
                        <p className="text-xs text-text-secondary mb-2">Audit Trail</p>
                        <div className="text-[10px] text-slate-400 font-mono">
                            <p>Started: {new Date().toLocaleTimeString()}</p>
                            <p>User: Analyst Kimia</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-border-light pt-6">
                <button className="px-4 py-2 text-text-secondary hover:underline text-sm">Cancel</button>
                <button
                    onClick={() => onSave({ isND, numericValue, qcRecovery, fileUploaded })}
                    disabled={!fileUploaded && !isND && !numericValue && !qualitativeValue} // Formatting logic
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Submit Result
                </button>
            </div>
        </PremiumCard>
    );
}
