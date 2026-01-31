import { pgTable, varchar, text, boolean, timestamp, decimal, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { samples, requestedTests } from './work-orders';
import { testTasks } from './tasks';
import { parameters, subparameters, methods, instruments, units, matrixParameterRules } from './master-data';

// QC status enum
export const qcStatusEnum = pgEnum('qc_status', ['PASS', 'FAIL', 'NONE']);

// Compliance status enum
export const complianceStatusEnum = pgEnum('compliance_status', ['PASS', 'FAIL', 'NOT_EVALUATED']);

// ND reporting style enum
export const ndReportingStyleEnum = pgEnum('nd_reporting_style', ['ND_TEXT', 'LT_LOD', 'LT_LOQ']);

// Test runs (individual test executions, can have multiple for reruns)
export const testRuns = pgTable('test_runs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    taskId: varchar('task_id', { length: 36 }).notNull().references(() => testTasks.id),
    runNumber: integer('run_number').notNull().default(1),

    // Instrument used
    instrumentId: varchar('instrument_id', { length: 36 }).references(() => instruments.id),

    // Dilution factor
    dilutionFactor: decimal('dilution_factor', { precision: 10, scale: 4 }).default('1'),

    // Raw readings
    rawReading: decimal('raw_reading', { precision: 15, scale: 6 }),
    blankReading: decimal('blank_reading', { precision: 15, scale: 6 }),

    // Timing
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Who performed
    performedBy: varchar('performed_by', { length: 36 }).references(() => users.id),

    // Notes
    notes: text('notes'),

    // Is final run
    isFinal: boolean('is_final').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Test results (the final calculated result)
export const testResults = pgTable('test_results', {
    id: varchar('id', { length: 36 }).primaryKey(),
    taskId: varchar('task_id', { length: 36 }).notNull().references(() => testTasks.id).unique(),
    runId: varchar('run_id', { length: 36 }).references(() => testRuns.id), // Which run this result came from

    // Parameter/subparameter
    parameterId: varchar('parameter_id', { length: 36 }).references(() => parameters.id),
    subparameterId: varchar('subparameter_id', { length: 36 }).references(() => subparameters.id),

    // Result value
    resultValue: decimal('result_value', { precision: 15, scale: 6 }),
    resultText: varchar('result_text', { length: 100 }), // e.g., "ND", "< 0.001"
    unitId: varchar('unit_id', { length: 36 }).references(() => units.id),

    // Not Detected handling
    isND: boolean('is_nd').notNull().default(false),
    ndReportingStyle: ndReportingStyleEnum('nd_reporting_style'),
    lodValue: decimal('lod_value', { precision: 15, scale: 6 }),
    loqValue: decimal('loq_value', { precision: 15, scale: 6 }),

    // Uncertainty
    uncertainty: decimal('uncertainty', { precision: 15, scale: 6 }),
    uncertaintyUnit: varchar('uncertainty_unit', { length: 50 }),

    // Limits (from rule at time of test)
    limitMin: decimal('limit_min', { precision: 15, scale: 6 }),
    limitMax: decimal('limit_max', { precision: 15, scale: 6 }),

    // Compliance
    complianceStatus: complianceStatusEnum('compliance_status').default('NOT_EVALUATED'),

    // QC
    qcRecoveryPercent: decimal('qc_recovery_percent', { precision: 6, scale: 2 }),
    qcStatus: qcStatusEnum('qc_status').default('NONE'),

    // Entered by
    enteredBy: varchar('entered_by', { length: 36 }).references(() => users.id),
    enteredAt: timestamp('entered_at', { withTimezone: true }),

    // Version for revisions
    version: integer('version').notNull().default(1),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Result attachments (chromatograms, spectra, etc.)
export const resultAttachments = pgTable('result_attachments', {
    id: varchar('id', { length: 36 }).primaryKey(),
    resultId: varchar('result_id', { length: 36 }).notNull().references(() => testResults.id),
    runId: varchar('run_id', { length: 36 }).references(() => testRuns.id),

    filePath: varchar('file_path', { length: 500 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileType: varchar('file_type', { length: 50 }),
    fileSize: integer('file_size'),

    description: text('description'),
    uploadedBy: varchar('uploaded_by', { length: 36 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Calculation logs (traceability of calculations)
export const calculations = pgTable('calculations', {
    id: varchar('id', { length: 36 }).primaryKey(),
    resultId: varchar('result_id', { length: 36 }).notNull().references(() => testResults.id),

    formula: text('formula'),
    inputValues: jsonb('input_values'), // {rawReading: 0.5, dilution: 10, blank: 0.01}
    calculatedValue: decimal('calculated_value', { precision: 15, scale: 6 }),

    calculatedBy: varchar('calculated_by', { length: 36 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// QC checks per result
export const qcChecks = pgTable('qc_checks', {
    id: varchar('id', { length: 36 }).primaryKey(),
    resultId: varchar('result_id', { length: 36 }).notNull().references(() => testResults.id),

    checkType: varchar('check_type', { length: 50 }).notNull(), // RPD, RECOVERY, BLANK
    expectedValue: decimal('expected_value', { precision: 15, scale: 6 }),
    actualValue: decimal('actual_value', { precision: 15, scale: 6 }),
    acceptanceMin: decimal('acceptance_min', { precision: 15, scale: 6 }),
    acceptanceMax: decimal('acceptance_max', { precision: 15, scale: 6 }),
    isPassed: boolean('is_passed').notNull(),
    remarks: text('remarks'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Nonconformities
export const nonconformityStatusEnum = pgEnum('nonconformity_status', ['OPEN', 'RESOLVED', 'CLOSED']);

export const nonconformities = pgTable('nonconformities', {
    id: varchar('id', { length: 36 }).primaryKey(),
    resultId: varchar('result_id', { length: 36 }).references(() => testResults.id),
    taskId: varchar('task_id', { length: 36 }).references(() => testTasks.id),

    ncNumber: varchar('nc_number', { length: 50 }).notNull(),
    description: text('description').notNull(),
    rootCause: text('root_cause'),
    correctiveAction: text('corrective_action'),
    preventiveAction: text('preventive_action'),

    status: nonconformityStatusEnum('status').notNull().default('OPEN'),

    raisedBy: varchar('raised_by', { length: 36 }).references(() => users.id),
    raisedAt: timestamp('raised_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedBy: varchar('resolved_by', { length: 36 }).references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const testRunsRelations = relations(testRuns, ({ one }) => ({
    task: one(testTasks, {
        fields: [testRuns.taskId],
        references: [testTasks.id],
    }),
    instrument: one(instruments, {
        fields: [testRuns.instrumentId],
        references: [instruments.id],
    }),
    performer: one(users, {
        fields: [testRuns.performedBy],
        references: [users.id],
    }),
}));

export const testResultsRelations = relations(testResults, ({ one, many }) => ({
    task: one(testTasks, {
        fields: [testResults.taskId],
        references: [testTasks.id],
    }),
    run: one(testRuns, {
        fields: [testResults.runId],
        references: [testRuns.id],
    }),
    parameter: one(parameters, {
        fields: [testResults.parameterId],
        references: [parameters.id],
    }),
    subparameter: one(subparameters, {
        fields: [testResults.subparameterId],
        references: [subparameters.id],
    }),
    unit: one(units, {
        fields: [testResults.unitId],
        references: [units.id],
    }),
    attachments: many(resultAttachments),
    calculations: many(calculations),
    qcChecks: many(qcChecks),
    nonconformities: many(nonconformities),
}));

export const resultAttachmentsRelations = relations(resultAttachments, ({ one }) => ({
    result: one(testResults, {
        fields: [resultAttachments.resultId],
        references: [testResults.id],
    }),
}));

export const calculationsRelations = relations(calculations, ({ one }) => ({
    result: one(testResults, {
        fields: [calculations.resultId],
        references: [testResults.id],
    }),
}));

export const qcChecksRelations = relations(qcChecks, ({ one }) => ({
    result: one(testResults, {
        fields: [qcChecks.resultId],
        references: [testResults.id],
    }),
}));

export const nonconformitiesRelations = relations(nonconformities, ({ one }) => ({
    result: one(testResults, {
        fields: [nonconformities.resultId],
        references: [testResults.id],
    }),
    task: one(testTasks, {
        fields: [nonconformities.taskId],
        references: [testTasks.id],
    }),
}));

