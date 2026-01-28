import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { MOCK_MATRICES } from "@/data/mock-db";

interface SampleAccessioningProps {
    defaultMatrixId?: string;
    onNext: () => void;
    onBack: () => void;
}

export function SampleAccessioning({ defaultMatrixId, onNext, onBack }: SampleAccessioningProps) {
    // FORM STATE
    const [sampleName, setSampleName] = useState("");
    const [matrixId, setMatrixId] = useState(defaultMatrixId || "");
    const [condition, setCondition] = useState("INTACT");
    const [storage, setStorage] = useState("CHILLER");
    const [temp, setTemp] = useState("");

    // Simplified for prototype: Only handling 1 sample
    return (
        <PremiumCard title="Step 2: Sample Accessioning" subtitle="Register physical sample condition & storage">
            <div className="grid gap-6 md:grid-cols-2">

                {/* 1. Identity */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-primary border-b border-border-light pb-2">Identification</h4>
                    <div className="space-y-2">
                        <Label>Sample Name / Label</Label>
                        <Input
                            placeholder="e.g. Outlet IPAL - Timut"
                            value={sampleName}
                            onChange={(e) => setSampleName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Matrix Type</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={matrixId}
                            onChange={(e) => setMatrixId(e.target.value)}
                        >
                            <option value="">Select Matrix...</option>
                            {MOCK_MATRICES.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Physical Condition */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-primary border-b border-border-light pb-2">Physical Condition</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Condition</Label>
                            <select
                                className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                            >
                                <option value="INTACT">Intact (Good)</option>
                                <option value="LEAK">Leaking</option>
                                <option value="DAMAGED">Damaged / Broken</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Temp (°C)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="4.0"
                                    className="pr-8"
                                    value={temp}
                                    onChange={(e) => setTemp(e.target.value)}
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-text-secondary">°C</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Storage Location</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {['CHILLER', 'FREEZER', 'ROOM'].map(loc => (
                                <button
                                    key={loc}
                                    onClick={() => setStorage(loc)}
                                    className={`text-xs py-2 px-1 rounded border transition-all ${storage === loc
                                            ? "bg-primary text-white border-primary"
                                            : "bg-surface-light border-border-light hover:bg-slate-100 dark:bg-surface-dark dark:border-white/10"
                                        }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Photo Evidence */}
                <div className="md:col-span-2 mt-2">
                    <div className="border-2 border-dashed border-border-light rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">add_a_photo</span>
                        <p className="text-sm text-text-secondary">Click to capture/upload sample photo evidence</p>
                    </div>
                </div>

            </div>

            <div className="mt-8 flex justify-between border-t border-border-light pt-6">
                <button onClick={onBack} className="text-text-secondary hover:text-text-main font-medium text-sm">
                    Back to Quotation
                </button>
                <button
                    onClick={onNext}
                    disabled={!sampleName || !matrixId}
                    className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
                >
                    Continue to Review
                </button>
            </div>
        </PremiumCard>
    );
}
