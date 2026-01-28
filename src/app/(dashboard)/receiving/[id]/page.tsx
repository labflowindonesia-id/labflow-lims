"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import WorkOrderDetailView from "@/features/receiving/components/WorkOrderDetailView";
import { useParams } from "next/navigation";

export default function ReceivingDetailPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Work Order Detail"
                description={`Order Reference: ${id}`}
            />
            <div className="mx-auto max-w-6xl">
                <WorkOrderDetailView id={id} />
            </div>
        </div>
    );
}
