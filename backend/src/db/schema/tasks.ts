import { pgTable, varchar, text, boolean, timestamp, decimal, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, analysts, departments } from './users';
import { samples, requestedTests } from './work-orders';
import { parameters, subparameters, methods, instruments, units } from './master-data';

// Task status enum
export const taskStatusEnum = pgEnum('task_status', [
    'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_RECHECK', 'COMPLETED', 'CANCELLED'
]);

// Task priority enum
export const taskPriorityEnum = pgEnum('task_priority', ['LOW', 'NORMAL', 'HIGH', 'URGENT']);

// Work plans (grouping of tasks)
export const workPlans = pgTable('work_plans', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    plannedDate: timestamp('planned_date', { withTimezone: true }).notNull(),
    departmentId: varchar('department_id', { length: 36 }).references(() => departments.id),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 36 }).notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Test tasks (the actual work items)
export const testTasks = pgTable('test_tasks', {
    id: varchar('id', { length: 36 }).primaryKey(),
    taskNumber: varchar('task_number', { length: 50 }).notNull().unique(),

    // Source
    requestedTestId: varchar('requested_test_id', { length: 36 }).notNull().references(() => requestedTests.id),
    sampleId: varchar('sample_id', { length: 36 }).notNull().references(() => samples.id),
    workPlanId: varchar('work_plan_id', { length: 36 }).references(() => workPlans.id),

    // Test details (snapshot from requested test)
    parameterId: varchar('parameter_id', { length: 36 }).references(() => parameters.id),
    subparameterId: varchar('subparameter_id', { length: 36 }).references(() => subparameters.id),
    methodId: varchar('method_id', { length: 36 }).references(() => methods.id),
    instrumentId: varchar('instrument_id', { length: 36 }).references(() => instruments.id),

    // Assignment
    assignedToId: varchar('assigned_to_id', { length: 36 }).references(() => analysts.id),
    assignedBy: varchar('assigned_by', { length: 36 }).references(() => users.id),
    assignedAt: timestamp('assigned_at', { withTimezone: true }),

    // Status & priority
    status: taskStatusEnum('status').notNull().default('PLANNED'),
    priority: taskPriorityEnum('priority').notNull().default('NORMAL'),

    // Dates
    plannedDate: timestamp('planned_date', { withTimezone: true }),
    dueDate: timestamp('due_date', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Flags
    isOverdue: boolean('is_overdue').notNull().default(false),
    isUrgent: boolean('is_urgent').notNull().default(false),

    // Notes
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Task status logs (history)
export const taskStatusLogs = pgTable('task_status_logs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    taskId: varchar('task_id', { length: 36 }).notNull().references(() => testTasks.id),
    previousStatus: taskStatusEnum('previous_status'),
    newStatus: taskStatusEnum('new_status').notNull(),
    changedBy: varchar('changed_by', { length: 36 }).references(() => users.id),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const workPlansRelations = relations(workPlans, ({ one, many }) => ({
    department: one(departments, {
        fields: [workPlans.departmentId],
        references: [departments.id],
    }),
    createdByUser: one(users, {
        fields: [workPlans.createdBy],
        references: [users.id],
    }),
    tasks: many(testTasks),
}));

export const testTasksRelations = relations(testTasks, ({ one, many }) => ({
    requestedTest: one(requestedTests, {
        fields: [testTasks.requestedTestId],
        references: [requestedTests.id],
    }),
    sample: one(samples, {
        fields: [testTasks.sampleId],
        references: [samples.id],
    }),
    workPlan: one(workPlans, {
        fields: [testTasks.workPlanId],
        references: [workPlans.id],
    }),
    parameter: one(parameters, {
        fields: [testTasks.parameterId],
        references: [parameters.id],
    }),
    subparameter: one(subparameters, {
        fields: [testTasks.subparameterId],
        references: [subparameters.id],
    }),
    method: one(methods, {
        fields: [testTasks.methodId],
        references: [methods.id],
    }),
    instrument: one(instruments, {
        fields: [testTasks.instrumentId],
        references: [instruments.id],
    }),
    assignedTo: one(analysts, {
        fields: [testTasks.assignedToId],
        references: [analysts.id],
    }),
    statusLogs: many(taskStatusLogs),
}));

export const taskStatusLogsRelations = relations(taskStatusLogs, ({ one }) => ({
    task: one(testTasks, {
        fields: [taskStatusLogs.taskId],
        references: [testTasks.id],
    }),
    changedByUser: one(users, {
        fields: [taskStatusLogs.changedBy],
        references: [users.id],
    }),
}));

