import { useState } from "react";
import { Label } from "@/components/ui/Label";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_MATRICES, MOCK_PARAMETERS, MOCK_RULES, MOCK_METHODS } from "@/data/mock-db";
import { QuotationLineItem } from "../types";
import { v4 as uuidv4 } from "uuid"; // We might need to install this or use a simple random string
import { cn } from "@/lib/utils";

interface LineItemManagerProps {
    items: QuotationLineItem[];
    onItemsChange: (items: QuotationLineItem[]) => void;
}

export function LineItemManager({ items, onItemsChange }: LineItemManagerProps) {
    // Staging state for the "Add New" area
    const [selectedMatrixId, setSelectedMatrixId] = useState<string>("");
    const [selectedParamId, setSelectedParamId] = useState<string>("");
    const [qty, setQty] = useState(1);

    // Derived state for filtered parameters
    // Only show parameters that have a Rule for the selected matrix!
    const availableParameters = MOCK_PARAMETERS.filter(p => {
        if (!selectedMatrixId) return false;
        // Check if a rule exists for this Matrix + Param combo
        return MOCK_RULES.some(r => r.matrix_id === selectedMatrixId && r.parameter_id === p.id);
    });

    const handleAddTest = () => {
        if (!selectedMatrixId || !selectedParamId) return;

        // 1. Fetch the Rule to auto-populate details
        const rule = MOCK_RULES.find(r => r.matrix_id === selectedMatrixId && r.parameter_id === selectedParamId);
        if (!rule) return; // Should not happen given filter above

        const newItem: QuotationLineItem = {
            id: crypto.randomUUID(),
            matrix_id: selectedMatrixId,
            parameter_id: selectedParamId,
            method_id: rule.default_method_id,
            instrument_id: rule.default_instrument_id,
            unit_price: rule.base_price,
            qty: qty,
            total_price: rule.base_price * qty,
            lead_time_days: rule.default_tat_days
        };

        onItemsChange([...items, newItem]);
        // Reset selection
        setSelectedParamId("");
    };

    const handleRemove = (id: string) => {
        onItemsChange(items.filter(i => i.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* ADD ITEM FORM */}
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    <h4 className="text-sm font-semibold text-primary">Add Test Parameter</h4>
                </div>

                <div className="grid gap-4 md:grid-cols-4 items-end">
                    <div className="space-y-1 md:col-span-1">
                        <Label className="text-xs">Sample Matrix</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={selectedMatrixId}
                            onChange={(e) => {
                                setSelectedMatrixId(e.target.value);
                                setSelectedParamId(""); // Reset param when matrix changes
                            }}
                        >
                            <option value="">Select Matrix...</option>
                            {MOCK_MATRICES.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1 md:col-span-1">
                        <Label className="text-xs">Parameter</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={selectedParamId}
                            onChange={(e) => setSelectedParamId(e.target.value)}
                            disabled={!selectedMatrixId}
                        >
                            <option value="">Select Parameter...</option>
                            {availableParameters.length === 0 && selectedMatrixId ? (
                                <option disabled>No parameters configured for this matrix yet</option>
                            ) : (
                                availableParameters.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="space-y-1 md:col-span-1">
                        <Label className="text-xs">Qty (Samples)</Label>
                        <input
                            type="number"
                            min={1}
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={qty}
                            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                        />
                    </div>

                    <div className="md:col-span-1">
                        <button
                            onClick={handleAddTest}
                            disabled={!selectedParamId}
                            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            Add to List
                        </button>
                    </div>
                </div>

                {/* Auto-fill Preview/Hint */}
                {selectedParamId && (() => {
                    const rule = MOCK_RULES.find(r => r.matrix_id === selectedMatrixId && r.parameter_id === selectedParamId);
                    if (!rule) return null;
                    const method = MOCK_METHODS.find(m => m.id === rule.default_method_id);
                    return (
                        <div className="text-xs text-text-secondary flex gap-4 bg-white/50 dark:bg-black/20 p-2 rounded">
                            <span className="flex items-center gap-1"><i className="material-symbols-outlined text-[14px]">science</i> {method?.code}</span>
                            <span className="flex items-center gap-1"><i className="material-symbols-outlined text-[14px]">payments</i> IDR {rule.base_price.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><i className="material-symbols-outlined text-[14px]">timer</i> {rule.default_tat_days} Days</span>
                        </div>
                    )
                })()}
            </div>

            {/* TABLE */}
            <DenseTable
                data={items}
                keyExtractor={(i) => i.id}
                columns={[
                    {
                        header: "Matrix",
                        accessorKey: "matrix_id",
                        cell: (item) => <span className="text-xs font-medium text-text-secondary">{MOCK_MATRICES.find(m => m.id === item.matrix_id)?.name}</span>
                    },
                    {
                        header: "Parameter",
                        accessorKey: "parameter_id",
                        cell: (item) => <span className="font-semibold text-text-main">{MOCK_PARAMETERS.find(p => p.id === item.parameter_id)?.name}</span>
                    },
                    {
                        header: "Method",
                        accessorKey: "method_id",
                        className: "hidden md:table-cell",
                        cell: (item) => <span className="text-xs text-text-secondary">{MOCK_METHODS.find(m => m.id === item.method_id)?.code}</span>
                    },
                    {
                        header: "Rate",
                        accessorKey: "unit_price",
                        cell: (item) => `Rp ${item.unit_price.toLocaleString()}`
                    },
                    { header: "Qty", accessorKey: "qty" },
                    {
                        header: "Total",
                        accessorKey: "total_price",
                        className: "font-bold",
                        cell: (item) => `Rp ${item.total_price.toLocaleString()}`
                    },
                    {
                        header: "",
                        accessorKey: "id",
                        cell: (item) => (
                            <button
                                onClick={() => handleRemove(item.id)}
                                className="text-danger hover:bg-danger/10 p-1 rounded transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        )
                    }
                ]}
                className="border-0 shadow-none"
            />

            {items.length === 0 && (
                <div className="text-center py-8 text-text-secondary italic text-sm border border-dashed border-border-light rounded-lg">
                    No tests added yet. Select a Matrix and Parameter above.
                </div>
            )}
        </div>
    );
}
