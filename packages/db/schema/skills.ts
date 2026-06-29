import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const skillLevelEnum = pgEnum('skill_level', ['beginner', 'intermediate', 'advanced']);

export const skillNodes = pgTable('skill_nodes', {
  id:           uuid('id').primaryKey().defaultRandom(),
  slug:         varchar('slug', { length: 100 }).notNull().unique(),
  name:         varchar('name', { length: 255 }).notNull(),
  description:  text('description'),
  category:     varchar('category', { length: 100 }).notNull(),
  level:        skillLevelEnum('level').default('beginner').notNull(),
  estimatedHrs: integer('estimated_hrs').default(10).notNull(),
  resourceUrl:  text('resource_url'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

// Edge in the skill DAG — fromSkill must be learned before toSkill
export const skillEdges = pgTable('skill_edges', {
  id:          uuid('id').primaryKey().defaultRandom(),
  fromSkillId: uuid('from_skill_id').notNull().references(() => skillNodes.id, { onDelete: 'cascade' }),
  toSkillId:   uuid('to_skill_id').notNull().references(() => skillNodes.id, { onDelete: 'cascade' }),
  weight:      integer('weight').default(1).notNull(),
});

export const userSkills = pgTable('user_skills', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  skillId:    uuid('skill_id').notNull().references(() => skillNodes.id, { onDelete: 'cascade' }),
  confidence: integer('confidence').default(50).notNull(),
  verified:   boolean('verified').default(false).notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});

export type SkillNode  = typeof skillNodes.$inferSelect;
export type SkillEdge  = typeof skillEdges.$inferSelect;
export type UserSkill  = typeof userSkills.$inferSelect;
