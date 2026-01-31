import { pgTable, varchar, text, boolean, timestamp, decimal, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Sample matrices (e.g., Air Limbah Domestik, Air Minum)
export const sampleMatrices = pgTable('sample_matrices', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }),
    category: varchar('category', { length: 100 }), // Environment, Food, etc.
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Units (mg/L, °C, etc.)
export const units = pgTable('units', {
    id: varchar('id', { length: 36 }).primaryKey(),
    symbol: varchar('symbol', { length: 50 }).notNull(), // mg/L
    name: varchar('name', { length: 255 }), // Milligram per Liter
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Parameters (COD, pH, Lead)
export const parameters = pgTable('parameters', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    symbol: varchar('symbol', { length: 50 }),
    group: varchar('group', { length: 100 }), // Logam Berat, Fisika, Kimia
    category: varchar('category', { length: 100 }),
    defaultUnitId: varchar('default_unit_id', { length: 36 }).references(() => units.id),
    hasSubparameter: boolean('has_subparameter').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Subparameters (for grouped params like Logam Berat -> Arsen, Cd, Pb)
export const subparameters = pgTable('subparameters', {
    id: varchar('id', { length: 36 }).primaryKey(),
    parameterId: varchar('parameter_id', { length: 36 }).notNull().references(() => parameters.id),
    name: varchar('name', { length: 255 }).notNull(),
    casNumber: varchar('cas_number', { length: 50 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Methods (SNI 6989.82:2018)
export const methods = pgTable('methods', {
    id: varchar('id', { length: 36 }).primaryKey(),
    code: varchar('code', { length: 100 }).notNull(), // SNI 6989.82:2018
    name: text('name').notNull(),
    description: text('description'),
    isAccredited: boolean('is_accredited').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Instruments (ICP-OES, pH Meter)
export const instrumentStatusEnum = pgEnum('instrument_status', ['READY', 'IN_USE', 'MAINTENANCE', 'CALIBRATION']);

export const instruments = pgTable('instruments', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }),
    model: varchar('model', { length: 255 }),
    serialNumber: varchar('serial_number', { length: 100 }),
    location: varchar('location', { length: 255 }),
    status: instrumentStatusEnum('status').default('READY'),
    calibrationDueDate: timestamp('calibration_due_date', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Limit type enum
export const limitTypeEnum = pgEnum('limit_type', ['MAX', 'MIN', 'RANGE', 'NONE']);

// Matrix-Parameter Rules (the core logic)
export const matrixParameterRules = pgTable('matrix_parameter_rules', {
    id: varchar('id', { length: 36 }).primaryKey(),
    matrixId: varchar('matrix_id', { length: 36 }).notNull().references(() => sampleMatrices.id),
    parameterId: varchar('parameter_id', { length: 36 }).references(() => parameters.id),
    subparameterId: varchar('subparameter_id', { length: 36 }).references(() => subparameters.id),

    // Auto-population defaults
    defaultMethodId: varchar('default_method_id', { length: 36 }).references(() => methods.id),
    defaultInstrumentId: varchar('default_instrument_id', { length: 36 }).references(() => instruments.id),
    defaultTatDays: integer('default_tat_days').notNull().default(5),

    // Limits / QC
    limitType: limitTypeEnum('limit_type').notNull().default('NONE'),
    limitMin: decimal('limit_min', { precision: 15, scale: 6 }),
    limitMax: decimal('limit_max', { precision: 15, scale: 6 }),
    limitUnitId: varchar('limit_unit_id', { length: 36 }).references(() => units.id),

    // LOD/LOQ defaults
    lodDefault: decimal('lod_default', { precision: 15, scale: 6 }),
    loqDefault: decimal('loq_default', { precision: 15, scale: 6 }),

    // QC rules (configurable per parameter/method)
    qcRecoveryMin: decimal('qc_recovery_min', { precision: 5, scale: 2 }).default('80.00'),
    qcRecoveryMax: decimal('qc_recovery_max', { precision: 5, scale: 2 }).default('120.00'),

    // Pricing
    basePrice: decimal('base_price', { precision: 15, scale: 2 }).notNull().default('0'),

    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Price list (version-controlled pricing)
export const priceList = pgTable('price_list', {
    id: varchar('id', { length: 36 }).primaryKey(),
    matrixId: varchar('matrix_id', { length: 36 }).notNull().references(() => sampleMatrices.id),
    parameterId: varchar('parameter_id', { length: 36 }).references(() => parameters.id),
    subparameterId: varchar('subparameter_id', { length: 36 }).references(() => subparameters.id),
    priceAmount: decimal('price_amount', { precision: 15, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('IDR'),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Test packages (bundle of parameters)
export const testPackages = pgTable('test_packages', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    matrixId: varchar('matrix_id', { length: 36 }).notNull().references(() => sampleMatrices.id),
    description: text('description'),
    totalPrice: decimal('total_price', { precision: 15, scale: 2 }).notNull(),
    tatDays: integer('tat_days').notNull().default(5),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Test package items
export const testPackageItems = pgTable('test_package_items', {
    id: varchar('id', { length: 36 }).primaryKey(),
    packageId: varchar('package_id', { length: 36 }).notNull().references(() => testPackages.id),
    parameterId: varchar('parameter_id', { length: 36 }).references(() => parameters.id),
    subparameterId: varchar('subparameter_id', { length: 36 }).references(() => subparameters.id),
    methodId: varchar('method_id', { length: 36 }).references(() => methods.id),
    instrumentId: varchar('instrument_id', { length: 36 }).references(() => instruments.id),
    priceOverride: decimal('price_override', { precision: 15, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Storage locations
export const storageLocationTypeEnum = pgEnum('storage_location_type', ['CHILLER', 'FREEZER', 'ROOM', 'OTHER']);

export const storageLocations = pgTable('storage_locations', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    locationType: storageLocationTypeEnum('location_type').notNull().default('ROOM'),
    temperatureSetpoint: decimal('temperature_setpoint', { precision: 5, scale: 2 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const parametersRelations = relations(parameters, ({ one, many }) => ({
    defaultUnit: one(units, {
        fields: [parameters.defaultUnitId],
        references: [units.id],
    }),
    subparameters: many(subparameters),
}));

export const subparametersRelations = relations(subparameters, ({ one }) => ({
    parameter: one(parameters, {
        fields: [subparameters.parameterId],
        references: [parameters.id],
    }),
}));

export const testPackagesRelations = relations(testPackages, ({ one, many }) => ({
    matrix: one(sampleMatrices, {
        fields: [testPackages.matrixId],
        references: [sampleMatrices.id],
    }),
    items: many(testPackageItems),
}));

export const testPackageItemsRelations = relations(testPackageItems, ({ one }) => ({
    package: one(testPackages, {
        fields: [testPackageItems.packageId],
        references: [testPackages.id],
    }),
}));

export const matrixParameterRulesRelations = relations(matrixParameterRules, ({ one }) => ({
    matrix: one(sampleMatrices, {
        fields: [matrixParameterRules.matrixId],
        references: [sampleMatrices.id],
    }),
    parameter: one(parameters, {
        fields: [matrixParameterRules.parameterId],
        references: [parameters.id],
    }),
    subparameter: one(subparameters, {
        fields: [matrixParameterRules.subparameterId],
        references: [subparameters.id],
    }),
    method: one(methods, {
        fields: [matrixParameterRules.defaultMethodId],
        references: [methods.id],
    }),
    instrument: one(instruments, {
        fields: [matrixParameterRules.defaultInstrumentId],
        references: [instruments.id],
    }),
    unit: one(units, {
        fields: [matrixParameterRules.limitUnitId],
        references: [units.id],
    }),
}));

