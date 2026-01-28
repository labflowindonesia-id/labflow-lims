import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

interface CoCStepProps {
    onBack: () => void;
    onNext: () => void;
}

export function CoCStep({ onBack, onNext }: CoCStepProps) {
    const [fileUploaded, setFileUploaded] = useState(false);

    return (
        <PremiumCard
            title="Step 3: Chain of Custody"
            subtitle="Document verification"
            className="animate-in fade-in slide-in-from-right-4 duration-500"
        >
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setFileUploaded(true)}>
                {fileUploaded ? (
                    <div className="prose">
                        <span className="material-symbols-outlined text-4xl text-green-500 mb-2">check_circle</span>
                        <p className="font-medium text-green-700">CoC Document Uploaded</p>
                        <p className="text-xs text-slate-400">chain_of_custody_scan.pdf (1.2MB)</p>
                    </div>
                ) : (
                    <div className="prose">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">cloud_upload</span>
                        <p className="font-medium text-slate-500">Click to upload Chain of Custody (CoC)</p>
                        <p className="text-xs text-slate-400">Supports PDF, JPG, PNG</p>
                    </div>
                )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="coc_count">Number of Containers</Label>
                    <Input id="coc_count" type="number" defaultValue={1} min={1} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="preservation">Preservation Check</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option>Ice Pack (Cold)</option>
                        <option>Acidified</option>
                        <option>None (Ambient)</option>
                    </select>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <button
                    onClick={onBack}
                    className="rounded-lg border border-border-light bg-transparent px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-50"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!fileUploaded}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Review & Finish &rarr;
                </button>
            </div>
        </PremiumCard>
    );
}
