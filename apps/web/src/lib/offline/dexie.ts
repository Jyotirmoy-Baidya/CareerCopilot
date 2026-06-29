import Dexie, { type Table } from 'dexie';

export interface LocalTask {
  id:           string;
  userId:       string;
  roadmapId:    string | null;
  skillId:      string | null;
  title:        string;
  description:  string | null;
  status:       'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate:      string;
  estimatedMin: number;
  completedAt:  string | null;
  synced:       boolean;
  updatedAt:    number;
  createdAt:    number;
}

export interface LocalRoadmapNode {
  id:          string;
  roadmapId:   string;
  skillId:     string;
  skillName:   string;
  order:       number;
  isCompleted: boolean;
  completedAt: string | null;
  synced:      boolean;
  updatedAt:   number;
}

export interface LocalNote {
  id:       string;
  groupId:  string;
  title:    string;
  cachedAt: number;
}

export interface SyncQueueItem {
  id?:            number;
  opType:         'task_update' | 'roadmap_node_update' | 'task_create';
  entityId:       string;
  payload:        string;
  createdAt:      number;
  retries:        number;
  lastAttemptAt:  number | null;
}

export interface LocalUserPrefs {
  key:           string;
  userId:        string;
  targetRole:    string;
  weeklyGoalHrs: number;
  lastSyncedAt:  number | null;
  streakDays:    number;
  lastStudiedAt: string | null;
}

class CareerCopilotOfflineDB extends Dexie {
  tasks!:        Table<LocalTask>;
  roadmapNodes!: Table<LocalRoadmapNode>;
  notes!:        Table<LocalNote>;
  syncQueue!:    Table<SyncQueueItem>;
  userPrefs!:    Table<LocalUserPrefs>;

  constructor() {
    super('careercopliot-v1');
    this.version(1).stores({
      tasks:        'id, userId, status, dueDate, synced, updatedAt',
      roadmapNodes: 'id, roadmapId, order, isCompleted, synced',
      notes:        'id, groupId, cachedAt',
      syncQueue:    '++id, opType, entityId, createdAt, retries',
      userPrefs:    'key',
    });
  }
}

export const offlineDB = new CareerCopilotOfflineDB();
