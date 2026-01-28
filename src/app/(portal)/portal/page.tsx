"use client";

import ClientDashboard from "@/features/portal/components/ClientDashboard";

export default function PortalHomePage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, Budi!</h1>
            <p className="text-slate-500">Here are your latest sample analysis statuses.</p>

            <div className="mt-6">
                <ClientDashboard />
            </div>
        </div>
    );
}
