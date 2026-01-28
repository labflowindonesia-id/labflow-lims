"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">Reports</h1>
            <p className="text-text-secondary">Generate and view laboratory reports.</p>

            <PremiumCard title="Available Reports">
                <div className="p-8 text-center text-text-secondary">
                    <span className="material-symbols-outlined text-4xl mb-2">construction</span>
                    <p>Report generation module is coming soon.</p>
                </div>
            </PremiumCard>
        </div>
    );
}
