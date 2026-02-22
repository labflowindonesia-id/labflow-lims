/**
 * React Hooks for Supabase Data Fetching
 * Uses TanStack Query for caching, deduplication, and automatic refetching
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    userService,
    customerService,
    quotationService,
    workOrderService,
    sampleService,
    testTaskService,
    testResultService,
    reportService,
    parameterService,
    methodService,
    instrumentService,
    unitService,
    sampleMatrixService,
    subparameterService,
    matrixParameterRuleService,
    testPackageService,
    testPackageItemService,
    departmentService,
    testRunService,
    resultSubmissionService,
    reviewAuditLogService,
    priceListService,
    labSettingsService,
    qcAlertService,
    qcControlChartService,
    qcCorrectiveActionService,
    insertRow,
    updateRow,
    deleteRow,
} from "@/lib/services";
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

// Query key factory for consistent cache invalidation
export const queryKeys = {
    users: {
        all: ["users"] as const,
        detail: (id: string) => ["users", id] as const,
        active: ["users", "active"] as const,
        byRole: (role: string) => ["users", "role", role] as const,
    },
    customers: {
        all: ["customers"] as const,
        detail: (id: string) => ["customers", id] as const,
        active: ["customers", "active"] as const,
    },
    customerContacts: {
        all: ["customerContacts"] as const,
        byCustomer: (customerId: string) => ["customerContacts", "customer", customerId] as const,
    },
    quotations: {
        all: ["quotations"] as const,
        detail: (id: string) => ["quotations", id] as const,
        byStatus: (status: string) => ["quotations", "status", status] as const,
        recent: (limit: number) => ["quotations", "recent", limit] as const,
    },
    workOrders: {
        all: ["workOrders"] as const,
        detail: (id: string) => ["workOrders", id] as const,
        byStatus: (status: string) => ["workOrders", "status", status] as const,
        byCustomer: (customerId: string) => ["workOrders", "customer", customerId] as const,
    },
    samples: {
        all: ["samples"] as const,
        detail: (id: string) => ["samples", id] as const,
        byWorkOrder: (workOrderId: string) => ["samples", "workOrder", workOrderId] as const,
    },
    testTasks: {
        all: ["testTasks"] as const,
        detail: (id: string) => ["testTasks", id] as const,
        worklist: (analystId?: string) => ["testTasks", "worklist", analystId] as const,
        overdue: ["testTasks", "overdue"] as const,
        byAnalyst: (analystId: string) => ["testTasks", "analyst", analystId] as const,
    },
    testResults: {
        detail: (id: string) => ["testResults", id] as const,
        byTask: (taskId: string) => ["testResults", "task", taskId] as const,
        latestByTask: (taskId: string) => ["testResults", "task", taskId, "latest"] as const,
    },
    reports: {
        all: ["reports"] as const,
        detail: (id: string) => ["reports", id] as const,
        byStatus: (status: string) => ["reports", "status", status] as const,
        pendingReview: ["reports", "pendingReview"] as const,
        byWorkOrder: (workOrderId: string) => ["reports", "workOrder", workOrderId] as const,
    },
    parameters: {
        all: ["parameters"] as const,
        active: ["parameters", "active"] as const,
        detail: (id: string) => ["parameters", id] as const,
    },
    methods: {
        all: ["methods"] as const,
        active: ["methods", "active"] as const,
        detail: (id: string) => ["methods", id] as const,
    },
    instruments: {
        all: ["instruments"] as const,
        active: ["instruments", "active"] as const,
        detail: (id: string) => ["instruments", id] as const,
    },
    units: {
        all: ["units"] as const,
        detail: (id: string) => ["units", id] as const,
    },
    sampleMatrices: {
        all: ["sampleMatrices"] as const,
        active: ["sampleMatrices", "active"] as const,
    },
    subParameters: {
        all: ["subParameters"] as const,
        active: ["subParameters", "active"] as const,
        byParameter: (parameterId: string) => ["subParameters", "parameter", parameterId] as const,
    },
    matrixParameterRules: {
        all: ["matrixParameterRules"] as const,
        active: ["matrixParameterRules", "active"] as const,
        byMatrix: (matrixId: string) => ["matrixParameterRules", "matrix", matrixId] as const,
    },
    testPackages: {
        all: ["testPackages"] as const,
        active: ["testPackages", "active"] as const,
        byMatrix: (matrixId: string) => ["testPackages", "matrix", matrixId] as const,
        items: (packageId: string) => ["testPackages", packageId, "items"] as const,
    },
    departments: {
        all: ["departments"] as const,
        active: ["departments", "active"] as const,
    },
    testRuns: {
        byTask: (taskId: string) => ["testRuns", "task", taskId] as const,
    },
    resultSubmissions: {
        all: ["resultSubmissions"] as const,
        byWorkOrder: (workOrderId: string) => ["resultSubmissions", "workOrder", workOrderId] as const,
        byStatus: (status: string) => ["resultSubmissions", "status", status] as const,
    },
    reviewAuditLogs: {
        byWorkOrder: (workOrderId: string) => ["reviewAuditLogs", "workOrder", workOrderId] as const,
    },
    priceList: {
        all: ["priceList"] as const,
        active: ["priceList", "active"] as const,
    },
    labSettings: {
        current: ["labSettings"] as const,
    },
    analystProfiles: {
        all: ["analystProfiles"] as const,
        byUser: (userId: string) => ["analystProfiles", "user", userId] as const,
    },
    analystCompetencies: {
        all: ["analystCompetencies"] as const,
        byProfile: (profileId: string) => ["analystCompetencies", "profile", profileId] as const,
    },
    analystCertificates: {
        all: ["analystCertificates"] as const,
        byProfile: (profileId: string) => ["analystCertificates", "profile", profileId] as const,
    },
    qcAlerts: {
        failed: ["qcAlerts", "failed"] as const,
    },
    qcControlChart: {
        byParameter: (parameterId: string) => ["qcControlChart", "parameter", parameterId] as const,
    },
    qcCorrectiveActions: {
        all: ["qcCorrectiveActions"] as const,
        byResult: (resultId: string) => ["qcCorrectiveActions", "result", resultId] as const,
    },
};

// ============================================
// USER HOOKS
// ============================================

export function useUsers() {
    return useQuery<User[]>({
        queryKey: queryKeys.users.all,
        queryFn: () => userService.getAll(),
    });
}

export function useUser(id: string) {
    return useQuery<User | null>({
        queryKey: queryKeys.users.detail(id),
        queryFn: () => userService.getById(id),
        enabled: !!id,
    });
}

export function useActiveUsers() {
    return useQuery<User[]>({
        queryKey: queryKeys.users.active,
        queryFn: () => userService.getActive(),
    });
}

export function useUsersByRole(role: User["role"]) {
    return useQuery<User[]>({
        queryKey: queryKeys.users.byRole(role),
        queryFn: () => userService.getByRole(role),
        enabled: !!role,
    });
}

// ============================================
// CUSTOMER HOOKS
// ============================================

export function useCustomers() {
    return useQuery<Customer[]>({
        queryKey: queryKeys.customers.all,
        queryFn: () => customerService.getAll(),
    });
}

export function useCustomer(id: string) {
    return useQuery<Customer | null>({
        queryKey: queryKeys.customers.detail(id),
        queryFn: () => customerService.getById(id),
        enabled: !!id,
    });
}

export function useActiveCustomers() {
    return useQuery<Customer[]>({
        queryKey: queryKeys.customers.active,
        queryFn: () => customerService.getActive(),
    });
}

// ============================================
// QUOTATION HOOKS
// ============================================

export function useQuotations() {
    return useQuery<Quotation[]>({
        queryKey: queryKeys.quotations.all,
        queryFn: () => quotationService.getAll(),
    });
}

export function useQuotation(id: string) {
    return useQuery<Quotation | null>({
        queryKey: queryKeys.quotations.detail(id),
        queryFn: () => quotationService.getById(id),
        enabled: !!id,
    });
}

export function useQuotationsByStatus(status: Quotation["status"]) {
    return useQuery<Quotation[]>({
        queryKey: queryKeys.quotations.byStatus(status),
        queryFn: () => quotationService.getByStatus(status),
        enabled: !!status,
    });
}

export function useRecentQuotations(limit = 10) {
    return useQuery<Quotation[]>({
        queryKey: queryKeys.quotations.recent(limit),
        queryFn: () => quotationService.getRecent(limit),
    });
}

// ============================================
// WORK ORDER HOOKS
// ============================================

export function useWorkOrders() {
    return useQuery<WorkOrder[]>({
        queryKey: queryKeys.workOrders.all,
        queryFn: () => workOrderService.getAll(),
    });
}

export function useWorkOrder(id: string) {
    return useQuery<WorkOrder | null>({
        queryKey: queryKeys.workOrders.detail(id),
        queryFn: () => workOrderService.getById(id),
        enabled: !!id,
    });
}

export function useWorkOrdersByStatus(status: WorkOrder["status"]) {
    return useQuery<WorkOrder[]>({
        queryKey: queryKeys.workOrders.byStatus(status),
        queryFn: () => workOrderService.getByStatus(status),
        enabled: !!status,
    });
}

export function useWorkOrdersByCustomer(customerId: string) {
    return useQuery<WorkOrder[]>({
        queryKey: queryKeys.workOrders.byCustomer(customerId),
        queryFn: () => workOrderService.getByCustomer(customerId),
        enabled: !!customerId,
    });
}

// ============================================
// SAMPLE HOOKS
// ============================================

export function useSamples() {
    return useQuery<Sample[]>({
        queryKey: queryKeys.samples.all,
        queryFn: () => sampleService.getAll(),
    });
}

export function useSample(id: string) {
    return useQuery<Sample | null>({
        queryKey: queryKeys.samples.detail(id),
        queryFn: () => sampleService.getById(id),
        enabled: !!id,
    });
}

export function useSamplesByWorkOrder(workOrderId: string) {
    return useQuery<Sample[]>({
        queryKey: queryKeys.samples.byWorkOrder(workOrderId),
        queryFn: () => sampleService.getByWorkOrder(workOrderId),
        enabled: !!workOrderId,
    });
}

/**
 * Fetch confirmed samples (from WOs with status RECEIVED_CONFIRMED or IN_ANALYSIS).
 * Returns sample_id (display), sample_name, id (UUID), matrix_id, work_order_id, work_order_number.
 */
