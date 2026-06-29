import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  customType,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { studyGroups } from './groups';
import { skillNodes } from './skills';

// PostgreSQL bytea type for storing Yjs binary document state
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() { return 'bytea'; },
  toDriver(val: Buffer) { return val; },
  fromDriver(val: Buffer) { return val; },
});

export const groupNotes = pgTable('group_notes', {
  id:        uuid('id').primaryKey().defaultRandom(),
  groupId:   uuid('group_id').notNull().references(() => studyGroups.id, { onDelete: 'cascade' }),
  skillId:   uuid('skill_id').references(() => skillNodes.id),
  title:     varchar('title', { length: 500 }).notNull(),
  yjsState:  bytea('yjs_state'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Named point-in-time snapshots for version history
export const noteVersions = pgTable('note_versions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  noteId:      uuid('note_id').notNull().references(() => groupNotes.id, { onDelete: 'cascade' }),
  yjsSnapshot: bytea('yjs_snapshot').notNull(),
  htmlContent: text('html_content'),
  label:       varchar('label', { length: 255 }),
  createdBy:   uuid('created_by').notNull().references(() => users.id),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

// Audit log for every sync operation
export const syncOps = pgTable('sync_ops', {
  id:        uuid('id').primaryKey().defaultRandom(),
  noteId:    uuid('note_id').references(() => groupNotes.id),
  userId:    uuid('user_id').notNull().references(() => users.id),
  opType:    varchar('op_type', { length: 50 }).notNull(),
  byteSize:  integer('byte_size'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Queue for offline operations that haven't synced to the server yet
export const offlineSyncQueue = pgTable('offline_sync_queue', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  opType:      varchar('op_type', { length: 100 }).notNull(),
  payload:     text('payload').notNull(),
  status:      varchar('status', { length: 20 }).default('pending').notNull(),
  retries:     integer('retries').default(0).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

export type GroupNote         = typeof groupNotes.$inferSelect;
export type NoteVersion       = typeof noteVersions.$inferSelect;
export type SyncOp            = typeof syncOps.$inferSelect;
export type OfflineSyncQueue  = typeof offlineSyncQueue.$inferSelect;
