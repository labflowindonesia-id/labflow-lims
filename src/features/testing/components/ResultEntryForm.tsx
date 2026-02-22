"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { useMatrixParameterRules, useMethods, useInstruments, useParameters, useSamples, useSampleMatrices, useUnits } from "@/hooks/use-supabase";
import { TestTask } from "@/types/database";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

interface ResultEntryFormProps {
    task: TestTask;
    onSave: (result: ResultData) => void | Promise<void>;
}

interface ResultData {
    isND: boolean;
    numericValue: string;
    qcRecovery: string;
    runs: Run[];
    uploadedFiles: UploadedFile[];
    remarks: string;
    resultType: "NUMERIC" | "QUALITATIVE";
    qualitativeValue: string;
    unitId: string | null;
    loqValue: number | null;
    lodValue: number | null;
    limitMin: number | null;
    limitMax: number | null;
}

type RunType = "INITIAL" | "REPEAT" | "RECHECK";

interface Run {
    id: string;
    type: RunType;
    value: string;
    timestamp: Date;
    reason?: string;
}

interface UploadedFile {
    id: string;
    name: string;
    size: string;
    timestamp: Date;
}

interface AuditEntry {
    timestamp: Date;
    action: string;
    user: string;
    details?: string;
}

export default function ResultEntryForm({ task, onSave }: ResultEntryFormProps) {
    // Auth — get logged-in user
    const { user: authUser } = useAuth();
    const currentUserName = authUser?.full_name || "Unknown Analyst";

    // Supabase data
    const { data: rules = [] } = useMatrixParameterRules();
    const { data: methods = [] } = useMethods();
    const { data: instruments = [] } = useInstruments();
    const { data: parameters = [] } = useParameters();
    const { data: samples = [] } = useSamples();
    const { data: matrices = [] } = useSampleMatrices();
    const { data: units = [] } = useUnits();

    // Helper functions for lookups
    const getParameterName = (id: string | null) => {
        if (!id) return "Unknown Parameter";
        return (parameters || []).find(p => p.id === id)?.name || "Unknown Parameter";
    };
    const getSampleName = (id: string | null) => {
        if (!id) return "Unknown Sample";
        return (samples || []).find(s => s.id === id)?.sample_name || "Unknown Sample";
    };
    const getMatrixName = (sampleId: string | null) => {
        if (!sampleId) return "Unknown Matrix";
        const sample = (samples || []).find(s => s.id === sampleId);
        return sample ? (matrices || []).find(m => m.id === sample.matrix_id)?.name || "Unknown Matrix" : "Unknown Matrix";
    };

    // Dynamic unit lookup: parameter → default_unit_id → units table
    const currentParameter = useMemo(() => (parameters || []).find(p => p.id === task.parameter_id), [parameters, task.parameter_id]);
    const unitSymbol = useMemo(() => {
        if (!currentParameter?.default_unit_id) return "—";
        return (units || []).find(u => u.id === currentParameter.default_unit_id)?.symbol || "—";
    }, [currentParameter, units]);

    // Dynamic matrix_id lookup from sample
    const currentSample = useMemo(() => (samples || []).find(s => s.id === task.sample_id), [samples, task.sample_id]);
    const sampleMatrixId = currentSample?.matrix_id || null;

    // Fetch Rule Logic — use sample's actual matrix_id (not hardcoded)
    const rule = (rules || []).find(r =>
        r.parameter_id === task.parameter_id &&
        r.matrix_id === sampleMatrixId
    );

    // LOQ/LOD: from parameter
    const loqDefault = (currentParameter as { loq_default?: number | null })?.loq_default ?? null;
    const lodDefault = (currentParameter as { lod_default?: number | null })?.lod_default ?? null;

    // Method and instrument from task references
    const method = (methods || []).find(m => m.id === task.method_id);
    const instrument = (instruments || []).find(i => i.id === task.instrument_id);

    // Calibration status helpers
    const getCalibrationBadge = () => {
        if (!instrument) return { label: "N/A", color: "text-text-secondary" };
        switch (instrument.status) {
            case "CALIBRATED": return { label: "Terkalibrasi", color: "text-success" };
            case "NOT_CALIBRATED": return { label: "Tidak Terkalibrasi", color: "text-danger" };
            case "IN_REPAIR": return { label: "Dalam Perbaikan", color: "text-warning" };
            default: return { label: String(instrument.status || "N/A"), color: "text-text-secondary" };
        }
    };
    const calibrationBadge = getCalibrationBadge();

    // FORM STATE
    const [isND, setIsND] = useState(false);
    const [resultType] = useState<"NUMERIC" | "QUALITATIVE">("NUMERIC");
    const [numericValue, setNumericValue] = useState<string>("");
    const [qualitativeValue] = useState<string>("");
    const [qcRecovery, setQcRecovery] = useState<string>("");
    const [remarks, setRemarks] = useState("");

    // Run Management
    const [runs, setRuns] = useState<Run[]>([
        { id: "run-1", type: "INITIAL", value: "", timestamp: new Date() }
    ]);
    const [showAddRun, setShowAddRun] = useState(false);
    const [newRunType, setNewRunType] = useState<RunType>("REPEAT");
    const [newRunReason, setNewRunReason] = useState("");

    // LOQ/LOD Override
    const [showLoqOverride, setShowLoqOverride] = useState(false);
    const [loqOverride, setLoqOverride] = useState("");
    const [lodOverride, setLodOverride] = useState("");
    const [overrideReason, setOverrideReason] = useState("");

    // Multiple File Uploads
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    // Method/Instrument Details
    const [showMethodDetails, setShowMethodDetails] = useState(false);

    // Audit Trail
    const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);

    // Initialize audit trail with real user name (run once)
    useState(() => {
        setAuditTrail([{ timestamp: new Date(), action: "Task Started", user: currentUserName }]);
    });

    // Save Progress
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // VALIDATION LOGIC
    const numVal = parseFloat(numericValue);
    const recoveryVal = parseFloat(qcRecovery);

    let complianceStatus: "PASS" | "FAIL" | "NONE" = "NONE";
    if (resultType === "NUMERIC" && !isND && !isNaN(numVal)) {
        if (rule?.limit_min !== undefined && rule?.limit_min !== null && rule?.limit_max !== undefined && rule?.limit_max !== null) {
            complianceStatus = (numVal >= rule.limit_min && numVal <= rule.limit_max) ? "PASS" : "FAIL";
        } else if (rule?.limit_max !== undefined && rule?.limit_max !== null) {
            complianceStatus = numVal <= rule.limit_max ? "PASS" : "FAIL";
        } else if (rule?.limit_min !== undefined && rule?.limit_min !== null) {
            complianceStatus = numVal >= rule.limit_min ? "PASS" : "FAIL";
        }
    }

    let qcStatus: "PASS" | "FAIL" | "NONE" = "NONE";
    if (!isNaN(recoveryVal)) {
        qcStatus = (recoveryVal >= 80 && recoveryVal <= 120) ? "PASS" : "FAIL";
    }

    const addRun = () => {
        if (!newRunReason.trim()) return;
        const newRun: Run = {
            id: `run-${runs.length + 1}`,
            type: newRunType,
            value: "",
            timestamp: new Date(),
            reason: newRunReason
        };
        setRuns([...runs, newRun]);
        addAuditEntry(`Added ${newRunType} run`, `Reason: ${newRunReason}`);
        setShowAddRun(false);
        setNewRunReason("");
    };

    const updateRunValue = (runId: string, value: string) => {
        setRuns(runs.map(r => r.id === runId ? { ...r, value } : r));
    };

    const handleFileUpload = () => {
        const newFile: UploadedFile = {
            id: `file-${uploadedFiles.length + 1}`,
            name: `raw_data_${Date.now()}.csv`,
            size: "2.4 MB",
            timestamp: new Date()
        };
        setUploadedFiles([...uploadedFiles, newFile]);
        addAuditEntry("File Uploaded", newFile.name);
    };

    const removeFile = (fileId: string) => {
        setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
    };

    const handleSaveProgress = () => {
        setLastSaved(new Date());
        addAuditEntry("Progress Saved", "Draft saved");
    };

    const addAuditEntry = (action: string, details?: string) => {
        setAuditTrail(prev => [...prev, {
            timestamp: new Date(),
            action,
            user: currentUserName,
            details
        }]);
    };

    const handleLoqLodOverride = () => {
        if (!overrideReason.trim()) return;
        addAuditEntry("LOQ/LOD Override", `LOQ: ${loqOverride}, LOD: ${lodOverride}. Reason: ${overrideReason}`);
        setShowLoqOverride(false);
    };

    const runTypeColors: Record<RunType, string> = {
        INITIAL: "bg-primary/20 text-primary",
        REPEAT: "bg-warning/20 text-warning",
        RECHECK: "bg-info/20 text-info"
    };

    const runReasonOptions = [
        "Out of range result",
        "QC failure",
        "Instrument malfunction",
        "Sample contamination suspected",
        "Client request",
        "Verification required"
    ];

    return (
        <div className="space-y-6">
            {/* Run Management Panel */}
            <PremiumCard
                title="Run Management"
                subtitle="Track initial and repeat measurements"
                action={
                    <button
                        onClick={() => setShowAddRun(true)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        Add Run
                    </button>
                }
            >
                <div className="space-y-3">
                    {runs.map((run, index) => (
                        <div key={run.id} className={cn(
                            "rounded-lg border p-4",
                            index === runs.length - 1 ? "border-primary/30 bg-primary/5" : "border-border-light dark:border-border-dark"
                        )}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={cn("px-2 py-0.5 rounded text-xs font-bold", runTypeColors[run.type])}>
                                        {run.type}
                                    </span>
                                    <span className="text-xs text-text-secondary">
                                        {run.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                                {run.reason && (
                                    <span className="text-xs text-text-secondary italic">
                                        Reason: {run.reason}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="Enter result value..."
                                    value={run.value}
                                    onChange={(e) => updateRunValue(run.id, e.target.value)}
                                    className="font-mono text-lg"
                                />
                                <span className="absolute right-3 top-3 text-sm text-text-secondary font-bold">{unitSymbol}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Run Modal */}
                {showAddRun && (
                    <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
                        <h4 className="text-sm font-bold text-text-main dark:text-white mb-3">Add New Run</h4>
                        <div className="grid gap-3">
                            <div className="flex gap-2">
                                {(["REPEAT", "RECHECK"] as RunType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setNewRunType(type)}
                                        className={cn(
                                            "px-3 py-1.5 rounded text-xs font-bold transition-all",
                                            newRunType === type ? runTypeColors[type] : "bg-slate-100 text-slate-500"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <select
                                className="text-sm border border-border-light rounded-md p-2 bg-white dark:bg-surface-dark"
                                value={newRunReason}
                                onChange={(e) => setNewRunReason(e.target.value)}
                            >
                                <option value="">Select reason...</option>
                                {runReasonOptions.map(reason => (
                                    <option key={reason} value={reason}>{reason}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAddRun(false)}
                                    className="flex-1 px-3 py-2 text-sm text-text-secondary hover:text-text-main"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addRun}
                                    disabled={!newRunReason}
                                    className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    Add Run
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </PremiumCard>

            {/* Main Result Entry */}
            <PremiumCard
                title={`Result Entry: ${getParameterName(task.parameter_id)}`}
                subtitle={`${getSampleName(task.sample_id)} (${getMatrixName(task.sample_id)})`}
                action={
                    <div className="flex items-center gap-2">
                        {lastSaved && (
                            <span className="text-xs text-success">
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <span className="text-xs font-mono text-text-secondary">{task.id}</span>
                    </div>
                }
                className={cn(
                    "border-l-4 transition-all",
                    complianceStatus === "PASS" ? "border-l-success" :
                        complianceStatus === "FAIL" ? "border-l-danger" : "border-l-primary"
                )}>
                <div className="grid gap-8 lg:grid-cols-2">

                    {/* LEFT: FILE UPLOAD & RESULT */}
                    <div className="space-y-6">
                        {/* Multiple File Uploads */}
                        <div className="space-y-3">
                            <Label>Raw Data Files</Label>
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                                onClick={handleFileUpload}
                            >
                                <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
                                <p className="text-sm font-medium text-slate-500 mt-2">Click to upload (CSV, PDF, Excel)</p>
                            </div>

                            {uploadedFiles.length > 0 && (
                                <div className="space-y-2">
                                    {uploadedFiles.map(file => (
                                        <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-success/10 border border-success/30">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-success text-[18px]">description</span>
                                                <div>
                                                    <p className="text-sm font-medium text-success">{file.name}</p>
                                                    <p className="text-xs text-text-secondary">{file.size}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFile(file.id)} className="text-danger hover:text-danger/70">
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* LOQ/LOD Override */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Detection Limits</Label>
                                <button
                                    onClick={() => setShowLoqOverride(!showLoqOverride)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {showLoqOverride ? "Hide" : "Override LOQ/LOD"}
                                </button>
                            </div>
                            <div className="text-xs text-text-secondary">
                                Default: LOQ = {loqDefault ?? "N/A"}, LOD = {lodDefault ?? "N/A"}
                            </div>

                            {showLoqOverride && (
                                <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs">LOQ Override</Label>
                                            <Input
                                                type="number"
                                                placeholder={loqDefault?.toString()}
                                                value={loqOverride}
                                                onChange={(e) => setLoqOverride(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">LOD Override</Label>
                                            <Input
                                                type="number"
                                                placeholder={lodDefault?.toString()}
                                                value={lodOverride}
                                                onChange={(e) => setLodOverride(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Reason for Override</Label>
                                        <Input
                                            placeholder="Enter justification..."
                                            value={overrideReason}
                                            onChange={(e) => setOverrideReason(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleLoqLodOverride}
                                        disabled={!overrideReason.trim()}
                                        className="w-full px-3 py-2 bg-warning text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        Apply Override
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Result Type & Value */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Label>Final Result</Label>
                                    {(rule?.limit_min !== null && rule?.limit_min !== undefined) || (rule?.limit_max !== null && rule?.limit_max !== undefined) ? (
                                        <p className="text-[10px] text-text-secondary mt-0.5 font-medium">
                                            Limit ({rule?.limit_type || "Standard"}): <span className="font-mono text-primary">{rule?.limit_min ?? "—"}</span> to <span className="font-mono text-primary">{rule?.limit_max ?? "—"}</span> {unitSymbol}
                                        </p>
                                    ) : null}
                                </div>
                                <label className="flex items-center gap-2 text-xs">
                                    <input type="checkbox" checked={isND} onChange={(e) => setIsND(e.target.checked)} className="rounded" />
                                    Not Detected (ND)
                                </label>
                            </div>

                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder={isND ? `< LOD (${lodDefault ?? "N/A"})` : "Enter final value..."}
                                    value={isND ? "" : numericValue}
                                    onChange={(e) => setNumericValue(e.target.value)}
                                    disabled={isND}
                                    className={cn(
                                        "pr-16 text-lg font-mono",
                                        complianceStatus === "FAIL" ? "border-danger text-danger bg-danger/5" :
                                            complianceStatus === "PASS" ? "border-success text-success bg-success/5" : ""
                                    )}
                                />
                                <span className="absolute right-3 top-3 text-sm text-text-secondary font-bold">{unitSymbol}</span>
                            </div>

                            {!isND && complianceStatus === "FAIL" && (
                                <div className="flex items-center gap-2 text-xs font-bold text-white bg-danger p-2 rounded animate-pulse">
                                    <span className="material-symbols-outlined text-[16px]">warning</span>
                                    {rule?.limit_min !== null && rule?.limit_max !== null
                                        ? `Out of Range (${rule?.limit_min} - ${rule?.limit_max})`
                                        : rule?.limit_max !== null
                                            ? `Exceeds Max Limit (${rule?.limit_max})`
                                            : `Below Min Limit (${rule?.limit_min})`}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: QC, METHOD DETAILS & AUDIT */}
                    <div className="space-y-4 lg:border-l border-border-light lg:pl-6 dark:border-white/10">
                        {/* QC Recovery */}
                        <div className="space-y-2">
                            <Label>QC Recovery (%)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 98.5"
                                className={cn(
                                    qcStatus === "FAIL" ? "border-danger" : qcStatus === "PASS" ? "border-success" : ""
                                )}
                                value={qcRecovery}
                                onChange={(e) => setQcRecovery(e.target.value)}
                            />
                            <p className="text-[10px] text-text-secondary">Acceptance: 80% - 120%</p>
                        </div>

                        {/* Method/Instrument Details */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowMethodDetails(!showMethodDetails)}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <Label>Method & Instrument Details</Label>
                                <span className="material-symbols-outlined text-[18px] text-text-secondary">
                                    {showMethodDetails ? "expand_less" : "expand_more"}
                                </span>
                            </button>

                            {showMethodDetails && (
                                <div className="p-3 rounded-lg border border-border-light bg-background-light/50 space-y-2 text-xs dark:border-border-dark dark:bg-black/20">
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Method:</span>
                                        <span className="font-medium">{method?.name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Instrument:</span>
                                        <span className="font-medium">{instrument?.name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Calibration:</span>
                                        <span className={cn("font-medium", calibrationBadge.color)}>{calibrationBadge.label}</span>
                                    </div>
                                    {instrument?.calibration_due_date && (
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Cal. Due Date:</span>
                                            <span className="font-medium">{new Date(instrument.calibration_due_date).toLocaleDateString("id-ID")}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Remarks */}
                        <div className="space-y-2">
                            <Label>Analyst Remarks</Label>
                            <textarea
                                className="w-full text-sm rounded-lg border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none"
                                rows={2}
                                placeholder="Add notes..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            ></textarea>
                        </div>

                        {/* Comprehensive Audit Trail */}
                        <div className="pt-4 border-t border-border-light dark:border-border-dark">
                            <Label className="mb-2">Audit Trail</Label>
                            <div className="max-h-[200px] overflow-y-auto space-y-2">
                                {auditTrail.map((entry, i) => (
                                    <div key={i} className="text-[10px] p-2 rounded bg-slate-50 dark:bg-white/5">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-text-main dark:text-white">{entry.action}</span>
                                            <span className="text-text-secondary">{entry.timestamp.toLocaleTimeString()}</span>
                                        </div>
                                        <div className="text-text-secondary">By: {entry.user}</div>
                                        {entry.details && <div className="text-text-secondary italic">{entry.details}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex justify-between gap-3 border-t border-border-light pt-6 dark:border-border-dark">
                    <button
                        onClick={handleSaveProgress}
                        className="px-4 py-2 text-sm font-medium border border-border-light rounded-lg hover:bg-background-light dark:border-border-dark"
                    >
                        Save Progress
                    </button>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 text-text-secondary hover:underline text-sm">Cancel</button>
                        <button
                            onClick={() => {
                                addAuditEntry("Result Submitted");
                                onSave({
                                    isND,
                                    numericValue,
                                    qcRecovery,
                                    runs,
                                    uploadedFiles,
                                    remarks,
                                    resultType,
                                    qualitativeValue,
                                    unitId: currentParameter?.default_unit_id || null,
                                    loqValue: loqOverride ? parseFloat(loqOverride) : loqDefault,
                                    lodValue: lodOverride ? parseFloat(lodOverride) : lodDefault,
                                    limitMin: rule?.limit_min ?? null,
                                    limitMax: rule?.limit_max ?? null,
                                });
                            }}
                            disabled={uploadedFiles.length === 0 && !isND && !numericValue}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit Result
                        </button>
                    </div>
                </div>
            </PremiumCard>
        </div>
    );
}
