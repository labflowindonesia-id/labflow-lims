"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { cn } from "@/lib/utils";

export default function PortalReportPage() {
    const params = useParams();
    const router = useRouter();
    const reportId = params.reportId as string;

    const [isDownloading, setIsDownloading] = useState(false);

    // Mock report data (in real app, fetched from API)
    const report = {
        id: reportId,
        reportNo: `RPT-2024-${reportId.slice(-4)}`,
        workOrderNo: "WO-2024-0001",
        customerName: "PT Maju Jaya Industries",
        sampleCount: 4,
        status: "FINAL" as const,
        issuedDate: new Date("2024-01-26"),
        signedBy: "Dr. Ahmad Wijaya",
        version: "R01",
    };

    const handleDownload = () => {
        setIsDownloading(true);
        // Simulate download
        setTimeout(() => {
            setIsDownloading(false);
            alert("PDF downloaded!");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">
                            Certificate of Analysis
                        </h1>
                        <p className="text-sm text-text-secondary">
                            {report.reportNo} • Version {report.version}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push("/portal")}
                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-main flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            Back to Portal
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-hover disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {isDownloading ? "hourglass_empty" : "download"}
                            </span>
                            {isDownloading ? "Downloading..." : "Download PDF"}
                        </button>
                    </div>
                </div>

                {/* Report Info Card */}
                <PremiumCard>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Report Number</span>
                                <span className="font-mono font-bold text-text-main">{report.reportNo}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Work Order</span>
                                <span className="font-mono text-text-main">{report.workOrderNo}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Customer</span>
                                <span className="text-text-main">{report.customerName}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Samples</span>
                                <span className="text-text-main">{report.sampleCount} samples</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Issued Date</span>
                                <span className="text-text-main">{report.issuedDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Signed By</span>
                                <span className="text-text-main">{report.signedBy}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border-light flex items-center justify-between">
                        <span className={cn(
                            "text-xs px-3 py-1 rounded-full font-bold uppercase",
                            report.status === "FINAL" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                            {report.status}
                        </span>
                        <span className="text-xs text-text-secondary">
                            Version {report.version} • Digitally Signed
                        </span>
                    </div>
                </PremiumCard>

                {/* PDF Preview Area */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* PDF Toolbar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
                            <span className="text-sm font-medium">{report.reportNo}.pdf</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 rounded hover:bg-white/10">
                                <span className="material-symbols-outlined text-[20px]">zoom_out</span>
                            </button>
                            <span className="text-xs px-2">100%</span>
                            <button className="p-1.5 rounded hover:bg-white/10">
                                <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                            </button>
                            <div className="w-px h-5 bg-white/20 mx-2" />
                            <button className="p-1.5 rounded hover:bg-white/10">
                                <span className="material-symbols-outlined text-[20px]">fullscreen</span>
                            </button>
                        </div>
                    </div>

                    {/* PDF Content (Mock Preview) */}
                    <div className="bg-slate-200 p-8 min-h-[800px] flex items-start justify-center">
                        <div className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-8">
                            {/* PDF Header */}
                            <div className="border-b-2 border-primary pb-4 mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-primary">CERTIFICATE OF ANALYSIS</h2>
                                        <p className="text-sm text-text-secondary mt-1">LabFlow Environmental Laboratory</p>
                                        <p className="text-xs text-text-secondary">ISO 17025:2017 Accredited</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-mono font-bold">{report.reportNo}</p>
                                        <p className="text-xs text-text-secondary">Version {report.version}</p>
                                        <p className="text-xs text-text-secondary">{report.issuedDate.toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-primary mb-2">CLIENT INFORMATION</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-text-secondary">Company</p>
                                        <p className="font-medium">{report.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Work Order</p>
                                        <p className="font-mono">{report.workOrderNo}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sample Results Table */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-primary mb-2">ANALYTICAL RESULTS</h3>
                                <table className="w-full text-sm border border-slate-200">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="border border-slate-200 px-3 py-2 text-left">Parameter</th>
                                            <th className="border border-slate-200 px-3 py-2 text-center">Result</th>
                                            <th className="border border-slate-200 px-3 py-2 text-center">Unit</th>
                                            <th className="border border-slate-200 px-3 py-2 text-center">Limit</th>
                                            <th className="border border-slate-200 px-3 py-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-slate-200 px-3 py-2">pH</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center font-mono">7.2</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center">-</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center">6-9</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center text-green-600 font-bold">PASS</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-slate-200 px-3 py-2">COD</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center font-mono">85</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center">mg/L</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center">100</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center text-green-600 font-bold">PASS</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-slate-200 px-3 py-2">BOD5</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center font-mono">28</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center">mg/L</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center">30</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center text-green-600 font-bold">PASS</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-slate-200 px-3 py-2">TSS</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center font-mono">42</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center">mg/L</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center">50</td>
                                            <td className="border border-slate-200 px-3 py-2 text-center text-green-600 font-bold">PASS</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Signature */}
                            <div className="mt-12 pt-6 border-t border-slate-200">
                                <div className="text-right">
                                    <p className="text-xs text-text-secondary mb-8">Digitally signed on {report.issuedDate.toLocaleDateString()}</p>
                                    <div className="inline-block border-b-2 border-slate-800 px-12 py-2">
                                        <p className="font-bold">{report.signedBy}</p>
                                        <p className="text-xs text-text-secondary">Technical Manager</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
