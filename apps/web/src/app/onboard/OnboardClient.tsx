'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const ROLES = [
  { slug: 'frontend',      label: 'Frontend Developer',  desc: 'HTML, CSS, React, UX' },
  { slug: 'backend',       label: 'Backend Developer',   desc: 'APIs, databases, servers' },
  { slug: 'fullstack',     label: 'Fullstack Developer', desc: 'Frontend + Backend combined' },
  { slug: 'devops',        label: 'DevOps Engineer',     desc: 'CI/CD, cloud, infrastructure' },
  { slug: 'data-scientist',label: 'Data Scientist',      desc: 'ML, statistics, Python' },
  { slug: 'mobile',        label: 'Mobile Developer',    desc: 'iOS, Android, React Native' },
];

const SKILLS: { category: string; items: { slug: string; label: string }[] }[] = [
  {
    category: 'Web Fundamentals',
    items: [
      { slug: 'html',       label: 'HTML' },
      { slug: 'css',        label: 'CSS' },
      { slug: 'javascript', label: 'JavaScript' },
      { slug: 'typescript', label: 'TypeScript' },
    ],
  },
  {
    category: 'Frontend',
    items: [
      { slug: 'react',    label: 'React' },
      { slug: 'nextjs',   label: 'Next.js' },
      { slug: 'vue',      label: 'Vue' },
      { slug: 'tailwind', label: 'Tailwind CSS' },
    ],
  },
  {
    category: 'Backend',
    items: [
      { slug: 'nodejs',     label: 'Node.js' },
      { slug: 'express',    label: 'Express' },
      { slug: 'python',     label: 'Python' },
      { slug: 'fastapi',    label: 'FastAPI' },
    ],
  },
  {
    category: 'Database',
    items: [
      { slug: 'postgresql', label: 'PostgreSQL' },
      { slug: 'mongodb',    label: 'MongoDB' },
      { slug: 'redis',      label: 'Redis' },
      { slug: 'mysql',      label: 'MySQL' },
    ],
  },
  {
    category: 'Tools & DevOps',
    items: [
      { slug: 'git',        label: 'Git' },
      { slug: 'docker',     label: 'Docker' },
      { slug: 'linux',      label: 'Linux' },
      { slug: 'kubernetes', label: 'Kubernetes' },
    ],
  },
];

const HOURS_OPTIONS = [5, 10, 15, 20, 30];

export function OnboardClient({ name }: { name: string }) {
  const router    = useRouter();
  const { update } = useSession();

  const [step,        setStep]        = useState(1);
  const [targetRole,  setTargetRole]  = useState('');
  const [knownSlugs,  setKnownSlugs]  = useState<Set<string>>(new Set());
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  function toggleSkill(slug: string) {
    setKnownSlugs(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboard', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          targetRole,
          knownSlugs:   Array.from(knownSlugs),
          weeklyGoalHrs: weeklyHours,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      await update({ isOnboarded: true, targetRole });
      window.location.href = '/home';
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* Progress bar */}
      <div className="px-8 pt-8">
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                step > n  ? 'bg-brand-500 text-white' :
                step === n ? 'bg-brand-500 text-white ring-4 ring-brand-50' :
                             'bg-gray-100 text-gray-400'
              }`}>
                {step > n ? '✓' : n}
              </div>
              {n < 3 && (
                <div className={`h-0.5 flex-1 rounded ${step > n ? 'bg-brand-500' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* Step 1: Role */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">What do you want to become?</h2>
            <p className="text-sm text-gray-500 mb-6">We&apos;ll tailor your learning roadmap around this goal.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLES.map(role => (
                <button
                  key={role.slug}
                  type="button"
                  onClick={() => setTargetRole(role.slug)}
                  className={`text-left px-4 py-4 rounded-xl border-2 transition-colors ${
                    targetRole === role.slug
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{role.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{role.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={!targetRole}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Known skills */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">What do you already know?</h2>
            <p className="text-sm text-gray-500 mb-6">Select everything you&apos;re comfortable with — we&apos;ll skip those in your roadmap.</p>
            <div className="space-y-5">
              {SKILLS.map(group => (
                <div key={group.category}>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group.category}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(skill => (
                      <button
                        key={skill.slug}
                        type="button"
                        onClick={() => toggleSkill(skill.slug)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                          knownSlugs.has(skill.slug)
                            ? 'border-brand-500 bg-brand-50 text-brand-600 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {skill.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-400">{knownSlugs.size} skill{knownSlugs.size !== 1 ? 's' : ''} selected — or leave blank if you&apos;re just getting started.</p>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Weekly hours */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">How many hours per week can you study?</h2>
            <p className="text-sm text-gray-500 mb-6">We&apos;ll use this to estimate how long your roadmap will take and pace your daily tasks.</p>
            <div className="flex flex-wrap gap-3">
              {HOURS_OPTIONS.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setWeeklyHours(h)}
                  className={`px-5 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    weeklyHours === h
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {h} hrs / week
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {weeklyHours <= 5  ? 'Casual — great for learning on the side.' :
               weeklyHours <= 10 ? 'Part-time — steady, consistent progress.' :
               weeklyHours <= 15 ? 'Dedicated — you\'ll move quickly.' :
                                   'Intensive — full-speed ahead.'}
            </p>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Setting up your roadmap…' : `Let's go, ${name}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
