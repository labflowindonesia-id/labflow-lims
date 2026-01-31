import { pgTable, varchar, text, boolean, timestamp, decimal, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workOrders, samples } from './work-orders';
import { testTasks } from './tasks';
import { testResults } from './results';
import { customers, customerContacts } from './customers';

// Submission status enum
export const submissionStatusEnum = pgEnum('submission_status', ['SUBMITTED', 'RETURNED', 'APPROVED']);

// Result submissions (batch submission for review)
export const resultSubmissions = pgTable('result_submissions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    submissionNumber: varchar('submission_number', { length: 50 }).notNull().unique(),

    // Source
    workOrderId: varchar('work_order_id', { length: 36 }).notNull().references(() => workOrders.id),

    // Status
    status: submissionStatusEnum('status').notNull().default('SUBMITTED'),

    // Submitted by analyst
    submittedBy: varchar('submitted_by', { length: 36 }).notNull().references(() => users.id),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),

    // Reviewed by manager
    reviewedBy: varchar('reviewed_by', { length: 36 }).references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

    // Notes
    analystNotes: text('analyst_notes'),
    reviewerNotes: text('reviewer_notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Submission items (which results are in submission)
export const submissionItems = pgTable('submission_items', {
    id: varchar('id', { length: 36 }).primaryKey(),
    submissionId: varchar('submission_id', { length: 36 }).notNull().references(() => resultSubmissions.id),
    taskId: varchar('task_id', { length: 36 }).notNull().references(() => testTasks.id),
    resultId: varchar('result_id', { length: 36 }).references(() => testResults.id),

    // Item status
    isApproved: boolean('is_approved'),
    returnReason: text('return_reason'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Revision scope enum
export const revisionScopeEnum = pgEnum('revision_scope', ['ENTIRE_REPORT', 'SPECIFIC_TESTS']);

// Revision requests (when manager returns for revision)
export const revisionRequests = pgTable('revision_requests', {
    id: varchar('id', { length: 36 }).primaryKey(),
    revisionNumber: varchar('revision_number', { length: 50 }).notNull(),

    submissionId: varchar('submission_id', { length: 36 }).notNull().references(() => resultSubmissions.id),

    scope: revisionScopeEnum('scope').notNull().default('SPECIFIC_TESTS'),
    reason: text('reason').notNull(),

    requestedBy: varchar('requested_by', { length: 36 }).notNull().references(() => users.id),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),

    // Resolution
    resolvedBy: varchar('resolved_by', { length: 36 }).references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    isResolved: boolean('is_resolved').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Revision request items (specific tests to be revised)
export const revisionRequestItems = pgTable('revision_request_items', {
    id: varchar('id', { length: 36 }).primaryKey(),
    revisionRequestId: varchar('revision_request_id', { length: 36 }).notNull().references(() => revisionRequests.id),
    taskId: varchar('task_id', { length: 36 }).notNull().references(() => testTasks.id),
    issueDescription: text('issue_description'),
    correctionRequired: text('correction_required'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Result versions (history of result changes for audit trail)
export const resultVersions = pgTable('result_versions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    resultId: varchar('result_id', { length: 36 }).notNull().references(() => testResults.id),
    version: integer('version').notNull(),

    // Snapshot of result at this version
    resultData: jsonb('result_data').notNull(), // Full result object

    // What changed
    changedFields: jsonb('changed_fields'), // ['resultValue', 'qcStatus']
    changeReason: text('change_reason'),

    changedBy: varchar('changed_by', { length: 36 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report status enum
export const reportStatusEnum = pgEnum('report_status', [
    'DRAFT', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'LOCKED', 'RELEASED'
]);

// Reports (Certificate of Analysis)
export const reports = pgTable('reports', {
    id: varchar('id', { length: 36 }).primaryKey(),
    reportNumber: varchar('report_number', { length: 50 }).notNull().unique(),
    revisionNumber: integer('revision_number').notNull().default(0),

    // Source
    workOrderId: varchar('work_order_id', { length: 36 }).notNull().references(() => workOrders.id),

    // Status
    status: reportStatusEnum('status').notNull().default('DRAFT'),

    // Title & scope
    title: varchar('title', { length: 500 }),
    regulationReference: varchar('regulation_reference', { length: 255 }), // PP 22/2021

    // Generation
    generatedBy: varchar('generated_by', { length: 36 }).references(() => users.id),
    generatedAt: timestamp('generated_at', { withTimezone: true }),

    // Approval
    approvedBy: varchar('approved_by', { length: 36 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),

    // Signature
    signatureId: varchar('signature_id', { length: 36 }),
    signedAt: timestamp('signed_at', { withTimezone: true }),

    // Lock (after release, no more changes without CR)
    isLocked: boolean('is_locked').notNull().default(false),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockedBy: varchar('locked_by', { length: 36 }).references(() => users.id),

    // Release to customer
    releasedAt: timestamp('released_at', { withTimezone: true }),
    releasedBy: varchar('released_by', { length: 36 }).references(() => users.id),

    // Notes
    internalNotes: text('internal_notes'),
    publicNotes: text('public_notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report customer snapshot (frozen customer info at report time)
export const reportCustomerSnapshot = pgTable('report_customer_snapshot', {
    id: varchar('id', { length: 36 }).primaryKey(),
    reportId: varchar('report_id', { length: 36 }).notNull().references(() => reports.id).unique(),

    customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    customerAddress: text('customer_address'),
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report sample snapshot (frozen sample info)
export const reportSampleSnapshot = pgTable('report_sample_snapshot', {
    id: varchar('id', { length: 36 }).primaryKey(),
    reportId: varchar('report_id', { length: 36 }).notNull().references(() => reports.id),
    sampleId: varchar('sample_id', { length: 36 }).notNull().references(() => samples.id),

    sampleLabId: varchar('sample_lab_id', { length: 50 }).notNull(),
    sampleName: varchar('sample_name', { length: 255 }),
    matrixName: varchar('matrix_name', { length: 255 }),
    receivedDate: timestamp('received_date', { withTimezone: true }),
    samplingDate: timestamp('sampling_date', { withTimezone: true }),
    condition: varchar('condition', { length: 50 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report results (snapshot of results in report)
export const reportResults = pgTable('report_results', {
    id: varchar('id', { length: 36 }).primaryKey(),
    reportId: varchar('report_id', { length: 36 }).notNull().references(() => reports.id),
    sampleSnapshotId: varchar('sample_snapshot_id', { length: 36 }).references(() => reportSampleSnapshot.id),
    resultId: varchar('result_id', { length: 36 }).references(() => testResults.id),

    // Frozen result data
    parameterName: varchar('parameter_name', { length: 255 }).notNull(),
    methodCode: varchar('method_code', { length: 100 }),
    resultValue: varchar('result_value', { length: 100 }).notNull(), // String to support "ND", "<0.001"
    unit: varchar('unit', { length: 50 }),
    limitValue: varchar('limit_value', { length: 100 }),
    complianceStatus: varchar('compliance_status', { length: 20 }),

    sortOrder: integer('sort_order').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report conformity statements
export const reportConformityStatements = pgTable('report_conformity_statements', {
    id: varchar('id', { length: 36 }).primaryKey(),
    reportId: varchar('report_id', { length: 36 }).notNull().references(() => reports.id),

    statementText: text('statement_text').notNull(),
    sortOrder: integer('sort_order').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Signatures
export const signatures = pgTable('signatures', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),

    signatoryName: varchar('signatory_name', { length: 255 }).notNull(),
    signatoryTitle: varchar('signatory_title', { length: 255 }),
    signatureImagePath: varchar('signature_image_path', { length: 500 }),

    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report documents (PDF files)
export const reportDocuments = pgTable('report_documents', {
    id: varchar('id', { length: 36 }).primaryKey(),
    reportId: varchar('report_id', { length: 36 }).notNull().references(() => reports.id),

    version: integer('version').notNull().default(1),
    isDraft: boolean('is_draft').notNull().default(true),
    hasWatermark: boolean('has_watermark').notNull().default(true),

    filePath: varchar('file_path', { length: 500 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size'),

    generatedBy: varchar('generated_by', { length: 36 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report locks (prevent changes after release)
export const reportLocks = pgTable('report_locks', {
    id: varchar('id', { length: 36 }).primaryKey(),
    reportId: varchar('report_id', { length: 36 }).notNull().references(() => reports.id),

    lockedBy: varchar('locked_by', { length: 36 }).notNull().references(() => users.id),
    lockedAt: timestamp('locked_at', { withTimezone: true }).notNull().defaultNow(),
    reason: text('reason'),

    // Unlock (only via CR)
    unlockedBy: varchar('unlocked_by', { length: 36 }).references(() => users.id),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
    unlockReason: text('unlock_reason'),
    changeRequestId: varchar('change_request_id', { length: 36 }),

    isActive: boolean('is_active').notNull().default(true),
});

// Relations
export const resultSubmissionsRelations = relations(resultSubmissions, ({ one, many }) => ({
    workOrder: one(workOrders, {
        fields: [resultSubmissions.workOrderId],
        references: [workOrders.id],
    }),
    submitter: one(users, {
        fields: [resultSubmissions.submittedBy],
        references: [users.id],
    }),
    reviewer: one(users, {
        fields: [resultSubmissions.reviewedBy],
        references: [users.id],
    }),
    items: many(submissionItems),
    revisionRequests: many(revisionRequests),
}));

export const submissionItemsRelations = relations(submissionItems, ({ one }) => ({
    submission: one(resultSubmissions, {
        fields: [submissionItems.submissionId],
        references: [resultSubmissions.id],
    }),
    task: one(testTasks, {
        fields: [submissionItems.taskId],
        references: [testTasks.id],
    }),
    result: one(testResults, {
        fields: [submissionItems.resultId],
        references: [testResults.id],
    }),
}));

export const revisionRequestsRelations = relations(revisionRequests, ({ one, many }) => ({
    submission: one(resultSubmissions, {
        fields: [revisionRequests.submissionId],
        references: [resultSubmissions.id],
    }),
    requester: one(users, {
        fields: [revisionRequests.requestedBy],
        references: [users.id],
    }),
    items: many(revisionRequestItems),
}));

export const revisionRequestItemsRelations = relations(revisionRequestItems, ({ one }) => ({
    revisionRequest: one(revisionRequests, {
        fields: [revisionRequestItems.revisionRequestId],
        references: [revisionRequests.id],
    }),
    task: one(testTasks, {
        fields: [revisionRequestItems.taskId],
        references: [testTasks.id],
    }),
}));

export const resultVersionsRelations = relations(resultVersions, ({ one }) => ({
    result: one(testResults, {
        fields: [resultVersions.resultId],
        references: [testResults.id],
    }),
    changedByUser: one(users, {
        fields: [resultVersions.changedBy],
        references: [users.id],
    }),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
    workOrder: one(workOrders, {
        fields: [reports.workOrderId],
        references: [workOrders.id],
    }),
    customerSnapshot: one(reportCustomerSnapshot, {
        fields: [reports.id],
        references: [reportCustomerSnapshot.reportId],
    }),
    sampleSnapshots: many(reportSampleSnapshot),
    results: many(reportResults),
    conformityStatements: many(reportConformityStatements),
    documents: many(reportDocuments),
    locks: many(reportLocks),
}));

export const reportCustomerSnapshotRelations = relations(reportCustomerSnapshot, ({ one }) => ({
    report: one(reports, {
        fields: [reportCustomerSnapshot.reportId],
        references: [reports.id],
    }),
}));

export const reportSampleSnapshotRelations = relations(reportSampleSnapshot, ({ one, many }) => ({
    report: one(reports, {
        fields: [reportSampleSnapshot.reportId],
        references: [reports.id],
    }),
    sample: one(samples, {
        fields: [reportSampleSnapshot.sampleId],
        references: [samples.id],
    }),
    results: many(reportResults),
}));

export const reportResultsRelations = relations(reportResults, ({ one }) => ({
    report: one(reports, {
        fields: [reportResults.reportId],
        references: [reports.id],
    }),
    sampleSnapshot: one(reportSampleSnapshot, {
        fields: [reportResults.sampleSnapshotId],
        references: [reportSampleSnapshot.id],
    }),
}));

export const signaturesRelations = relations(signatures, ({ one }) => ({
    user: one(users, {
        fields: [signatures.userId],
        references: [users.id],
    }),
}));

export const reportDocumentsRelations = relations(reportDocuments, ({ one }) => ({
    report: one(reports, {
        fields: [reportDocuments.reportId],
        references: [reports.id],
    }),
}));

export const reportLocksRelations = relations(reportLocks, ({ one }) => ({
    report: one(reports, {
        fields: [reportLocks.reportId],
        references: [reports.id],
    }),
    locker: one(users, {
        fields: [reportLocks.lockedBy],
        references: [users.id],
    }),
}));

