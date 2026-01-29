import { Customer, Instrument, MatrixParameterRule, Method, Parameter, Report, ResultSubmission, SampleMatrix, TestResult, TestTask, Unit, User, Quotation, WorkOrder } from "@/types/master-data";

// ... (Previous MOCK_USERS, CUSTOMERS, TECHNOLOGY, MATRICES, PARAMETERS, RULES)

// --- 1. USERS ---
export const MOCK_USERS: User[] = [
    { id: "usr-001", full_name: "Admin LIMS", email: "admin@labflow.id", role: "ADMIN", is_active: true },
    { id: "usr-002", full_name: "Lab Manager", email: "manager@labflow.id", role: "MANAGER", is_active: true },
    { id: "usr-003", full_name: "Analyst Kimia", email: "analyst1@labflow.id", role: "ANALYST", is_active: true },
];

export const MOCK_CUSTOMERS: Customer[] = [
    {
        id: "cust-001",
        name: "PT. Indofood Sukses Makmur",
        address: "Jl. Jend. Sudirman Kav 76-78, Jakarta",
        contacts: [
            { id: "cc-001", customer_id: "cust-001", name: "Budi Santoso", email: "budi.s@indofood.co.id", mobile: "+62812345678", is_primary: true },
            { id: "cc-002", customer_id: "cust-001", name: "Siti HSE", email: "siti.hse@indofood.co.id", mobile: "+62812987654", is_primary: false },
        ],
        is_active: true
    },
    {
        id: "cust-002",
        name: "Dinas Lingkungan Hidup DKI",
        address: "Jl. Mandala V No.67, Cililitan",
        contacts: [
            { id: "cc-003", customer_id: "cust-002", name: "Pak Kabid", email: "kabid@dlh.jakarta.go.id", mobile: "+628111122233", is_primary: true },
        ],
        is_active: true
    }
];

export const MOCK_UNITS: Unit[] = [
    { id: "u-001", symbol: "mg/L", name: "Milligram per Liter" },
    { id: "u-002", symbol: "°C", name: "Degree Celsius" },
    { id: "u-003", symbol: "CFU/100mL", name: "Colony Forming Units" },
    { id: "u-004", symbol: "-", name: "No Unit (pH)" },
];

export const MOCK_INSTRUMENTS: Instrument[] = [
    { id: "ins-001", name: "Spectrophotometer UV-Vis", is_active: true },
    { id: "ins-002", name: "ICP-OES", is_active: true },
    { id: "ins-003", name: "AAS", is_active: true },
    { id: "ins-004", name: "pH Meter Portable", is_active: true },
];

export const MOCK_METHODS: Method[] = [
    { id: "met-001", code: "SNI 6989.2:2009", name: "Cara Uji COD dengan Refluks Tertutup" },
    { id: "met-002", code: "SNI 6989.11:2004", name: "Cara Uji Derajat Keasaman (pH)" },
    { id: "met-003", code: "USEPA 200.7", name: "Metals by ICP-OES" },
];

export const MOCK_MATRICES: SampleMatrix[] = [
    { id: "mat-001", name: "Air Limbah Domestik", category: "Environment" },
    { id: "mat-002", name: "Air Minum", category: "Environment" },
    { id: "mat-003", name: "Tanah / Soil", category: "Environment" },
];

export const MOCK_PARAMETERS: Parameter[] = [
    { id: "par-001", name: "COD (Chemical Oxygen Demand)", group: "Kimia", unit_id: "u-001", is_active: true },
    { id: "par-002", name: "pH", group: "Fisika", unit_id: "u-004", is_active: true },
    { id: "par-003", name: "Lead (Pb)", group: "Logam Berat", unit_id: "u-001", is_active: true },
    { id: "par-004", name: "Cadmium (Cd)", group: "Logam Berat", unit_id: "u-001", is_active: true },
];

