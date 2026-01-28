"use client";

import { ActionToolbar } from "@/components/ui/Toolbar";
import MyTaskBoard from "@/features/worklist/components/MyTaskBoard";

export default function WorklistPage() {
    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="My Worklist"
                description="Daily testing tasks and priorities"
            />
            <div className="mx-auto max-w-6xl">
                <MyTaskBoard />
            </div>
        </div>
    );
}
