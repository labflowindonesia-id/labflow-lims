"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { CoAPreview } from "@/features/reporting/components/CoAPreview";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

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

    const [isPublished, setIsPublished] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("standard");
    const [reportVersion, setReportVersion] = useState("R01");
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signature, setSignature] = useState<SignatureData | null>(null);
    const [signerName, setSignerName] = useState("Dr. Ahmad Wijaya");
    const [signerTitle, setSignerTitle] = useState("Technical Manager");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const templates: { id: TemplateType; name: string; description: string }[] = [
        { id: "standard", name: "Standard CoA", description: "Default certificate format" },
        { id: "detailed", name: "Detailed Report", description: "Includes method details and QC data" },
        { id: "summary", name: "Summary Report", description: "Condensed single-page format" },
        { id: "regulatory", name: "Regulatory Format", description: "For government submissions" }
    ];

    const handlePublish = () => {
        if (!signature) {
            setShowSignatureModal(true);
            return;
        }
        setIsPublished(true);
    };

    const handleLock = () => {
        setIsLocked(true);
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
                    Report Number: RPT-2024-{woId.slice(-4)} • Version: {reportVersion}
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
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                        >
                            <span className="material-symbols-outlined text-[14px] mr-1 align-middle">lock</span>
                            Lock Report
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
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shadow-lg flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            Publish & Sign
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

                    {/* Version */}
                    <PremiumCard title="Version">
                        <div className="flex gap-2">
                            {["R01", "R02", "R03"].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setReportVersion(v)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                                        reportVersion === v
                                            ? "bg-primary text-white"
                                            : "bg-slate-100 text-text-secondary hover:bg-slate-200 dark:bg-white/10"
                                    )}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-text-secondary mt-2">
                            {reportVersion === "R01" ? "Initial release" : `Revision ${reportVersion.substring(1)}`}
                        </p>
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
        </div>
    );
}
