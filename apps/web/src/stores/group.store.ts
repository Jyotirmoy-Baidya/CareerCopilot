import { create } from 'zustand';

interface PermRow { view: boolean; edit: boolean; create: boolean; delete: boolean }

interface GroupPermissions {
  editor: PermRow;
  viewer: PermRow;
}

interface GroupContext {
  groupId:     string;
  groupName:   string;
  inviteCode:  string;
  userRole:    'admin' | 'editor' | 'viewer';
  isOwner:     boolean;
  permissions: GroupPermissions | null;
}

interface GroupState extends GroupContext {
  setGroup:       (ctx: GroupContext) => void;
  clearGroup:     () => void;
  setPermissions: (p: GroupPermissions) => void;
}

const EMPTY: GroupContext = {
  groupId:     '',
  groupName:   '',
  inviteCode:  '',
  userRole:    'viewer',
  isOwner:     false,
  permissions: null,
};

export const useGroupStore = create<GroupState>((set) => ({
  ...EMPTY,

  setGroup: (ctx) => set(ctx),

  clearGroup: () => set(EMPTY),

  setPermissions: (permissions) => set({ permissions }),
}));
