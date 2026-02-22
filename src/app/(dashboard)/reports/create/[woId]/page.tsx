"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { CoAPreview } from "@/features/reporting/components/CoAPreview";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSamplesByWorkOrder, useSampleMatrices, useReportsByWorkOrder, useWorkOrder } from "@/hooks/use-supabase";
import { updateRow, insertRow, reportService } from "@/lib/services";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";

type TemplateType = "standard" | "detailed" | "summary" | "regulatory";

interface SignatureData {
    name: string;
    title: string;
    signedAt: Date;
    dataUrl?: string;
}

export default function CreateReportPage() {
    const params = useParams();
    const router = useRouter();
    const woId = params.woId as string;
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: dbSamples = [] } = useSamplesByWorkOrder(woId);
    const { data: matrices = [] } = useSampleMatrices();
    const { data: reports = [] } = useReportsByWorkOrder(woId);
    const { data: workOrder } = useWorkOrder(woId);

    // The latest report is the first one since useReportsByWorkOrder orders by revision_number desc
    const latestReport = reports[0];

    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("standard");
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signature, setSignature] = useState<SignatureData | null>(null);
    const [signerName, setSignerName] = useState("");
    const [signerTitle, setSignerTitle] = useState("");

    // Initialize signer with current user if empty
    useEffect(() => {
        if (user && !signerName) {
            setSignerName(user.full_name || "");
        }
    }, [user, signerName]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Map DB samples for UI
    const samples = dbSamples.map(s => ({
        id: s.id,
        name: s.sample_name || s.sample_lab_id,
        matrix: matrices.find(m => m.id === s.matrix_id)?.name || "Unknown",
        status: "COMPLETED" // Simplification: assume completed since WO is in review/completed
    }));

    const [selectedSamples, setSelectedSamples] = useState<Set<string>>(new Set());

    // Auto-select all samples initially
    useEffect(() => {
        if (samples.length > 0 && selectedSamples.size === 0) {
            setSelectedSamples(new Set(samples.map(s => s.id)));
        }
    }, [samples, selectedSamples]);

    // NEW: QC data toggle
    const [includeQCData, setIncludeQCData] = useState(false);
    const [includeMethodDetails, setIncludeMethodDetails] = useState(false);

    // NEW: Email notification
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailRecipients, setEmailRecipients] = useState("customer@example.com");
    const [emailMessage, setEmailMessage] = useState("Please find attached the Certificate of Analysis for your samples.");

    // NEW: Revision history for auto-versioning
    const isPublished = latestReport?.status === "SUBMITTED" || latestReport?.status === "APPROVED" || latestReport?.status === "RELEASED" || latestReport?.status === "LOCKED";
    const isLocked = latestReport?.is_locked || false;
    const reportVersion = latestReport ? `R${latestReport.revision_number.toString().padStart(2, "0")}` : "R01";

    const revisionHistory = reports.map(r => ({
        version: `R${r.revision_number.toString().padStart(2, "0")}`,
        createdAt: new Date(r.created_at),
        reason: r.public_notes || r.internal_notes || (r.revision_number === 1 ? "Initial release" : "Revision"),
        lockedAt: r.locked_at ? new Date(r.locked_at) : undefined
    }));

    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [revisionReason, setRevisionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-version function - creates new version when revision occurs after lock
    const handleRevisionRequest = async () => {
        if (!revisionReason.trim() || !latestReport) return;
        setIsSubmitting(true);
        try {
            // 1. Lock current version
            await updateRow("reports", latestReport.id, {
                is_locked: true,
                locked_at: new Date().toISOString(),
                locked_by: user?.id || null
            });

            // 2. Create new draft report
            const newRevNum = latestReport.revision_number + 1;
            const reportNumber = latestReport.report_number; // keep same base number

            await insertRow("reports", {
                report_number: reportNumber,
                revision_number: newRevNum,
                work_order_id: woId,
                status: "DRAFT",
                title: latestReport.title,
                generated_by: user?.id || null,
                generated_at: new Date().toISOString(),
                is_locked: false,
                public_notes: revisionReason
            });

            queryClient.invalidateQueries({ queryKey: ["reports", "workOrder", woId] });
            setShowRevisionModal(false);
            setRevisionReason("");
            setSignature(null); // Reset signature for new version
            alert(`New version R${String(newRevNum).padStart(2, "0")} created. Previous version locked.`);
        } catch (error) {
            console.error("Failed to create revision", error);
            alert("Failed to create revision. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const templates: { id: TemplateType; name: string; description: string }[] = [
        { id: "standard", name: "Standard CoA", description: "Default certificate format" },
        { id: "detailed", name: "Detailed Report", description: "Includes method details and QC data" },
        { id: "summary", name: "Summary Report", description: "Condensed single-page format" },
        { id: "regulatory", name: "Regulatory Format", description: "For government submissions" }
    ];

    const handlePublish = async () => {
        if (!signature) {
            setShowSignatureModal(true);
            return;
        }

        setIsSubmitting(true);
        try {
            if (latestReport) {
                // Update existing report
                await updateRow("reports", latestReport.id, {
                    status: "SUBMITTED",
                    signed_at: new Date().toISOString()
                });
            } else {
                // Create new report
                const reportNumber = await reportService.generateReportNumber();

                await insertRow("reports", {
                    report_number: reportNumber,
                    revision_number: 1,
                    work_order_id: woId,
                    status: "SUBMITTED",
                    title: `Certificate of Analysis — ${workOrder?.work_order_number || woId}`,
                    generated_by: user?.id || null,
                    generated_at: new Date().toISOString(),
                    is_locked: false,
                    signed_at: new Date().toISOString()
                });
            }
            queryClient.invalidateQueries({ queryKey: ["reports", "workOrder", woId] });
            queryClient.invalidateQueries({ queryKey: ["reports"] });
        } catch (error) {
            console.error("Failed to publish", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLock = async () => {
        if (!latestReport) return;
        setIsSubmitting(true);
        try {
            await updateRow("reports", latestReport.id, {
                is_locked: true,
                locked_at: new Date().toISOString(),
                locked_by: user?.id || null
            });
            queryClient.invalidateQueries({ queryKey: ["reports", "workOrder", woId] });
        } catch (error) {
            console.error("Failed to lock", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Signature canvas handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = "#1a365d";
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setSignature({
            name: signerName,
            title: signerTitle,
            signedAt: new Date(),
            dataUrl: canvas.toDataURL()
        });
        setShowSignatureModal(false);
    };

    if (isPublished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center",
                    isLocked ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-600"
                )}>
                    <span className="material-symbols-outlined text-4xl">
                        {isLocked ? "lock" : "verified"}
                    </span>
                </div>
                <h2 className="text-2xl font-bold text-text-main dark:text-white">
                    {isLocked ? "Report Locked" : "Report Published!"}
                </h2>
                <p className="text-sm text-text-secondary">
                    Report Number: {latestReport?.report_number} • Version: {reportVersion}
                </p>
                {signature && (
                    <p className="text-xs text-text-secondary">
                        Signed by {signature.name} on {signature.signedAt.toLocaleString()}
                    </p>
                )}
                <div className="flex gap-4">
                    {!isLocked && (
                        <button
                            onClick={handleLock}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[14px] mr-1 align-middle">lock</span>
                            {isSubmitting ? "Locking..." : "Lock Report"}
                        </button>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 dark:bg-white/10"
                    >
                        Print PDF
                    </button>
                    <button
                        onClick={() => router.push("/reports")}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
                    >
                        Back to Reports
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 bg-slate-100 dark:bg-background-dark min-h-screen">
            <ActionToolbar
                title="Generate CoA"
                description={`Order: ${woId}`}
                actions={
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-border-light rounded-lg text-sm font-medium hover:bg-slate-50 dark:bg-surface-dark dark:border-border-dark">
                            Edit Content
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={isSubmitting || isPublished}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shadow-lg flex items-center gap-1 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            {isPublished ? "Published" : "Publish & Sign"}
                        </button>
                    </div>
                }
            />

            <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* Sidebar Options */}
                <div className="space-y-4">
                    {/* Template Selection */}
                    <PremiumCard title="Report Template" className="sticky top-4">
                        <div className="space-y-2">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg border transition-all",
                                        selectedTemplate === t.id
                                            ? "border-primary bg-primary/10"
                                            : "border-border-light hover:border-primary/50 dark:border-border-dark"
                                    )}
                                >
                                    <p className="font-medium text-sm text-text-main dark:text-white">{t.name}</p>
                                    <p className="text-xs text-text-secondary">{t.description}</p>
                                </button>
                            ))}
                        </div>
                    </PremiumCard>

                    {/* Version & Revision History */}
                    <PremiumCard title="Version & History">
                        <div className="space-y-3">
                            {/* Current Version */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-text-main dark:text-white">
                                    Current: <span className="text-primary font-bold">{reportVersion}</span>
                                </span>
                                {isLocked && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger/20 text-danger font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">lock</span>
                                        LOCKED
                                    </span>
                                )}
                            </div>

                            {/* Revision History */}
                            <div className="space-y-1 max-h-28 overflow-y-auto">
                                {revisionHistory.map((rev) => (
                                    <div
                                        key={rev.version}
                                        className={cn(
                                            "flex items-center justify-between p-2 rounded text-xs",
                                            rev.version === reportVersion
                                                ? "bg-primary/10 border border-primary/30"
                                                : "bg-slate-50 dark:bg-white/5"
                                        )}
                                    >
                                        <div>
                                            <span className="font-bold">{rev.version}</span>
                                            <span className="text-text-secondary ml-2">{rev.reason}</span>
                                        </div>
                                        {rev.lockedAt && (
                                            <span className="material-symbols-outlined text-[14px] text-slate-400" title={`Locked: ${rev.lockedAt.toLocaleDateString()}`}>
                                                lock
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Create New Revision Button */}
                            {isPublished && (
                                <button
                                    onClick={() => setShowRevisionModal(true)}
                                    className="w-full px-3 py-2 bg-warning/20 text-warning border border-warning/30 rounded-lg text-xs font-medium hover:bg-warning/30 flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                                    Create New Revision
                                </button>
                            )}

                            <p className="text-[10px] text-text-secondary">
                                Anti-silent-edit: New versions auto-lock previous releases
                            </p>
                        </div>
                    </PremiumCard>

                    {/* NEW: Sample Selection */}
                    <PremiumCard title="Sample Selection">
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {samples.map(sample => (
                                <label
                                    key={sample.id}
                                    className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                                        selectedSamples.has(sample.id)
                                            ? "border-primary bg-primary/5"
                                            : "border-border-light dark:border-border-dark",
                                        sample.status !== "COMPLETED" && "opacity-50"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedSamples.has(sample.id)}
                                        disabled={sample.status !== "COMPLETED"}
                                        onChange={() => {
                                            const newSet = new Set(selectedSamples);
                                            if (newSet.has(sample.id)) {
                                                newSet.delete(sample.id);
                                            } else {
                                                newSet.add(sample.id);
                                            }
                                            setSelectedSamples(newSet);
                                        }}
                                        className="rounded border-border-light"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-text-main dark:text-white truncate">
                                            {sample.name}
                                        </p>
                                        <p className="text-[10px] text-text-secondary">{sample.matrix}</p>
                                    </div>
                                    <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                        sample.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                            sample.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-100 text-slate-500"
                                    )}>
                                        {sample.status.replace("_", " ")}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-text-secondary mt-2">
                            {selectedSamples.size} sample(s) selected
                        </p>
                    </PremiumCard>

                    {/* NEW: Report Options */}
                    <PremiumCard title="Report Options">
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeQCData}
                                    onChange={() => setIncludeQCData(!includeQCData)}
                                    className="rounded border-border-light w-4 h-4"
                                />
                                <div>
                                    <p className="text-sm font-medium text-text-main dark:text-white">Include QC Data</p>
                                    <p className="text-xs text-text-secondary">Control charts & batch info</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeMethodDetails}
                                    onChange={() => setIncludeMethodDetails(!includeMethodDetails)}
                                    className="rounded border-border-light w-4 h-4"
                                />
                                <div>
                                    <p className="text-sm font-medium text-text-main dark:text-white">Method Details</p>
                                    <p className="text-xs text-text-secondary">SOPs & reference standards</p>
                                </div>
                            </label>
                        </div>
                    </PremiumCard>

                    {/* NEW: Send Report */}
                    <PremiumCard title="Send Report">
                        <button
                            onClick={() => setShowEmailModal(true)}
                            className="w-full py-2.5 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                            <span className="material-symbols-outlined text-[18px]">mail</span>
                            Email to Customer
                        </button>
                    </PremiumCard>

                    {/* Signature Status */}
                    <PremiumCard title="Digital Signature">
                        {signature ? (
                            <div className="space-y-2">
                                <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                                    <p className="text-sm font-medium text-success">✓ Signed</p>
                                    <p className="text-xs text-text-secondary">{signature.name}</p>
                                    <p className="text-xs text-text-secondary">{signature.title}</p>
                                </div>
                                <button
                                    onClick={() => setShowSignatureModal(true)}
                                    className="w-full text-xs text-primary hover:underline"
                                >
                                    Change Signature
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowSignatureModal(true)}
                                className="w-full py-3 border-2 border-dashed border-border-light rounded-lg text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors dark:border-border-dark"
                            >
                                <span className="material-symbols-outlined text-[20px] block mb-1">draw</span>
                                Add Signature
                            </button>
                        )}
                    </PremiumCard>
                </div>

                {/* Preview */}
                <div className="overflow-x-auto">
                    <div className="bg-white rounded-lg shadow-lg p-2 dark:bg-surface-dark">
                        {/* DRAFT Watermark */}
                        <div className="relative">
                            {!signature && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <span className="text-[80px] font-bold text-red-500/10 rotate-[-30deg]">
                                        DRAFT
                                    </span>
                                </div>
                            )}
                            <CoAPreview workOrderId={woId} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Signature Modal */}
            {showSignatureModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Digital Signature</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-text-main dark:text-white block mb-1">Name</label>
                                <input
                                    type="text"
                                    value={signerName}
                                    onChange={(e) => setSignerName(e.target.value)}
                                    className="w-full border border-border-light rounded-lg p-2 text-sm dark:border-border-dark dark:bg-background-dark"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-main dark:text-white block mb-1">Title</label>
                                <input
                                    type="text"
                                    value={signerTitle}
                                    onChange={(e) => setSignerTitle(e.target.value)}
                                    className="w-full border border-border-light rounded-lg p-2 text-sm dark:border-border-dark dark:bg-background-dark"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-main dark:text-white block mb-1">Draw Signature</label>
                                <div className="border border-border-light rounded-lg overflow-hidden dark:border-border-dark">
                                    <canvas
                                        ref={canvasRef}
                                        width={350}
                                        height={120}
                                        className="bg-white cursor-crosshair w-full"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                    />
                                </div>
                                <button
                                    onClick={clearSignature}
                                    className="text-xs text-text-secondary hover:text-danger mt-1"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowSignatureModal(false)}
                                className="flex-1 px-4 py-2 text-text-secondary hover:text-text-main"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSignature}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium"
                            >
                                Save Signature
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600">mail</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main dark:text-white">
                                    Send Report
                                </h3>
                                <p className="text-sm text-text-secondary">
                                    Email CoA to customer
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-text-main dark:text-white block mb-1">
                                    Recipients
                                </label>
                                <input
                                    type="text"
                                    value={emailRecipients}
                                    onChange={(e) => setEmailRecipients(e.target.value)}
                                    placeholder="email@example.com, another@example.com"
                                    className="w-full border border-border-light rounded-lg p-2 text-sm dark:border-border-dark dark:bg-background-dark"
                                />
                                <p className="text-xs text-text-secondary mt-1">
                                    Separate multiple emails with commas
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-main dark:text-white block mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={emailMessage}
                                    onChange={(e) => setEmailMessage(e.target.value)}
                                    rows={3}
                                    className="w-full border border-border-light rounded-lg p-2 text-sm dark:border-border-dark dark:bg-background-dark resize-none"
                                />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg dark:bg-black/20">
                                <p className="text-xs font-medium text-text-main dark:text-white mb-1">
                                    Attachment
                                </p>
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <span className="material-symbols-outlined text-[16px] text-danger">picture_as_pdf</span>
                                    {latestReport?.report_number}-{reportVersion}.pdf
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="flex-1 px-4 py-2 text-text-secondary hover:text-text-main"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    alert(`Email sent to: ${emailRecipients}`);
                                    setShowEmailModal(false);
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                                Send Email
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revision Request Modal */}
            {showRevisionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-warning">edit_note</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main dark:text-white">Create New Revision</h3>
                                <p className="text-xs text-text-secondary">Current version {reportVersion} will be locked</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                                    Revision Reason *
                                </label>
                                <select
                                    value={revisionReason}
                                    onChange={(e) => setRevisionReason(e.target.value)}
                                    className="w-full border border-border-light rounded-lg p-2 text-sm dark:border-border-dark dark:bg-background-dark"
                                >
                                    <option value="">Select reason...</option>
                                    <option value="Customer requested correction">Customer requested correction</option>
                                    <option value="Typographical error">Typographical error</option>
                                    <option value="Additional tests added">Additional tests added</option>
                                    <option value="QC issue resolved">QC issue resolved</option>
                                    <option value="Regulatory compliance update">Regulatory compliance update</option>
                                </select>
                            </div>

                            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-warning text-[16px] mt-0.5">info</span>
                                    <div className="text-xs text-text-main dark:text-white">
                                        <p className="font-medium">Anti-Silent-Edit Policy</p>
                                        <p className="text-text-secondary mt-1">
                                            Creating a new revision will permanently lock version {reportVersion}.
                                            A new draft ({reportVersion === "R01" ? "R02" : `R${String(parseInt(reportVersion.substring(1)) + 1).padStart(2, "0")}`}) will be created.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowRevisionModal(false);
                                    setRevisionReason("");
                                }}
                                className="flex-1 px-4 py-2 text-text-secondary hover:text-text-main"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRevisionRequest}
                                disabled={!revisionReason || isSubmitting}
                                className="flex-1 px-4 py-2 bg-warning text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                {isSubmitting ? "Creating..." : "Create Revision"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

