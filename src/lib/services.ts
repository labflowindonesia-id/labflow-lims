/**
 * Supabase Data Services
 * Provides typed data access for LIMS entities
 */

import { supabase } from "@/lib/supabase";
import type {
    User,
    Customer,
    Quotation,
    WorkOrder,
    Sample,
    TestTask,
    TestResult,
    Report,
    Parameter,
    Method,
    Instrument,
    Unit,
    SampleMatrix,
    SubParameter,
    MatrixParameterRule,
    TestPackage,
    TestPackageItem,
    Department,
    TestRun,
    ResultSubmission,
    PriceListItem,
    LabSettings,
    ReviewAuditLog,
    QCCorrectiveAction,
} from "@/types/database";

// Generic query helpers
async function fetchAll<T>(
    table: string,
    options?: {
        select?: string;
        orderBy?: { column: string; ascending?: boolean };
        filter?: { column: string; value: string | number | boolean };
        limit?: number;
    }
): Promise<T[]> {
    let query = supabase.from(table).select(options?.select || "*");

    if (options?.filter) {
        query = query.eq(options.filter.column, options.filter.value);
    }

    if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? true,
        });
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error(`Error fetching from ${table}:`, error);
        throw error;
    }

    return (data as T[]) || [];
}

async function fetchById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // Not found
        console.error(`Error fetching ${table} by id:`, error);
        throw error;
    }

    return data as T;
}

// ============================================
// USER SERVICES
// ============================================

export const userService = {
    getAll: () => fetchAll<User>("users", { orderBy: { column: "full_name" } }),
    getById: (id: string) => fetchById<User>("users", id),
    getActive: () =>
        fetchAll<User>("users", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "full_name" },
        }),
    getByRole: (role: User["role"]) =>
        fetchAll<User>("users", {
            filter: { column: "role", value: role },
            orderBy: { column: "full_name" },
        }),
};

// ============================================
// CUSTOMER SERVICES
// ============================================

export const customerService = {
    getAll: () =>
        fetchAll<Customer>("customers", { orderBy: { column: "name" } }),
    getById: (id: string) => fetchById<Customer>("customers", id),
    getActive: () =>
        fetchAll<Customer>("customers", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "name" },
        }),
    search: async (query: string): Promise<Customer[]> => {
        const { data, error } = await supabase
            .from("customers")
            .select("*")
            .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
            .order("name");

        if (error) throw error;
        return data || [];
    },
};

// ============================================
// QUOTATION SERVICES
// ============================================

export const quotationService = {
    getAll: () =>
        fetchAll<Quotation>("quotations", {
            orderBy: { column: "created_at", ascending: false },
        }),
    getById: (id: string) => fetchById<Quotation>("quotations", id),
    getByStatus: (status: Quotation["status"]) =>
        fetchAll<Quotation>("quotations", {
            filter: { column: "status", value: status },
            orderBy: { column: "created_at", ascending: false },
        }),
    getByCustomer: (customerId: string) =>
        fetchAll<Quotation>("quotations", {
            filter: { column: "customer_id", value: customerId },
            orderBy: { column: "created_at", ascending: false },
        }),
    getRecent: (limit = 10) =>
        fetchAll<Quotation>("quotations", {
            orderBy: { column: "created_at", ascending: false },
            limit,
        }),
};

// ============================================
// WORK ORDER SERVICES
// ============================================

export const workOrderService = {
    getAll: () =>
        fetchAll<WorkOrder>("work_orders", {
            orderBy: { column: "created_at", ascending: false },
        }),
    getById: (id: string) => fetchById<WorkOrder>("work_orders", id),
    getByStatus: (status: WorkOrder["status"]) =>
        fetchAll<WorkOrder>("work_orders", {
            filter: { column: "status", value: status },
            orderBy: { column: "created_at", ascending: false },
        }),
    getByCustomer: (customerId: string) =>
        fetchAll<WorkOrder>("work_orders", {
            filter: { column: "customer_id", value: customerId },
            orderBy: { column: "created_at", ascending: false },
        }),
    getInProgress: () =>
        fetchAll<WorkOrder>("work_orders", {
            filter: { column: "status", value: "IN_ANALYSIS" },
            orderBy: { column: "due_date" },
        }),
};

// ============================================
// SAMPLE SERVICES
// ============================================

