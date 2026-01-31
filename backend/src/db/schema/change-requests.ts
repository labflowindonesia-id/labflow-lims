import { pgTable, varchar, text, boolean, timestamp, decimal, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workOrders, samples, requestedTests } from './work-orders';
import { reports } from './reports';

// Change request status enum
export const changeRequestStatusEnum = pgEnum('change_request_status', [
    'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'APPLIED'
]);

// Change type enum
export const changeTypeEnum = pgEnum('change_type', [
    'ADD_TEST', 'REMOVE_TEST', 'UPDATE_TEST_DUE_DATE', 'UPDATE_METHOD_INSTRUMENT',
    'UPDATE_SAMPLE_METADATA', 'UPDATE_STORAGE_LOCATION', 'UPDATE_CUSTOMER_CONTACT', 'OTHER'
]);

// Entity type enum
export const entityTypeEnum = pgEnum('entity_type', [
    'QUOTATION', 'QUOTATION_LINE', 'WORK_ORDER', 'SAMPLE', 'REQUESTED_TEST', 'TEST_TASK', 'REPORT'
]);

// Change requests table
export const changeRequests = pgTable('change_requests', {
    id: varchar('id', { length: 36 }).primaryKey(),
    crNumber: varchar('cr_number', { length: 50 }).notNull().unique(),

    // Source (what is being changed)
    workOrderId: varchar('work_order_id', { length: 36 }).references(() => workOrders.id),
    reportId: varchar('report_id', { length: 36 }).references(() => reports.id),

    // Status
    status: changeRequestStatusEnum('status').notNull().default('DRAFT'),

    // Justification
    reason: text('reason').notNull(),
    businessJustification: text('business_justification'),

    // Requested by
    requestedBy: varchar('requested_by', { length: 36 }).notNull().references(() => users.id),
    requestedAt: timestamp('requested_at', { withTimezone: true }),

    // Submitted for approval
    submittedAt: timestamp('submitted_at', { withTimezone: true }),

    // Approved/Rejected by manager
    reviewedBy: varchar('reviewed_by', { length: 36 }).references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),

    // Applied
    appliedBy: varchar('applied_by', { length: 36 }).references(() => users.id),
    appliedAt: timestamp('applied_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Change request items (individual changes within CR)
export const changeRequestItems = pgTable('change_request_items', {
    id: varchar('id', { length: 36 }).primaryKey(),
    changeRequestId: varchar('change_request_id', { length: 36 }).notNull().references(() => changeRequests.id),

    // What's changing
    changeType: changeTypeEnum('change_type').notNull(),
    entityType: entityTypeEnum('entity_type').notNull(),
    entityId: varchar('entity_id', { length: 36 }).notNull(),

    // Before/After snapshots
    fieldName: varchar('field_name', { length: 100 }).notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),

    // Description
    description: text('description'),

    // Application status
    isApplied: boolean('is_applied').notNull().default(false),
    appliedAt: timestamp('applied_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Change request attachments
export const changeRequestAttachments = pgTable('change_request_attachments', {
    id: varchar('id', { length: 36 }).primaryKey(),
    changeRequestId: varchar('change_request_id', { length: 36 }).notNull().references(() => changeRequests.id),

    filePath: varchar('file_path', { length: 500 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileType: varchar('file_type', { length: 50 }),
    fileSize: integer('file_size'),
    description: text('description'),

    uploadedBy: varchar('uploaded_by', { length: 36 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Change request audit log
export const changeRequestAudit = pgTable('change_request_audit', {
    id: varchar('id', { length: 36 }).primaryKey(),
    changeRequestId: varchar('change_request_id', { length: 36 }).notNull().references(() => changeRequests.id),

    action: varchar('action', { length: 50 }).notNull(), // CREATED, SUBMITTED, APPROVED, REJECTED, APPLIED
    previousStatus: changeRequestStatusEnum('previous_status'),
    newStatus: changeRequestStatusEnum('new_status'),

    performedBy: varchar('performed_by', { length: 36 }).references(() => users.id),
    notes: text('notes'),
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const changeRequestsRelations = relations(changeRequests, ({ one, many }) => ({
    workOrder: one(workOrders, {
        fields: [changeRequests.workOrderId],
        references: [workOrders.id],
    }),
    report: one(reports, {
        fields: [changeRequests.reportId],
        references: [reports.id],
    }),
    requester: one(users, {
        fields: [changeRequests.requestedBy],
        references: [users.id],
        relationName: 'crRequester',
    }),
    reviewer: one(users, {
        fields: [changeRequests.reviewedBy],
        references: [users.id],
        relationName: 'crReviewer',
    }),
    items: many(changeRequestItems),
    attachments: many(changeRequestAttachments),
    auditLogs: many(changeRequestAudit),
}));

export const changeRequestItemsRelations = relations(changeRequestItems, ({ one }) => ({
    changeRequest: one(changeRequests, {
        fields: [changeRequestItems.changeRequestId],
        references: [changeRequests.id],
    }),
}));

export const changeRequestAttachmentsRelations = relations(changeRequestAttachments, ({ one }) => ({
    changeRequest: one(changeRequests, {
        fields: [changeRequestAttachments.changeRequestId],
        references: [changeRequests.id],
    }),
}));

export const changeRequestAuditRelations = relations(changeRequestAudit, ({ one }) => ({
    changeRequest: one(changeRequests, {
        fields: [changeRequestAudit.changeRequestId],
        references: [changeRequests.id],
    }),
    performer: one(users, {
        fields: [changeRequestAudit.performedBy],
        references: [users.id],
    }),
}));

