import { pgTable, varchar, text, boolean, timestamp, decimal, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { parameters, subparameters, methods, instruments, sampleMatrices } from './master-data';

// QC Recovery records (periodic QC runs)
export const qcRecoveryRecords = pgTable('qc_recovery_records', {
    id: varchar('id', { length: 36 }).primaryKey(),

    // What was tested
    matrixId: varchar('matrix_id', { length: 36 }).references(() => sampleMatrices.id),
    parameterId: varchar('parameter_id', { length: 36 }).references(() => parameters.id),
    subparameterId: varchar('subparameter_id', { length: 36 }).references(() => subparameters.id),
    methodId: varchar('method_id', { length: 36 }).references(() => methods.id),
    instrumentId: varchar('instrument_id', { length: 36 }).references(() => instruments.id),

    // Spike/recovery
    spikedAmount: decimal('spiked_amount', { precision: 15, scale: 6 }).notNull(),
    recoveredAmount: decimal('recovered_amount', { precision: 15, scale: 6 }).notNull(),
    recoveryPercent: decimal('recovery_percent', { precision: 6, scale: 2 }).notNull(),

    // Acceptance range
    acceptanceMin: decimal('acceptance_min', { precision: 5, scale: 2 }).notNull().default('80.00'),
    acceptanceMax: decimal('acceptance_max', { precision: 5, scale: 2 }).notNull().default('120.00'),

    // Result
    isPassed: boolean('is_passed').notNull(),

    // Who/when
    performedBy: varchar('performed_by', { length: 36 }).references(() => users.id),
    performedAt: timestamp('performed_at', { withTimezone: true }).notNull(),

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// QC trend cache (for quick lookup of last N QC results)
export const qcTrendCache = pgTable('qc_trend_cache', {
    id: varchar('id', { length: 36 }).primaryKey(),

    // Key
    matrixId: varchar('matrix_id', { length: 36 }).notNull().references(() => sampleMatrices.id),
    parameterId: varchar('parameter_id', { length: 36 }).notNull().references(() => parameters.id),
    methodId: varchar('method_id', { length: 36 }).references(() => methods.id),

    // Cached data
    lastFiveRecoveries: jsonb('last_five_recoveries'), // [{date, value, passed}, ...]
    averageRecovery: decimal('average_recovery', { precision: 6, scale: 2 }),
    stdDeviation: decimal('std_deviation', { precision: 6, scale: 2 }),

    // Control chart limits
    warningLimitLow: decimal('warning_limit_low', { precision: 6, scale: 2 }),
    warningLimitHigh: decimal('warning_limit_high', { precision: 6, scale: 2 }),
    controlLimitLow: decimal('control_limit_low', { precision: 6, scale: 2 }),
    controlLimitHigh: decimal('control_limit_high', { precision: 6, scale: 2 }),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const qcRecoveryRecordsRelations = relations(qcRecoveryRecords, ({ one }) => ({
    matrix: one(sampleMatrices, {
        fields: [qcRecoveryRecords.matrixId],
        references: [sampleMatrices.id],
    }),
    parameter: one(parameters, {
        fields: [qcRecoveryRecords.parameterId],
        references: [parameters.id],
    }),
    subparameter: one(subparameters, {
        fields: [qcRecoveryRecords.subparameterId],
        references: [subparameters.id],
    }),
    method: one(methods, {
        fields: [qcRecoveryRecords.methodId],
        references: [methods.id],
    }),
    instrument: one(instruments, {
        fields: [qcRecoveryRecords.instrumentId],
        references: [instruments.id],
    }),
    performer: one(users, {
        fields: [qcRecoveryRecords.performedBy],
        references: [users.id],
    }),
}));

export const qcTrendCacheRelations = relations(qcTrendCache, ({ one }) => ({
    matrix: one(sampleMatrices, {
        fields: [qcTrendCache.matrixId],
        references: [sampleMatrices.id],
    }),
    parameter: one(parameters, {
        fields: [qcTrendCache.parameterId],
        references: [parameters.id],
    }),
    method: one(methods, {
        fields: [qcTrendCache.methodId],
        references: [methods.id],
    }),
}));

