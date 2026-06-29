import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { roadmaps } from './roadmaps';

export const groupRoleEnum = pgEnum('group_role', ['admin', 'editor', 'viewer']);

export type GroupPermissions = {
  editor: { view: boolean; edit: boolean; create: boolean; delete: boolean };
  viewer: { view: boolean; edit: boolean; create: boolean; delete: boolean };
};

export const DEFAULT_PERMISSIONS: GroupPermissions = {
  editor: { view: true, edit: true,  create: true,  delete: false },
  viewer: { view: true, edit: false, create: false, delete: false },
};

export const studyGroups = pgTable('study_groups', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  roadmapId:   uuid('roadmap_id').references(() => roadmaps.id),
  createdBy:   uuid('created_by').notNull().references(() => users.id),
  inviteCode:  varchar('invite_code', { length: 12 }).unique(),
  permissions: jsonb('permissions').$type<GroupPermissions>().default(DEFAULT_PERMISSIONS).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
});

export const groupMembers = pgTable('group_members', {
  id:       uuid('id').primaryKey().defaultRandom(),
  groupId:  uuid('group_id').notNull().references(() => studyGroups.id, { onDelete: 'cascade' }),
  userId:   uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role:     groupRoleEnum('role').default('viewer').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export type StudyGroup  = typeof studyGroups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
