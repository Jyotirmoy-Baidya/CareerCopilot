'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2, AlertTriangle } from 'lucide-react';

export default function NewGroupPage() {
  const router = useRouter();
  const [name,    setName]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/groups', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to create group');
      setLoading(false);
      return;
    }

    const { groupId } = await res.json();
    router.push(`/groups/${groupId}`);
  };

  return (
    <div className="max-w-lg">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to groups
      </Link>

      <div className="bg-white rounded-xl border p-8">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mb-5">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create a study group</h1>
        <p className="text-sm text-gray-500 mt-1">
          Give your group a name. An invite code is generated automatically.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Group name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Full Stack Study Circle"
              required
              maxLength={100}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : 'Create group'}
          </button>
        </form>
      </div>
    </div>
  );
}