export const sampleService = {
    getAll: () =>
        fetchAll<Sample>("samples", {
            orderBy: { column: "created_at", ascending: false },
        }),
    getById: (id: string) => fetchById<Sample>("samples", id),
    getByWorkOrder: (workOrderId: string) =>
        fetchAll<Sample>("samples", {
            filter: { column: "work_order_id", value: workOrderId },
            orderBy: { column: "created_at" },
        }),
};

// ============================================
// TEST TASK SERVICES (Worklist)
// ============================================

export const testTaskService = {
    getAll: () =>
        fetchAll<TestTask>("test_tasks", {
            orderBy: { column: "due_date" },
        }),
    getById: (id: string) => fetchById<TestTask>("test_tasks", id),
    getByStatus: (status: TestTask["status"]) =>
        fetchAll<TestTask>("test_tasks", {
            filter: { column: "status", value: status },
            orderBy: { column: "due_date" },
        }),
    getByAnalyst: (analystId: string) =>
        fetchAll<TestTask>("test_tasks", {
            filter: { column: "assigned_to_id", value: analystId },
            orderBy: { column: "due_date" },
        }),
    getWorklist: async (analystId?: string): Promise<TestTask[]> => {
        let query = supabase
            .from("test_tasks")
            .select("*")
            .in("status", ["ASSIGNED", "IN_PROGRESS", "WAITING_RECHECK"])
            .order("priority", { ascending: false })
            .order("due_date");

        if (analystId) {
            query = query.eq("assigned_to_id", analystId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },
    getOverdue: async (): Promise<TestTask[]> => {
        const { data, error } = await supabase
            .from("test_tasks")
            .select("*")
            .eq("is_overdue", true)
            .neq("status", "COMPLETED")
            .neq("status", "CANCELLED")
            .order("due_date");

        if (error) throw error;
        return data || [];
    },
};

// ============================================
// TEST RESULT SERVICES
// ============================================

export const testResultService = {
    getAll: () =>
        fetchAll<TestResult>("test_results", {
            orderBy: { column: "created_at", ascending: false },
        }),
    getById: (id: string) => fetchById<TestResult>("test_results", id),
    getByTask: (taskId: string) =>
        fetchAll<TestResult>("test_results", {
            filter: { column: "task_id", value: taskId },
            orderBy: { column: "created_at", ascending: false },
        }),
    getLatestByTask: async (taskId: string): Promise<TestResult | null> => {
        const { data, error } = await supabase
            .from("test_results")
            .select("*")
            .eq("task_id", taskId)
            .order("version", { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== "PGRST116") throw error;
        return data;
    },
};

// ============================================
// QC SERVICES
// ============================================

export const qcAlertService = {
    getFailedResults: async (): Promise<TestResult[]> => {
        const { data, error } = await supabase
            .from("test_results")
            .select("*")
            .or("compliance_status.eq.FAIL,qc_status.eq.FAIL")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data as TestResult[]) || [];
    },
};

export const qcControlChartService = {
    getByParameter: async (parameterId: string): Promise<TestResult[]> => {
        const { data, error } = await supabase
            .from("test_results")
            .select("*")
            .eq("parameter_id", parameterId)
            .order("created_at", { ascending: true });
        if (error) {
            console.error("[QC Chart] Supabase error:", error.message, error.details);
            throw error;
        }
        // Filter for non-null qc_recovery_percent on client side
        const filtered = (data || []).filter(
            (r: Record<string, unknown>) => r.qc_recovery_percent !== null && r.qc_recovery_percent !== undefined
        );
        return filtered as TestResult[];
    },
};

export const qcCorrectiveActionService = {
    getByResult: (resultId: string) =>
        fetchAll<QCCorrectiveAction>("qc_corrective_actions", {
            filter: { column: "result_id", value: resultId },
            orderBy: { column: "created_at", ascending: false },
        }),
    getAll: () =>
        fetchAll<QCCorrectiveAction>("qc_corrective_actions", {
            orderBy: { column: "created_at", ascending: false },
        }),
};

// ============================================
// REPORT SERVICES
// ============================================

export const reportService = {
    generateReportNumber: async (): Promise<string> => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const prefix = `RPT-${year}${month}`;

        const { data, error } = await supabase
            .from("reports")
            .select("report_number")
            .like("report_number", `${prefix}%`)
            .order("report_number", { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error generating report number:", error);
            throw new Error(`Failed to generate report number: ${error.message}`);
        }

        let sequence = 1;
        if (data && data.length > 0) {
            const lastNumberStr = (data as { report_number: string }[])[0].report_number;
            const lastSequenceStr = lastNumberStr.slice(-4);
            const lastSequence = parseInt(lastSequenceStr, 10);
            if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
            }
        }

        const sequenceStr = String(sequence).padStart(4, '0');
        return `${prefix}${sequenceStr}`;
    },
    getAll: () =>
        fetchAll<Report>("reports", {
            orderBy: { column: "created_at", ascending: false },
        }),
    getById: (id: string) => fetchById<Report>("reports", id),
    getByStatus: (status: Report["status"]) =>
        fetchAll<Report>("reports", {
            filter: { column: "status", value: status },
            orderBy: { column: "created_at", ascending: false },
        }),
    getByWorkOrder: (workOrderId: string) =>
        fetchAll<Report>("reports", {
            filter: { column: "work_order_id", value: workOrderId },
            orderBy: { column: "revision_number", ascending: false },
        }),
    getPendingReview: () =>
        fetchAll<Report>("reports", {
            filter: { column: "status", value: "SUBMITTED" },
            orderBy: { column: "generated_at" },
        }),
};

// ============================================
// MASTER DATA SERVICES
// ============================================

export const parameterService = {
    getAll: () =>
        fetchAll<Parameter>("parameters", { orderBy: { column: "name" } }),
    getById: (id: string) => fetchById<Parameter>("parameters", id),
    getActive: () =>
        fetchAll<Parameter>("parameters", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "name" },
        }),
};

