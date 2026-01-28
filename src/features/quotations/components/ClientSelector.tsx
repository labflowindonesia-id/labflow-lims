import { useState, useEffect } from "react";
import { Label } from "@/components/ui/Label";
import { MOCK_CUSTOMERS, MOCK_USERS } from "@/data/mock-db";
import { Customer, CustomerContact } from "@/types/master-data";
import { cn } from "@/lib/utils";

interface ClientSelectorProps {
    selectedCustomerId?: string;
    selectedContactId?: string;
    onCustomerChange: (customer: Customer) => void;
    onContactChange: (contact: CustomerContact) => void;
}

export function ClientSelector({ selectedCustomerId, selectedContactId, onCustomerChange, onContactChange }: ClientSelectorProps) {
    // Local state for UI feedback
    const activeCustomer = MOCK_CUSTOMERS.find(c => c.id === selectedCustomerId);

    // Logic: When customer changes, available contacts change
    const [availableContacts, setAvailableContacts] = useState<CustomerContact[]>([]);

    useEffect(() => {
        if (activeCustomer) {
            setAvailableContacts(activeCustomer.contacts);
            // Auto-select primary contact if no contact selected yet
            if (!selectedContactId) {
                const primary = activeCustomer.contacts.find(c => c.is_primary);
                if (primary) onContactChange(primary);
            }
        } else {
            setAvailableContacts([]);
        }
    }, [activeCustomer?.id]); // Only re-run if ID changes

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Customer Dropdown */}
            <div className="space-y-2">
                <Label>Customer / Client</Label>
                <select
                    className="flex h-10 w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm dark:bg-white/5 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none"
                    value={selectedCustomerId || ""}
                    onChange={(e) => {
                        const cust = MOCK_CUSTOMERS.find(c => c.id === e.target.value);
                        if (cust) onCustomerChange(cust);
                    }}
                >
                    <option value="" disabled>Select Customer...</option>
                    {MOCK_CUSTOMERS.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Contact Dropdown */}
            <div className="space-y-2">
                <Label>Attention To (CP)</Label>
                <select
                    className={cn(
                        "flex h-10 w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm dark:bg-white/5 dark:border-white/10 outline-none",
                        !selectedCustomerId && "opacity-50 cursor-not-allowed"
                    )}
                    value={selectedContactId || ""}
                    disabled={!selectedCustomerId}
                    onChange={(e) => {
                        const contact = availableContacts.find(c => c.id === e.target.value);
                        if (contact) onContactChange(contact);
                    }}
                >
                    <option value="" disabled>Select Contact Person...</option>
                    {availableContacts.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.name} {c.is_primary ? "(Primary)" : ""}
                        </option>
                    ))}
                </select>
            </div>

            {/* Read-only details preview */}
            {activeCustomer && (
                <div className="md:col-span-2 rounded-md bg-slate-50 p-3 text-xs text-text-secondary dark:bg-white/5 flex gap-6">
                    <div>
                        <span className="font-semibold block mb-1">Address</span>
                        {activeCustomer.address}
                    </div>
                    {selectedContactId && (() => {
                        const selected = availableContacts.find(c => c.id === selectedContactId);
                        return selected ? (
                            <>
                                <div>
                                    <span className="font-semibold block mb-1">Email</span>
                                    {selected.email}
                                </div>
                                <div>
                                    <span className="font-semibold block mb-1">Phone</span>
                                    {selected.mobile}
                                </div>
                            </>
                        ) : null;
                    })()}
                </div>
            )}
        </div>
    );
}