export function useConfirmedSamples() {
    return useQuery<
        Array<{
            id: string;
            sample_id: string;
            sample_name: string | null;
            matrix_id: string | null;
            work_order_id: string;
            work_order_number: string;
            customer_name: string | null;
        }>
    >({
        queryKey: ["samples", "confirmed"] as const,
        queryFn: async () => {
            // First get WOs with confirmed/in-analysis status
            const { data: wos, error: woErr } = await supabase
                .from("work_orders")
                .select("id, work_order_number, customer_name_snapshot, status")
                .in("status", ["RECEIVED_CONFIRMED", "IN_ANALYSIS"]);
            if (woErr) throw woErr;

            const woIds = (wos || []).map((wo: any) => wo.id);
            if (woIds.length === 0) return [];

            // Build WO lookup map
            const woMap: Record<string, { work_order_number: string; customer_name: string | null }> = {};
            (wos || []).forEach((wo: any) => {
                woMap[wo.id] = {
                    work_order_number: wo.work_order_number,
                    customer_name: wo.customer_name_snapshot,
                };
            });

            // Fetch samples linked to those WOs
            // NOTE: DB column is "sample_lab_id" (not "sample_id")
            const { data: samples, error: sErr } = await supabase
                .from("samples")
                .select("id, sample_lab_id, sample_name, matrix_id, work_order_id")
                .in("work_order_id", woIds)
                .order("created_at", { ascending: false });
            if (sErr) throw sErr;

            return (samples || []).map((s: any) => ({
                id: s.id,
                sample_id: s.sample_lab_id,
                sample_name: s.sample_name,
                matrix_id: s.matrix_id,
                work_order_id: s.work_order_id,
                work_order_number: woMap[s.work_order_id]?.work_order_number || "",
                customer_name: woMap[s.work_order_id]?.customer_name || null,
            }));
        },
    });
}

