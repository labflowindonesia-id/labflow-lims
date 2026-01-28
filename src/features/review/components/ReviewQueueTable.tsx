import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_SUBMISSIONS, MOCK_TASKS } from "@/data/mock-db";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ReviewQueueTable() {
    // Just mockup linking submission to task info
    const submissions = MOCK_SUBMISSIONS.map(sub => {
        const sampleName = MOCK_TASKS.find(t => t.sample_id === sub.sample_id)?.sample_name_snapshot || "Unknown Sample";
        return { ...sub, sampleName };
    });

    return (
        <PremiumCard
            title="Approvals Needed"
            subtitle="Review and sign-off on analytical results"
        >
            <DenseTable
                data={submissions}
                keyExtractor={s => s.id}
                columns={[
                    { header: "Work Order", accessorKey: "work_order_id", className: "font-mono" },
                    { header: "Sample", accessorKey: "sampleName", className: "font-medium" },
                    {
                        header: "Submitted",
                        accessorKey: "submitted_at",
                        cell: s => s.submitted_at.toLocaleDateString()
                    },
                    {
                        header: "QC Status",
                        accessorKey: "qc_failure_count",
                        cell: (s) => (
                            <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-full flex w-fit items-center gap-1",
                                s.qc_failure_count > 0
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            )}>
                                {s.qc_failure_count > 0 ? (
                                    <><span className="material-symbols-outlined text-[12px]">warning</span> Alerts ({s.qc_failure_count})</>
                                ) : (
                                    <><span className="material-symbols-outlined text-[12px]">check_circle</span> Clean</>
                                )}
                            </span>
                        )
                    },
                    {
                        header: "Action",
                        accessorKey: "id",
                        cell: (s) => (
                            <Link
                                href={`/review/${s.id}`}
                                className="text-primary hover:underline text-xs font-semibold"
                            >
                                Review Data &gt;
                            </Link>
                        )
                    }
                ]}
                className="border-0"
            />
        </PremiumCard>
    );
}
