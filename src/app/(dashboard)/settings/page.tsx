"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">Settings</h1>
            <p className="text-text-secondary">Manage system preferences.</p>

            <PremiumCard title="General Settings">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Laboratory Name</Label>
                        <Input defaultValue="LabFlow LIMS" />
                    </div>
                    <div className="space-y-2">
                        <Label>Support Email</Label>
                        <Input defaultValue="support@labflow.com" />
                    </div>
                </div>
                <div className="mt-6">
                    <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover">
                        Save Changes
                    </button>
                </div>
            </PremiumCard>
        </div>
    );
}