/**
 * Fetch all test results (for MyTaskBoard real QC status).
 */
export function useTestResults() {
    return useQuery<TestResult[]>({
        queryKey: ["testResults", "all"] as const,
        queryFn: () => testResultService.getAll(),
    });
}

/**
 * Fetch all test runs (for MyTaskBoard real raw data check).
 */
export function useTestRunsAll() {
    return useQuery<TestRun[]>({
        queryKey: ["testRuns", "all"] as const,
        queryFn: () => testRunService.getAll(),
    });
}

// ============================================
// TEST TASK HOOKS (Worklist)
// ============================================

export function useTestTasks() {
    return useQuery<TestTask[]>({
        queryKey: queryKeys.testTasks.all,
        queryFn: () => testTaskService.getAll(),
    });
}

export function useTestTask(id: string) {
    return useQuery<TestTask | null>({
        queryKey: queryKeys.testTasks.detail(id),
        queryFn: () => testTaskService.getById(id),
        enabled: !!id,
    });
}

export function useWorklist(analystId?: string) {
    return useQuery<TestTask[]>({
        queryKey: queryKeys.testTasks.worklist(analystId),
        queryFn: () => testTaskService.getWorklist(analystId),
    });
}

export function useOverdueTasks() {
    return useQuery<TestTask[]>({
        queryKey: queryKeys.testTasks.overdue,
        queryFn: () => testTaskService.getOverdue(),
    });
}

