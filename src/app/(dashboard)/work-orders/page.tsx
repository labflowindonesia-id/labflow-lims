"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import WorkOrderListTable from "@/features/work-orders/components/WorkOrderListTable";

export default function MasterWorkOrdersPage() {
    return (
        <div className="space-y-6">
            <ActionToolbar
                title="Master Work Orders"
                description="View and track all work orders from drafted quotes to completed analysis"
            />

            <div className="w-full">
                <WorkOrderListTable />
            </div>
        </div>
    );
}
