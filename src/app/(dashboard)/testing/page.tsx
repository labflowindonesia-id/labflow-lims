"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /testing — Redirects to worklist since testing requires a specific taskId.
 * The actual testing workspace is at /testing/[taskId].
 */
export default function TestingPageRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/worklist");
    }, [router]);

    return (
        <div className="flex items-center justify-center h-64">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span className="ml-2 text-text-secondary">Redirecting to worklist...</span>
        </div>
    );
}