export const methodService = {
    getAll: () => fetchAll<Method>("methods", { orderBy: { column: "code" } }),
    getById: (id: string) => fetchById<Method>("methods", id),
    getActive: () =>
        fetchAll<Method>("methods", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "code" },
        }),
};

export const instrumentService = {
    getAll: () =>
        fetchAll<Instrument>("instruments", { orderBy: { column: "name" } }),
    getById: (id: string) => fetchById<Instrument>("instruments", id),
    getActive: () =>
        fetchAll<Instrument>("instruments", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "name" },
        }),
};

export const unitService = {
    getAll: () => fetchAll<Unit>("units", { orderBy: { column: "symbol" } }),
    getById: (id: string) => fetchById<Unit>("units", id),
};

// ============================================
// ADDITIONAL MASTER DATA SERVICES
// ============================================

export const sampleMatrixService = {
    getAll: () => fetchAll<SampleMatrix>("sample_matrices", { orderBy: { column: "name" } }),
    getById: (id: string) => fetchById<SampleMatrix>("sample_matrices", id),
    getActive: () =>
        fetchAll<SampleMatrix>("sample_matrices", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "name" },
        }),
};

export const subparameterService = {
    getAll: () => fetchAll<SubParameter>("subparameters", { orderBy: { column: "name" } }),
    getById: (id: string) => fetchById<SubParameter>("subparameters", id),
    getByParameter: (parameterId: string) =>
        fetchAll<SubParameter>("subparameters", {
            filter: { column: "parameter_id", value: parameterId },
            orderBy: { column: "name" },
        }),
    getActive: () =>
        fetchAll<SubParameter>("subparameters", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "name" },
        }),
};

export const matrixParameterRuleService = {
    getAll: () => fetchAll<MatrixParameterRule>("matrix_parameter_rules", { orderBy: { column: "matrix_id" } }),
    getById: (id: string) => fetchById<MatrixParameterRule>("matrix_parameter_rules", id),
    getByMatrix: (matrixId: string) =>
        fetchAll<MatrixParameterRule>("matrix_parameter_rules", {
            filter: { column: "matrix_id", value: matrixId },
            orderBy: { column: "parameter_id" },
        }),
    getByParameter: (parameterId: string) =>
        fetchAll<MatrixParameterRule>("matrix_parameter_rules", {
            filter: { column: "parameter_id", value: parameterId },
        }),
    getActive: () =>
        fetchAll<MatrixParameterRule>("matrix_parameter_rules", {
            filter: { column: "is_active", value: true },
        }),
};

export const testPackageService = {
    getAll: () => fetchAll<TestPackage>("test_packages", { orderBy: { column: "name" } }),
    getById: (id: string) => fetchById<TestPackage>("test_packages", id),
    getByMatrix: (matrixId: string) =>
        fetchAll<TestPackage>("test_packages", {
            filter: { column: "matrix_id", value: matrixId },
            orderBy: { column: "name" },
        }),
    getActive: () =>
        fetchAll<TestPackage>("test_packages", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "name" },
        }),
};

export const testPackageItemService = {
    getByPackage: (packageId: string) =>
        fetchAll<TestPackageItem>("test_package_items", {
            filter: { column: "package_id", value: packageId },
        }),
};

