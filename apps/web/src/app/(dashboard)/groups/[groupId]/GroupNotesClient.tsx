'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Copy, Check } from 'lucide-react';
import { useGroupStore } from '@/stores/group.store';
import { toast } from 'sonner';

interface Props {
  groupId:    string;
  inviteCode: string;
}

export function GroupNotesClient({ groupId, inviteCode }: Props) {
  const router    = useRouter();
  const [creating, setCreating] = useState(false);
  const [copied,   setCopied]   = useState(false);

  const userRole = useGroupStore(s => s.userRole);
  const canCreate = userRole === 'admin' || userRole === 'editor';

  const createNote = async () => {
    setCreating(true);
    const res = await fetch(`/api/groups/${groupId}/notes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: 'Untitled note' }),
    }).catch(() => null);

    setCreating(false);
    if (!res?.ok) {
      toast.error('Could not create note. Try again.');
      return;
    }
    const { noteId } = await res.json();
    router.push(`/groups/${groupId}/notes/${noteId}`);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyCode}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border rounded-md px-3 py-1.5 transition"
        title="Copy invite code"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy code'}
      </button>

      {canCreate && (
        <button
          onClick={createNote}
          disabled={creating}
          className="inline-flex items-center gap-1.5 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-md px-3 py-1.5 transition disabled:opacity-60"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          New note
        </button>
      )}
    </div>
  );
}
