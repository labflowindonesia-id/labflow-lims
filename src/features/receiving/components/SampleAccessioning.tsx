"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { useSampleMatrices, useUnits } from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";

export interface SampleAccessioningData {
    sample_name: string;
    customer_sample_id: string;
    matrix_id: string;
    quantity: number;
    unit_id: string;
    packaging_type: string;
    seal_intact: boolean;
    condition: string;
    condition_notes: string;
    storage_type: string;
    storage_location: string;
    storage_temperature: number | null;
    volume: number | null;
    volume_unit: string;
    due_date: string;
    acceptance_decision: "ACCEPT" | "REJECT";
    rejection_reason: string;
}

interface SampleAccessioningProps {
    defaultMatrixId?: string;
    onNext: (data: SampleAccessioningData) => void;
    onBack: () => void;
}

const STORAGE_LOCATIONS = [
    { id: "CHILLER_A1", name: "Chiller A - Shelf 1", type: "CHILLER" },
    { id: "CHILLER_A2", name: "Chiller A - Shelf 2", type: "CHILLER" },
    { id: "FREEZER_B1", name: "Freezer B - Shelf 1", type: "FREEZER" },
    { id: "ROOM_C1", name: "Room Temp - Rack C1", type: "ROOM" },
    { id: "ROOM_C2", name: "Room Temp - Rack C2", type: "ROOM" },
];

