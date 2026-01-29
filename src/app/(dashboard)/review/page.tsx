"use client";

import { useState } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import ResultsReviewTable from "@/features/reporting/components/ResultsReviewTable";
import ReviewDetailPanel from "@/features/reporting/components/ReviewDetailPanel";

export default function ResultsReviewPage() {
    const [selectedWO, setSelectedWO] = useState<string | null>(null);

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Results Verification"
                description="Manager approval workspace"
                actions={
                    selectedWO && (
                        <button
                            onClick={() => setSelectedWO(null)}
                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-main flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            Back to Queue
                        </button>
                    )
                }
            />
            <div className="mx-auto max-w-5xl">
                {selectedWO ? (
                    <ReviewDetailPanel
                        workOrderId={selectedWO}
                        onApprove={() => {
                            alert("Results approved! Report ready for generation.");
                            setSelectedWO(null);
                        }}
                        onReject={(reason) => {
                            alert(`Rejected: ${reason}`);
                            setSelectedWO(null);
                        }}
                    />
                ) : (
                    <ResultsReviewTable onSelectWO={setSelectedWO} />
                )}
            </div>
        </div>
    );
}

