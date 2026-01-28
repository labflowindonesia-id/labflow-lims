import { PremiumCard } from "@/components/ui/PremiumCard";
import { MOCK_WORK_ORDERS } from "@/data/mock-db";

interface CoAPreviewProps {
    workOrderId: string;
}

export function CoAPreview({ workOrderId }: CoAPreviewProps) {
    const wo = MOCK_WORK_ORDERS.find(w => w.id === workOrderId) || MOCK_WORK_ORDERS[0];

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
                        <span className="font-mono">{wo.work_order_no}</span>
                        <span className="text-slate-500">Received:</span>
                        <span>{wo.received_date.toLocaleDateString()}</span>
                        <span className="text-slate-500">Matrix:</span>
                        <span>Wastewater</span>
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
                        {/* Mock Results */}
                        <tr>
                            <td className="py-2 font-medium">Chemical Oxygen Demand (COD)</td>
                            <td className="py-2 text-slate-500">mg/L</td>
                            <td className="py-2 font-bold">45.0</td>
                            <td className="py-2 text-right text-xs text-slate-500">SNI 6989.2:2009</td>
                        </tr>
                        <tr>
                            <td className="py-2 font-medium">pH</td>
                            <td className="py-2 text-slate-500">-</td>
                            <td className="py-2 font-bold">7.2</td>
                            <td className="py-2 text-right text-xs text-slate-500">SNI 6989.11:2004</td>
                        </tr>
                        <tr>
                            <td className="py-2 font-medium">Total Suspended Solids (TSS)</td>
                            <td className="py-2 text-slate-500">mg/L</td>
                            <td className="py-2 font-bold">12.5</td>
                            <td className="py-2 text-right text-xs text-slate-500">SNI 6989.3:2019</td>
                        </tr>
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
