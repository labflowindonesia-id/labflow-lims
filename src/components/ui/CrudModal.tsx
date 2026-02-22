"use client";

import { useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldConfig {
    name: string;
    label: string;
    type: "text" | "email" | "tel" | "number" | "select" | "textarea" | "checkbox" | "date";
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
    defaultValue?: string | number | boolean;
}

interface CrudModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    mode: "add" | "edit" | "delete";
    fields?: FieldConfig[];
    initialData?: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
    entityName?: string;
}

export function CrudModal({
    isOpen,
    onClose,
    title,
    mode,
    fields = [],
    initialData = {},
    onSave,
    entityName = "item"
}: CrudModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Reset form data whenever the modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSave(formData);
            onClose();
        } catch (err: any) {
            alert(err.message || String(err));
            console.error(err);
        }
    };

    const handleFieldChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Delete Confirmation
    if (mode === "delete") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-surface-dark">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-danger text-2xl">delete</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-main dark:text-white">{title}</h2>
                            <p className="text-sm text-text-secondary">This action cannot be undone</p>
                        </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-6">
                        Are you sure you want to delete this {entityName}? All associated data will be permanently removed.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-100 rounded-lg dark:hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    await onSave({ delete: true, id: initialData.id });
                                    onClose();
                                } catch (err: any) {
                                    alert(err.message || String(err));
                                    console.error(err);
                                }
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger/90 rounded-lg"
                        >
                            Delete {entityName}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Add / Edit Form
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-surface-dark">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            mode === "add" ? "bg-success/10" : "bg-primary/10"
                        )}>
                            <span className={cn(
                                "material-symbols-outlined",
                                mode === "add" ? "text-success" : "text-primary"
                            )}>
                                {mode === "add" ? "add" : "edit"}
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-text-main dark:text-white">{title}</h2>
                    </div>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-main">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map(field => (
                        <div key={field.name} className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main dark:text-white">
                                {field.label}
                                {field.required && <span className="text-danger ml-1">*</span>}
                            </label>

                            {field.type === "textarea" ? (
                                <textarea
                                    className="w-full text-sm rounded-lg border border-border-light p-3 bg-white dark:bg-white/5 dark:border-white/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    rows={3}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    value={formData[field.name] || ""}
                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                />
                            ) : field.type === "select" ? (
                                <select
                                    className="w-full text-sm rounded-lg border border-border-light p-3 bg-white dark:bg-surface-dark dark:border-white/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    required={field.required}
                                    value={formData[field.name] || ""}
                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                >
                                    <option value="">Select {field.label}</option>
                                    {field.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : field.type === "checkbox" ? (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                                        checked={formData[field.name] || false}
                                        onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                                    />
                                    <span className="text-sm text-text-secondary">{field.placeholder || "Enable"}</span>
                                </label>
                            ) : field.type === "date" ? (
                                <input
                                    type="date"
                                    className="w-full text-sm rounded-lg border border-border-light p-3 bg-white dark:bg-white/5 dark:border-white/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    required={field.required}
                                    value={formData[field.name] || ""}
                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                />
                            ) : (
                                <input
                                    type={field.type}
                                    className="w-full text-sm rounded-lg border border-border-light p-3 bg-white dark:bg-white/5 dark:border-white/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    value={formData[field.name] || ""}
                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                />
                            )}
                        </div>
                    ))}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-100 rounded-lg dark:hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg"
                        >
                            {mode === "add" ? "Create" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