export const MOCK_RULES: MatrixParameterRule[] = [
    {
        id: "rule-001",
        matrix_id: "mat-001",
        parameter_id: "par-001",
        default_method_id: "met-001",
        default_instrument_id: "ins-001",
        default_tat_days: 5,
        limit_type: "MAX",
        limit_max: 100,
        limit_unit_id: "u-001",
        lod_default: 10,
        base_price: 75000
    },
    {
        id: "rule-002",
        matrix_id: "mat-001",
        parameter_id: "par-002",
        default_method_id: "met-002",
        default_instrument_id: "ins-004",
        default_tat_days: 1,
        limit_type: "RANGE",
        limit_min: 6,
        limit_max: 9,
        limit_unit_id: "u-004",
        lod_default: 0,
        base_price: 25000
    },
    {
        id: "rule-003",
        matrix_id: "mat-001",
        parameter_id: "par-003",
        default_method_id: "met-003",
        default_instrument_id: "ins-002",
        default_tat_days: 7,
        limit_type: "MAX",
        limit_max: 0.1,
        limit_unit_id: "u-001",
        lod_default: 0.005,
        base_price: 125000
    },
    {
        id: "rule-004",
        matrix_id: "mat-001",
        parameter_id: "par-004",
        default_method_id: "met-003",
        default_instrument_id: "ins-002",
        default_tat_days: 7,
        limit_type: "MAX",
        limit_max: 0.01,
        limit_unit_id: "u-001",
        lod_default: 0.001,
        base_price: 125000
    },
    {
        id: "rule-005",
        matrix_id: "mat-002",
        parameter_id: "par-002",
        default_method_id: "met-002",
        default_instrument_id: "ins-004",
        default_tat_days: 1,
        limit_type: "RANGE",
        limit_min: 6.5,
        limit_max: 8.5,
        limit_unit_id: "u-004",
        lod_default: 0,
        base_price: 25000
    }
];

// --- SUB-PARAMETERS ---
export interface SubParameter {
    id: string;
    parameter_id: string;
    name: string;
    cas_number?: string;
    is_active: boolean;
}

export const MOCK_SUBPARAMETERS: SubParameter[] = [
    { id: "subpar-001", parameter_id: "par-003", name: "Lead (Pb)", cas_number: "7439-92-1", is_active: true },
    { id: "subpar-002", parameter_id: "par-003", name: "Arsenic (As)", cas_number: "7440-38-2", is_active: true },
    { id: "subpar-003", parameter_id: "par-003", name: "Mercury (Hg)", cas_number: "7439-97-6", is_active: true },
    { id: "subpar-004", parameter_id: "par-004", name: "Cadmium (Cd)", cas_number: "7440-43-9", is_active: true },
    { id: "subpar-005", parameter_id: "par-004", name: "Chromium (Cr)", cas_number: "7440-47-3", is_active: true },
];

// --- TEST PACKAGES ---
export interface TestPackage {
    id: string;
    name: string;
    matrix_id: string;
    description: string;
    total_price: number;
    tat_days: number;
    is_active: boolean;
}

export interface TestPackageItem {
    id: string;
    package_id: string;
    parameter_id: string;
    subparameter_id?: string;
    method_id: string;
    instrument_id: string;
    price_override?: number;
}

export const MOCK_TEST_PACKAGES: TestPackage[] = [
    {
        id: "pkg-001",
        name: "Basic Water Quality",
        matrix_id: "mat-001",
        description: "Essential parameters for wastewater monitoring",
        total_price: 250000,
        tat_days: 5,
        is_active: true
    },
    {
        id: "pkg-002",
        name: "Heavy Metals Panel",
        matrix_id: "mat-001",
        description: "Complete heavy metal analysis (Pb, Cd, As, Hg, Cr)",
        total_price: 550000,
        tat_days: 7,
        is_active: true
    },
    {
        id: "pkg-003",
        name: "Drinking Water Compliance",
        matrix_id: "mat-002",
        description: "Full parameter set for drinking water regulations",
        total_price: 750000,
        tat_days: 7,
        is_active: true
    }
];