export function useTasksByAnalyst(analystId: string) {
    return useQuery<TestTask[]>({
        queryKey: queryKeys.testTasks.byAnalyst(analystId),
        queryFn: () => testTaskService.getByAnalyst(analystId),
        enabled: !!analystId,
    });
}

// ============================================
// TEST RESULT HOOKS
// ============================================

export function useTestResult(id: string) {
    return useQuery<TestResult | null>({
        queryKey: queryKeys.testResults.detail(id),
        queryFn: () => testResultService.getById(id),
        enabled: !!id,
    });
}

export function useTestResultsByTask(taskId: string) {
    return useQuery<TestResult[]>({
        queryKey: queryKeys.testResults.byTask(taskId),
        queryFn: () => testResultService.getByTask(taskId),
        enabled: !!taskId,
    });
}

export function useLatestResultByTask(taskId: string) {
    return useQuery<TestResult | null>({
        queryKey: queryKeys.testResults.latestByTask(taskId),
        queryFn: () => testResultService.getLatestByTask(taskId),
        enabled: !!taskId,
    });
}

// ============================================
// REPORT HOOKS
// ============================================

export function useReports() {
    return useQuery<Report[]>({
        queryKey: queryKeys.reports.all,
        queryFn: () => reportService.getAll(),
    });
}

export function useReport(id: string) {
    return useQuery<Report | null>({
        queryKey: queryKeys.reports.detail(id),
        queryFn: () => reportService.getById(id),
        enabled: !!id,
    });
}

export function useReportsByStatus(status: Report["status"]) {
    return useQuery<Report[]>({
        queryKey: queryKeys.reports.byStatus(status),
        queryFn: () => reportService.getByStatus(status),
        enabled: !!status,
    });
}

export function usePendingReviewReports() {
    return useQuery<Report[]>({
        queryKey: queryKeys.reports.pendingReview,
        queryFn: () => reportService.getPendingReview(),
    });
}

export function useReportsByWorkOrder(workOrderId: string) {
    return useQuery<Report[]>({
        queryKey: queryKeys.reports.byWorkOrder(workOrderId),
        queryFn: () => reportService.getByWorkOrder(workOrderId),
        enabled: !!workOrderId,
    });
}

