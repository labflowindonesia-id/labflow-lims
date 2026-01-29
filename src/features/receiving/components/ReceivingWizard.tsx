"use client";

import { useState } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { QuotationFetcher } from "./QuotationFetcher";
import { SampleAccessioning } from "./SampleAccessioning";
import { SamplingInfoStep } from "./SamplingInfoStep";
import { CoCStep } from "./CoCStep";
import { PremiumCard } from "@/components/ui/PremiumCard";
import Link from "next/link";

export default function ReceivingWizard() {
    const [step, setStep] = useState(1);
    const [linkedData, setLinkedData] = useState<any>(null);
    const [samplingData, setSamplingData] = useState<any>(null);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);

    // Generate Work Order Number
    const workOrderNo = "WO-2026-003";
    const currentDate = new Date();

    const handleQuotationFound = (data: any) => {
        setLinkedData(data);
        setStep(2);
    };

    const handleSamplingInfo = (data: any) => {
        setSamplingData(data);
        setStep(3);
    };

    const handleCoC = () => {
        setStep(4);
    };

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Sample Receiving"
                description="Accessioning Wizard: Link Quote -> Metadata -> CoC -> Register"
            />

            {/* PROGRESS BAR */}
            <div className="flex justify-between max-w-2xl mx-auto mb-8 px-4">
                {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="flex flex-col items-center gap-2 relative">
                        {s < 5 && (
                            <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${step > s ? "bg-success" : "bg-slate-200"}`}></div>
                        )}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === s ? "bg-primary text-white shadow-lg shadow-primary/30" :
                            step > s ? "bg-success text-white" : "bg-slate-200 text-slate-500 dark:bg-white/10"
                            }`}>
                            {step > s ? "✓" : s}
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-text-secondary hidden md:block">
                            {s === 1 ? "Link Quote" :
                                s === 2 ? "Sampling" :
                                    s === 3 ? "CoC" :
                                        s === 4 ? "Samples" : "Finish"}
                        </span>
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto">
                {step === 1 && (
                    <QuotationFetcher onQuotationFound={handleQuotationFound} />
                )}

                {step === 2 && (
                    <SamplingInfoStep
                        onBack={() => setStep(1)}
                        onNext={handleSamplingInfo}
                    />
                )}

                {step === 3 && (
                    <CoCStep
                        onBack={() => setStep(2)}
                        onNext={handleCoC}
                    />
                )}

                {step === 4 && (
                    <SampleAccessioning
                        defaultMatrixId={linkedData?.matrix_id}
                        onBack={() => setStep(3)}
                        onNext={() => setStep(5)}
                    />
                )}

                {step === 5 && (
                    <PremiumCard title="Accessioning Complete" className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success mb-4">
                            <span className="material-symbols-outlined text-4xl">check_circle</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-text-main dark:text-white">Sample Receiving Successful!</h2>
                        <p className="text-text-secondary mb-8">Work Order <span className="font-mono text-text-main dark:text-white font-bold">{workOrderNo}</span> created.</p>

                        <div className="flex flex-wrap justify-center gap-3">
                            <Link href={`/receiving/${workOrderNo.toLowerCase().replace(/-/g, '-')}`}>
                                <button className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    View Work Order
                                </button>
                            </Link>
                            <button
                                onClick={() => setShowReceiptPreview(true)}
                                className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                Sample Receipt PDF
                            </button>
                            <button className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">print</span>
                                Print Labels
                            </button>
                        </div>

                        <button
                            onClick={() => { setStep(1); setLinkedData(null); setSamplingData(null); }}
                            className="mt-12 text-sm text-text-secondary hover:underline flex items-center gap-1 mx-auto"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Start New Accessioning
                        </button>
                    </PremiumCard>
                )}
            </div>

            {/* Sample Receipt PDF Preview Modal */}
            {showReceiptPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                            <h3 className="text-lg font-bold text-text-main dark:text-white">Sample Receipt</h3>
                            <button
                                onClick={() => setShowReceiptPreview(false)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* PDF Content */}
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-black/20">
                            <div className="bg-white dark:bg-surface-dark p-8 rounded-lg shadow-lg max-w-[600px] mx-auto">
                                {/* Receipt Header */}
                                <div className="text-center mb-6 pb-4 border-b-2 border-primary">
                                    <h1 className="text-xl font-bold text-primary">LabFlow LIMS</h1>
                                    <p className="text-xs text-text-secondary mt-1">Laboratory Information Management System</p>
                                </div>

                                <h2 className="text-lg font-bold text-center mb-6 text-text-main dark:text-white">SAMPLE RECEIPT</h2>

                                {/* Receipt Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                                    <div>
                                        <p className="text-text-secondary">Work Order No:</p>
                                        <p className="font-bold text-text-main dark:text-white">{workOrderNo}</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Receipt Date:</p>
                                        <p className="font-medium text-text-main dark:text-white">{currentDate.toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Customer:</p>
                                        <p className="font-medium text-text-main dark:text-white">{linkedData?.customer_name || "PT. Sample Customer"}</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Quotation Ref:</p>
                                        <p className="font-medium text-text-main dark:text-white">{linkedData?.quotation_no || "QT-2026-001"}</p>
                                    </div>
                                </div>

                                {/* Sampling Info */}
                                {samplingData && (
                                    <div className="mb-6 p-4 bg-slate-50 dark:bg-black/20 rounded-lg">
                                        <h3 className="text-sm font-semibold mb-3 text-text-main dark:text-white">Sampling Information</h3>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-text-secondary">Location:</span>
                                                <span className="ml-2 text-text-main dark:text-white">{samplingData.location_name || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="text-text-secondary">Sampler:</span>
                                                <span className="ml-2 text-text-main dark:text-white">{samplingData.sampler_name || samplingData.sampled_by}</span>
                                            </div>
                                            <div>
                                                <span className="text-text-secondary">Date/Time:</span>
                                                <span className="ml-2 text-text-main dark:text-white">{samplingData.sampling_date} {samplingData.sampling_time}</span>
                                            </div>
                                            <div>
                                                <span className="text-text-secondary">Weather:</span>
                                                <span className="ml-2 text-text-main dark:text-white">{samplingData.weather_condition || "-"}</span>
                                            </div>
                                            {samplingData.field_ph && (
                                                <div>
                                                    <span className="text-text-secondary">Field pH:</span>
                                                    <span className="ml-2 text-text-main dark:text-white">{samplingData.field_ph}</span>
                                                </div>
                                            )}
                                            {samplingData.field_temperature && (
                                                <div>
                                                    <span className="text-text-secondary">Field Temp:</span>
                                                    <span className="ml-2 text-text-main dark:text-white">{samplingData.field_temperature}°C</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Samples Table */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold mb-3 text-text-main dark:text-white">Samples Received</h3>
                                    <table className="w-full text-xs border border-border-light dark:border-border-dark">
                                        <thead className="bg-slate-100 dark:bg-black/20">
                                            <tr>
                                                <th className="px-2 py-1.5 text-left border-b">Sample ID</th>
                                                <th className="px-2 py-1.5 text-left border-b">Description</th>
                                                <th className="px-2 py-1.5 text-center border-b">Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="px-2 py-1.5 border-b font-mono">S-2026-001-01</td>
                                                <td className="px-2 py-1.5 border-b">Water Sample - Outlet</td>
                                                <td className="px-2 py-1.5 border-b text-center">500 mL</td>
                                            </tr>
                                            <tr>
                                                <td className="px-2 py-1.5 border-b font-mono">S-2026-001-02</td>
                                                <td className="px-2 py-1.5 border-b">Water Sample - Inlet</td>
                                                <td className="px-2 py-1.5 border-b text-center">500 mL</td>
                                            </tr>
                                            <tr>
                                                <td className="px-2 py-1.5 font-mono">S-2026-001-03</td>
                                                <td className="px-2 py-1.5">Soil Sample</td>
                                                <td className="px-2 py-1.5 text-center">1 kg</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Signature */}
                                <div className="flex justify-between pt-4 border-t border-border-light dark:border-border-dark">
                                    <div className="text-center">
                                        <div className="w-32 border-b border-text-secondary mb-1 h-8"></div>
                                        <p className="text-xs text-text-secondary">Customer Signature</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-32 border-b border-text-secondary mb-1 h-8"></div>
                                        <p className="text-xs text-text-secondary">Lab Staff Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-4 border-t border-border-light dark:border-border-dark">
                            <button
                                onClick={() => setShowReceiptPreview(false)}
                                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-main"
                            >
                                Close
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Download PDF
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-success/90 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">print</span>
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

