"use client";

import { usePathname } from "next/navigation";
import { ActionToolbar } from "@/components/ui/Toolbar";
import SmartReviewDetail from "@/features/review/components/SmartReviewDetail";

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
    // For demo: verify ID or use "sub-001"
    const id = "sub-001";

    const handleApprove = () => {
        alert("Report Approved! Status changed to LOCKED. Certificate Generated.");
        window.history.back();
    };

    const handleReject = (reason: string) => {
        if (!reason) return alert("Reason required!");
        alert(`Returned to Analyst. Reason: ${reason}`);
        window.history.back();
    };

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Data Review"
                description="Secure approval gateway"
            />
            <div className="max-w-5xl mx-auto">
                <SmartReviewDetail
                    submissionId={id}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            </div>
        </div>
    );
}
