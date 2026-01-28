"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import ReceivingTable from "@/features/receiving/components/ReceivingTable";

export default function ReceivingIndexPage() {
    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Sample Receiving"
                description="Central accessioning log"
            />
            <div className="max-w-6xl mx-auto">
                <ReceivingTable />
            </div>
        </div>
    );
}