export function SampleAccessioning({ defaultMatrixId, onNext, onBack }: SampleAccessioningProps) {
    const { data: matrices = [] } = useSampleMatrices();
    const { data: units = [] } = useUnits();

    // Sample ID preview (actual generated at registration by service)
    const sampleIdPreview = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `S-${year}${month}XXXX`;
    }, []);

    // FORM STATE
    const [sampleName, setSampleName] = useState("");
    const [customerSampleId, setCustomerSampleId] = useState("");
    const [matrixId, setMatrixId] = useState(defaultMatrixId || "");
    const [quantity, setQuantity] = useState("1");
    const [unitId, setUnitId] = useState("");
    const [packagingType, setPackagingType] = useState("BOTTLE");
    const [sealIntact, setSealIntact] = useState(true);
    const [condition, setCondition] = useState("INTACT");
    const [conditionNotes, setConditionNotes] = useState("");
    const [storageType, setStorageType] = useState("CHILLER");
    const [storageLocation, setStorageLocation] = useState("");
    const [temp, setTemp] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [acceptanceDecision, setAcceptanceDecision] = useState<"ACCEPT" | "REJECT">("ACCEPT");
    const [rejectionReason, setRejectionReason] = useState("");

    const filteredLocations = useMemo(() =>
        STORAGE_LOCATIONS.filter(loc => loc.type === storageType),
        [storageType]
    );

    const handleSubmit = () => {
        const data: SampleAccessioningData = {
            sample_name: sampleName,
            customer_sample_id: customerSampleId,
            matrix_id: matrixId,
            quantity: parseInt(quantity) || 1,
            unit_id: unitId,
            packaging_type: packagingType,
            seal_intact: sealIntact,
            condition,
            condition_notes: conditionNotes,
            storage_type: storageType,
            storage_location: storageLocation,
            storage_temperature: temp ? parseFloat(temp) : null,
            volume: quantity ? parseFloat(quantity) : null,
            volume_unit: unitId,
            due_date: dueDate,
            acceptance_decision: acceptanceDecision,
            rejection_reason: rejectionReason,
        };
        onNext(data);
    };

    const canSubmit = acceptanceDecision === "ACCEPT"
        ? !!(sampleName && matrixId)
        : !!(rejectionReason.trim());

    return (
        <PremiumCard title="Step 4: Sample Accessioning" subtitle="Register physical sample condition & storage">
            <div className="grid gap-6 md:grid-cols-2">

                {/* 1. Sample Identity */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-primary border-b border-border-light pb-2">Sample Identification</h4>

                    {/* Sample ID Preview */}
                    <div className="space-y-2">
                        <Label>Sample ID (Auto-generated at registration)</Label>
                        <div className="flex gap-2 items-center">
                            <div className="flex-1 font-mono text-sm px-3 py-2 rounded-md bg-slate-100 dark:bg-white/5 border border-border-light text-text-secondary">
                                {sampleIdPreview}
                            </div>
                            <span className="text-xs text-text-secondary italic">Will be assigned</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Customer Sample ID (optional)</Label>
                        <Input
                            placeholder="e.g. Sample label dari customer"
                            value={customerSampleId}
                            onChange={(e) => setCustomerSampleId(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Sample Name / Label *</Label>
                        <Input
                            placeholder="e.g. Outlet IPAL - Timur"
                            value={sampleName}
                            onChange={(e) => setSampleName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Matrix Type *</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={matrixId}
                            onChange={(e) => setMatrixId(e.target.value)}
                        >
                            <option value="">Select Matrix...</option>
                            {(matrices || []).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Unit</Label>
                            <select
                                className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                                value={unitId}
                                onChange={(e) => setUnitId(e.target.value)}
                            >
                                <option value="">Select Unit...</option>
                                {(units || []).map(u => (
                                    <option key={u.id} value={u.id}>{u.symbol} ({u.name})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Packaging Type */}
                    <div className="space-y-2">
                        <Label>Packaging / Container Type</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={packagingType}
                            onChange={(e) => setPackagingType(e.target.value)}
                        >
                            <option value="BOTTLE">Plastic Bottle</option>
                            <option value="GLASS">Glass Bottle</option>
                            <option value="BAG">Sample Bag</option>
                            <option value="CONTAINER">Sealed Container</option>
                            <option value="VIAL">Vial</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    {/* Seal Status */}
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-border-light hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={sealIntact}
                            onChange={(e) => setSealIntact(e.target.checked)}
                            className="h-5 w-5 rounded border-border-light text-success"
                        />
                        <div>
                            <span className="font-medium text-sm text-text-main dark:text-white">Seal Intact</span>
                            <p className="text-xs text-text-secondary">Sample container seal/cap is undamaged</p>
                        </div>
                    </label>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <Label>Requested Due Date</Label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-text-secondary">Leave blank to use default TAT from quotation</p>
                    </div>
                </div>

                {/* 2. Physical Condition & Storage */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-primary border-b border-border-light pb-2">Physical Condition & Storage</h4>

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
                            <Label>Received Temp (°C)</Label>
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

                    {condition !== "INTACT" && (
                        <div className="space-y-2">
                            <Label>Condition Notes</Label>
                            <textarea
                                className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                                rows={2}
                                placeholder="Describe damage, leak, or other condition..."
                                value={conditionNotes}
                                onChange={(e) => setConditionNotes(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Storage Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {['CHILLER', 'FREEZER', 'ROOM'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        setStorageType(type);
                                        setStorageLocation("");
                                    }}
                                    className={cn(
                                        "text-xs py-2 px-1 rounded border transition-all",
                                        storageType === type
                                            ? "bg-primary text-white border-primary"
                                            : "bg-surface-light border-border-light hover:bg-slate-100 dark:bg-surface-dark dark:border-white/10"
                                    )}
                                >
                                    {type === "CHILLER" && "❄️ "}
                                    {type === "FREEZER" && "🧊 "}
                                    {type === "ROOM" && "🌡️ "}
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Specific Location</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={storageLocation}
                            onChange={(e) => setStorageLocation(e.target.value)}
                        >
                            <option value="">Select Location...</option>
                            {filteredLocations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Photo Evidence */}
                    <div className="space-y-2">
                        <Label>Photo Evidence</Label>
                        <div className="border-2 border-dashed border-border-light rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                            <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">add_a_photo</span>
                            <p className="text-sm text-text-secondary">Click to capture/upload sample photo evidence</p>
                        </div>
                    </div>

                    {/* Acceptance Decision — 2 options only */}
                    <div className="space-y-2">
                        <Label>Acceptance Decision *</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['ACCEPT', 'REJECT'] as const).map(decision => (
                                <button
                                    key={decision}
                                    type="button"
                                    onClick={() => setAcceptanceDecision(decision)}
                                    className={cn(
                                        "text-sm py-3 px-4 rounded-lg border-2 transition-all font-semibold flex items-center justify-center gap-2",
                                        acceptanceDecision === decision
                                            ? (decision === "ACCEPT"
                                                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                                                : "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20")
                                            : "bg-surface-light border-border-light hover:bg-slate-100 dark:bg-surface-dark dark:border-white/10 text-text-secondary"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {decision === "ACCEPT" ? "check_circle" : "cancel"}
                                    </span>
                                    {decision === "ACCEPT" ? "Accept" : "Reject"}
                                </button>
                            ))}
                        </div>
                        {acceptanceDecision === "ACCEPT" && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                Sample will be registered in the system with a new Sample ID & Work Order
                            </p>
                        )}
                        {acceptanceDecision === "REJECT" && (
                            <div className="mt-2 space-y-2">
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                    Sample will NOT be registered. Only a rejection log will be created.
                                </p>
                                <textarea
                                    className="w-full text-sm rounded-md border border-red-300 dark:border-red-700 p-2 bg-red-50 dark:bg-red-900/10"
                                    rows={3}
                                    placeholder="Alasan penolakan (wajib diisi)..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Summary Preview Card */}
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-text-secondary">
                            {acceptanceDecision === "ACCEPT" ? "Sample will be registered as:" : "Sample will be REJECTED"}
                        </p>
                        {acceptanceDecision === "ACCEPT" ? (
                            <p className="font-mono text-lg font-bold text-primary">{sampleIdPreview}</p>
                        ) : (
                            <p className="font-mono text-lg font-bold text-red-500">REJECTED — Log Only</p>
                        )}
                    </div>
                    {acceptanceDecision === "ACCEPT" && (
                        <div className="text-right">
                            <p className="text-xs text-text-secondary">Format</p>
                            <p className="font-mono text-xs text-text-main">S-YYYYMMXXXX</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-between border-t border-border-light pt-6">
                <button onClick={onBack} className="text-text-secondary hover:text-text-main font-medium text-sm">
                    ← Back to CoC
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={cn(
                        "rounded-lg px-6 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium",
                        acceptanceDecision === "ACCEPT"
                            ? "bg-primary hover:bg-primary-hover"
                            : "bg-red-500 hover:bg-red-600"
                    )}
                >
                    {acceptanceDecision === "ACCEPT" ? "Register Sample & Continue" : "Log Rejection & Continue"}
                </button>
            </div>
        </PremiumCard>
    );
}
