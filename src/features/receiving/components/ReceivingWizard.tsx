"use client";

import { useState } from "react";
import { ActionToolbar } from "@/components/ui/Toolbar";
import { QuotationFetcher } from "./QuotationFetcher";
import { SampleAccessioning } from "./SampleAccessioning";
import { PremiumCard } from "@/components/ui/PremiumCard";

export default function ReceivingWizard() {
    const [step, setStep] = useState(1);
    const [linkedData, setLinkedData] = useState<any>(null); // State to hold fetched Quotation data

    const handleQuotationFound = (data: any) => {
        setLinkedData(data);
        setStep(2); // Auto-advance
    };

    return (
        <div className="space-y-6 pb-20">
            <ActionToolbar
                title="Sample Receiving"
                description="Accessioning Wizard: Link Quote -> Register Sample -> Labeling"
            />

            {/* PROGRESS BAR */}
            <div className="flex justify-between max-w-lg mx-auto mb-8 px-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === s ? "bg-primary text-white shadow-lg shadow-primary/30" :
                                step > s ? "bg-success text-white" : "bg-slate-200 text-slate-500 dark:bg-white/10"
                            }`}>
                            {step > s ? "✓" : s}
                        </div>
                        <span className="text-xs text-text-secondary hidden md:block">
                            {s === 1 ? "Link Quote" : s === 2 ? "Sample Details" : "Review"}
                        </span>
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto">
                {step === 1 && (
                    <QuotationFetcher onQuotationFound={handleQuotationFound} />
                )}

                {step === 2 && (
                    <SampleAccessioning
                        defaultMatrixId={linkedData?.matrix_id}
                        onBack={() => setStep(1)}
                        onNext={() => setStep(3)}
                    />
                )}

                {step === 3 && (
                    <PremiumCard title="Step 3: Ready to Print" className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success mb-4">
                            <span className="material-symbols-outlined text-4xl">print</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Accessioning Complete!</h2>
                        <p className="text-text-secondary mb-8">Sample ID <span className="font-mono text-text-main font-bold">R-202601-0004</span> generated.</p>

                        <div className="flex justify-center gap-4">
                            <button className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-lg text-sm font-medium hover:bg-slate-200">
                                Print Receipt (PDF)
                            </button>
                            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shadow-lg shadow-primary/20">
                                Print Barcode Label
                            </button>
                        </div>

                        <button
                            onClick={() => { setStep(1); setLinkedData(null); }}
                            className="mt-12 text-sm text-text-secondary hover:underline"
                        >
                            Start New Batch
                        </button>
                    </PremiumCard>
                )}
            </div>
        </div>
    );
}
