'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function GroupsClient() {
  const router = useRouter();
  const [code,    setCode]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/groups/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ inviteCode: code }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Invalid invite code');
      return;
    }

    router.push(`/groups/${data.groupId}`);
  };

  return (
    <div>
      <form onSubmit={join} className="flex gap-2 max-w-sm">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="INVITE CODE"
          maxLength={12}
          required
          className="flex-1 border rounded-md px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-brand-500 text-white text-sm rounded-md hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-2 max-w-sm">{error}</p>}
    </div>
  );
}
