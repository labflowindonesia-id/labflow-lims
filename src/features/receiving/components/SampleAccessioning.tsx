"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { MOCK_MATRICES, MOCK_UNITS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

interface SampleAccessioningProps {
    defaultMatrixId?: string;
    onNext: () => void;
    onBack: () => void;
}

// Mock storage locations
const STORAGE_LOCATIONS = [
    { id: "CHILLER_A1", name: "Chiller A - Shelf 1", type: "CHILLER" },
    { id: "CHILLER_A2", name: "Chiller A - Shelf 2", type: "CHILLER" },
    { id: "FREEZER_B1", name: "Freezer B - Shelf 1", type: "FREEZER" },
    { id: "ROOM_C1", name: "Room Temp - Rack C1", type: "ROOM" },
    { id: "ROOM_C2", name: "Room Temp - Rack C2", type: "ROOM" },
];

export function SampleAccessioning({ defaultMatrixId, onNext, onBack }: SampleAccessioningProps) {
    // Auto-generated Sample ID
    const autoSampleId = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `S-${year}${month}${day}-${random}`;
    }, []);

    // FORM STATE
    const [sampleId, setSampleId] = useState(autoSampleId);
    const [sampleName, setSampleName] = useState("");
    const [matrixId, setMatrixId] = useState(defaultMatrixId || "");
    const [quantity, setQuantity] = useState("1");
    const [unitId, setUnitId] = useState("");
    const [condition, setCondition] = useState("INTACT");
    const [storageType, setStorageType] = useState("CHILLER");
    const [storageLocation, setStorageLocation] = useState("");
    const [temp, setTemp] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [printBarcode, setPrintBarcode] = useState(true);

    // Filter storage locations by type
    const filteredLocations = useMemo(() =>
        STORAGE_LOCATIONS.filter(loc => loc.type === storageType),
        [storageType]
    );

    const handleRegenerateId = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setSampleId(`S-${year}${month}${day}-${random}`);
    };

    const handlePrintBarcode = () => {
        alert(`Printing barcode for Sample ID: ${sampleId}`);
        // In real app, this would trigger barcode printer
    };

    return (
        <PremiumCard title="Step 4: Sample Accessioning" subtitle="Register physical sample condition & storage">
            <div className="grid gap-6 md:grid-cols-2">

                {/* 1. Sample Identity */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-primary border-b border-border-light pb-2">Sample Identification</h4>

                    {/* Auto-generated Sample ID */}
                    <div className="space-y-2">
                        <Label>Sample ID (Auto-generated)</Label>
                        <div className="flex gap-2">
                            <Input
                                value={sampleId}
                                onChange={(e) => setSampleId(e.target.value)}
                                className="font-mono flex-1"
                            />
                            <button
                                type="button"
                                onClick={handleRegenerateId}
                                className="rounded-lg border border-border-light bg-white px-3 py-2 text-text-secondary hover:bg-background-light dark:border-border-dark dark:bg-surface-dark"
                                title="Regenerate ID"
                            >
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                            </button>
                            <button
                                type="button"
                                onClick={handlePrintBarcode}
                                className="rounded-lg bg-primary px-3 py-2 text-white hover:bg-primary-hover"
                                title="Print Barcode"
                            >
                                <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                            </button>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-text-secondary">
                            <input
                                type="checkbox"
                                checked={printBarcode}
                                onChange={(e) => setPrintBarcode(e.target.checked)}
                                className="rounded border-border-light"
                            />
                            Print barcode label after registration
                        </label>
                    </div>

                    <div className="space-y-2">
                        <Label>Sample Name / Label</Label>
                        <Input
                            placeholder="e.g. Outlet IPAL - Timur"
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
                                {MOCK_UNITS.map(u => (
                                    <option key={u.id} value={u.id}>{u.symbol} ({u.name})</option>
                                ))}
                            </select>
                        </div>
                    </div>

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
                </div>

            </div>

            {/* Sample ID Preview Card */}
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-text-secondary">Sample will be registered as:</p>
                        <p className="font-mono text-lg font-bold text-primary">{sampleId}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-text-secondary">Barcode</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs text-text-main">{sampleId}</span>
                            <span className="material-symbols-outlined text-[20px] text-primary">qr_code_2</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-between border-t border-border-light pt-6">
                <button onClick={onBack} className="text-text-secondary hover:text-text-main font-medium text-sm">
                    ← Back to CoC
                </button>
                <button
                    onClick={onNext}
                    disabled={!sampleName || !matrixId}
                    className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Register Sample & Continue
                </button>
            </div>
        </PremiumCard>
    );
}
