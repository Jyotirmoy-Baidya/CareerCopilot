'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email address is required');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password too short', {
        description: 'Use at least 8 characters.',
      });
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? 'Registration failed', {
        description: 'Please try again or use a different email.',
      });
      setLoading(false);
      return;
    }

    toast.success('Account created!', { description: 'Signing you in…' });
    await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    router.push('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-10">

        <div className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mb-5">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start your learning journey with CareerCopilot</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Your full name"
              required
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="jb@gmail.com"
              required
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400">Minimum 8 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </span>
            ) : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-7">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-500 hover:text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