export const MOCK_TEST_PACKAGE_ITEMS: TestPackageItem[] = [
    { id: "pkgi-001", package_id: "pkg-001", parameter_id: "par-001", method_id: "met-001", instrument_id: "ins-001" },
    { id: "pkgi-002", package_id: "pkg-001", parameter_id: "par-002", method_id: "met-002", instrument_id: "ins-004" },
    { id: "pkgi-003", package_id: "pkg-002", parameter_id: "par-003", method_id: "met-003", instrument_id: "ins-002" },
    { id: "pkgi-004", package_id: "pkg-002", parameter_id: "par-004", method_id: "met-003", instrument_id: "ins-002" },
];

// --- DEPARTMENTS ---
export interface Department {
    id: string;
    name: string;
    is_active: boolean;
}

export const MOCK_DEPARTMENTS: Department[] = [
    { id: "dept-001", name: "Chemistry Lab", is_active: true },
    { id: "dept-002", name: "Microbiology Lab", is_active: true },
    { id: "dept-003", name: "Physical Testing", is_active: true },
    { id: "dept-004", name: "Sample Receiving", is_active: true },
];

export const MOCK_TASKS: TestTask[] = [
    {
        id: "task-001",
        work_order_id: "WO-2026-001",
        sample_id: "S-001",
        sample_name_snapshot: "Outlet IPAL - Timut",
        matrix_name_snapshot: "Air Limbah Domestik",
        parameter_id: "par-001",
        parameter_name_snapshot: "COD",
        method_id_snapshot: "met-001",
        instrument_id_snapshot: "ins-001",
        assigned_to_user_id: "usr-003",
        due_date: new Date(new Date().setDate(new Date().getDate() + 2)),
        priority: "NORMAL",
        status: "WAITING_RECHECK" // Updated status for Phase 3 demo
    }
];

export const MOCK_RESULTS: TestResult[] = [
    {
        id: "res-001",
        task_id: "task-001",
        is_nd: false,
        numeric_value: 110, // Intentionally HIGH to trigger Compliance FAIL
        unit_id: "u-001",
        formatted_limit_text: "Max 100 mg/L",
        compliance_status: "FAIL",
        qc_recovery: 98,
        qc_status: "PASS",
        analyst_remarks: "Value high, re-checked.",
        completed_at: new Date()
    }
];

export const MOCK_SUBMISSIONS: ResultSubmission[] = [
    {
        id: "sub-001",
        work_order_id: "WO-2026-001",
        sample_id: "S-001",
        submitted_by_user_id: "usr-003",
        submitted_at: new Date(),
        status: "SUBMITTED",
        total_tests: 1,
        qc_failure_count: 0 // QC Pass, but Compliance Fail
    }
];

// --- 9. LIST DATA (Phase 4) ---
export const MOCK_QUOTATIONS: Quotation[] = [
    {
        id: "q-2026-001",
        quotation_no: "QT-2026-001",
        customer_id: "cust-001",
        customer_name_snapshot: "PT. Indofood Sukses Makmur",
        created_at: new Date("2026-01-20"),
        total_amount: 1250000,
        status: "APPROVED"
    },
    {
        id: "q-2026-002",
        quotation_no: "QT-2026-002",
        customer_id: "cust-002",
        customer_name_snapshot: "Dinas Lingkungan Hidup DKI",
        created_at: new Date("2026-01-25"),
        total_amount: 5500000,
        status: "DRAFT"
    },
    {
        id: "q-2026-003",
        quotation_no: "QT-2026-003",
        customer_id: "cust-001",
        customer_name_snapshot: "PT. Indofood Sukses Makmur",
        created_at: new Date("2026-01-28"),
        total_amount: 850000,
        status: "SUBMITTED"
    }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
    {
        id: "wo-2026-001",
        work_order_no: "WO-2026-001",
        quotation_id: "q-2026-001",
        customer_id: "cust-001",
        customer_name_snapshot: "PT. Indofood Sukses Makmur",
        received_date: new Date("2026-01-22"),
        status: "IN_PROGRESS",
        sample_count: 3
    }
];
