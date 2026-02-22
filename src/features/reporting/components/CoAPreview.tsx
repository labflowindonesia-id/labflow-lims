"use client";

import { useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import {
    useWorkOrder,
    useSamplesByWorkOrder,
    useTestTasks,
    useTestResults,
    useParameters,
    useUnits,
    useMethods,
    useSampleMatrices
} from "@/hooks/use-supabase";

interface CoAPreviewProps {
    workOrderId: string;
}

export function CoAPreview({ workOrderId }: CoAPreviewProps) {
    const { data: wo, isLoading: woLoading } = useWorkOrder(workOrderId);
    const { data: samples = [], isLoading: samplesLoading } = useSamplesByWorkOrder(workOrderId);
    const { data: allTasks = [], isLoading: tasksLoading } = useTestTasks();
    const { data: allResults = [], isLoading: resultsLoading } = useTestResults();
    const { data: parameters = [] } = useParameters();
    const { data: units = [] } = useUnits();
    const { data: methods = [] } = useMethods();
    const { data: matrices = [] } = useSampleMatrices();

    const isLoading = woLoading || samplesLoading || tasksLoading || resultsLoading;

    const matrixDisplay = useMemo(() => {
        if (!samples.length || !matrices.length) return "-";
        const mNames = Array.from(new Set(samples.map(s => {
            const mat = matrices.find(m => m.id === s.matrix_id);
            return mat ? mat.name : null;
        }))).filter(Boolean);
        return mNames.join(", ") || "-";
    }, [samples, matrices]);

    const resultsData = useMemo(() => {
        if (!samples.length || !allTasks.length || !allResults.length) return [];

        const sampleIds = samples.map(s => s.id);
        const filteredTasks = allTasks.filter(t => t.sample_id && sampleIds.includes(t.sample_id) && t.status !== "CANCELLED");

        return filteredTasks.map(task => {
            const result = allResults.find(r => r.task_id === task.id);
            const parameter = parameters.find(p => p.id === task.parameter_id);
            const unit = units.find(u => u.id === result?.unit_id);
            const method = methods.find(m => m.id === task.method_id);

            let displayResult = "-";
            if (result) {
                if (result.is_nd) {
                    displayResult = result.lod_value ? `< ${result.lod_value}` : "ND";
                } else {
                    displayResult = result.result_text || (result.result_value !== null ? String(result.result_value) : "-");
                }
            }

            return {
                id: task.id,
                parameterName: parameter?.name || "-",
                unitSymbol: unit?.symbol || "-",
                result: displayResult,
                methodCode: method?.code || "-",
                complianceStat: result?.compliance_status || "NOT_EVALUATED"
            };
        });
    }, [samples, allTasks, allResults, parameters, units, methods]);

    if (isLoading) {
        return <div className="mx-auto w-[210mm] bg-white shadow-2xl min-h-[297mm] p-12 animate-pulse"><div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div></div>;
    }

    if (!wo) {
        return <div className="p-8 text-center text-red-500">Work Order not found</div>;
    }

    return (
        <div className="mx-auto w-[210mm] bg-white shadow-2xl min-h-[297mm] p-12 text-black print:shadow-none print:w-full">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">LABFLOW</h1>
                    <p className="text-sm font-medium text-slate-500 spacing-1">ANALYTICAL SERVICES</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                    <p>Jl. Teknologi No. 10, Jakarta</p>
                    <p>Phone: +62 21 555-0199</p>
                    <p>Email: lab@labflow.id</p>
                </div>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-xl font-bold uppercase decoration-slate-400 underline underline-offset-4">Certificate of Analysis</h2>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-12 mb-8 text-sm">
                <div>
                    <h3 className="font-bold text-slate-900 border-b border-slate-200 mb-2">Customer Information</h3>
                    <div className="grid grid-cols-[80px_1fr] gap-y-1">
                        <span className="text-slate-500">Name:</span>
                        <span className="font-medium">{wo.customer_name_snapshot}</span>
                        <span className="text-slate-500">Address:</span>
                        <span>-</span>
                        <span className="text-slate-500">Attn:</span>
                        <span>Manager HSE</span>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 border-b border-slate-200 mb-2">Sample Information</h3>
                    <div className="grid grid-cols-[80px_1fr] gap-y-1">
                        <span className="text-slate-500">Order No:</span>
                        <span className="font-mono">{wo.work_order_number}</span>
                        <span className="text-slate-500">Received:</span>
                        <span>{new Date(wo.received_date).toLocaleDateString()}</span>
                        <span className="text-slate-500">Matrix:</span>
                        <span>{matrixDisplay}</span>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="mb-12">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-900 text-left">
                            <th className="py-2 w-[40%]">Parameter</th>
                            <th className="py-2">Unit</th>
                            <th className="py-2">Result</th>
                            <th className="py-2 text-right">Method</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {resultsData.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500 italic">No results available.</td>
                            </tr>
                        ) : (
                            resultsData.map(row => (
                                <tr key={row.id}>
                                    <td className="py-2 font-medium">{row.parameterName}</td>
                                    <td className="py-2 text-slate-500">{row.unitSymbol}</td>
                                    <td className="py-2 font-bold">
                                        <div className="flex items-center gap-2">
                                            {row.result}
                                            {row.complianceStat === "FAIL" && (
                                                <span className="text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold">FAIL</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-2 text-right text-xs text-slate-500">{row.methodCode}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-12">
                <div className="flex justify-between items-end">
                    <div className="text-xs text-slate-500 max-w-sm">
                        <p className="mb-1 fw-bold">Note:</p>
                        <p>1. Results relate only to the items tested.</p>
                        <p>2. Report shall not be reproduced except in full without written approval of the lab.</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium mb-16">Authorized Signatory,</p>
                        <p className="text-sm font-bold border-t border-slate-300 pt-2 w-48 inline-block">Lab Manager</p>
                    </div>
                </div>
                <div className="mt-8 text-center text-[10px] text-slate-400">
                    <p>Page 1 of 1 • Generated via LabFlow LIMS • {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
