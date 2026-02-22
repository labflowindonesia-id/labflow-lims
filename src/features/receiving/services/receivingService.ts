/**
 * Receiving Service
 * Handles sample registration (accept/reject), WO generation, and sample ID generation.
 */

import { supabase } from "@/lib/supabase";

// Types
export interface QuotationSearchResult {
    id: string;
    quotation_number: string;
    customer_id: string;
    customer_name: string;
    customer_address: string;
    matrix_id: string;
    matrix_name: string;
    lines: Array<{
        id: string;
        parameter_id: string;
        method_id: string;
        parameter_name_snapshot: string;
        method_code_snapshot: string;
    }>;
}

export interface SampleRegistrationData {
    quotation_id: string;
    customer_id: string;
    customer_name: string;
    customer_address: string;
    matrix_id: string;
    samples: Array<{
        sample_name: string;
        customer_sample_id?: string;
        condition: string;
        condition_notes?: string;
        storage_temperature?: number;
        original_volume?: number;
        volume_unit?: string;
        sampling_date?: string;
    }>;
    sampling_data?: {
        sampling_point?: string;
        sampled_by?: string;
        sampling_method?: string;
        weather_condition?: string;
    };
    coc_data?: {
        coc_number?: string;
        transport_method?: string;
        transport_temperature?: string;
        custody_seal_intact?: boolean;
    };
    requested_tests: Array<{
        parameter_id: string;
        method_id: string;
    }>;
    receiver_notes?: string;
    total_samples: number;
}

export interface RegistrationResult {
    work_order_id: string;
    work_order_number: string;
    sample_ids: string[];
    sample_lab_ids: string[];
}

export interface RejectionData {
    quotation_id: string;
    customer_id: string;
    customer_name: string;
    reason: string;
    samples: Array<{
        sample_name: string;
        condition: string;
    }>;
}

export interface RejectionResult {
    audit_event_id: string;
}

// Generate the next WO number (WO-YYYY-XXX, sequential)
async function generateWorkOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `WO-${year}-`;

    const { data, error } = await supabase
        .from("work_orders")
        .select("work_order_number")
        .like("work_order_number", `${prefix}%`)
        .order("work_order_number", { ascending: false })
        .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (data && data.length > 0) {
        const lastNumber = data[0].work_order_number;
        const parts = lastNumber.split("-");
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) nextNumber = lastSeq + 1;
    }

    return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

// Generate the next Sample Lab ID (S-YYYYMMXXXX, global sequential)
async function generateSampleLabId(count: number): Promise<string[]> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `S-${year}${month}`;

    const { data, error } = await supabase
        .from("samples")
        .select("sample_lab_id")
        .like("sample_lab_id", `S-${year}%`)
        .order("sample_lab_id", { ascending: false })
        .limit(1);

    if (error) throw error;

    let nextSeq = 1;
    if (data && data.length > 0) {
        const lastId = data[0].sample_lab_id;
        // Extract the last 4 digits (XXXX)
        const seqStr = lastId.slice(-4);
        const lastSeq = parseInt(seqStr, 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
        ids.push(`${prefix}${String(nextSeq + i).padStart(4, "0")}`);
    }

    return ids;
}

// Search for approved quotations
export async function searchApprovedQuotations(
    searchTerm: string
): Promise<QuotationSearchResult[]> {
    const { data: quotations, error } = await supabase
        .from("quotations")
        .select("id, quotation_number, customer_id, matrix_id")
        .eq("status", "APPROVED")
        .or(
            `quotation_number.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`
        )
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) throw error;
    if (!quotations || quotations.length === 0) return [];

    const results: QuotationSearchResult[] = [];

    for (const q of quotations) {
        // Fetch customer
        const { data: customer } = await supabase
            .from("customers")
            .select("name, address")
            .eq("id", q.customer_id)
            .single();

        // Fetch matrix
        const { data: matrix } = await supabase
            .from("sample_matrices")
            .select("name")
            .eq("id", q.matrix_id)
            .single();

        // Fetch quotation lines
        const { data: lines } = await supabase
            .from("quotation_lines")
            .select(
                "id, parameter_id, method_id, parameter_name_snapshot, method_code_snapshot"
            )
            .eq("quotation_id", q.id)
            .order("line_number");

        results.push({
            id: q.id,
            quotation_number: q.quotation_number,
            customer_id: q.customer_id,
            customer_name: customer?.name || "Unknown",
            customer_address: customer?.address || "",
            matrix_id: q.matrix_id,
            matrix_name: matrix?.name || "Unknown",
            lines: lines || [],
        });
    }

    return results;
}

