import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  studentId: text('student_id'),
  role: text('role').notNull().default('student'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  contactEmail: text('contact_email').notNull(),
  meetingSchedule: text('meeting_schedule').notNull(),
  location: text('location').notNull(),
  memberCount: integer('member_count').notNull().default(1),
  createdByUid: text('created_by_uid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('upcoming'),
  category: text('category').notNull(),
  venue: text('venue').notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  capacity: integer('capacity').notNull().default(100),
  registeredCount: integer('registered_count').notNull().default(0),
  createdByUid: text('created_by_uid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const registrations = pgTable(
  'registrations',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id')
      .references(() => events.id, { onDelete: 'cascade' })
      .notNull(),
    userUid: text('user_uid'),
    studentName: text('student_name').notNull(),
    studentId: text('student_id').notNull(),
    studentEmail: text('student_email'),
    passCode: text('pass_code').notNull().unique(),
    checkedIn: boolean('checked_in').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('registrations_event_student_idx').on(table.eventId, table.studentId),
  ]
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [events.organizationId],
    references: [organizations.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
}));
