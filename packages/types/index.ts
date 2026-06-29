// Shared TypeScript interfaces used across services and the web app

export interface JWTPayload {
  sub:   string;
  role:  'learner' | 'mentor' | 'admin';
  email: string;
  name:  string;
  iat:   number;
  exp:   number;
}

export interface AuthUser {
  id:    string;
  role:  'learner' | 'mentor' | 'admin';
  email: string;
  name:  string;
}

export interface RoadmapSkill {
  nodeId:       string;
  skillId:      string;
  slug:         string;
  name:         string;
  description:  string | null;
  level:        'beginner' | 'intermediate' | 'advanced';
  estimatedHrs: number;
  isCompleted:  boolean;
  order:        number;
}

export interface GeneratedRoadmap {
  roadmapId:     string;
  userId:        string;
  targetRole:    string;
  title:         string;
  totalSkills:   number;
  doneSkills:    number;
  estimatedDays: number;
  skills:        RoadmapSkill[];
}

export interface DailyTask {
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
  createdAt:    string;
}

export interface StudyGroupSummary {
  id:          string;
  name:        string;
  description: string | null;
  inviteCode:  string | null;
  memberCount: number;
  userRole:    'admin' | 'editor' | 'viewer';
}

export interface NoteMeta {
  id:        string;
  groupId:   string;
  title:     string;
  updatedAt: string;
}

export interface NoteVersion {
  id:            string;
  noteId:        string;
  label:         string | null;
  createdAt:     string;
  createdByName: string;
}

export type NotificationJobType =
  | { type: 'daily_reminder';   userId: string; data: { streakDays: number } }
  | { type: 'inactivity_alert'; userId: string; data: { daysSince: number } }
  | { type: 'milestone';        userId: string; data: { skillName: string; progressPct: number } }
  | { type: 'weekly_report';    userId: string; data: { tasksCompleted: number; summary: string } }
  | { type: 'group_joined';       userId: string; data: { groupName: string; inviteCode: string } }
  | { type: 'role_changed';       userId: string; data: { groupName: string; newRole: string } }
  | { type: 'note_version_saved'; userId: string; data: {
      noteTitle:     string;
      groupName:     string;
      versionLabel:  string;
      createdByName: string;
      createdAt:     string;
      htmlContent:   string;
    };
  };

export interface SyncOp {
  type:      'task_update' | 'roadmap_node_update' | 'task_create';
  payload:   Record<string, unknown>;
  timestamp: number;
  version:   number;
}

export interface ApiError {
  error:   string;
  details?: unknown;
}
