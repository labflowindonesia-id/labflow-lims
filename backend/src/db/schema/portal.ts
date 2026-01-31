import { pgTable, varchar, text, boolean, timestamp, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './customers';
import { workOrders } from './work-orders';
import { reports } from './reports';

// Portal accounts (separate auth from internal users)
export const portalAccounts = pgTable('portal_accounts', {
    id: varchar('id', { length: 36 }).primaryKey(),
    customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id),

    // Login credentials
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),

    // Profile
    contactName: varchar('contact_name', { length: 255 }),

    // Status
    isActive: boolean('is_active').notNull().default(true),
    emailVerified: boolean('email_verified').notNull().default(false),

    // Security
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),

    // Password reset
    passwordResetToken: varchar('password_reset_token', { length: 255 }),
    passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Portal sessions
export const portalSessions = pgTable('portal_sessions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    accountId: varchar('account_id', { length: 36 }).notNull().references(() => portalAccounts.id),

    token: varchar('token', { length: 500 }).notNull().unique(),

    // Session info
    ipAddress: varchar('ip_address', { length: 50 }),
    userAgent: text('user_agent'),

    // Expiration
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    isRevoked: boolean('is_revoked').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Portal access policies (customer visibility rules)
export const portalAccessPolicies = pgTable('portal_access_policies', {
    id: varchar('id', { length: 36 }).primaryKey(),
    customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id),

    // What they can see
    canViewWorkOrders: boolean('can_view_work_orders').notNull().default(true),
    canViewReports: boolean('can_view_reports').notNull().default(true),
    canDownloadReports: boolean('can_download_reports').notNull().default(true),
    canViewStatusTimeline: boolean('can_view_status_timeline').notNull().default(true),

    // Retention
    reportRetentionDays: integer('report_retention_days').default(1825), // 5 years

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Portal activity logs
export const portalActivityLogs = pgTable('portal_activity_logs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    accountId: varchar('account_id', { length: 36 }).notNull().references(() => portalAccounts.id),
    sessionId: varchar('session_id', { length: 36 }).references(() => portalSessions.id),

    action: varchar('action', { length: 50 }).notNull(), // LOGIN, LOGOUT, VIEW_REPORT, DOWNLOAD_REPORT
    resourceType: varchar('resource_type', { length: 50 }), // REPORT, WORK_ORDER
    resourceId: varchar('resource_id', { length: 36 }),

    ipAddress: varchar('ip_address', { length: 50 }),
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report customer visibility (which reports are visible in portal)
export const reportCustomerVisibility = pgTable('report_customer_visibility', {
    id: varchar('id', { length: 36 }).primaryKey(),
    reportId: varchar('report_id', { length: 36 }).notNull().references(() => reports.id),
    customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id),

    isVisible: boolean('is_visible').notNull().default(true),
    visibleFrom: timestamp('visible_from', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Timeline stage enum
export const timelineStageEnum = pgEnum('timeline_stage', ['RECEIVED', 'LAB_ANALYSIS', 'REVIEW', 'COMPLETED']);

// Status timeline events (for customer portal tracker)
export const statusTimelineEvents = pgTable('status_timeline_events', {
    id: varchar('id', { length: 36 }).primaryKey(),
    workOrderId: varchar('work_order_id', { length: 36 }).notNull().references(() => workOrders.id),

    stage: timelineStageEnum('stage').notNull(),
    status: varchar('status', { length: 50 }).notNull(), // pending, in_progress, completed
    description: text('description'),

    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const portalAccountsRelations = relations(portalAccounts, ({ one, many }) => ({
    customer: one(customers, {
        fields: [portalAccounts.customerId],
        references: [customers.id],
    }),
    sessions: many(portalSessions),
    activityLogs: many(portalActivityLogs),
}));

export const portalSessionsRelations = relations(portalSessions, ({ one }) => ({
    account: one(portalAccounts, {
        fields: [portalSessions.accountId],
        references: [portalAccounts.id],
    }),
}));

export const portalAccessPoliciesRelations = relations(portalAccessPolicies, ({ one }) => ({
    customer: one(customers, {
        fields: [portalAccessPolicies.customerId],
        references: [customers.id],
    }),
}));

export const portalActivityLogsRelations = relations(portalActivityLogs, ({ one }) => ({
    account: one(portalAccounts, {
        fields: [portalActivityLogs.accountId],
        references: [portalAccounts.id],
    }),
    session: one(portalSessions, {
        fields: [portalActivityLogs.sessionId],
        references: [portalSessions.id],
    }),
}));

export const reportCustomerVisibilityRelations = relations(reportCustomerVisibility, ({ one }) => ({
    report: one(reports, {
        fields: [reportCustomerVisibility.reportId],
        references: [reports.id],
    }),
    customer: one(customers, {
        fields: [reportCustomerVisibility.customerId],
        references: [customers.id],
    }),
}));

export const statusTimelineEventsRelations = relations(statusTimelineEvents, ({ one }) => ({
    workOrder: one(workOrders, {
        fields: [statusTimelineEvents.workOrderId],
        references: [workOrders.id],
    }),
}));

