import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_RESULTS, MOCK_TASKS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

export default function QCAlertTable() {
    // Filter failures
    const alerts = MOCK_RESULTS.filter(r => r.compliance_status === "FAIL" || r.qc_status === "FAIL").map(r => {
        const task = MOCK_TASKS.find(t => t.id === r.task_id);
        return {
            ...r,
            sample_name: task?.sample_name_snapshot || "Unknown Sample",
            parameter: task?.parameter_name_snapshot || "Unknown Param"
        };
    });

    return (
        <PremiumCard title="QC Alerts" subtitle="Action required: Out of Spec (OOS) or QC Failures">
            <DenseTable
                data={alerts}
                keyExtractor={r => r.id}
                columns={[
                    { header: "Sample", accessorKey: "sample_name" },
                    { header: "Parameter", accessorKey: "parameter" },
                    {
                        header: "Value",
                        accessorKey: "numeric_value",
                        className: "font-mono font-bold text-right",
                        cell: r => `${r.numeric_value} ${r.unit_id === 'u-001' ? 'mg/L' : ''}`
                    },
                    {
                        header: "Issue",
                        accessorKey: "compliance_status",
                        cell: r => (
                            <div className="flex flex-col gap-1">
                                {r.compliance_status === "FAIL" && (
                                    <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                                        Max Limit Exceeded
                                    </span>
                                )}
                                {r.qc_status === "FAIL" && (
                                    <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                                        QC Recovery Low
                                    </span>
                                )}
                            </div>
                        )
                    },
                    {
                        header: "Action",
                        accessorKey: "id",
                        className: "text-right",
                        cell: () => (
                            <button className="text-xs font-semibold text-primary hover:underline">
                                Investigate
                            </button>
                        )
                    }
                ]}
            />
        </PremiumCard>
    );
}
