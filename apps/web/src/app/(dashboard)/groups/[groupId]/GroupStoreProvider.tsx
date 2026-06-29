'use client';

import { useEffect } from 'react';
import { useGroupStore } from '@/stores/group.store';

interface Props {
  groupId:    string;
  groupName:  string;
  inviteCode: string;
  userRole:   'admin' | 'editor' | 'viewer';
  isOwner:    boolean;
}

export function GroupStoreProvider({ groupId, groupName, inviteCode, userRole, isOwner }: Props) {
  const { setGroup, clearGroup } = useGroupStore();

  useEffect(() => {
    setGroup({ groupId, groupName, inviteCode, userRole, isOwner, permissions: null });
    return () => clearGroup();
  }, [groupId, groupName, inviteCode, userRole, isOwner, setGroup, clearGroup]);

  return null;
}
