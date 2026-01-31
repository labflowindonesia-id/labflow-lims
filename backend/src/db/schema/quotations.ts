import { pgTable, varchar, text, boolean, timestamp, decimal, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers, customerContacts } from './customers';
import { users } from './users';
import { sampleMatrices, parameters, subparameters, methods, instruments, units, testPackages } from './master-data';

// Quotation status enum
export const quotationStatusEnum = pgEnum('quotation_status', [
    'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'
]);

// Quotations table
export const quotations = pgTable('quotations', {
    id: varchar('id', { length: 36 }).primaryKey(),
    quotationNumber: varchar('quotation_number', { length: 50 }).notNull().unique(),
    revisionNumber: integer('revision_number').notNull().default(0),

    // Customer info
    customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id),
    contactId: varchar('contact_id', { length: 36 }).references(() => customerContacts.id),

    // Customer snapshot (frozen at creation for audit trail)
    customerNameSnapshot: varchar('customer_name_snapshot', { length: 255 }),
    customerAddressSnapshot: text('customer_address_snapshot'),

    // Quotation details
    matrixId: varchar('matrix_id', { length: 36 }).notNull().references(() => sampleMatrices.id),
    sampleCount: integer('sample_count').notNull().default(1),
    samplingType: varchar('sampling_type', { length: 50 }), // GRAB, COMPOSITE
    urgencyFactor: decimal('urgency_factor', { precision: 5, scale: 2 }).default('1.00'),

    // Dates
    validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
    tatDays: integer('tat_days').notNull().default(5),

    // Status & workflow
    status: quotationStatusEnum('status').notNull().default('DRAFT'),

    // Approval info
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    submittedBy: varchar('submitted_by', { length: 36 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedBy: varchar('approved_by', { length: 36 }).references(() => users.id),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectedBy: varchar('rejected_by', { length: 36 }).references(() => users.id),
    rejectionReason: text('rejection_reason'),

    // Totals
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
    discount: decimal('discount', { precision: 15, scale: 2 }).default('0'),
    taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('11.00'), // PPN 11%
    taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
    grandTotal: decimal('grand_total', { precision: 15, scale: 2 }).notNull().default('0'),
    currency: varchar('currency', { length: 3 }).notNull().default('IDR'),

    // Notes
    internalNotes: text('internal_notes'),
    publicNotes: text('public_notes'),
    termsConditions: text('terms_conditions'),

    // PDF
    draftPdfPath: varchar('draft_pdf_path', { length: 500 }),

    // Audit
    createdBy: varchar('created_by', { length: 36 }).notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Quotation line items
export const quotationLines = pgTable('quotation_lines', {
    id: varchar('id', { length: 36 }).primaryKey(),
    quotationId: varchar('quotation_id', { length: 36 }).notNull().references(() => quotations.id),
    lineNumber: integer('line_number').notNull(),

    // Test info
    parameterId: varchar('parameter_id', { length: 36 }).references(() => parameters.id),
    subparameterId: varchar('subparameter_id', { length: 36 }).references(() => subparameters.id),
    packageId: varchar('package_id', { length: 36 }).references(() => testPackages.id),
    methodId: varchar('method_id', { length: 36 }).references(() => methods.id),
    instrumentId: varchar('instrument_id', { length: 36 }).references(() => instruments.id),

    // Snapshots for audit
    parameterNameSnapshot: varchar('parameter_name_snapshot', { length: 255 }),
    methodCodeSnapshot: varchar('method_code_snapshot', { length: 100 }),

    // Pricing
    unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
    lineTotal: decimal('line_total', { precision: 15, scale: 2 }).notNull(),

    // TAT override
    tatDays: integer('tat_days'),

    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Contract review (Manager approval)
export const contractReviewStatusEnum = pgEnum('contract_review_status', [
    'PENDING', 'APPROVED', 'REJECTED'
]);

export const contractReviews = pgTable('contract_reviews', {
    id: varchar('id', { length: 36 }).primaryKey(),
    quotationId: varchar('quotation_id', { length: 36 }).notNull().references(() => quotations.id).unique(),

    // Review fields
    laboratoryCapabilityOk: boolean('laboratory_capability_ok'),
    resourceAvailabilityOk: boolean('resource_availability_ok'),
    sampleRequirementsOk: boolean('sample_requirements_ok'),
    methodAvailabilityOk: boolean('method_availability_ok'),
    subcontractingOk: boolean('subcontracting_ok'),
    deliveryTimelineOk: boolean('delivery_timeline_ok'),

    // Result
    status: contractReviewStatusEnum('status').notNull().default('PENDING'),
    notes: text('notes'),

    reviewedBy: varchar('reviewed_by', { length: 36 }).references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Quotation documents (PDF versions)
export const quotationDocuments = pgTable('quotation_documents', {
    id: varchar('id', { length: 36 }).primaryKey(),
    quotationId: varchar('quotation_id', { length: 36 }).notNull().references(() => quotations.id),
    version: integer('version').notNull().default(1),
    filePath: varchar('file_path', { length: 500 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    generatedBy: varchar('generated_by', { length: 36 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const quotationsRelations = relations(quotations, ({ one, many }) => ({
    customer: one(customers, {
        fields: [quotations.customerId],
        references: [customers.id],
    }),
    contact: one(customerContacts, {
        fields: [quotations.contactId],
        references: [customerContacts.id],
    }),
    matrix: one(sampleMatrices, {
        fields: [quotations.matrixId],
        references: [sampleMatrices.id],
    }),
    createdByUser: one(users, {
        fields: [quotations.createdBy],
        references: [users.id],
        relationName: 'quotationCreator',
    }),
    approvedByUser: one(users, {
        fields: [quotations.approvedBy],
        references: [users.id],
        relationName: 'quotationApprover',
    }),
    lines: many(quotationLines),
    contractReview: one(contractReviews, {
        fields: [quotations.id],
        references: [contractReviews.quotationId],
    }),
    documents: many(quotationDocuments),
}));

export const quotationLinesRelations = relations(quotationLines, ({ one }) => ({
    quotation: one(quotations, {
        fields: [quotationLines.quotationId],
        references: [quotations.id],
    }),
    parameter: one(parameters, {
        fields: [quotationLines.parameterId],
        references: [parameters.id],
    }),
    subparameter: one(subparameters, {
        fields: [quotationLines.subparameterId],
        references: [subparameters.id],
    }),
    method: one(methods, {
        fields: [quotationLines.methodId],
        references: [methods.id],
    }),
    instrument: one(instruments, {
        fields: [quotationLines.instrumentId],
        references: [instruments.id],
    }),
    package: one(testPackages, {
        fields: [quotationLines.packageId],
        references: [testPackages.id],
    }),
}));

export const contractReviewsRelations = relations(contractReviews, ({ one }) => ({
    quotation: one(quotations, {
        fields: [contractReviews.quotationId],
        references: [quotations.id],
    }),
    reviewer: one(users, {
        fields: [contractReviews.reviewedBy],
        references: [users.id],
    }),
}));

export const quotationDocumentsRelations = relations(quotationDocuments, ({ one }) => ({
    quotation: one(quotations, {
        fields: [quotationDocuments.quotationId],
        references: [quotations.id],
    }),
}));