export const departmentService = {
    getAll: () => fetchAll<Department>("departments", { orderBy: { column: "name" } }),
    getById: (id: string) => fetchById<Department>("departments", id),
    getActive: () =>
        fetchAll<Department>("departments", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "name" },
        }),
};

export const testRunService = {
    getAll: () =>
        fetchAll<TestRun>("test_runs", {
            orderBy: { column: "created_at", ascending: false },
        }),
    getById: (id: string) => fetchById<TestRun>("test_runs", id),
    getByTask: (taskId: string) =>
        fetchAll<TestRun>("test_runs", {
            filter: { column: "task_id", value: taskId },
            orderBy: { column: "run_number" },
        }),
};

export const resultSubmissionService = {
    getAll: () =>
        fetchAll<ResultSubmission>("result_submissions", {
            orderBy: { column: "submitted_at", ascending: false },
        }),
    getById: (id: string) => fetchById<ResultSubmission>("result_submissions", id),
    getByWorkOrder: (workOrderId: string) =>
        fetchAll<ResultSubmission>("result_submissions", {
            filter: { column: "work_order_id", value: workOrderId },
            orderBy: { column: "submitted_at", ascending: false },
        }),
    getByStatus: (status: ResultSubmission["status"]) =>
        fetchAll<ResultSubmission>("result_submissions", {
            filter: { column: "status", value: status },
            orderBy: { column: "submitted_at", ascending: false },
        }),
};

export const reviewAuditLogService = {
    getByWorkOrder: (workOrderId: string) =>
        fetchAll<ReviewAuditLog>("review_audit_logs", {
            filter: { column: "work_order_id", value: workOrderId },
            orderBy: { column: "created_at", ascending: false },
        }),
};

// ============================================
// PRICE LIST SERVICES
// ============================================

export const priceListService = {
    getAll: () => fetchAll<PriceListItem>("price_list", { orderBy: { column: "matrix_id" } }),
    getById: (id: string) => fetchById<PriceListItem>("price_list", id),
    getActive: () =>
        fetchAll<PriceListItem>("price_list", {
            filter: { column: "is_active", value: true },
            orderBy: { column: "matrix_id" },
        }),
};

// ============================================
// LAB SETTINGS SERVICES
// ============================================

export const labSettingsService = {
    get: async (): Promise<LabSettings | null> => {
        const { data, error } = await supabase
            .from("lab_settings")
            .select("*")
            .eq("id", "default")
            .single();

        if (error && error.code !== "PGRST116") throw error;
        return data;
    },
    update: async (settings: Partial<LabSettings>): Promise<LabSettings> => {
        const { data, error } = await supabase
            .from("lab_settings")
            .update({ ...settings, updated_at: new Date().toISOString() } as any)
            .eq("id", "default")
            .select()
            .single();

        if (error) throw error;
        return data as LabSettings;
    },
};

// ============================================
// GENERIC CRUD HELPERS
// ============================================

export async function insertRow<T>(table: string, row: Record<string, unknown>): Promise<T> {
    // Clean empty strings to null for optional fields
    const cleanedRow: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
        cleanedRow[key] = value === "" ? null : value;
    }
    // Auto-generate UUID if id is not provided (most tables use varchar PK without default)
    if (!cleanedRow.id) {
        cleanedRow.id = crypto.randomUUID();
    }
    const { data, error } = await supabase.from(table as any).insert(cleanedRow as any).select().single();
    if (error) {
        console.error(`[insertRow] Table: ${table}, Error: ${error.message}, Code: ${error.code}, Details: ${error.details}, Hint: ${error.hint}`);
        throw new Error(`Insert failed on "${table}": ${error.message}`);
    }
    return data as T;
}

export async function updateRow<T>(table: string, id: string, updates: Record<string, unknown>): Promise<T> {
    const cleanedUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
        cleanedUpdates[key] = value === "" ? null : value;
    }
    const { data, error } = await supabase.from(table as any).update(cleanedUpdates as any).eq("id", id).select().maybeSingle();
    if (error) {
        console.error(`[updateRow] Table: ${table}, ID: ${id}, Error: ${error.message}, Code: ${error.code}`);
        throw new Error(`Update failed on "${table}": ${error.message}`);
    }
    return data as T;
}

export async function deleteRow(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) {
        console.error(`[deleteRow] Table: ${table}, ID: ${id}, Error: ${error.message}, Code: ${error.code}`);
        throw new Error(`Delete failed on "${table}": ${error.message}`);
    }
}
