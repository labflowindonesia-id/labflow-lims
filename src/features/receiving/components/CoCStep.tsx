"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { DenseTable } from "@/components/ui/DenseTable";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MOCK_USERS } from "@/data/mock-db";

interface CoCStepProps {
    onBack: () => void;
    onNext: () => void;
}

interface CustodyEntry {
    id: string;
    handedBy: string;
    receivedBy: string;
    timestamp: Date;
    location: string;
    notes: string;
}

export function CoCStep({ onBack, onNext }: CoCStepProps) {
    const [fileUploaded, setFileUploaded] = useState(false);
    const [fileName, setFileName] = useState("");
    const [containerCount, setContainerCount] = useState("1");
    const [preservation, setPreservation] = useState("COLD");

    // Chain of Custody Log
    const [custodyLog, setCustodyLog] = useState<CustodyEntry[]>([
        {
            id: "coc-001",
            handedBy: "Customer Representative",
            receivedBy: MOCK_USERS[2]?.full_name || "Sample Receiving Staff",
            timestamp: new Date(),
            location: "Sample Reception Desk",
            notes: "Initial sample handover"
        }
    ]);

    // New entry form
    const [showAddEntry, setShowAddEntry] = useState(false);
    const [newEntry, setNewEntry] = useState({
        handedBy: "",
        receivedBy: "",
        location: "",
        notes: ""
    });

    const handleFileUpload = () => {
        setFileUploaded(true);
        setFileName("chain_of_custody_scan.pdf");
    };

    const handleAddEntry = () => {
        if (!newEntry.handedBy || !newEntry.receivedBy) return;

        setCustodyLog([...custodyLog, {
            id: crypto.randomUUID(),
            handedBy: newEntry.handedBy,
            receivedBy: newEntry.receivedBy,
            timestamp: new Date(),
            location: newEntry.location,
            notes: newEntry.notes
        }]);

        setNewEntry({ handedBy: "", receivedBy: "", location: "", notes: "" });
        setShowAddEntry(false);
    };

    const handleRemoveEntry = (id: string) => {
        setCustodyLog(custodyLog.filter(e => e.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* CoC Document Upload */}
            <PremiumCard
                title="Step 3: Chain of Custody"
                subtitle="Document verification and custody transfer log"
                className="animate-in fade-in slide-in-from-right-4 duration-500"
            >
                {/* File Upload */}
                <div
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                        fileUploaded
                            ? "border-success/30 bg-success/5"
                            : "border-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                    onClick={handleFileUpload}
                >
                    {fileUploaded ? (
                        <div className="flex flex-col items-center">
                            <span className="material-symbols-outlined text-4xl text-success mb-2">check_circle</span>
                            <p className="font-medium text-success">CoC Document Uploaded</p>
                            <p className="text-xs text-text-secondary mt-1">{fileName} (1.2MB)</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFileUploaded(false);
                                    setFileName("");
                                }}
                                className="mt-2 text-xs text-text-secondary hover:text-danger"
                            >
                                Remove & Re-upload
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">cloud_upload</span>
                            <p className="font-medium text-text-main dark:text-white">Click to upload Chain of Custody (CoC)</p>
                            <p className="text-xs text-text-secondary mt-1">Supports PDF, JPG, PNG</p>
                        </div>
                    )}
                </div>

                {/* Sample Info */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Number of Containers</Label>
                        <Input
                            type="number"
                            min={1}
                            value={containerCount}
                            onChange={(e) => setContainerCount(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Preservation Method</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={preservation}
                            onChange={(e) => setPreservation(e.target.value)}
                        >
                            <option value="COLD">❄️ Ice Pack (Cold)</option>
                            <option value="ACID">⚗️ Acidified</option>
                            <option value="AMBIENT">🌡️ None (Ambient)</option>
                            <option value="FROZEN">🧊 Frozen</option>
                        </select>
                    </div>
                </div>
            </PremiumCard>

            {/* Chain of Custody Log */}
            <PremiumCard
                title="Custody Transfer Log"
                subtitle="Record all custody transfers for this sample"
                action={
                    <button
                        onClick={() => setShowAddEntry(!showAddEntry)}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Transfer
                    </button>
                }
            >
                {/* Add Entry Form */}
                {showAddEntry && (
                    <div className="mb-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 space-y-4">
                        <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                            New Custody Transfer
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Handed By</Label>
                                <Input
                                    placeholder="Name of person handing over"
                                    value={newEntry.handedBy}
                                    onChange={(e) => setNewEntry({ ...newEntry, handedBy: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Received By</Label>
                                <select
                                    className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                                    value={newEntry.receivedBy}
                                    onChange={(e) => setNewEntry({ ...newEntry, receivedBy: e.target.value })}
                                >
                                    <option value="">Select Staff...</option>
                                    {MOCK_USERS.map(u => (
                                        <option key={u.id} value={u.full_name}>{u.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Location</Label>
                                <Input
                                    placeholder="Transfer location"
                                    value={newEntry.location}
                                    onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Notes</Label>
                                <Input
                                    placeholder="Optional notes"
                                    value={newEntry.notes}
                                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowAddEntry(false)}
                                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-main"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEntry}
                                disabled={!newEntry.handedBy || !newEntry.receivedBy}
                                className="px-3 py-1.5 text-xs font-medium rounded bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                            >
                                Add Entry
                            </button>
                        </div>
                    </div>
                )}

                {/* Custody Log Table */}
                <DenseTable
                    data={custodyLog}
                    keyExtractor={(e) => e.id}
                    columns={[
                        {
                            header: "Timestamp",
                            accessorKey: "timestamp",
                            cell: (e) => (
                                <span className="text-xs font-mono">
                                    {e.timestamp.toLocaleDateString()} {e.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )
                        },
                        {
                            header: "Handed By",
                            accessorKey: "handedBy",
                            cell: (e) => <span className="font-medium">{e.handedBy}</span>
                        },
                        {
                            header: "→",
                            accessorKey: "id",
                            className: "text-center text-text-secondary",
                            cell: () => <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        },
                        {
                            header: "Received By",
                            accessorKey: "receivedBy",
                            cell: (e) => <span className="font-medium text-primary">{e.receivedBy}</span>
                        },
                        {
                            header: "Location",
                            accessorKey: "location",
                            className: "hidden md:table-cell",
                            cell: (e) => <span className="text-xs text-text-secondary">{e.location || "-"}</span>
                        },
                        {
                            header: "Notes",
                            accessorKey: "notes",
                            className: "hidden lg:table-cell",
                            cell: (e) => <span className="text-xs text-text-secondary">{e.notes || "-"}</span>
                        },
                        {
                            header: "",
                            accessorKey: "id",
                            cell: (e) => custodyLog.length > 1 && (
                                <button
                                    onClick={() => handleRemoveEntry(e.id)}
                                    className="text-danger/50 hover:text-danger p-1"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )
                        }
                    ]}
                    className="border-0"
                />

                {custodyLog.length === 0 && (
                    <div className="text-center py-8 text-text-secondary text-sm">
                        No custody transfers recorded yet.
                    </div>
                )}
            </PremiumCard>

            {/* Navigation */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={onBack}
                    className="rounded-lg border border-border-light bg-transparent px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-50 dark:border-border-dark"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!fileUploaded}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continue to Sample Registration →
                </button>
            </div>
        </div>
    );
}
