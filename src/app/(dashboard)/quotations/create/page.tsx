"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import QuotationForm from "@/features/quotations/components/QuotationForm";

export default function QuotationBuilderPage() {
    const { user } = useAuth();
    const router = useRouter();
    const isManager = user?.role === "manager";

    useEffect(() => {
        if (isManager) {
            router.replace("/quotations");
        }
    }, [isManager, router]);

    if (isManager) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-amber-400 mb-4">block</span>
                <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">Access Restricted</h2>
                <p className="text-sm text-slate-400 mt-2">Managers cannot create quotations. Redirecting...</p>
            </div>
        );
    }

    return <QuotationForm />;
}
