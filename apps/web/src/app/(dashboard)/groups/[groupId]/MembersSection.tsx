'use client';

import { useEffect, useState } from 'react';
import { Crown, Shield, User, Check, X, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useGroupStore } from '@/stores/group.store';

type Role    = 'admin' | 'editor' | 'viewer';
type PermKey = 'view' | 'edit' | 'create' | 'delete';

interface PermRow { view: boolean; edit: boolean; create: boolean; delete: boolean }
interface GroupPermissions { editor: PermRow; viewer: PermRow }

interface Member {
  id:        string;
  userId:    string;
  role:      Role;
  isCreator: boolean;
  joinedAt:  string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

const ROLE_META: Record<Role, { label: string; color: string; icon: React.ReactNode }> = {
  admin:  { label: 'Admin',  color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <Shield className="w-3.5 h-3.5" /> },
  editor: { label: 'Editor', color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: <User    className="w-3.5 h-3.5" /> },
  viewer: { label: 'Member', color: 'text-gray-600 bg-gray-50 border-gray-200',       icon: <User    className="w-3.5 h-3.5" /> },
};

const DEFAULT_PERMISSIONS: GroupPermissions = {
  editor: { view: true,  edit: true,  create: true,  delete: false },
  viewer: { view: true,  edit: false, create: false, delete: false },
};

function normalizePermissions(raw: unknown): GroupPermissions {
  const p = raw as Partial<GroupPermissions> | null | undefined;
  return {
    editor: { ...DEFAULT_PERMISSIONS.editor, ...(p?.editor ?? {}) },
    viewer: { ...DEFAULT_PERMISSIONS.viewer, ...(p?.viewer ?? {}) },
  };
}

const PERM_ROWS: { label: string; key: PermKey }[] = [
  { label: 'View notes',   key: 'view'   },
  { label: 'Edit notes',   key: 'edit'   },
  { label: 'Create notes', key: 'create' },
  { label: 'Delete notes', key: 'delete' },
];

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  return (
    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-semibold">
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

interface Props {
  groupId: string;
}

export function MembersSection({ groupId }: Props) {
  const userRole       = useGroupStore(s => s.userRole);
  const isOwner        = useGroupStore(s => s.isOwner);
  const setPermissions = useGroupStore(s => s.setPermissions);

  const [members,    setMembers]    = useState<Member[]>([]);
  const [permissions, setLocalPerms] = useState<GroupPermissions | null>(null);
  const [loadingM,   setLoadingM]   = useState(true);
  const [loadingP,   setLoadingP]   = useState(true);
  const [savingPerm, setSavingPerm] = useState(false);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [permDirty,  setPermDirty]  = useState(false);
  const [permSaved,  setPermSaved]  = useState(false);

  const canManageRoles = isOwner || userRole === 'admin';

  useEffect(() => {
    fetch(`/api/groups/${groupId}/members`)
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => toast.error('Could not load members'))
      .finally(() => setLoadingM(false));

    if (isOwner) {
      fetch(`/api/groups/${groupId}/permissions`)
        .then(r => r.json())
        .then(d => { const p = normalizePermissions(d.permissions); setLocalPerms(p); setPermissions(p); })
        .catch(() => {})
        .finally(() => setLoadingP(false));
    } else {
      setLoadingP(false);
    }
  }, [groupId, isOwner, setPermissions]);

  function togglePerm(role: 'editor' | 'viewer', key: PermKey) {
    setLocalPerms(prev => {
      if (!prev) return prev;
      return { ...prev, [role]: { ...prev[role], [key]: !prev[role][key] } };
    });
    setPermDirty(true);
    setPermSaved(false);
  }

  async function savePermissions() {
    if (!permissions) return;
    setSavingPerm(true);
    const res = await fetch(`/api/groups/${groupId}/permissions`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ permissions }),
    }).catch(() => null);
    setSavingPerm(false);

    if (res?.ok) {
      setPermissions(permissions);
      setPermDirty(false);
      setPermSaved(true);
      toast.success('Permissions saved');
    } else {
      toast.error('Could not save permissions');
    }
  }

  async function changeRole(memberId: string, newRole: Role) {
    setSavingRole(memberId);
    const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role: newRole }),
    }).catch(() => null);

    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      toast.error(data?.error ?? 'Could not update role');
    } else {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast.success('Role updated');
    }
    setSavingRole(null);
  }

  return (
    <div className="space-y-4">

      {/* Roles & permissions — owner-only, editable */}
      {isOwner && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Roles &amp; permissions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Click any cell to toggle. Owner always has full access.</p>
            </div>
            {permDirty && (
              <button
                onClick={savePermissions}
                disabled={savingPerm}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-60 transition"
              >
                {savingPerm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save changes
              </button>
            )}
            {permSaved && !permDirty && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                <Check className="w-4 h-4" /> Saved
              </span>
            )}
          </div>

          {loadingP ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : permissions && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3 font-medium w-1/2">Permission</th>
                    <th className="text-center px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1 justify-center">
                        <Crown className="w-3.5 h-3.5 text-amber-500" /> Owner
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1 justify-center">
                        <Shield className="w-3.5 h-3.5 text-blue-500" /> Editor
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1 justify-center">
                        <User className="w-3.5 h-3.5 text-gray-400" /> Member
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {PERM_ROWS.map(row => (
                    <tr key={row.key} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-700 font-medium">{row.label}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => togglePerm('editor', row.key)} className="flex justify-center w-full group" title="Toggle">
                          {permissions.editor[row.key]
                            ? <Check className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                            : <X     className="w-4 h-4 text-gray-300 group-hover:scale-110 transition-transform" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => togglePerm('viewer', row.key)} className="flex justify-center w-full group" title="Toggle">
                          {permissions.viewer[row.key]
                            ? <Check className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                            : <X     className="w-4 h-4 text-gray-300 group-hover:scale-110 transition-transform" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-700 font-medium">Manage roles</td>
                    <td className="px-4 py-3 text-center"><div className="flex justify-center"><Check className="w-4 h-4 text-green-500" /></div></td>
                    <td className="px-4 py-3 text-center"><div className="flex justify-center"><X className="w-4 h-4 text-gray-200" /></div></td>
                    <td className="px-4 py-3 text-center"><div className="flex justify-center"><X className="w-4 h-4 text-gray-200" /></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Members list — visible to everyone */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Members</h2>
          {!loadingM && (
            <span className="text-xs text-gray-400">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          )}
        </div>

        {loadingM ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : members.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No members found.</p>
        ) : (
          <ul className="divide-y">
            {members.map(m => {
              const meta = ROLE_META[m.role];
              return (
                <li key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                  <Avatar name={m.user.name} avatarUrl={m.user.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate">{m.user.name}</span>
                      {m.isCreator && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          <Crown className="w-3 h-3" /> Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                  </div>

                  {canManageRoles && !m.isCreator ? (
                    <div className="flex items-center gap-2">
                      {savingRole === m.id && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                      <select
                        value={m.role}
                        disabled={savingRole === m.id}
                        onChange={e => changeRole(m.id, e.target.value as Role)}
                        className={`text-xs font-medium border rounded-full px-3 py-1.5 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-60 ${meta.color}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Member</option>
                      </select>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-1 ${meta.color}`}>
                      {meta.icon} {m.isCreator ? 'Owner' : meta.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
