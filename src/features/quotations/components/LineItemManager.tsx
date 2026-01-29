"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/Label";
import { DenseTable } from "@/components/ui/DenseTable";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { MOCK_MATRICES, MOCK_PARAMETERS, MOCK_RULES, MOCK_METHODS, MOCK_SUBPARAMETERS, MOCK_TEST_PACKAGES, MOCK_TEST_PACKAGE_ITEMS } from "@/data/mock-db";
import { QuotationLineItem } from "../types";
import { cn } from "@/lib/utils";

interface LineItemManagerProps {
    items: QuotationLineItem[];
    onItemsChange: (items: QuotationLineItem[]) => void;
}

export function LineItemManager({ items, onItemsChange }: LineItemManagerProps) {
    // Staging state for the "Add New" area
    const [selectedMatrixId, setSelectedMatrixId] = useState<string>("");
    const [selectedParamId, setSelectedParamId] = useState<string>("");
    const [selectedSubParamId, setSelectedSubParamId] = useState<string>("");
    const [qty, setQty] = useState(1);
    const [showPackages, setShowPackages] = useState(false);
    const [packageFilter, setPackageFilter] = useState<string>("");

    // Available parameters filtered by matrix (with rules)
    const availableParameters = useMemo(() => {
        if (!selectedMatrixId) return [];
        return MOCK_PARAMETERS.filter(p =>
            MOCK_RULES.some(r => r.matrix_id === selectedMatrixId && r.parameter_id === p.id)
        );
    }, [selectedMatrixId]);

    // Available sub-parameters for selected parameter
    const availableSubParams = useMemo(() => {
        if (!selectedParamId) return [];
        return MOCK_SUBPARAMETERS.filter(sp => sp.parameter_id === selectedParamId && sp.is_active);
    }, [selectedParamId]);

    // Available packages filtered by matrix
    const availablePackages = useMemo(() => {
        let packages = MOCK_TEST_PACKAGES.filter(p => p.is_active);
        if (selectedMatrixId) {
            packages = packages.filter(p => p.matrix_id === selectedMatrixId);
        }
        if (packageFilter) {
            packages = packages.filter(p =>
                p.name.toLowerCase().includes(packageFilter.toLowerCase())
            );
        }
        return packages;
    }, [selectedMatrixId, packageFilter]);

    // Calculate due date from lead time
    const calculateDueDate = (leadTimeDays: number): Date => {
        const date = new Date();
        date.setDate(date.getDate() + leadTimeDays);
        return date;
    };

    const handleAddTest = () => {
        if (!selectedMatrixId || !selectedParamId) return;

        const rule = MOCK_RULES.find(r => r.matrix_id === selectedMatrixId && r.parameter_id === selectedParamId);
        if (!rule) return;

        const newItem: QuotationLineItem = {
            id: crypto.randomUUID(),
            matrix_id: selectedMatrixId,
            parameter_id: selectedParamId,
            subparameter_id: selectedSubParamId || undefined,
            method_id: rule.default_method_id,
            instrument_id: rule.default_instrument_id,
            unit_price: rule.base_price,
            qty: qty,
            total_price: rule.base_price * qty,
            lead_time_days: rule.default_tat_days,
            due_date_estimate: calculateDueDate(rule.default_tat_days)
        };

        onItemsChange([...items, newItem]);
        setSelectedParamId("");
        setSelectedSubParamId("");
    };

    const handleAddPackage = (packageId: string) => {
        const pkg = MOCK_TEST_PACKAGES.find(p => p.id === packageId);
        if (!pkg) return;

        const packageItems = MOCK_TEST_PACKAGE_ITEMS.filter(pi => pi.package_id === packageId);
        const newItems: QuotationLineItem[] = packageItems.map(pi => {
            const rule = MOCK_RULES.find(r => r.parameter_id === pi.parameter_id && r.matrix_id === pkg.matrix_id);
            const pricePerItem = pi.price_override || rule?.base_price || 0;
            const tat = rule?.default_tat_days || 5;

            return {
                id: crypto.randomUUID(),
                matrix_id: pkg.matrix_id,
                parameter_id: pi.parameter_id,
                subparameter_id: pi.subparameter_id,
                method_id: pi.method_id,
                instrument_id: pi.instrument_id,
                unit_price: pricePerItem,
                qty: qty,
                total_price: pricePerItem * qty,
                lead_time_days: tat,
                due_date_estimate: calculateDueDate(tat),
                package_id: packageId
            };
        });

        onItemsChange([...items, ...newItems]);
        setShowPackages(false);
    };

    const handleRemove = (id: string) => {
        onItemsChange(items.filter(i => i.id !== id));
    };

    // Get display names
    const getMatrixName = (id: string) => MOCK_MATRICES.find(m => m.id === id)?.name || id;
    const getParamName = (id: string) => MOCK_PARAMETERS.find(p => p.id === id)?.name || id;
    const getSubParamName = (id?: string) => id ? MOCK_SUBPARAMETERS.find(sp => sp.id === id)?.name : null;
    const getMethodCode = (id: string) => MOCK_METHODS.find(m => m.id === id)?.code || id;

    return (
        <div className="space-y-6">
            {/* PACKAGE QUICK SELECTOR */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-text-secondary">Quick Add:</span>
                {MOCK_TEST_PACKAGES.filter(p => p.is_active).slice(0, 3).map(pkg => (
                    <button
                        key={pkg.id}
                        onClick={() => handleAddPackage(pkg.id)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                            "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                        )}
                    >
                        <span className="material-symbols-outlined text-[14px] mr-1 align-middle">inventory_2</span>
                        {pkg.name}
                    </button>
                ))}
                <button
                    onClick={() => setShowPackages(!showPackages)}
                    className="px-2 py-1.5 text-xs text-text-secondary hover:text-primary"
                >
                    {showPackages ? "Hide" : "More Packages..."}
                </button>
            </div>

            {/* PACKAGE BROWSER */}
            {showPackages && (
                <PremiumCard title="Test Packages" subtitle="Pre-configured test bundles">
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Search packages..."
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5"
                            value={packageFilter}
                            onChange={(e) => setPackageFilter(e.target.value)}
                        />
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {availablePackages.map(pkg => (
                                <div
                                    key={pkg.id}
                                    className="rounded-lg border border-border-light p-4 hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() => handleAddPackage(pkg.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-bold text-text-main dark:text-white">{pkg.name}</h4>
                                            <p className="text-xs text-text-secondary mt-1">{pkg.description}</p>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                            {MOCK_TEST_PACKAGE_ITEMS.filter(pi => pi.package_id === pkg.id).length} tests
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                                        <span className="text-lg font-bold text-primary">Rp {pkg.total_price.toLocaleString()}</span>
                                        <span className="text-xs text-text-secondary flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">timer</span>
                                            {pkg.tat_days} days
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PremiumCard>
            )}

            {/* ADD INDIVIDUAL TEST */}
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    <h4 className="text-sm font-semibold text-primary">Add Individual Test</h4>
                </div>

                <div className="grid gap-4 md:grid-cols-5 items-end">
                    {/* Matrix */}
                    <div className="space-y-1">
                        <Label className="text-xs">Sample Matrix</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={selectedMatrixId}
                            onChange={(e) => {
                                setSelectedMatrixId(e.target.value);
                                setSelectedParamId("");
                                setSelectedSubParamId("");
                            }}
                        >
                            <option value="">Select Matrix...</option>
                            {MOCK_MATRICES.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Parameter */}
                    <div className="space-y-1">
                        <Label className="text-xs">Parameter</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={selectedParamId}
                            onChange={(e) => {
                                setSelectedParamId(e.target.value);
                                setSelectedSubParamId("");
                            }}
                            disabled={!selectedMatrixId}
                        >
                            <option value="">Select Parameter...</option>
                            {availableParameters.length === 0 && selectedMatrixId ? (
                                <option disabled>No parameters configured</option>
                            ) : (
                                availableParameters.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Sub-Parameter (conditional) */}
                    <div className="space-y-1">
                        <Label className="text-xs">Sub-Parameter</Label>
                        <select
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={selectedSubParamId}
                            onChange={(e) => setSelectedSubParamId(e.target.value)}
                            disabled={availableSubParams.length === 0}
                        >
                            <option value="">{availableSubParams.length === 0 ? "N/A" : "Select Sub-Param..."}</option>
                            {availableSubParams.map(sp => (
                                <option key={sp.id} value={sp.id}>{sp.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                        <Label className="text-xs">Qty (Samples)</Label>
                        <input
                            type="number"
                            min={1}
                            className="w-full text-sm rounded-md border border-border-light p-2 bg-white dark:bg-white/5 dark:border-white/10"
                            value={qty}
                            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                        />
                    </div>

                    {/* Add Button */}
                    <div>
                        <button
                            onClick={handleAddTest}
                            disabled={!selectedParamId}
                            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            Add to List
                        </button>
                    </div>
                </div>

                {/* Auto-fill Preview */}
                {selectedParamId && (() => {
                    const rule = MOCK_RULES.find(r => r.matrix_id === selectedMatrixId && r.parameter_id === selectedParamId);
                    if (!rule) return null;
                    const method = MOCK_METHODS.find(m => m.id === rule.default_method_id);
                    const dueDate = calculateDueDate(rule.default_tat_days);
                    return (
                        <div className="text-xs text-text-secondary flex flex-wrap gap-4 bg-white/50 dark:bg-black/20 p-2 rounded">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">science</span> {method?.code}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">payments</span> Rp {rule.base_price.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">timer</span> {rule.default_tat_days} Days</span>
                            <span className="flex items-center gap-1 text-primary font-medium">
                                <span className="material-symbols-outlined text-[14px]">event</span>
                                Due: {dueDate.toLocaleDateString()}
                            </span>
                        </div>
                    );
                })()}
            </div>

            {/* ITEMS TABLE */}
            <DenseTable
                data={items}
                keyExtractor={(i) => i.id}
                columns={[
                    {
                        header: "Matrix",
                        accessorKey: "matrix_id",
                        cell: (item) => <span className="text-xs font-medium text-text-secondary">{getMatrixName(item.matrix_id)}</span>
                    },
                    {
                        header: "Parameter",
                        accessorKey: "parameter_id",
                        cell: (item) => (
                            <div>
                                <span className="font-semibold text-text-main">{getParamName(item.parameter_id)}</span>
                                {item.subparameter_id && (
                                    <span className="block text-xs text-text-secondary">→ {getSubParamName(item.subparameter_id)}</span>
                                )}
                                {item.package_id && (
                                    <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">PKG</span>
                                )}
                            </div>
                        )
                    },
                    {
                        header: "Method",
                        accessorKey: "method_id",
                        className: "hidden md:table-cell",
                        cell: (item) => <span className="text-xs text-text-secondary">{getMethodCode(item.method_id)}</span>
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
                        header: "Due Date",
                        accessorKey: "due_date_estimate",
                        cell: (item) => (
                            <span className="text-xs text-primary font-medium">
                                {item.due_date_estimate?.toLocaleDateString() || `+${item.lead_time_days}d`}
                            </span>
                        )
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
                    <span className="material-symbols-outlined text-[32px] text-slate-300 mb-2">science</span>
                    <p>No tests added yet.</p>
                    <p className="text-xs mt-1">Select a package above or add individual tests.</p>
                </div>
            )}

            {/* TOTALS SUMMARY */}
            {items.length > 0 && (
                <div className="flex justify-end">
                    <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 text-right space-y-1">
                        <div className="flex justify-between gap-8 text-sm">
                            <span className="text-text-secondary">Total Items:</span>
                            <span className="font-bold">{items.length}</span>
                        </div>
                        <div className="flex justify-between gap-8 text-sm">
                            <span className="text-text-secondary">Max Lead Time:</span>
                            <span className="font-bold">{Math.max(...items.map(i => i.lead_time_days))} days</span>
                        </div>
                        <div className="flex justify-between gap-8 text-lg border-t border-border-light pt-2 mt-2">
                            <span className="text-text-secondary">Subtotal:</span>
                            <span className="font-bold text-primary">Rp {items.reduce((sum, i) => sum + i.total_price, 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
