"use client";

import { useState } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { QuotationFetcher } from "./QuotationFetcher";
import { SampleAccessioning, type SampleAccessioningData } from "./SampleAccessioning";
import { SamplingInfoStep } from "./SamplingInfoStep";
import { CoCStep } from "./CoCStep";
import { PremiumCard } from "@/components/ui/PremiumCard";
import Link from "next/link";
import {
    registerSamples,
    rejectSamples,
    type QuotationSearchResult,
    type RegistrationResult,
} from "../services/receivingService";

interface SamplingInfo {
    location_name?: string;
    sampler_name?: string;
    sampled_by?: string;
    sampling_date?: string;
    sampling_time?: string;
    weather_condition?: string;
    field_ph?: string;
    field_temperature?: string;
}

export default function ReceivingWizard() {
    const [step, setStep] = useState(1);
    const [linkedData, setLinkedData] = useState<QuotationSearchResult | null>(null);
    const [samplingData, setSamplingData] = useState<SamplingInfo | null>(null);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
    const [isRejected, setIsRejected] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const currentDate = new Date();

    const handleQuotationFound = (data: QuotationSearchResult) => {
        setLinkedData(data);
        setStep(2);
    };

    const handleSamplingInfo = (data: SamplingInfo) => {
        setSamplingData(data);
        setStep(3);
    };

    const handleCoC = () => {
        setStep(4);
    };

    const handleSampleAccessioning = async (sampleData: SampleAccessioningData) => {
        if (!linkedData) return;
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            if (sampleData.acceptance_decision === "ACCEPT") {
                const result = await registerSamples({
                    quotation_id: linkedData.id,
                    customer_id: linkedData.customer_id,
                    customer_name: linkedData.customer_name,
                    customer_address: linkedData.customer_address,
                    matrix_id: linkedData.matrix_id || sampleData.matrix_id,
                    samples: [{
                        sample_name: sampleData.sample_name,
                        customer_sample_id: sampleData.customer_sample_id || undefined,
                        condition: sampleData.condition,
                        condition_notes: sampleData.condition_notes || undefined,
                        storage_temperature: sampleData.storage_temperature ?? undefined,
                        original_volume: sampleData.volume ?? undefined,
                        volume_unit: sampleData.volume_unit || undefined,
                        sampling_date: sampleData.due_date || undefined,
                    }],
                    requested_tests: linkedData.lines.map(l => ({
                        parameter_id: l.parameter_id,
                        method_id: l.method_id,
                    })),
                    total_samples: 1,
                });

                setRegistrationResult(result);
                setIsRejected(false);
            } else {
                await rejectSamples({
                    quotation_id: linkedData.id,
                    customer_id: linkedData.customer_id,
                    customer_name: linkedData.customer_name,
                    reason: sampleData.rejection_reason,
                    samples: [{
                        sample_name: sampleData.sample_name,
                        condition: sampleData.condition,
                    }],
                });

                setRegistrationResult(null);
                setIsRejected(true);
            }

            setStep(5);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            console.error("Registration failed:", err);
            setSubmitError(`Registration failed: ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setLinkedData(null);
        setSamplingData(null);
        setRegistrationResult(null);
        setIsRejected(false);
        setSubmitError(null);
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
                    <>
                        {submitError && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-500">error</span>
                                <div>
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Registration Error</p>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{submitError}</p>
                                </div>
                            </div>
                        )}
                        {isSubmitting && (
                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-700 rounded-lg flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-blue-800 dark:text-blue-200">Registering sample...</p>
                            </div>
                        )}
                        <SampleAccessioning
                            defaultMatrixId={linkedData?.matrix_id}
                            onBack={() => setStep(3)}
                            onNext={handleSampleAccessioning}
                        />
                    </>
                )}

                {/* STEP 5: Success / Rejection */}
                {step === 5 && !isRejected && registrationResult && (
                    <PremiumCard title="Accessioning Complete" className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success mb-4">
                            <span className="material-symbols-outlined text-4xl">check_circle</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-text-main dark:text-white">Sample Receiving Successful!</h2>
                        <p className="text-text-secondary mb-2">
                            Work Order <span className="font-mono text-text-main dark:text-white font-bold">{registrationResult.work_order_number}</span> created.
                        </p>
                        <div className="inline-flex flex-wrap gap-2 justify-center mb-8">
                            {registrationResult.sample_lab_ids.map((sid) => (
                                <span key={sid} className="font-mono text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                                    {sid}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-center gap-3">
                            <Link href={`/receiving/${registrationResult.work_order_id}`}>
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
                            onClick={handleReset}
                            className="mt-12 text-sm text-text-secondary hover:underline flex items-center gap-1 mx-auto"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Start New Accessioning
                        </button>
                    </PremiumCard>
                )}

                {step === 5 && isRejected && (
                    <PremiumCard title="Sample Rejected" className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 text-red-500 mb-4">
                            <span className="material-symbols-outlined text-4xl">cancel</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-text-main dark:text-white">Sample Rejected</h2>
                        <p className="text-text-secondary mb-8">
                            The sample has been rejected. A rejection log has been recorded in audit events.<br />
                            No Work Order or Sample ID was created.
                        </p>

                        <div className="flex flex-wrap justify-center gap-3">
                            <Link href="/receiving">
                                <button className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">list</span>
                                    Back to Receiving
                                </button>
                            </Link>
                        </div>

                        <button
                            onClick={handleReset}
                            className="mt-12 text-sm text-text-secondary hover:underline flex items-center gap-1 mx-auto"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Start New Accessioning
                        </button>
                    </PremiumCard>
                )}
            </div>

            {/* Sample Receipt PDF Preview Modal */}
            {showReceiptPreview && registrationResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                            <h3 className="text-lg font-bold text-text-main dark:text-white">Sample Receipt</h3>
                            <button
                                onClick={() => setShowReceiptPreview(false)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-black/20">
                            <div className="bg-white dark:bg-surface-dark p-8 rounded-lg shadow-lg max-w-[600px] mx-auto">
                                <div className="text-center mb-6 pb-4 border-b-2 border-primary">
                                    <h1 className="text-xl font-bold text-primary">LabFlow LIMS</h1>
                                    <p className="text-xs text-text-secondary mt-1">Laboratory Information Management System</p>
                                </div>

                                <h2 className="text-lg font-bold text-center mb-6 text-text-main dark:text-white">SAMPLE RECEIPT</h2>

                                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                                    <div>
                                        <p className="text-text-secondary">Work Order No:</p>
                                        <p className="font-bold text-text-main dark:text-white">{registrationResult.work_order_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Receipt Date:</p>
                                        <p className="font-medium text-text-main dark:text-white">{currentDate.toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Customer:</p>
                                        <p className="font-medium text-text-main dark:text-white">{linkedData?.customer_name || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-text-secondary">Quotation Ref:</p>
                                        <p className="font-medium text-text-main dark:text-white">{linkedData?.quotation_number || "-"}</p>
                                    </div>
                                </div>

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
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold mb-3 text-text-main dark:text-white">Samples Received</h3>
                                    <table className="w-full text-xs border border-border-light dark:border-border-dark">
                                        <thead className="bg-slate-100 dark:bg-black/20">
                                            <tr>
                                                <th className="px-2 py-1.5 text-left border-b">Sample Lab ID</th>
                                                <th className="px-2 py-1.5 text-left border-b">Matrix</th>
                                                <th className="px-2 py-1.5 text-center border-b">Condition</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {registrationResult.sample_lab_ids.map((sid, i) => (
                                                <tr key={sid}>
                                                    <td className="px-2 py-1.5 border-b font-mono">{sid}</td>
                                                    <td className="px-2 py-1.5 border-b">{linkedData?.matrix_name || "-"}</td>
                                                    <td className="px-2 py-1.5 border-b text-center">
                                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                                            ACCEPTED
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

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
