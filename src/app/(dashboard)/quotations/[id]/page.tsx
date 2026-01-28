"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import QuotationDetailView from "@/features/quotations/components/QuotationDetailView";
import { useParams } from "next/navigation";

export default function QuotationDetailPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Quotation Detail"
                description={`Reference ID: ${id}`}
            />
            <div className="mx-auto max-w-6xl">
                <QuotationDetailView id={id} />
            </div>
        </div>
    );
}
