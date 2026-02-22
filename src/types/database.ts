/**
 * Supabase Database Types
 * Auto-generated from LabFlow LIMS schema
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// Enum types matching database
export type UserRole = "ADMIN" | "MANAGER" | "ANALYST";
export type QuotationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
export type WorkOrderStatus = "RECEIVED_DRAFT" | "RECEIVED_CONFIRMED" | "IN_ANALYSIS" | "IN_REVIEW" | "COMPLETED" | "CANCELLED";
export type TaskStatus = "PLANNED" | "ASSIGNED" | "IN_PROGRESS" | "WAITING_RECHECK" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type ReportStatus = "DRAFT" | "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED" | "LOCKED" | "RELEASED";
export type QCStatus = "PASS" | "FAIL" | "NONE";
export type ComplianceStatus = "PASS" | "FAIL" | "NOT_EVALUATED";
export type InstrumentStatus = "CALIBRATED" | "NOT_CALIBRATED" | "IN_REPAIR";
export type ConditionStatus = "INTACT" | "LEAK" | "DAMAGED" | "OTHER";
export type SubmissionStatus = "SUBMITTED" | "RETURNED" | "APPROVED";
export type ChangeRequestStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED" | "APPLIED";

// Table row types
export interface Tables {
    users: {
        Row: {
            id: string;
            full_name: string;
            email: string;
            role: UserRole;
            is_active: boolean;
            last_login_at: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["users"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["users"]["Insert"]>;
    };
    customers: {
        Row: {
            id: string;
            name: string;
            code: string | null;
            address: string | null;
            city: string | null;
            country: string | null;
            tax_id: string | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["customers"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["customers"]["Insert"]>;
    };
    customer_contacts: {
        Row: {
            id: string;
            customer_id: string;
            name: string;
            position: string | null;
            email: string | null;
            phone: string | null;
            is_primary: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["customer_contacts"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["customer_contacts"]["Insert"]>;
    };
    quotations: {
        Row: {
            id: string;
            quotation_number: string;
            customer_id: string;
            customer_name_snapshot: string | null;
            customer_address_snapshot: string | null;
            status: QuotationStatus;
            subtotal: number;
            discount_percent: number | null;
            discount_amount: number | null;
            tax_percent: number | null;
            tax_amount: number | null;
            grand_total: number;
            valid_until: string | null;
            notes: string | null;
            created_by: string | null;
            submitted_at: string | null;
            approved_by: string | null;
            approved_at: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["quotations"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["quotations"]["Insert"]>;
    };
    work_orders: {
        Row: {
            id: string;
            work_order_number: string;
            quotation_id: string | null;
            customer_id: string;
            customer_name_snapshot: string | null;
            customer_address_snapshot: string | null;
            contract_number: string | null;
            received_date: string;
            due_date: string | null;
            status: WorkOrderStatus;
            priority: TaskPriority;
            sample_count: number;
            notes: string | null;
            created_by: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["work_orders"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["work_orders"]["Insert"]>;
    };
    samples: {
        Row: {
            id: string;
            sample_lab_id: string;
            work_order_id: string;
            sample_name: string | null;
            matrix_id: string | null;
            customer_sample_id: string | null;
            description: string | null;
            condition_status: ConditionStatus;
            storage_location_id: string | null;
            received_date: string;
            received_by: string | null;
            notes: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["samples"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["samples"]["Insert"]>;
    };
    test_tasks: {
        Row: {
            id: string;
            task_number: string;
            requested_test_id: string | null;
            sample_id: string | null;
            work_plan_id: string | null;
            parameter_id: string | null;
            subparameter_id: string | null;
            method_id: string | null;
            instrument_id: string | null;
            assigned_to_id: string | null;
            assigned_by: string | null;
            assigned_at: string | null;
            status: TaskStatus;
            priority: TaskPriority;
            planned_date: string | null;
            due_date: string | null;
            started_at: string | null;
            completed_at: string | null;
            is_overdue: boolean;
            is_urgent: boolean;
            notes: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["test_tasks"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["test_tasks"]["Insert"]>;
    };
    test_results: {
        Row: {
            id: string;
            task_id: string;
            run_id: string | null;
            parameter_id: string | null;
            subparameter_id: string | null;
            result_value: number | null;
            result_text: string | null;
            unit_id: string | null;
            is_nd: boolean;
            nd_reporting_style: string | null;
            lod_value: number | null;
            loq_value: number | null;
            uncertainty: number | null;
            uncertainty_unit: string | null;
            limit_min: number | null;
            limit_max: number | null;
            compliance_status: ComplianceStatus | null;
            qc_recovery_percent: number | null;
            qc_status: QCStatus | null;
            entered_by: string | null;
            entered_at: string | null;
            version: number;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["test_results"]["Row"], "created_at" | "updated_at" | "version">;
        Update: Partial<Tables["test_results"]["Insert"]>;
    };
    reports: {
        Row: {
            id: string;
            report_number: string;
            revision_number: number;
            work_order_id: string;
            status: ReportStatus;
            title: string | null;
            regulation_reference: string | null;
            generated_by: string | null;
            generated_at: string | null;
            approved_by: string | null;
            approved_at: string | null;
            signature_id: string | null;
            signed_at: string | null;
            is_locked: boolean;
            locked_at: string | null;
            locked_by: string | null;
            released_at: string | null;
            released_by: string | null;
            internal_notes: string | null;
            public_notes: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["reports"]["Row"], "created_at" | "updated_at" | "revision_number" | "is_locked">;
        Update: Partial<Tables["reports"]["Insert"]>;
    };
    parameters: {
        Row: {
            id: string;
            name: string;
            symbol: string | null;
            group: string | null;
            category: string | null;
            default_unit_id: string | null;
            has_subparameter: boolean;
            loq_default: number | null;
            lod_default: number | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["parameters"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["parameters"]["Insert"]>;
    };
    methods: {
        Row: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["methods"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["methods"]["Insert"]>;
    };
    instruments: {
        Row: {
            id: string;
            name: string;
            code: string | null;
            model: string | null;
            serial_number: string | null;
            location: string | null;
            status: InstrumentStatus;
            calibration_due_date: string | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["instruments"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["instruments"]["Insert"]>;
    };
    units: {
        Row: {
            id: string;
            symbol: string;
            name: string | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["units"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["units"]["Insert"]>;
    };
    sample_matrices: {
        Row: {
            id: string;
            name: string;
            category: string | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["sample_matrices"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["sample_matrices"]["Insert"]>;
    };
    subparameters: {
        Row: {
            id: string;
            parameter_id: string;
            name: string;
            cas_number: string | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["subparameters"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["subparameters"]["Insert"]>;
    };
    matrix_parameter_rules: {
        Row: {
            id: string;
            matrix_id: string;
            parameter_id: string;
            default_method_id: string | null;
            default_instrument_id: string | null;
            default_tat_days: number | null;
            limit_type: string | null;
            limit_min: number | null;
            limit_max: number | null;
            limit_unit_id: string | null;
            lod_default: number | null;
            base_price: number | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["matrix_parameter_rules"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["matrix_parameter_rules"]["Insert"]>;
    };
    test_packages: {
        Row: {
            id: string;
            name: string;
            matrix_id: string;
            description: string | null;
            total_price: number;
            tat_days: number;
            regulation: string | null;
            notes: string | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["test_packages"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["test_packages"]["Insert"]>;
    };
    test_package_items: {
        Row: {
            id: string;
            package_id: string;
            parameter_id: string;
            subparameter_id: string | null;
            method_id: string;
            instrument_id: string;
            price_override: number | null;
            created_at: string;
        };
        Insert: Omit<Tables["test_package_items"]["Row"], "created_at">;
        Update: Partial<Tables["test_package_items"]["Insert"]>;
    };
    departments: {
        Row: {
            id: string;
            name: string;
            code: string | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["departments"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["departments"]["Insert"]>;
    };
    test_runs: {
        Row: {
            id: string;
            task_id: string;
            run_number: number;
            instrument_id: string | null;
            dilution_factor: number | null;
            raw_reading: number | null;
            blank_reading: number | null;
            started_at: string | null;
            completed_at: string | null;
            performed_by: string | null;
            notes: string | null;
            is_final: boolean;
            created_at: string;
        };
        Insert: Omit<Tables["test_runs"]["Row"], "created_at">;
        Update: Partial<Tables["test_runs"]["Insert"]>;
    };
    result_submissions: {
        Row: {
            id: string;
            work_order_id: string;
            sample_id: string | null;
            submitted_by: string | null;
            submitted_at: string;
            status: SubmissionStatus;
            remarks: string | null;
            reviewed_by: string | null;
            reviewed_at: string | null;
            created_at: string;
        };
        Insert: Omit<Tables["result_submissions"]["Row"], "created_at">;
        Update: Partial<Tables["result_submissions"]["Insert"]>;
    };
    review_audit_logs: {
        Row: {
            id: string;
            work_order_id: string;
            submission_id: string | null;
            action: string;
            performed_by: string | null;
            notes: string | null;
            created_at: string;
        };
        Insert: Omit<Tables["review_audit_logs"]["Row"], "created_at">;
        Update: Partial<Tables["review_audit_logs"]["Insert"]>;
    };
    price_list: {
        Row: {
            id: string;
            matrix_id: string;
            parameter_id: string;
            price_amount: number;
            currency: string;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["price_list"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["price_list"]["Insert"]>;
    };
    lab_settings: {
        Row: {
            id: string;
            lab_name: string;
            company_code: string | null;
            support_email: string | null;
            support_phone: string | null;
            address: string | null;
            accreditation_number: string | null;
            default_currency: string;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["lab_settings"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["lab_settings"]["Insert"]>;
    };
    analyst_profiles: {
        Row: {
            id: string;
            user_id: string;
            employee_id: string | null;
            specialization: string | null;
            job_description: string | null;
            job_description_url: string | null;
            education: string | null;
            years_experience: number;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["analyst_profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["analyst_profiles"]["Insert"]>;
    };
    analyst_competencies: {
        Row: {
            id: string;
            profile_id: string;
            name: string;
            category: string | null;
            level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | null;
            acquired_date: string | null;
            expiry_date: string | null;
            notes: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["analyst_competencies"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["analyst_competencies"]["Insert"]>;
    };
    analyst_certificates: {
        Row: {
            id: string;
            profile_id: string;
            name: string;
            issuer: string | null;
            certificate_number: string | null;
            issued_date: string | null;
            expiry_date: string | null;
            document_url: string | null;
            document_name: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["analyst_certificates"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Tables["analyst_certificates"]["Insert"]>;
    };
    qc_corrective_actions: {
        Row: {
            id: string;
            result_id: string;
            action: string;
            action_type: string | null;
            performed_by: string | null;
            notes: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<Tables["qc_corrective_actions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Tables["qc_corrective_actions"]["Insert"]>;
    };
}

// Database interface for Supabase client
export interface Database {
    public: {
        Tables: Tables;
        Enums: {
            user_role: UserRole;
            quotation_status: QuotationStatus;
            work_order_status: WorkOrderStatus;
            task_status: TaskStatus;
            task_priority: TaskPriority;
            report_status: ReportStatus;
            qc_status: QCStatus;
            compliance_status: ComplianceStatus;
            instrument_status: InstrumentStatus;
            condition_status: ConditionStatus;
            submission_status: SubmissionStatus;
            change_request_status: ChangeRequestStatus;
        };
    };
}

// Helper types for common queries
export type User = Tables["users"]["Row"];
export type Customer = Tables["customers"]["Row"];
export type Quotation = Tables["quotations"]["Row"];
export type WorkOrder = Tables["work_orders"]["Row"];
export type Sample = Tables["samples"]["Row"];
export type TestTask = Tables["test_tasks"]["Row"];
export type TestResult = Tables["test_results"]["Row"];
export type Report = Tables["reports"]["Row"];
export type Parameter = Tables["parameters"]["Row"];
export type Method = Tables["methods"]["Row"];
export type Instrument = Tables["instruments"]["Row"];
export type Unit = Tables["units"]["Row"];
export type SampleMatrix = Tables["sample_matrices"]["Row"];
export type SubParameter = Tables["subparameters"]["Row"];
export type MatrixParameterRule = Tables["matrix_parameter_rules"]["Row"];
export type TestPackage = Tables["test_packages"]["Row"];
export type TestPackageItem = Tables["test_package_items"]["Row"];
export type Department = Tables["departments"]["Row"];
export type TestRun = Tables["test_runs"]["Row"];
export type ResultSubmission = Tables["result_submissions"]["Row"];
export type PriceListItem = Tables["price_list"]["Row"];
export type LabSettings = Tables["lab_settings"]["Row"];
export type AnalystProfile = Tables["analyst_profiles"]["Row"];
export type AnalystCompetency = Tables["analyst_competencies"]["Row"];
export type AnalystCertificate = Tables["analyst_certificates"]["Row"];
export type ReviewAuditLog = Tables["review_audit_logs"]["Row"];
export type QCCorrectiveAction = Tables["qc_corrective_actions"]["Row"];

