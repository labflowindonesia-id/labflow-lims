import { pgTable, varchar, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'MANAGER', 'ANALYST']);

// Users table (synced with Supabase Auth)
export const users = pgTable('users', {
    id: varchar('id', { length: 36 }).primaryKey(), // Supabase Auth UID
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    role: userRoleEnum('role').notNull().default('ANALYST'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Departments table
export const departments = pgTable('departments', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Analyst profiles (extended user info for analysts)
export const analysts = pgTable('analysts', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    employeeCode: varchar('employee_code', { length: 50 }),
    departmentId: varchar('department_id', { length: 36 }).references(() => departments.id),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Skill level enum
export const skillLevelEnum = pgEnum('skill_level', ['TRAINING', 'COMPETENT', 'EXPERT']);

// Analyst skills for auto-assignment
export const analystSkills = pgTable('analyst_skills', {
    id: varchar('id', { length: 36 }).primaryKey(),
    analystId: varchar('analyst_id', { length: 36 }).notNull().references(() => analysts.id),
    matrixId: varchar('matrix_id', { length: 36 }),
    parameterId: varchar('parameter_id', { length: 36 }),
    methodId: varchar('method_id', { length: 36 }),
    instrumentId: varchar('instrument_id', { length: 36 }),
    skillLevel: skillLevelEnum('skill_level').notNull().default('COMPETENT'),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validTo: timestamp('valid_to', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
    analyst: one(analysts, {
        fields: [users.id],
        references: [analysts.userId],
    }),
}));

export const analystsRelations = relations(analysts, ({ one, many }) => ({
    user: one(users, {
        fields: [analysts.userId],
        references: [users.id],
    }),
    department: one(departments, {
        fields: [analysts.departmentId],
        references: [departments.id],
    }),
    skills: many(analystSkills),
}));

export const analystSkillsRelations = relations(analystSkills, ({ one }) => ({
    analyst: one(analysts, {
        fields: [analystSkills.analystId],
        references: [analysts.id],
    }),
}));

