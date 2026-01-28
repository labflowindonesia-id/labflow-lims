import { Customer, CustomerContact, SampleMatrix, Parameter, Method, Instrument } from "@/types/master-data";

export type QuotationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface QuotationHdr {
    id: string;
    quotation_no: string; // Auto-generated
    created_at: Date;
    valid_until: Date;
    status: QuotationStatus;

    // Client Snapshot
    customer_id: string;
    contact_id: string;

    // Financials
    subtotal: number;
    tax_percent: number; // 0.11
    tax_amount: number;
    total: number;
}

export interface QuotationLineItem {
    id: string; // uuid for list key
    matrix_id: string;
    parameter_id: string;

    // Auto-filled from Rules but editable
    method_id: string;
    instrument_id: string;
    unit_price: number;
    qty: number;
    total_price: number;
    lead_time_days: number;
}
