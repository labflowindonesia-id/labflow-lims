export type UserRole = "ADMIN" | "MANAGER" | "ANALYST";

export interface User {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
}

export interface Department {
    id: string;
    name: string;
}

export interface CustomerContact {
    id: string;
    customer_id: string;
    name: string;
    email: string;
    mobile: string;
    is_primary: boolean;
}

export interface Customer {
    id: string;
    name: string;
    address: string;
    contacts: CustomerContact[];
    is_active: boolean;
}

export interface Unit {
    id: string;
    symbol: string; // mg/L, ppm
    name: string;
}

export interface Instrument {
    id: string;
    name: string; // ICP-OES
    model?: string;
    is_active: boolean;
}

export interface Method {
    id: string;
    code: string; // SNI 6989.82:2018
    name: string;
}

export interface Parameter {
    id: string;
    name: string; // COD, Arsenic
    group?: string; // Logam Berat
    unit_id: string;
    is_active: boolean;
}

export interface SampleMatrix {
    id: string;
    name: string; // Air Limbah Domestik
    category?: string; // Environment
}

// THE CORE LOGIC: Matrix-Specific Rules
export interface MatrixParameterRule {
    id: string;
    matrix_id: string;
    parameter_id: string;

    // Auto-population defaults
    default_method_id: string;
    default_instrument_id: string;
    default_tat_days: number;

    // Limits / QC
    limit_type: "MAX" | "MIN" | "RANGE" | "NONE";
    limit_min?: number;
    limit_max?: number;
    limit_unit_id?: string;

    lod_default?: number; // Limit of Detection

    // Commercial
    base_price: number;
}

export type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TaskStatus = "PLANNED" | "ASSIGNED" | "IN_PROGRESS" | "WAITING_RECHECK" | "COMPLETED" | "CANCELLED";

// 6. TASKS & WORKLIST (Phase 2)
export interface TestTask {
    id: string;
    work_order_id: string;
    sample_id: string;
    sample_name_snapshot: string; // for display in card
    matrix_name_snapshot: string;

    // Test Info
    parameter_id: string; // "par-001"
    parameter_name_snapshot: string; // "COD"
    method_id_snapshot: string; // "met-001"
    instrument_id_snapshot: string;

    // Planning
    assigned_to_user_id?: string;
    due_date: Date;
    priority: TaskPriority;
    status: TaskStatus;
}

// 7. RESULTS & QC (Phase 2)
export interface TestResult {
    id: string;
    task_id: string;

    // Value
    is_nd: boolean; // Not Detected
    numeric_value?: number;
    text_value?: string; // "< 0.005" if ND, or "DETECTED" for qual
    unit_id: string;

    // Limits / Compliance
    formatted_limit_text: string; // "Max 100"
    compliance_status: "PASS" | "FAIL" | "NOT_EVALUATED";

    // QC
    qc_recovery?: number; // 95%
    qc_status: "PASS" | "FAIL" | "NONE";

    analyst_remarks?: string;
    completed_at: Date;
}

// 8. REVIEW & REPORTING (Phase 3)
export type SubmissionStatus = "SUBMITTED" | "RETURNED" | "APPROVED";

export interface ResultSubmission {
    id: string;
    work_order_id: string;
    sample_id: string;
    submitted_by_user_id: string;
    submitted_at: Date;
    status: SubmissionStatus;

    // Quick Snapshot for Dashboard
    total_tests: number;
    qc_failure_count: number; // Red Flag
}

export type ReportStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "LOCKED" | "RELEASED";

export interface Report {
    id: string;
    report_no: string; // LF-2026-...
    work_order_id: string;
    sample_id: string;
    status: ReportStatus;
    created_at: Date;
    approved_at?: Date;
    approved_by_user_id?: string;
    is_locked: boolean;
}

// 9. CORE TRANSACTION LISTS (Phase 4)
export type QuotationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface Quotation {
    id: string;
    quotation_no: string;
    customer_id: string;
    customer_name_snapshot: string; // denormalized for list view
    created_at: Date;
    total_amount: number;
    status: QuotationStatus;
}

export type WorkOrderStatus = "RECEIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface WorkOrder {
    id: string;
    work_order_no: string; // WO-2026-001
    quotation_id?: string;
    customer_id: string;
    customer_name_snapshot: string;
    received_date: Date;
    status: WorkOrderStatus;
    sample_count: number;
}
