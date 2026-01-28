"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import QuotationsTable from "@/features/quotations/components/QuotationsTable";

export default function QuotationsIndexPage() {
    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Quotations"
                description="Sales pipeline and contract management"
            />
            <div className="max-w-6xl mx-auto">
                <QuotationsTable />
            </div>
        </div>
    );
}
