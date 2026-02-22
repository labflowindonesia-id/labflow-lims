"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/Label";
import { useCustomers } from "@/hooks/use-supabase";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface CustomerContact {
    id: string;
    customer_id: string;
    name: string;
    email: string | null;
    mobile: string | null;
    is_primary: boolean;
}

interface ClientSelectorCustomer {
    id: string;
    name: string;
    address: string | null;
    phone?: string | null;
    email?: string | null;
    code?: string | null;
    is_active: boolean;
}

interface ClientSelectorProps {
    selectedCustomerId?: string;
    selectedContactId?: string;
    onCustomerChange: (customer: ClientSelectorCustomer) => void;
    onContactChange: (contact: CustomerContact) => void;
}

export function ClientSelector({ selectedCustomerId, selectedContactId, onCustomerChange, onContactChange }: ClientSelectorProps) {
    const { data: customersList = [] } = useCustomers();
    const customers = customersList as ClientSelectorCustomer[];

    const activeCustomer = customers.find(c => c.id === selectedCustomerId);

    const [availableContacts, setAvailableContacts] = useState<CustomerContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);

    // Fetch contacts from customer_contacts table when customer changes
    useEffect(() => {
        if (!selectedCustomerId) {
            setAvailableContacts([]);
            return;
        }

        let cancelled = false;
        setLoadingContacts(true);

        supabase
            .from("customer_contacts")
            .select("*")
            .eq("customer_id", selectedCustomerId)
            .eq("is_active", true)
            .order("is_primary", { ascending: false })
            .then(({ data, error }) => {
                if (cancelled) return;
                setLoadingContacts(false);

                if (error) {
                    console.error("Failed to fetch contacts:", error);
                    setAvailableContacts([]);
                    return;
                }

                const contacts = (data || []) as CustomerContact[];
                setAvailableContacts(contacts);

                // Auto-select primary contact if no contact selected yet
                if (!selectedContactId && contacts.length > 0) {
                    const primary = contacts.find(c => c.is_primary);
                    if (primary) onContactChange(primary);
                    else onContactChange(contacts[0]);
                }
            });

        return () => { cancelled = true; };
    }, [selectedCustomerId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Customer Dropdown */}
            <div className="space-y-2">
                <Label>Customer / Client</Label>
                <select
                    className="flex h-10 w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm dark:bg-white/5 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none"
                    value={selectedCustomerId || ""}
                    onChange={(e) => {
                        const cust = customers.find(c => c.id === e.target.value);
                        if (cust) onCustomerChange(cust);
                    }}
                >
                    <option value="" disabled>Select Customer...</option>
                    {customers.map(c => (
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
                        (!selectedCustomerId || loadingContacts) && "opacity-50 cursor-not-allowed"
                    )}
                    value={selectedContactId || ""}
                    disabled={!selectedCustomerId || loadingContacts}
                    onChange={(e) => {
                        const contact = availableContacts.find(c => c.id === e.target.value);
                        if (contact) onContactChange(contact);
                    }}
                >
                    <option value="" disabled>
                        {loadingContacts ? "Loading contacts..." : "Select Contact Person..."}
                    </option>
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
                        {activeCustomer.address || "-"}
                    </div>
                    {selectedContactId && (() => {
                        const selected = availableContacts.find(c => c.id === selectedContactId);
                        return selected ? (
                            <>
                                <div>
                                    <span className="font-semibold block mb-1">Email</span>
                                    {selected.email || "-"}
                                </div>
                                <div>
                                    <span className="font-semibold block mb-1">Phone</span>
                                    {selected.mobile || "-"}
                                </div>
                            </>
                        ) : null;
                    })()}
                </div>
            )}
        </div>
    );
}
