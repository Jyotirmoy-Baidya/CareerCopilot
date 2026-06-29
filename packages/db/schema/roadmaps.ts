import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { skillNodes } from './skills';

export const roadmapStatusEnum = pgEnum('roadmap_status', ['active', 'completed', 'paused']);

export const roadmaps = pgTable('roadmaps', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:         varchar('title', { length: 255 }).notNull(),
  targetRole:    varchar('target_role', { length: 255 }).notNull(),
  status:        roadmapStatusEnum('status').default('active').notNull(),
  totalSkills:   integer('total_skills').default(0).notNull(),
  doneSkills:    integer('done_skills').default(0).notNull(),
  estimatedDays: integer('estimated_days'),
  metadata:      jsonb('metadata'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
});

export const roadmapNodes = pgTable('roadmap_nodes', {
  id:          uuid('id').primaryKey().defaultRandom(),
  roadmapId:   uuid('roadmap_id').notNull().references(() => roadmaps.id, { onDelete: 'cascade' }),
  skillId:     uuid('skill_id').notNull().references(() => skillNodes.id),
  order:       integer('order').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  unlockedAt:  timestamp('unlocked_at'),
});

export type Roadmap     = typeof roadmaps.$inferSelect;
export type RoadmapNode = typeof roadmapNodes.$inferSelect;
