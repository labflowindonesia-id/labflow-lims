import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { MOCK_RESULTS, MOCK_TASKS, MOCK_SUBMISSIONS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

interface SmartReviewDetailProps {
    submissionId: string;
    onApprove: () => void;
    onReject: (reason: string) => void;
}

export default function SmartReviewDetail({ submissionId, onApprove, onReject }: SmartReviewDetailProps) {
    const submission = MOCK_SUBMISSIONS.find(s => s.id === submissionId);

    // Find results linked to this submission's sample/WO
    // (Simplified lookup for proto)
    const results = MOCK_RESULTS.filter(r => {
        const task = MOCK_TASKS.find(t => t.id === r.task_id);
        return task?.work_order_id === submission?.work_order_id;
    });

    const [rejectReason, setRejectReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    if (!submission) return <div>Submission not found</div>;

    return (
        <div className="space-y-6">
            <PremiumCard title={`Review: ${submission.work_order_id}`} className="sticky top-4 z-10">
                <div className="flex justify-between items-center">
                    <div className="text-sm">
                        <span className="text-text-secondary">Analyst:</span> <span className="font-semibold">Analyst Kimia</span>
                    </div>
                    <div className="flex gap-2">
                        {isRejecting ? (
                            <div className="flex gap-2 animate-in slide-in-from-right">
                                <input
                                    className="text-sm border rounded px-2 py-1 w-64"
                                    placeholder="Reason for rejection..."
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    onClick={() => onReject(rejectReason)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                    Confirm Reject
                                </button>
                                <button
                                    onClick={() => setIsRejecting(false)}
                                    className="px-3 py-1 bg-slate-200 rounded text-sm hover:bg-slate-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsRejecting(true)}
                                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                                >
                                    Request Revision
                                </button>
                                <button
                                    onClick={onApprove}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20 text-sm font-medium"
                                >
                                    Approve & Sign
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </PremiumCard>

            <div className="space-y-4">
                {results.map(res => {
                    const task = MOCK_TASKS.find(t => t.id === res.task_id);
                    return (
                        <div key={res.id} className="bg-white dark:bg-surface-dark border border-border-light rounded-lg p-4 shadow-sm flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-lg">{task?.parameter_name_snapshot}</h4>
                                    <span className="text-xs text-text-secondary bg-slate-100 px-2 rounded">{task?.method_id_snapshot}</span>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div>
                                        <span className="text-text-secondary text-xs block">Result</span>
                                        <span className="font-mono font-semibold text-base">{res.numeric_value} <span className="text-xs text-text-secondary">mg/L</span></span>
                                    </div>
                                    <div>
                                        <span className="text-text-secondary text-xs block">Limit</span>
                                        <span className="text-text-secondary">{res.formatted_limit_text}</span>
                                    </div>
                                </div>
                            </div>

                            {/* TRAFFIC LIGHTS */}
                            <div className="flex gap-4">
                                {/* Compliance Flag */}
                                <div className={cn(
                                    "px-3 py-1 rounded text-xs font-bold text-center w-24 border",
                                    res.compliance_status === "PASS" ? "bg-green-50 border-green-200 text-green-700" :
                                        res.compliance_status === "FAIL" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                )}>
                                    <span className="block text-[10px] uppercase font-normal opacity-70">Compliance</span>
                                    {res.compliance_status}
                                </div>

                                {/* QC Flag */}
                                <div className={cn(
                                    "px-3 py-1 rounded text-xs font-bold text-center w-24 border",
                                    res.qc_status === "PASS" ? "bg-blue-50 border-blue-200 text-blue-700" :
                                        res.qc_status === "FAIL" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                )}>
                                    <span className="block text-[10px] uppercase font-normal opacity-70">QC Check</span>
                                    {res.qc_status} ({res.qc_recovery}%)
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
