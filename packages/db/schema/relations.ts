import { relations } from 'drizzle-orm';
import { users } from './users';
import { studyGroups, groupMembers } from './groups';
import { groupNotes, noteVersions } from './notes';
import { roadmaps, roadmapNodes } from './roadmaps';
import { skillNodes } from './skills';
import { dailyTasks } from './tasks';

export const usersRelations = relations(users, ({ many }) => ({
  groupMembers: many(groupMembers),
  groupNotes:   many(groupNotes),
  roadmaps:     many(roadmaps),
  dailyTasks:   many(dailyTasks),
}));

export const studyGroupsRelations = relations(studyGroups, ({ many }) => ({
  members: many(groupMembers),
  notes:   many(groupNotes),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(studyGroups, { fields: [groupMembers.groupId], references: [studyGroups.id] }),
  user:  one(users,       { fields: [groupMembers.userId],  references: [users.id] }),
}));

export const groupNotesRelations = relations(groupNotes, ({ one, many }) => ({
  group:    one(studyGroups, { fields: [groupNotes.groupId], references: [studyGroups.id] }),
  creator:  one(users,       { fields: [groupNotes.createdBy], references: [users.id] }),
  versions: many(noteVersions),
}));

export const noteVersionsRelations = relations(noteVersions, ({ one }) => ({
  note:    one(groupNotes, { fields: [noteVersions.noteId],    references: [groupNotes.id] }),
  creator: one(users,      { fields: [noteVersions.createdBy], references: [users.id] }),
}));

export const roadmapsRelations = relations(roadmaps, ({ one, many }) => ({
  creator: one(users,         { fields: [roadmaps.userId],    references: [users.id] }),
  nodes:   many(roadmapNodes),
}));

export const roadmapNodesRelations = relations(roadmapNodes, ({ one }) => ({
  roadmap:   one(roadmaps,    { fields: [roadmapNodes.roadmapId], references: [roadmaps.id] }),
  skillNode: one(skillNodes,  { fields: [roadmapNodes.skillId],   references: [skillNodes.id] }),
}));

export const dailyTasksRelations = relations(dailyTasks, ({ one }) => ({
  user: one(users, { fields: [dailyTasks.userId], references: [users.id] }),
}));
