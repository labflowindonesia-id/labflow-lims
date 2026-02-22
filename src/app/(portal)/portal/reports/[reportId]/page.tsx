"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { cn } from "@/lib/utils";
import { useReports, useWorkOrder, useSamplesByWorkOrder, useUsers } from "@/hooks/use-supabase";
import { CoAPreview } from "@/features/reporting/components/CoAPreview";

export default function PortalReportPage() {
    const params = useParams();
    const router = useRouter();
    const reportId = params.reportId as string;

    const [isDownloading, setIsDownloading] = useState(false);

    // Fetch real data
    const { data: dbReports = [], isLoading: reportsLoading } = useReports();
    const { data: users = [] } = useUsers();

    const dbReport = dbReports.find(r => r.id === reportId);

    const { data: wo, isLoading: woLoading } = useWorkOrder(dbReport?.work_order_id || "");
    const { data: samples = [], isLoading: samplesLoading } = useSamplesByWorkOrder(wo?.id || "");

    const isLoading = reportsLoading || (dbReport && woLoading) || samplesLoading;

    // Derived report data for header
    let report = null;
    if (dbReport && wo) {
        const signer = users.find(u => u.id === dbReport.generated_by); // Simplified: signed by the generator

        report = {
            id: dbReport.id,
            reportNo: dbReport.report_number,
            workOrderNo: wo.work_order_number,
            customerName: wo.customer_name_snapshot,
            sampleCount: samples.length,
            status: dbReport.status,
            issuedDate: new Date(dbReport.created_at),
            signedBy: signer?.full_name || "Authorized Signatory",
            version: `R${dbReport.revision_number.toString().padStart(2, "0")}`,
        };
    }

    const handleDownload = () => {
        setIsDownloading(true);
        // Simulate download
        setTimeout(() => {
            setIsDownloading(false);
            alert("PDF downloaded!");
        }, 1500);
    };

    if (isLoading) {
        return <div className="min-h-screen bg-slate-100 flex items-center justify-center">Loading Report...</div>;
    }

    if (!report) {
        return <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center space-y-4">
            <p className="text-lg text-text-secondary">Report not found.</p>
            <button onClick={() => router.push("/portal")} className="px-4 py-2 bg-primary text-white rounded">Back to Portal</button>
        </div>;
    }

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
                            report.status === "APPROVED" || report.status === "RELEASED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                            {report.status.replace("_", " ")}
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

                    {/* PDF Content (Preview) */}
                    <div className="bg-slate-200 p-8 flex items-start justify-center overflow-x-auto min-h-[800px] print:p-0 print:bg-white">
                        <div className="scale-[0.85] sm:scale-100 origin-top">
                            <CoAPreview workOrderId={dbReport!.work_order_id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
