import { pgTable, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Customers table
export const customers = pgTable('customers', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }),
    address: text('address'),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Customer contacts (PIC)
export const customerContacts = pgTable('customer_contacts', {
    id: varchar('id', { length: 36 }).primaryKey(),
    customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    mobile: varchar('mobile', { length: 50 }),
    addressOverride: text('address_override'),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
    contacts: many(customerContacts),
}));

export const customerContactsRelations = relations(customerContacts, ({ one }) => ({
    customer: one(customers, {
        fields: [customerContacts.customerId],
        references: [customers.id],
    }),
}));

