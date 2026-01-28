"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import ReviewQueueTable from "@/features/review/components/ReviewQueueTable";

export default function ReviewIndexPage() {
    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Management Review"
                description="Overview of pending reports and result submissions"
            />
            <div className="max-w-6xl mx-auto">
                <ReviewQueueTable />
            </div>
        </div>
    );
}
