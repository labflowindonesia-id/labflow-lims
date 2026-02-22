/**
 * Quotation Service
 * Handles all quotation-related database operations
 */

import { supabase } from "@/lib/supabase";

// ============================================
// TYPES
// ============================================

export interface QuotationInsert {
    quotation_number: string;
    revision_number: number;
    customer_id: string;
    contact_id?: string;
    customer_name_snapshot?: string;
    customer_address_snapshot?: string;
    matrix_id: string;
    sample_count: number;
    sampling_type?: string;
    urgency_factor?: number;
    valid_until: string; // ISO date string
    tat_days: number;
    status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
    subtotal: number;
    discount?: number;
    tax_rate?: number;
    tax_amount?: number;
    grand_total: number;
    currency: string;
    internal_notes?: string;
    public_notes?: string;
    terms_conditions?: string;
    created_by: string;
}

export interface QuotationLineInsert {
    quotation_id: string;
    line_number: number;
    parameter_id?: string;
    subparameter_id?: string;
    package_id?: string;
    method_id?: string;
    instrument_id?: string;
    parameter_name_snapshot?: string;
    method_code_snapshot?: string;
    unit_price: number;
    quantity: number;
    discount_percent?: number;
    line_total: number;
    tat_days?: number;
    notes?: string;
}

export interface AuditEventInsert {
    entity_type: string;
    entity_id: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "SUBMIT" | "APPROVE" | "REJECT" | "GENERATE_PDF";
    user_id?: string;
    user_email?: string;
    user_role?: string;
    old_values?: Record<string, unknown>;
    new_values?: Record<string, unknown>;
    changed_fields?: string[];
    reason?: string;
}

export interface ContractReviewInsert {
    quotation_id: string;
    laboratory_capability_ok?: boolean;
    resource_availability_ok?: boolean;
    sample_requirements_ok?: boolean;
    method_availability_ok?: boolean;
    subcontracting_ok?: boolean;
    delivery_timeline_ok?: boolean;
    status: "APPROVED" | "REJECTED";
    notes?: string;
    reviewed_by?: string;
    reviewed_at?: string;
}

// ============================================
// QUOTATION CRUD
// ============================================

export async function createQuotation(data: QuotationInsert) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: row, error } = await supabase
        .from("quotations")
        .insert({ id, ...data, created_at: now, updated_at: now })
        .select()
        .single();

    if (error) throw error;
    return row;
}

export async function updateQuotationStatus(
    id: string,
    updates: Record<string, unknown>
) {
    const now = new Date().toISOString();
    const { data: row, error } = await supabase
        .from("quotations")
        .update({ ...updates, updated_at: now })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return row;
}

// ============================================
// LINE ITEMS CRUD
// ============================================

export async function insertQuotationLines(lines: QuotationLineInsert[]) {
    if (lines.length === 0) return [];

    const now = new Date().toISOString();
    const rows = lines.map(line => ({
        id: crypto.randomUUID(),
        ...line,
        created_at: now,
        updated_at: now,
    }));

    const { data, error } = await supabase
        .from("quotation_lines")
        .insert(rows)
        .select();

    if (error) throw error;
    return data;
}

export async function deleteQuotationLines(quotationId: string) {
    const { error } = await supabase
        .from("quotation_lines")
        .delete()
        .eq("quotation_id", quotationId);

    if (error) throw error;
}

// ============================================
// AUDIT TRAIL
// ============================================

export async function logAuditEvent(data: AuditEventInsert) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
        .from("audit_events")
        .insert({
            id,
            ...data,
            changed_fields: data.changed_fields ? JSON.stringify(data.changed_fields) : null,
            created_at: now,
        });

    if (error) {
        console.error("Failed to log audit event:", error);
        // Non-blocking: don't throw so the main operation still succeeds
    }
}

// ============================================
// CONTRACT REVIEW
// ============================================

export async function insertContractReview(data: ContractReviewInsert) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: row, error } = await supabase
        .from("contract_reviews")
        .insert({ id, ...data, created_at: now, updated_at: now })
        .select()
        .single();

    if (error) throw error;
    return row;
}

// ============================================
// QUOTATION NUMBER GENERATOR
// ============================================

export async function generateQuotationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `QT-${year}-`;

    // Find the latest quotation number for this year
    const { data, error } = await supabase
        .from("quotations")
        .select("quotation_number")
        .like("quotation_number", `${prefix}%`)
        .order("quotation_number", { ascending: false })
        .limit(1);

    if (error) throw error;

    let nextNum = 1;
    if (data && data.length > 0) {
        const lastNo = data[0].quotation_number;
        const numPart = parseInt(lastNo.replace(prefix, ""), 10);
        if (!isNaN(numPart)) nextNum = numPart + 1;
    }

    return `${prefix}${String(nextNum).padStart(3, "0")}`;
}
