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
    const [linkedData, setLinkedData] = useState<any>(null); // State to hold fetched Quotation data
    const [samplingData, setSamplingData] = useState<any>(null);

    const handleQuotationFound = (data: any) => {
        setLinkedData(data);
        setStep(2); // Go to Sampling Info
    };

    const handleSamplingInfo = (data: any) => {
        setSamplingData(data);
        setStep(3); // Go to CoC
    };

    const handleCoC = () => {
        setStep(4); // Go to Accessioning (The original "Step 2")
    };

    // We treat Sample Accessioning as Step 4 now

    // Step Map:
    // 1: Link Quote
    // 2: Sampling Info (NEW)
    // 3: CoC (NEW)
    // 4: Sample Accessioning (Old Step 2)
    // 5: Finish (Old Step 3)

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
                        {/* Connector Line */}
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
                            <span className="material-symbols-outlined text-4xl">print</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Review Successful!</h2>
                        <p className="text-text-secondary mb-8">Work Order <span className="font-mono text-text-main font-bold">WO-2026-003</span> created.</p>

                        <div className="flex justify-center gap-4">
                            <Link href="/receiving/wo-2026-001">
                                <button className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-lg text-sm font-medium hover:bg-slate-200">
                                    View Work Order Details
                                </button>
                            </Link>
                            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shadow-lg shadow-primary/20">
                                Print Labels
                            </button>
                        </div>

                        <button
                            onClick={() => { setStep(1); setLinkedData(null); }}
                            className="mt-12 text-sm text-text-secondary hover:underline"
                        >
                            Start New Accessioning
                        </button>
                    </PremiumCard>
                )}
            </div>
        </div>
    );
}