// ============================================
// MASTER DATA HOOKS
// ============================================

export function useParameters() {
    return useQuery<Parameter[]>({
        queryKey: queryKeys.parameters.active,
        queryFn: () => parameterService.getActive(),
    });
}

export function useParameter(id: string) {
    return useQuery<Parameter | null>({
        queryKey: queryKeys.parameters.detail(id),
        queryFn: () => parameterService.getById(id),
        enabled: !!id,
    });
}

export function useMethods() {
    return useQuery<Method[]>({
        queryKey: queryKeys.methods.active,
        queryFn: () => methodService.getActive(),
    });
}

export function useMethod(id: string) {
    return useQuery<Method | null>({
        queryKey: queryKeys.methods.detail(id),
        queryFn: () => methodService.getById(id),
        enabled: !!id,
    });
}

export function useInstruments() {
    return useQuery<Instrument[]>({
        queryKey: queryKeys.instruments.active,
        queryFn: () => instrumentService.getActive(),
    });
}

export function useInstrument(id: string) {
    return useQuery<Instrument | null>({
        queryKey: queryKeys.instruments.detail(id),
        queryFn: () => instrumentService.getById(id),
        enabled: !!id,
    });
}

export function useUnits() {
    return useQuery<Unit[]>({
        queryKey: queryKeys.units.all,
        queryFn: () => unitService.getAll(),
    });
}

export function useUnit(id: string) {
    return useQuery<Unit | null>({
        queryKey: queryKeys.units.detail(id),
        queryFn: () => unitService.getById(id),
        enabled: !!id,
    });
}

// ============================================
// SAMPLE MATRIX HOOKS
// ============================================

export function useSampleMatrices() {
    return useQuery<SampleMatrix[]>({
        queryKey: queryKeys.sampleMatrices.all,
        queryFn: () => sampleMatrixService.getAll(),
    });
}

export function useActiveSampleMatrices() {
    return useQuery<SampleMatrix[]>({
        queryKey: queryKeys.sampleMatrices.active,
        queryFn: () => sampleMatrixService.getActive(),
    });
}

// ============================================
// SUBPARAMETER HOOKS
// ============================================

export function useSubParameters() {
    return useQuery<SubParameter[]>({
        queryKey: queryKeys.subParameters.all,
        queryFn: () => subparameterService.getAll(),
    });
}

export function useActiveSubParameters() {
    return useQuery<SubParameter[]>({
        queryKey: queryKeys.subParameters.active,
        queryFn: () => subparameterService.getActive(),
    });
}

export function useSubParametersByParameter(parameterId: string) {
    return useQuery<SubParameter[]>({
        queryKey: queryKeys.subParameters.byParameter(parameterId),
        queryFn: () => subparameterService.getByParameter(parameterId),
        enabled: !!parameterId,
    });
}

// ============================================
// MATRIX PARAMETER RULE HOOKS
// ============================================

export function useMatrixParameterRules() {
    return useQuery<MatrixParameterRule[]>({
        queryKey: queryKeys.matrixParameterRules.all,
        queryFn: () => matrixParameterRuleService.getAll(),
    });
}

export function useActiveMatrixParameterRules() {
    return useQuery<MatrixParameterRule[]>({
        queryKey: queryKeys.matrixParameterRules.active,
        queryFn: () => matrixParameterRuleService.getActive(),
    });
}

export function useMatrixParameterRulesByMatrix(matrixId: string) {
    return useQuery<MatrixParameterRule[]>({
        queryKey: queryKeys.matrixParameterRules.byMatrix(matrixId),
        queryFn: () => matrixParameterRuleService.getByMatrix(matrixId),
        enabled: !!matrixId,
    });
}

// ============================================
// TEST PACKAGE HOOKS
// ============================================

export function useTestPackages() {
    return useQuery<TestPackage[]>({
        queryKey: queryKeys.testPackages.all,
        queryFn: () => testPackageService.getAll(),
    });
}

