"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import ResultsReviewTable from "@/features/reporting/components/ResultsReviewTable";

export default function ResultsReviewPage() {
    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Results Verification"
                description="Manager approval workspace"
            />
            <div className="mx-auto max-w-5xl">
                <ResultsReviewTable />
            </div>
        </div>
    );
}
