import { pgTable, varchar, text, boolean, timestamp, integer, pgEnum, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Audit action enum
export const auditActionEnum = pgEnum('audit_action', [
    'CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT', 'GENERATE_PDF', 'LOCK', 'UNLOCK'
]);

// Notification channel enum
export const notificationChannelEnum = pgEnum('notification_channel', ['EMAIL']);

// Notification status enum
export const notificationStatusEnum = pgEnum('notification_status', ['PENDING', 'SENT', 'FAILED']);

// Audit events (comprehensive audit trail for all entities)
export const auditEvents = pgTable('audit_events', {
    id: varchar('id', { length: 36 }).primaryKey(),

    // What was affected
    entityType: varchar('entity_type', { length: 50 }).notNull(), // quotation, work_order, sample, task, result, report
    entityId: varchar('entity_id', { length: 36 }).notNull(),

    // What happened
    action: auditActionEnum('action').notNull(),

    // Who did it
    userId: varchar('user_id', { length: 36 }).references(() => users.id),
    userEmail: varchar('user_email', { length: 255 }),
    userRole: varchar('user_role', { length: 50 }),

    // Change details
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    changedFields: jsonb('changed_fields'), // ['status', 'resultValue']

    // Context
    reason: text('reason'),
    ipAddress: varchar('ip_address', { length: 50 }),
    userAgent: text('user_agent'),

    // Related entities
    relatedEntities: jsonb('related_entities'), // [{type: 'work_order', id: '...'}]

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    entityIdx: index('audit_entity_idx').on(table.entityType, table.entityId),
    userIdx: index('audit_user_idx').on(table.userId),
    createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
}));

// Entity locks (prevent concurrent edits)
export const entityLocks = pgTable('entity_locks', {
    id: varchar('id', { length: 36 }).primaryKey(),

    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 36 }).notNull(),

    lockedBy: varchar('locked_by', { length: 36 }).notNull().references(() => users.id),
    lockedAt: timestamp('locked_at', { withTimezone: true }).notNull().defaultNow(),
    reason: text('reason'),

    // Automatic expiration
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isReleased: boolean('is_released').notNull().default(false),
    releasedAt: timestamp('released_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    entityIdx: index('lock_entity_idx').on(table.entityType, table.entityId),
}));

// Policy violations (security incidents)
export const policyViolations = pgTable('policy_violations', {
    id: varchar('id', { length: 36 }).primaryKey(),

    violationType: varchar('violation_type', { length: 100 }).notNull(), // UNAUTHORIZED_ACCESS, RATE_LIMIT_EXCEEDED
    severity: varchar('severity', { length: 20 }).notNull(), // LOW, MEDIUM, HIGH, CRITICAL

    userId: varchar('user_id', { length: 36 }).references(() => users.id),
    ipAddress: varchar('ip_address', { length: 50 }),

    description: text('description').notNull(),
    metadata: jsonb('metadata'),

    isResolved: boolean('is_resolved').notNull().default(false),
    resolvedBy: varchar('resolved_by', { length: 36 }).references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolution: text('resolution'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Notifications (internal and external)
export const notifications = pgTable('notifications', {
    id: varchar('id', { length: 36 }).primaryKey(),

    // Recipient
    recipientType: varchar('recipient_type', { length: 20 }).notNull(), // USER, CUSTOMER, EMAIL
    recipientId: varchar('recipient_id', { length: 36 }),
    recipientEmail: varchar('recipient_email', { length: 255 }),

    // Channel
    channel: notificationChannelEnum('channel').notNull(),

    // Content
    subject: varchar('subject', { length: 500 }),
    message: text('message').notNull(),
    htmlContent: text('html_content'),

    // Related entity
    entityType: varchar('entity_type', { length: 50 }),
    entityId: varchar('entity_id', { length: 36 }),

    // Status
    status: notificationStatusEnum('status').notNull().default('PENDING'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
    retryCount: integer('retry_count').notNull().default(0),

    // n8n tracking
    webhookResponseCode: integer('webhook_response_code'),
    webhookResponseBody: text('webhook_response_body'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    statusIdx: index('notification_status_idx').on(table.status),
    recipientIdx: index('notification_recipient_idx').on(table.recipientType, table.recipientId),
}));



// Relations
export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
    user: one(users, {
        fields: [auditEvents.userId],
        references: [users.id],
    }),
}));

export const entityLocksRelations = relations(entityLocks, ({ one }) => ({
    locker: one(users, {
        fields: [entityLocks.lockedBy],
        references: [users.id],
    }),
}));

export const policyViolationsRelations = relations(policyViolations, ({ one }) => ({
    user: one(users, {
        fields: [policyViolations.userId],
        references: [users.id],
    }),
    resolver: one(users, {
        fields: [policyViolations.resolvedBy],
        references: [users.id],
    }),
}));