export function useActiveTestPackages() {
    return useQuery<TestPackage[]>({
        queryKey: queryKeys.testPackages.active,
        queryFn: () => testPackageService.getActive(),
    });
}

export function useTestPackagesByMatrix(matrixId: string) {
    return useQuery<TestPackage[]>({
        queryKey: queryKeys.testPackages.byMatrix(matrixId),
        queryFn: () => testPackageService.getByMatrix(matrixId),
        enabled: !!matrixId,
    });
}

export function useTestPackageItems(packageId: string) {
    return useQuery<TestPackageItem[]>({
        queryKey: queryKeys.testPackages.items(packageId),
        queryFn: () => testPackageItemService.getByPackage(packageId),
        enabled: !!packageId,
    });
}

// ============================================
// DEPARTMENT HOOKS
// ============================================

export function useDepartments() {
    return useQuery<Department[]>({
        queryKey: queryKeys.departments.all,
        queryFn: () => departmentService.getAll(),
    });
}

export function useActiveDepartments() {
    return useQuery<Department[]>({
        queryKey: queryKeys.departments.active,
        queryFn: () => departmentService.getActive(),
    });
}

// ============================================
// TEST RUN HOOKS
// ============================================

export function useTestRunsByTask(taskId: string) {
    return useQuery<TestRun[]>({
        queryKey: queryKeys.testRuns.byTask(taskId),
        queryFn: () => testRunService.getByTask(taskId),
        enabled: !!taskId,
    });
}

// ============================================
// RESULT SUBMISSION HOOKS
// ============================================

export function useResultSubmissions() {
    return useQuery<ResultSubmission[]>({
        queryKey: queryKeys.resultSubmissions.all,
        queryFn: () => resultSubmissionService.getAll(),
    });
}

export function useResultSubmissionsByWorkOrder(workOrderId: string) {
    return useQuery<ResultSubmission[]>({
        queryKey: queryKeys.resultSubmissions.byWorkOrder(workOrderId),
        queryFn: () => resultSubmissionService.getByWorkOrder(workOrderId),
        enabled: !!workOrderId,
    });
}

export function useResultSubmissionsByStatus(status: ResultSubmission["status"]) {
    return useQuery<ResultSubmission[]>({
        queryKey: queryKeys.resultSubmissions.byStatus(status),
        queryFn: () => resultSubmissionService.getByStatus(status),
        enabled: !!status,
    });
}

// ============================================
// REVIEW AUDIT LOG HOOKS
// ============================================

export function useReviewAuditLogs(workOrderId: string) {
    return useQuery<ReviewAuditLog[]>({
        queryKey: queryKeys.reviewAuditLogs.byWorkOrder(workOrderId),
        queryFn: () => reviewAuditLogService.getByWorkOrder(workOrderId),
        enabled: !!workOrderId,
    });
}

// ============================================
// PRICE LIST HOOKS
// ============================================

export function usePriceList() {
    return useQuery<PriceListItem[]>({
        queryKey: queryKeys.priceList.all,
        queryFn: () => priceListService.getAll(),
    });
}

export function useActivePriceList() {
    return useQuery<PriceListItem[]>({
        queryKey: queryKeys.priceList.active,
        queryFn: () => priceListService.getActive(),
    });
}

// ============================================
// LAB SETTINGS HOOKS
// ============================================

export function useLabSettings() {
    return useQuery<LabSettings | null>({
        queryKey: queryKeys.labSettings.current,
        queryFn: () => labSettingsService.get(),
    });
}

export function useUpdateLabSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (settings: Partial<LabSettings>) => labSettingsService.update(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.labSettings.current });
        },
    });
}

// ============================================
// ANALYST QUALIFICATION HOOKS
// ============================================

/**
 * Returns a map of analyst user_id → Set<parameter_id> they are qualified for.
 * Links: analyst_profiles → analyst_competencies → method code extraction → methods → matrix_parameter_rules → parameter_id
 */
