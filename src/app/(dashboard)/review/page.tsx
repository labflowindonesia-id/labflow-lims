"use client";

import { useState, useCallback } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import ResultsReviewTable from "@/features/reporting/components/ResultsReviewTable";
import ReviewDetailPanel from "@/features/reporting/components/ReviewDetailPanel";
import { useQueryClient } from "@tanstack/react-query";

export default function ResultsReviewPage() {
    const [selectedWO, setSelectedWO] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const handleApprove = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["workOrders"] });
        queryClient.invalidateQueries({ queryKey: ["resultSubmissions"] });
        setSelectedWO(null);
    }, [queryClient]);

    const handleReject = useCallback((_reason: string) => {
        queryClient.invalidateQueries({ queryKey: ["resultSubmissions"] });
        queryClient.invalidateQueries({ queryKey: ["workOrders"] });
        queryClient.invalidateQueries({ queryKey: ["testTasks"] });
        setSelectedWO(null);
    }, [queryClient]);

    return (
        <div className="space-y-6">
            <ActionToolbar
                title="Results Verification"
                description="Manager approval workspace"
                actions={
                    selectedWO && (
                        <button
                            onClick={() => setSelectedWO(null)}
                            className="text-sm text-text-secondary hover:text-primary flex items-center gap-1.5"
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
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                ) : (
                    <ResultsReviewTable onSelectWO={setSelectedWO} />
                )}
            </div>
        </div>
    );
}