// Register accepted samples — insert WO + samples + audit log
export async function registerSamples(
    data: SampleRegistrationData
): Promise<RegistrationResult> {
    // Get authenticated user for created_by
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error("Not authenticated");

    const woNumber = await generateWorkOrderNumber();
    const sampleLabIds = await generateSampleLabId(data.samples.length);
    const woId = crypto.randomUUID();

    // 1. Insert Work Order
    const { error: woError } = await supabase
        .from("work_orders")
        .insert({
            id: woId,
            work_order_number: woNumber,
            quotation_id: data.quotation_id,
            customer_id: data.customer_id,
            customer_name_snapshot: data.customer_name,
            customer_address_snapshot: data.customer_address,
            matrix_id: data.matrix_id,
            status: "RECEIVED_DRAFT",
            received_date: new Date().toISOString(),
            total_samples: data.total_samples,
            receiver_notes: data.receiver_notes || null,
            created_by: authUser.id,
        });

    if (woError) throw woError;

    // 2. Insert Samples
    const sampleRows = data.samples.map((s, i) => ({
        id: crypto.randomUUID(),
        work_order_id: woId,
        sample_lab_id: sampleLabIds[i],
        sample_name: s.sample_name,
        customer_sample_id: s.customer_sample_id || null,
        matrix_id: data.matrix_id,
        condition: s.condition || "INTACT",
        condition_notes: s.condition_notes || null,
        storage_temperature: s.storage_temperature || null,
        original_volume: s.original_volume || null,
        volume_unit: s.volume_unit || null,
        sampling_date: s.sampling_date || null,
    }));

    const sampleIds: string[] = sampleRows.map((r) => r.id);

    const { error: sampError } = await supabase
        .from("samples")
        .insert(sampleRows);

    if (sampError) throw sampError;

    // 3. Insert Audit Event
    const { error: auditError } = await supabase
        .from("audit_events")
        .insert({
            id: crypto.randomUUID(),
            entity_type: "WORK_ORDER",
            entity_id: woId,
            action: "CREATE",
            user_id: authUser.id,
            user_email: authUser.email,
            new_values: {
                work_order_number: woNumber,
                sample_lab_ids: sampleLabIds,
                quotation_id: data.quotation_id,
                total_samples: data.total_samples,
            },
            reason: "Sample accepted and registered via Receiving Wizard",
        });

    if (auditError) console.error("Audit log failed:", auditError);

    // 4. Create requested_tests for each sample × parameter
    const requestedTestRows: Array<{
        id: string;
        sample_id: string;
        parameter_id: string;
        method_id: string;
    }> = [];

    for (let i = 0; i < sampleRows.length; i++) {
        for (const test of data.requested_tests) {
            requestedTestRows.push({
                id: crypto.randomUUID(),
                sample_id: sampleRows[i].id,
                parameter_id: test.parameter_id,
                method_id: test.method_id,
            });
        }
    }

    if (requestedTestRows.length > 0) {
        const { error: rtError } = await supabase
            .from("requested_tests")
            .insert(requestedTestRows);
        if (rtError) console.error("requested_tests insert failed:", rtError);
    }

    // 5. Create test_tasks for each requested_test
    // Find first available analyst to auto-assign
    const { data: firstAnalyst } = await supabase
        .from("analysts")
        .select("id")
        .limit(1)
        .single();

    const analystId = firstAnalyst?.id || null;
    const taskTimestamp = Date.now();
    const dueDateISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const taskRows = requestedTestRows.map((rt, idx) => ({
        id: crypto.randomUUID(),
        task_number: `TSK-${taskTimestamp}-${idx}`,
        requested_test_id: rt.id,
        sample_id: rt.sample_id,
        parameter_id: rt.parameter_id,
        method_id: rt.method_id,
        assigned_to_id: analystId,
        assigned_by: authUser.id,
        assigned_at: new Date().toISOString(),
        status: "IN_PROGRESS" as const,
        priority: "NORMAL" as const,
        planned_date: new Date().toISOString(),
        due_date: dueDateISO,
    }));

    if (taskRows.length > 0) {
        const { error: taskError } = await supabase
            .from("test_tasks")
            .insert(taskRows);
        if (taskError) console.error("test_tasks insert failed:", taskError);
    }

    // 6. Update work order status to IN_ANALYSIS
    const { error: woUpdateError } = await supabase
        .from("work_orders")
        .update({ status: "IN_ANALYSIS" })
        .eq("id", woId);
    if (woUpdateError) console.error("WO status update failed:", woUpdateError);

    return {
        work_order_id: woId,
        work_order_number: woNumber,
        sample_ids: sampleIds,
        sample_lab_ids: sampleLabIds,
    };
}

// Log rejected samples — only audit event, no WO or samples
export async function rejectSamples(
    data: RejectionData
): Promise<RejectionResult> {
    // Get authenticated user for audit trail
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error("Not authenticated");

    const auditId = crypto.randomUUID();

    const { error } = await supabase.from("audit_events").insert({
        id: auditId,
        entity_type: "SAMPLE_RECEIVING",
        entity_id: data.quotation_id,
        action: "REJECT",
        user_id: authUser.id,
        user_email: authUser.email,
        new_values: {
            customer_id: data.customer_id,
            customer_name: data.customer_name,
            samples: data.samples,
        },
        reason: data.reason,
    });

    if (error) throw error;

    return { audit_event_id: auditId };
}
