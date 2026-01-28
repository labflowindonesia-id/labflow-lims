"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_WORK_ORDERS } from "@/data/mock-db";
import Link from "next/link";

export default function ReportsPage() {
    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Reports & Certificates"
                description="Manage official certificates of analysis"
            />

            <div className="mx-auto max-w-5xl space-y-6">

                {/* Pending Generation Block */}
                <PremiumCard title="Pending Generation" className="border-l-4 border-l-primary">
                    <DenseTable
                        data={MOCK_WORK_ORDERS}
                        keyExtractor={w => w.id}
                        columns={[
                            { header: "Order", accessorKey: "work_order_no" },
                            { header: "Customer", accessorKey: "customer_name_snapshot" },
                            { header: "Status", accessorKey: "status" },
                            {
                                header: "Action",
                                accessorKey: "id",
                                className: "text-right",
                                cell: (w) => (
                                    <Link href={`/reports/create/${w.id}`}>
                                        <button className="rounded bg-primary px-3 py-1 text-xs font-bold text-white shadow hover:bg-primary-hover">
                                            Generate CoA
                                        </button>
                                    </Link>
                                )
                            }
                        ]}
                    />
                </PremiumCard>

                {/* History Block (Mock) */}
                <PremiumCard title="Report History" className="opacity-75">
                    <p className="text-sm text-text-secondary py-8 text-center italic">
                        No historical reports found.
                    </p>
                </PremiumCard>
            </div>
        </div>
    );
}
