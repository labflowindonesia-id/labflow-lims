"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import QCAlertTable from "@/features/qc/components/QCAlertTable";
import ControlChart from "@/features/qc/components/ControlChart";

export default function QCMonitorPage() {
    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="QC Monitor"
                description="Quality Assurance Dashboard"
                actions={
                    <button className="rounded-lg bg-white border border-border-light px-3 py-1 text-xs font-medium text-text-secondary hover:bg-slate-50">
                        Export Report
                    </button>
                }
            />

            <div className="mx-auto max-w-6xl grid grid-cols-1 gap-6">
                <QCAlertTable />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ControlChart />
                    {/* Placeholder for another chart */}
                    <div className="opacity-50 grayscale pointer-events-none">
                        <ControlChart />
                    </div>
                </div>
            </div>
        </div>
    );
}
