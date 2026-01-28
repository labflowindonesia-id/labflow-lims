"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import QuotationsReviewTable from "@/features/quotations/components/QuotationsReviewTable";

export default function ContractReviewPage() {
    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Contract Review"
                description="Manager approval for outgoing quotations"
            />
            <div className="mx-auto max-w-5xl">
                <QuotationsReviewTable />
            </div>
        </div>
    );
}
