import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { roadmaps } from './roadmaps';
import { skillNodes } from './skills';

export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'skipped']);

export const dailyTasks = pgTable('daily_tasks', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roadmapId:    uuid('roadmap_id').references(() => roadmaps.id),
  skillId:      uuid('skill_id').references(() => skillNodes.id),
  title:        varchar('title', { length: 500 }).notNull(),
  description:  text('description'),
  status:       taskStatusEnum('status').default('pending').notNull(),
  dueDate:      date('due_date').notNull(),
  estimatedMin: integer('estimated_min').default(30).notNull(),
  completedAt:  timestamp('completed_at'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

export type DailyTask    = typeof dailyTasks.$inferSelect;
export type NewDailyTask = typeof dailyTasks.$inferInsert;
