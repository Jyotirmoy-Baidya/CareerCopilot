import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['learner', 'mentor', 'admin']);

export const users = pgTable('users', {
  id:            uuid('id').primaryKey().defaultRandom(),
  email:         varchar('email', { length: 255 }).notNull().unique(),
  name:          varchar('name', { length: 255 }).notNull(),
  passwordHash:  text('password_hash'),
  role:          userRoleEnum('role').default('learner').notNull(),
  avatarUrl:     text('avatar_url'),
  targetRole:    varchar('target_role', { length: 255 }),
  weeklyGoalHrs: integer('weekly_goal_hrs').default(10),
  isOnboarded:   boolean('is_onboarded').default(false).notNull(),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