export function useAnalystQualifications() {
    return useQuery<Record<string, string[]>>({
        queryKey: ["analystQualifications"] as const,
        queryFn: async () => {
            // 1. Fetch all analyst profiles with their competencies
            const { data: profiles, error: pErr } = await supabase
                .from("analyst_profiles")
                .select("user_id, analyst_competencies(name)");
            if (pErr) throw pErr;

            // 2. Fetch methods and matrix_parameter_rules for cross-referencing
            const { data: methods, error: mErr } = await supabase
                .from("methods")
                .select("id, code");
            if (mErr) throw mErr;

            const { data: rules, error: rErr } = await supabase
                .from("matrix_parameter_rules")
                .select("parameter_id, default_method_id");
            if (rErr) throw rErr;

            // Cast results to known shapes
            const typedRules = (rules || []) as unknown as { parameter_id: string; default_method_id: string | null }[];
            const typedMethods = (methods || []) as unknown as { id: string; code: string }[];
            const typedProfiles = (profiles || []) as unknown as { user_id: string; analyst_competencies: { name: string }[] }[];

            // 3. Build method_id → parameter_ids map
            const methodToParams: Record<string, Set<string>> = {};
            for (const rule of typedRules) {
                if (!rule.default_method_id) continue;
                if (!methodToParams[rule.default_method_id]) {
                    methodToParams[rule.default_method_id] = new Set();
                }
                methodToParams[rule.default_method_id].add(rule.parameter_id);
            }

            // 4. Build user_id → parameter_ids qualification map
            const qualMap: Record<string, string[]> = {};
            for (const profile of typedProfiles) {
                const competencies = profile.analyst_competencies || [];
                const qualifiedParamIds = new Set<string>();

                for (const comp of competencies) {
                    const compName = comp.name || "";
                    // Match competency name against method codes
                    for (const method of typedMethods) {
                        if (compName.includes(method.code)) {
                            // Found matching method, get its parameter IDs
                            const paramIds = methodToParams[method.id];
                            if (paramIds) {
                                paramIds.forEach(pid => qualifiedParamIds.add(pid));
                            }
                        }
                    }
                }

                if (qualifiedParamIds.size > 0) {
                    qualMap[profile.user_id] = Array.from(qualifiedParamIds);
                }
            }

            return qualMap;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

// ============================================
// QC HOOKS
// ============================================

export function useQCAlerts() {
    return useQuery<TestResult[]>({
        queryKey: queryKeys.qcAlerts.failed,
        queryFn: () => qcAlertService.getFailedResults(),
    });
}

export function useQCControlChart(parameterId: string) {
    return useQuery<TestResult[]>({
        queryKey: queryKeys.qcControlChart.byParameter(parameterId),
        queryFn: () => qcControlChartService.getByParameter(parameterId),
        enabled: !!parameterId,
        retry: 1,
    });
}

export function useQCCorrectiveActions(resultId: string) {
    return useQuery<QCCorrectiveAction[]>({
        queryKey: queryKeys.qcCorrectiveActions.byResult(resultId),
        queryFn: () => qcCorrectiveActionService.getByResult(resultId),
        enabled: !!resultId,
    });
}

export function useAddCorrectiveAction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (row: Record<string, unknown>) =>
            insertRow<QCCorrectiveAction>("qc_corrective_actions", row),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.qcCorrectiveActions.all });
        },
    });
}

// ============================================
// GENERIC CRUD MUTATION HOOKS
// ============================================

export function useInsertRow<T>(table: string, invalidateKeys: readonly unknown[]) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (row: Record<string, unknown>) => insertRow<T>(table, row),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invalidateKeys });
        },
    });
}

export function useUpdateRow<T>(table: string, invalidateKeys: readonly unknown[]) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
            updateRow<T>(table, id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invalidateKeys });
        },
    });
}

export function useDeleteRow(table: string, invalidateKeys: readonly unknown[]) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteRow(table, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invalidateKeys });
        },
    });
}
