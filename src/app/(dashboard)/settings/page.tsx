"use client";

import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { CrudModal, FieldConfig } from "@/components/ui/CrudModal";
import { MOCK_USERS, MOCK_CUSTOMERS, MOCK_PARAMETERS, MOCK_MATRICES, MOCK_METHODS, MOCK_INSTRUMENTS, MOCK_UNITS } from "@/data/mock-db";
import { cn } from "@/lib/utils";

type SettingsTab = "general" | "users" | "customers" | "parameters" | "matrices" | "methods" | "instruments" | "units" | "packages" | "departments" | "matrix_rules" | "price_list";

interface ModalState {
    isOpen: boolean;
    mode: "add" | "edit" | "delete";
    data: Record<string, any>;
    entityType: string;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    const [searchQuery, setSearchQuery] = useState("");
    const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: "add", data: {}, entityType: "user" });

    const openModal = (mode: "add" | "edit" | "delete", entityType: string, data: Record<string, any> = {}) => {
        setModal({ isOpen: true, mode, entityType, data });
    };

    const closeModal = () => {
        setModal({ isOpen: false, mode: "add", data: {}, entityType: "user" });
    };

    const handleSave = (formData: Record<string, any>) => {
        console.log("Saving:", modal.entityType, modal.mode, formData);
        alert(`${modal.mode === "add" ? "Created" : modal.mode === "edit" ? "Updated" : "Deleted"} ${modal.entityType}: ${JSON.stringify(formData)}`);
    };

    // Field configurations for each entity type
    const fieldConfigs: Record<string, FieldConfig[]> = {
        user: [
            { name: "full_name", label: "Full Name", type: "text", required: true, placeholder: "John Doe" },
            { name: "email", label: "Email", type: "email", required: true, placeholder: "john@example.com" },
            {
                name: "role", label: "Role", type: "select", required: true, options: [
                    { value: "ADMIN", label: "Admin" },
                    { value: "MANAGER", label: "Manager" },
                    { value: "ANALYST", label: "Analyst" },
                    { value: "REVIEWER", label: "Reviewer" },
                ]
            },
            { name: "is_active", label: "Active Status", type: "checkbox", placeholder: "User is active" },
        ],
        customer: [
            { name: "name", label: "Company Name", type: "text", required: true },
            { name: "code", label: "Customer Code", type: "text", required: true, placeholder: "CUST-001" },
            { name: "address", label: "Address", type: "textarea", placeholder: "Full address" },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "email", label: "Email", type: "email" },
        ],
        parameter: [
            { name: "name", label: "Parameter Name", type: "text", required: true },
            { name: "symbol", label: "Symbol", type: "text", placeholder: "e.g. COD, BOD" },
            {
                name: "category", label: "Category", type: "select", options: [
                    { value: "Physical", label: "Physical" },
                    { value: "Chemical", label: "Chemical" },
                    { value: "Biological", label: "Biological" },
                ]
            },
        ],
        matrix: [
            { name: "name", label: "Matrix Name", type: "text", required: true },
            { name: "code", label: "Code", type: "text", required: true },
            { name: "category", label: "Category", type: "text" },
        ],
        method: [
            { name: "name", label: "Method Name", type: "text", required: true },
            { name: "code", label: "Method Code", type: "text", required: true },
            { name: "is_accredited", label: "Accredited", type: "checkbox", placeholder: "Method is accredited" },
        ],
        instrument: [
            { name: "name", label: "Instrument Name", type: "text", required: true },
            { name: "code", label: "Code", type: "text", required: true },
            { name: "location", label: "Location", type: "text" },
            {
                name: "status", label: "Status", type: "select", options: [
                    { value: "READY", label: "Ready" },
                    { value: "IN_USE", label: "In Use" },
                    { value: "MAINTENANCE", label: "Maintenance" },
                    { value: "CALIBRATION", label: "Calibration" },
                ]
            },
        ],
        unit: [
            { name: "name", label: "Unit Name", type: "text", required: true },
            { name: "symbol", label: "Symbol", type: "text", required: true, placeholder: "e.g. mg/L" },
        ],
        department: [
            { name: "name", label: "Department Name", type: "text", required: true },
            { name: "code", label: "Department Code", type: "text", required: true, placeholder: "e.g. CHEM, MICRO" },
            { name: "head", label: "Department Head", type: "text", placeholder: "Name of department head" },
            { name: "is_active", label: "Active", type: "checkbox", placeholder: "Department is active" },
        ],
        matrix_rule: [
            { name: "matrix", label: "Matrix", type: "select", required: true, options: MOCK_MATRICES.map(m => ({ value: m.id, label: m.name })) },
            { name: "parameter", label: "Parameter", type: "select", required: true, options: MOCK_PARAMETERS.map(p => ({ value: p.id, label: p.name })) },
            { name: "method", label: "Default Method", type: "select", options: MOCK_METHODS.map(m => ({ value: m.id, label: m.name })) },
            { name: "is_allowed", label: "Allowed", type: "checkbox", placeholder: "Combination is allowed" },
        ],
        price_item: [
            { name: "matrix", label: "Matrix", type: "select", required: true, options: MOCK_MATRICES.map(m => ({ value: m.id, label: m.name })) },
            { name: "parameter", label: "Parameter", type: "select", required: true, options: MOCK_PARAMETERS.map(p => ({ value: p.id, label: p.name })) },
            { name: "price", label: "Price (IDR)", type: "number", required: true, placeholder: "e.g. 150000" },
            { name: "min_qty", label: "Min Quantity", type: "number", placeholder: "Minimum quantity for this price" },
        ],
    };

    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: "general", label: "General", icon: "settings" },
        { id: "users", label: "Users", icon: "group" },
        { id: "customers", label: "Customers", icon: "business" },
        { id: "departments", label: "Departments", icon: "corporate_fare" },
        { id: "parameters", label: "Parameters", icon: "science" },
        { id: "matrices", label: "Matrices", icon: "grid_view" },
        { id: "matrix_rules", label: "Matrix-Param Rules", icon: "rule" },
        { id: "methods", label: "Methods", icon: "description" },
        { id: "instruments", label: "Instruments", icon: "precision_manufacturing" },
        { id: "units", label: "Units", icon: "straighten" },
        { id: "packages", label: "Test Packages", icon: "inventory_2" },
        { id: "price_list", label: "Price List", icon: "payments" },
    ];

    const filterData = <T extends { name?: string }>(data: T[]): T[] => {
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(item => item.name?.toLowerCase().includes(q));
    };

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">Settings & Master Data</h1>
                <p className="text-text-secondary">Manage system configuration and reference data</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-border-light dark:border-border-dark pb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab.id
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-slate-100 text-text-secondary hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20"
                        )}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="max-w-6xl">
                {/* General Settings */}
                {activeTab === "general" && (
                    <PremiumCard title="General Settings" subtitle="Laboratory information and preferences">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Laboratory Name</Label>
                                    <Input defaultValue="LabFlow LIMS" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company Code</Label>
                                    <Input defaultValue="LF-001" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Support Email</Label>
                                    <Input defaultValue="support@labflow.com" type="email" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Support Phone</Label>
                                    <Input defaultValue="+62 21 123 4567" type="tel" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <textarea
                                        className="w-full text-sm rounded-lg border border-border-light p-3 bg-white dark:bg-white/5 dark:border-white/10"
                                        rows={3}
                                        defaultValue="Jl. Industri Raya No. 123, Kawasan Industri MM2100, Bekasi, Indonesia"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Accreditation Number</Label>
                                    <Input defaultValue="LP-123-IDN" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Currency</Label>
                                    <select className="w-full text-sm rounded-lg border border-border-light p-3 bg-white dark:bg-surface-dark dark:border-white/10">
                                        <option value="IDR">IDR - Indonesian Rupiah</option>
                                        <option value="USD">USD - US Dollar</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark flex justify-end">
                            <button className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover">
                                Save Changes
                            </button>
                        </div>
                    </PremiumCard>
                )}

                {/* Users Management */}
                {activeTab === "users" && (
                    <PremiumCard
                        title="User Management"
                        subtitle="Manage laboratory personnel and access"
                        action={
                            <button
                                onClick={() => openModal("add", "user")}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
                            >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add User
                            </button>
                        }
                    >
                        <DenseTable
                            data={MOCK_USERS}
                            keyExtractor={u => u.id}
                            columns={[
                                { header: "Name", accessorKey: "full_name", className: "font-medium" },
                                { header: "Email", accessorKey: "email", className: "text-sm text-text-secondary" },
                                {
                                    header: "Role",
                                    accessorKey: "role",
                                    cell: u => (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-bold",
                                            u.role === "ADMIN" ? "bg-primary/20 text-primary" :
                                                u.role === "MANAGER" ? "bg-warning/20 text-warning" :
                                                    "bg-slate-100 text-slate-600"
                                        )}>
                                            {u.role}
                                        </span>
                                    )
                                },
                                {
                                    header: "Status",
                                    accessorKey: "is_active",
                                    cell: u => (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-bold",
                                            u.is_active ? "bg-success/20 text-success" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {u.is_active ? "Active" : "Inactive"}
                                        </span>
                                    )
                                },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    cell: u => (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openModal("edit", "user", u); }}
                                                className="text-primary hover:underline text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openModal("delete", "user", u); }}
                                                className="text-danger hover:underline text-xs"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}

                {/* Customers Management */}
                {activeTab === "customers" && (
                    <PremiumCard
                        title="Customers & Contacts"
                        subtitle="Manage client information"
                        action={
                            <button onClick={() => openModal("add", "customer")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Customer
                            </button>
                        }
                    >
                        <DenseTable
                            data={MOCK_CUSTOMERS}
                            keyExtractor={c => c.id}
                            columns={[
                                { header: "Company", accessorKey: "name", className: "font-medium" },
                                { header: "Code", accessorKey: "code", className: "font-mono text-xs" },
                                { header: "Address", accessorKey: "address", className: "text-sm text-text-secondary line-clamp-1" },
                                { header: "Phone", accessorKey: "phone", className: "text-sm" },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    cell: (c) => (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal("edit", "customer", c); }} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal("delete", "customer", c); }} className="text-danger hover:underline text-xs">Delete</button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}

                {/* Parameters Management */}
                {activeTab === "parameters" && (
                    <PremiumCard
                        title="Parameters & Sub-Parameters"
                        subtitle="Analytical parameters and test specifications"
                        action={
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search parameters..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-48"
                                />
                                <button onClick={() => openModal("add", "parameter")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Add
                                </button>
                            </div>
                        }
                    >
                        <DenseTable
                            data={filterData(MOCK_PARAMETERS)}
                            keyExtractor={p => p.id}
                            columns={[
                                { header: "Parameter", accessorKey: "name", className: "font-medium" },
                                { header: "Symbol", accessorKey: "symbol", className: "font-mono text-xs" },
                                {
                                    header: "Category",
                                    accessorKey: "category",
                                    cell: p => (
                                        <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                            {p.category}
                                        </span>
                                    )
                                },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    cell: (p) => (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal("edit", "parameter", p); }} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal("delete", "parameter", p); }} className="text-danger hover:underline text-xs">Delete</button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}

                {/* Matrices Management */}
                {activeTab === "matrices" && (
                    <PremiumCard
                        title="Sample Matrices"
                        subtitle="Sample types and matrix categories"
                        action={
                            <button onClick={() => openModal("add", "matrix")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Matrix
                            </button>
                        }
                    >
                        <DenseTable
                            data={MOCK_MATRICES}
                            keyExtractor={m => m.id}
                            columns={[
                                { header: "Matrix Name", accessorKey: "name", className: "font-medium" },
                                { header: "Code", accessorKey: "code", className: "font-mono text-xs" },
                                { header: "Category", accessorKey: "category", className: "text-sm" },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    cell: (m) => (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal("edit", "matrix", m); }} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal("delete", "matrix", m); }} className="text-danger hover:underline text-xs">Delete</button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}

                {/* Methods Management */}
                {activeTab === "methods" && (
                    <PremiumCard
                        title="Test Methods"
                        subtitle="Standard test methods and procedures"
                        action={
                            <button onClick={() => openModal("add", "method")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Method
                            </button>
                        }
                    >
                        <DenseTable
                            data={MOCK_METHODS}
                            keyExtractor={m => m.id}
                            columns={[
                                { header: "Method Name", accessorKey: "name", className: "font-medium" },
                                { header: "Code", accessorKey: "code", className: "font-mono text-xs" },
                                {
                                    header: "Accredited",
                                    accessorKey: "is_accredited",
                                    cell: m => (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-bold",
                                            m.is_accredited ? "bg-success/20 text-success" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {m.is_accredited ? "Yes" : "No"}
                                        </span>
                                    )
                                },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    cell: (m) => (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal("edit", "method", m); }} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal("delete", "method", m); }} className="text-danger hover:underline text-xs">Delete</button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}

                {/* Instruments Management */}
                {activeTab === "instruments" && (
                    <PremiumCard
                        title="Instruments"
                        subtitle="Laboratory equipment and calibration status"
                        action={
                            <button onClick={() => openModal("add", "instrument")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Instrument
                            </button>
                        }
                    >
                        <DenseTable
                            data={MOCK_INSTRUMENTS}
                            keyExtractor={i => i.id}
                            columns={[
                                { header: "Instrument", accessorKey: "name", className: "font-medium" },
                                { header: "Code", accessorKey: "code", className: "font-mono text-xs" },
                                { header: "Location", accessorKey: "location", className: "text-sm text-text-secondary" },
                                {
                                    header: "Status",
                                    accessorKey: "status",
                                    cell: i => (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-bold",
                                            i.status === "READY" ? "bg-success/20 text-success" :
                                                i.status === "IN_USE" ? "bg-primary/20 text-primary" :
                                                    i.status === "MAINTENANCE" ? "bg-warning/20 text-warning" :
                                                        "bg-danger/20 text-danger"
                                        )}>
                                            {i.status.replace("_", " ")}
                                        </span>
                                    )
                                },
                                {
                                    header: "Cal. Due",
                                    accessorKey: "calibration_due_date",
                                    cell: i => {
                                        const dueDate = new Date(i.calibration_due_date);
                                        const isOverdue = dueDate < new Date();
                                        return (
                                            <span className={cn("text-xs", isOverdue && "text-danger font-bold")}>
                                                {dueDate.toLocaleDateString()}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    cell: (i) => (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal("edit", "instrument", i); }} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal("delete", "instrument", i); }} className="text-danger hover:underline text-xs">Delete</button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}

                {/* Units Management */}
                {activeTab === "units" && (
                    <PremiumCard
                        title="Units of Measurement"
                        subtitle="Standard units and conversion factors"
                        action={
                            <button onClick={() => openModal("add", "unit")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Unit
                            </button>
                        }
                    >
                        <DenseTable
                            data={MOCK_UNITS}
                            keyExtractor={u => u.id}
                            columns={[
                                { header: "Unit Name", accessorKey: "name", className: "font-medium" },
                                { header: "Symbol", accessorKey: "symbol", className: "font-mono text-lg" },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    cell: (u) => (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal("edit", "unit", u); }} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal("delete", "unit", u); }} className="text-danger hover:underline text-xs">Delete</button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}

                {/* Test Packages */}
                {activeTab === "packages" && (
                    <PremiumCard
                        title="Test Packages"
                        subtitle="Pre-configured test bundles for quotations"
                        action={
                            <button className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Create Package
                            </button>
                        }
                    >
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                { name: "Basic Water Quality", tests: 8, price: 2500000 },
                                { name: "Heavy Metals Panel", tests: 12, price: 4500000 },
                                { name: "Complete Soil Analysis", tests: 15, price: 6000000 },
                                { name: "Microbiological Suite", tests: 6, price: 3200000 },
                            ].map((pkg, i) => (
                                <div key={i} className="rounded-lg border border-border-light p-4 hover:border-primary/50 transition-colors dark:border-border-dark">
                                    <h4 className="font-bold text-text-main dark:text-white">{pkg.name}</h4>
                                    <p className="text-xs text-text-secondary mt-1">{pkg.tests} tests included</p>
                                    <p className="text-lg font-bold text-primary mt-2">
                                        Rp {pkg.price.toLocaleString()}
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <button className="text-xs text-primary hover:underline">Edit</button>
                                        <button className="text-xs text-text-secondary hover:underline">View Tests</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PremiumCard>
                )}

                {/* Departments */}
                {activeTab === "departments" && (
                    <PremiumCard
                        title="departments"
                        subtitle="Laboratory departments and sections"
                        action={
                            <button onClick={() => openModal("add", "department")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Department
                            </button>
                        }
                    >
                        <DenseTable
                            data={[
                                { id: "dept-001", name: "Chemistry", code: "CHEM", head: "Dr. Ahmad Wijaya", is_active: true },
                                { id: "dept-002", name: "Microbiology", code: "MICRO", head: "Dr. Siti Rahayu", is_active: true },
                                { id: "dept-003", name: "Physical Testing", code: "PHYS", head: "Budi Santoso", is_active: true },
                                { id: "dept-004", name: "Sample Receiving", code: "RCV", head: "Maya Putri", is_active: true },
                                { id: "dept-005", name: "QA/QC", code: "QC", head: "Rina Kusuma", is_active: false },
                            ]}
                            keyExtractor={d => d.id}
                            columns={[
                                { header: "Department", accessorKey: "name", className: "font-medium" },
                                { header: "Code", accessorKey: "code", className: "font-mono text-xs" },
                                { header: "Head", accessorKey: "head" },
                                {
                                    header: "Status",
                                    accessorKey: "is_active",
                                    cell: (d) => (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-bold",
                                            d.is_active ? "bg-success/20 text-success" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {d.is_active ? "Active" : "Inactive"}
                                        </span>
                                    )
                                },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    className: "text-right",
                                    cell: (d) => (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal("edit", "department", d); }} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal("delete", "department", d); }} className="text-danger hover:underline text-xs">Delete</button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}

                {/* Matrix-Parameter Rules */}
                {activeTab === "matrix_rules" && (
                    <PremiumCard
                        title="Matrix-Parameter Rules"
                        subtitle="Define which parameters are allowed for each matrix type"
                        action={
                            <button onClick={() => openModal("add", "matrix_rule")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Rule
                            </button>
                        }
                    >
                        <DenseTable
                            data={[
                                { id: "rule-001", matrix: "Air Minum", parameter: "pH", method: "SNI 6989.11:2019", is_allowed: true },
                                { id: "rule-002", matrix: "Air Minum", parameter: "TDS", method: "SNI 6989.27:2019", is_allowed: true },
                                { id: "rule-003", matrix: "Air Limbah", parameter: "BOD", method: "SNI 6989.72:2009", is_allowed: true },
                                { id: "rule-004", matrix: "Air Limbah", parameter: "COD", method: "SNI 6989.2:2019", is_allowed: true },
                                { id: "rule-005", matrix: "Tanah", parameter: "pH", method: "SNI 3551:2012", is_allowed: true },
                                { id: "rule-006", matrix: "Air Minum", parameter: "BOD", method: null, is_allowed: false },
                            ]}
                            keyExtractor={r => r.id}
                            columns={[
                                { header: "Matrix", accessorKey: "matrix", className: "font-medium" },
                                { header: "Parameter", accessorKey: "parameter" },
                                {
                                    header: "Default Method",
                                    accessorKey: "method",
                                    cell: (r) => r.method || <span className="text-slate-400 italic">Not specified</span>
                                },
                                {
                                    header: "Allowed",
                                    accessorKey: "is_allowed",
                                    cell: (r) => (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-bold",
                                            r.is_allowed ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                                        )}>
                                            {r.is_allowed ? "Yes" : "No"}
                                        </span>
                                    )
                                },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    className: "text-right",
                                    cell: (r) => (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal("edit", "matrix_rule", r); }} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal("delete", "matrix_rule", r); }} className="text-danger hover:underline text-xs">Delete</button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}

                {/* Price List */}
                {activeTab === "price_list" && (
                    <PremiumCard
                        title="Price List"
                        subtitle="Manage test pricing by matrix and parameter"
                        action={
                            <div className="flex gap-2">
                                <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-text-main rounded-lg text-sm font-medium hover:bg-slate-50">
                                    <span className="material-symbols-outlined text-[16px]">upload</span>
                                    Import Excel
                                </button>
                                <button onClick={() => openModal("add", "price_item")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Add Price
                                </button>
                            </div>
                        }
                    >
                        <DenseTable
                            data={[
                                { id: "price-001", matrix: "Air Minum", parameter: "pH", price: 75000, min_qty: 1 },
                                { id: "price-002", matrix: "Air Minum", parameter: "TDS", price: 100000, min_qty: 1 },
                                { id: "price-003", matrix: "Air Minum", parameter: "Kekeruhan", price: 85000, min_qty: 1 },
                                { id: "price-004", matrix: "Air Limbah", parameter: "BOD", price: 250000, min_qty: 1 },
                                { id: "price-005", matrix: "Air Limbah", parameter: "COD", price: 200000, min_qty: 1 },
                                { id: "price-006", matrix: "Tanah", parameter: "pH Tanah", price: 120000, min_qty: 1 },
                                { id: "price-007", matrix: "Air Minum", parameter: "pH", price: 65000, min_qty: 10 },
                            ]}
                            keyExtractor={p => p.id}
                            columns={[
                                { header: "Matrix", accessorKey: "matrix", className: "font-medium" },
                                { header: "Parameter", accessorKey: "parameter" },
                                {
                                    header: "Price",
                                    accessorKey: "price",
                                    className: "text-right font-mono",
                                    cell: (p) => `Rp ${p.price.toLocaleString()}`
                                },
                                {
                                    header: "Min Qty",
                                    accessorKey: "min_qty",
                                    className: "text-center",
                                    cell: (p) => p.min_qty > 1 ? (
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold">≥{p.min_qty}</span>
                                    ) : "-"
                                },
                                {
                                    header: "Actions",
                                    accessorKey: "id",
                                    className: "text-right",
                                    cell: (p) => (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal("edit", "price_item", p); }} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal("delete", "price_item", p); }} className="text-danger hover:underline text-xs">Delete</button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumCard>
                )}
            </div>

            {/* CRUD Modal */}
            <CrudModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={`${modal.mode === "add" ? "Add" : modal.mode === "edit" ? "Edit" : "Delete"} ${modal.entityType.charAt(0).toUpperCase() + modal.entityType.slice(1)}`}
                mode={modal.mode}
                fields={fieldConfigs[modal.entityType] || []}
                initialData={modal.data}
                onSave={handleSave}
                entityName={modal.entityType}
            />
        </div>
    );
}
