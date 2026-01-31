import { pgTable, varchar, text, boolean, timestamp, decimal, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers, customerContacts } from './customers';
import { users } from './users';
import { quotations } from './quotations';
import { sampleMatrices, parameters, subparameters, methods, instruments, units, storageLocations } from './master-data';

// Work order status enum
export const workOrderStatusEnum = pgEnum('work_order_status', [
    'RECEIVED_DRAFT', 'RECEIVED_CONFIRMED', 'IN_ANALYSIS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'
]);

// Work orders table
export const workOrders = pgTable('work_orders', {
    id: varchar('id', { length: 36 }).primaryKey(),
    workOrderNumber: varchar('work_order_number', { length: 50 }).notNull().unique(),

    // Source quotation (optional - can be walk-in)
    quotationId: varchar('quotation_id', { length: 36 }).references(() => quotations.id),

    // Customer info
    customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id),
    contactId: varchar('contact_id', { length: 36 }).references(() => customerContacts.id),

    // Frozen snapshots
    customerNameSnapshot: varchar('customer_name_snapshot', { length: 255 }),
    customerAddressSnapshot: text('customer_address_snapshot'),

    // Matrix
    matrixId: varchar('matrix_id', { length: 36 }).notNull().references(() => sampleMatrices.id),

    // Status
    status: workOrderStatusEnum('status').notNull().default('RECEIVED_DRAFT'),

    // Dates
    receivedDate: timestamp('received_date', { withTimezone: true }).notNull().defaultNow(),
    confirmedDate: timestamp('confirmed_date', { withTimezone: true }),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedDate: timestamp('completed_date', { withTimezone: true }),

    // Sample info
    totalSamples: integer('total_samples').notNull().default(1),

    // Notes
    receiverNotes: text('receiver_notes'),

    // Audit
    createdBy: varchar('created_by', { length: 36 }).notNull().references(() => users.id),
    confirmedBy: varchar('confirmed_by', { length: 36 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Condition status enum
export const conditionStatusEnum = pgEnum('condition_status', ['INTACT', 'LEAK', 'DAMAGED', 'OTHER']);

// Sampling method enum
export const samplingMethodEnum = pgEnum('sampling_method', ['GRAB', 'COMPOSITE']);

// Samples table
export const samples = pgTable('samples', {
    id: varchar('id', { length: 36 }).primaryKey(),
    workOrderId: varchar('work_order_id', { length: 36 }).notNull().references(() => workOrders.id),

    // Sample identifiers
    sampleLabId: varchar('sample_lab_id', { length: 50 }).notNull().unique(), // R/YYYYMMXXXX
    customerSampleId: varchar('customer_sample_id', { length: 100 }),

    // Sample details
    sampleName: varchar('sample_name', { length: 255 }),
    description: text('description'),

    // Matrix
    matrixId: varchar('matrix_id', { length: 36 }).notNull().references(() => sampleMatrices.id),

    // Condition at receipt
    condition: conditionStatusEnum('condition').notNull().default('INTACT'),
    conditionNotes: text('condition_notes'),

    // Storage
    storageLocationId: varchar('storage_location_id', { length: 36 }).references(() => storageLocations.id),
    storageTemperature: decimal('storage_temperature', { precision: 5, scale: 2 }),

    // Volume/quantity
    originalVolume: decimal('original_volume', { precision: 10, scale: 3 }),
    volumeUnit: varchar('volume_unit', { length: 20 }),

    // Dates
    samplingDate: timestamp('sampling_date', { withTimezone: true }),
    collectedBy: varchar('collected_by', { length: 255 }),

    // Disposal
    disposalDate: timestamp('disposal_date', { withTimezone: true }),
    isDisposed: boolean('is_disposed').notNull().default(false),

    // Audit
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Sample photos
export const samplePhotos = pgTable('sample_photos', {
    id: varchar('id', { length: 36 }).primaryKey(),
    sampleId: varchar('sample_id', { length: 36 }).notNull().references(() => samples.id),
    filePath: varchar('file_path', { length: 500 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size'), // bytes
    uploadedBy: varchar('uploaded_by', { length: 36 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Sampling details (field measurements)
export const samplingDetails = pgTable('sampling_details', {
    id: varchar('id', { length: 36 }).primaryKey(),
    sampleId: varchar('sample_id', { length: 36 }).notNull().references(() => samples.id).unique(),

    // Sampling info
    samplingMethod: samplingMethodEnum('sampling_method'),
    samplingLocation: text('sampling_location'),
    samplingPoint: varchar('sampling_point', { length: 255 }),
    samplingCoordinates: varchar('sampling_coordinates', { length: 100 }), // GPS coordinates

    // Weather conditions
    weatherCondition: varchar('weather_condition', { length: 100 }),
    ambientTemperature: decimal('ambient_temperature', { precision: 5, scale: 2 }),

    // Field observations
    fieldObservations: text('field_observations'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Field measurements (pH, temp at sampling)
export const fieldMeasurements = pgTable('field_measurements', {
    id: varchar('id', { length: 36 }).primaryKey(),
    sampleId: varchar('sample_id', { length: 36 }).notNull().references(() => samples.id),
    parameterName: varchar('parameter_name', { length: 100 }).notNull(), // pH, Temperature, DO
    value: decimal('value', { precision: 15, scale: 6 }).notNull(),
    unitSymbol: varchar('unit_symbol', { length: 50 }),
    measuredAt: timestamp('measured_at', { withTimezone: true }),
    measuredBy: varchar('measured_by', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Requested tests (tests to be performed on sample)
export const requestedTests = pgTable('requested_tests', {
    id: varchar('id', { length: 36 }).primaryKey(),
    sampleId: varchar('sample_id', { length: 36 }).notNull().references(() => samples.id),

    // Test info
    parameterId: varchar('parameter_id', { length: 36 }).references(() => parameters.id),
    subparameterId: varchar('subparameter_id', { length: 36 }).references(() => subparameters.id),
    methodId: varchar('method_id', { length: 36 }).references(() => methods.id),
    instrumentId: varchar('instrument_id', { length: 36 }).references(() => instruments.id),

    // From quotation line
    quotationLineId: varchar('quotation_line_id', { length: 36 }),

    // TAT
    tatDays: integer('tat_days').notNull().default(5),
    dueDate: timestamp('due_date', { withTimezone: true }),

    // Price
    priceAmount: decimal('price_amount', { precision: 15, scale: 2 }),

    // Status
    isScheduled: boolean('is_scheduled').notNull().default(false),
    isCompleted: boolean('is_completed').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
    quotation: one(quotations, {
        fields: [workOrders.quotationId],
        references: [quotations.id],
    }),
    customer: one(customers, {
        fields: [workOrders.customerId],
        references: [customers.id],
    }),
    contact: one(customerContacts, {
        fields: [workOrders.contactId],
        references: [customerContacts.id],
    }),
    matrix: one(sampleMatrices, {
        fields: [workOrders.matrixId],
        references: [sampleMatrices.id],
    }),
    samples: many(samples),
    createdByUser: one(users, {
        fields: [workOrders.createdBy],
        references: [users.id],
        relationName: 'workOrderCreator',
    }),
}));

export const samplesRelations = relations(samples, ({ one, many }) => ({
    workOrder: one(workOrders, {
        fields: [samples.workOrderId],
        references: [workOrders.id],
    }),
    matrix: one(sampleMatrices, {
        fields: [samples.matrixId],
        references: [sampleMatrices.id],
    }),
    storageLocation: one(storageLocations, {
        fields: [samples.storageLocationId],
        references: [storageLocations.id],
    }),
    photos: many(samplePhotos),
    samplingDetails: one(samplingDetails, {
        fields: [samples.id],
        references: [samplingDetails.sampleId],
    }),
    fieldMeasurements: many(fieldMeasurements),
    requestedTests: many(requestedTests),
}));

export const samplePhotosRelations = relations(samplePhotos, ({ one }) => ({
    sample: one(samples, {
        fields: [samplePhotos.sampleId],
        references: [samples.id],
    }),
}));

export const samplingDetailsRelations = relations(samplingDetails, ({ one }) => ({
    sample: one(samples, {
        fields: [samplingDetails.sampleId],
        references: [samples.id],
    }),
}));

export const fieldMeasurementsRelations = relations(fieldMeasurements, ({ one }) => ({
    sample: one(samples, {
        fields: [fieldMeasurements.sampleId],
        references: [samples.id],
    }),
}));

export const requestedTestsRelations = relations(requestedTests, ({ one }) => ({
    sample: one(samples, {
        fields: [requestedTests.sampleId],
        references: [samples.id],
    }),
    parameter: one(parameters, {
        fields: [requestedTests.parameterId],
        references: [parameters.id],
    }),
    subparameter: one(subparameters, {
        fields: [requestedTests.subparameterId],
        references: [subparameters.id],
    }),
    method: one(methods, {
        fields: [requestedTests.methodId],
        references: [methods.id],
    }),
    instrument: one(instruments, {
        fields: [requestedTests.instrumentId],
        references: [instruments.id],
    }),
}));

