"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import { CoAPreview } from "@/features/reporting/components/CoAPreview";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateReportPage() {
    const params = useParams();
    const router = useRouter();
    const woId = params.woId as string;
    const [isPublished, setIsPublished] = useState(false);

    const handlePublish = () => {
        setIsPublished(true);
        // In real app, update DB status to COMPLETE
    };

    if (isPublished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <span className="material-symbols-outlined text-4xl">verified</span>
                </div>
                <h2 className="text-2xl font-bold text-text-main">Report Published!</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200"
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
        <div className="space-y-6 pb-20 bg-slate-100 min-h-screen">
            <ActionToolbar
                title="Generate CoA"
                description={`Order: ${woId}`}
                actions={
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-border-light rounded-lg text-sm font-medium hover:bg-slate-50">
                            Edit Content
                        </button>
                        <button
                            onClick={handlePublish}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shadow-lg"
                        >
                            Publish & Sign
                        </button>
                    </div>
                }
            />

            <div className="mx-auto max-w-[220mm] pb-12 overflow-x-auto">
                <CoAPreview workOrderId={woId} />
            </div>
        </div>
    );
}
