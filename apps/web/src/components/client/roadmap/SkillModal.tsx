'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

// Demo YouTube video IDs mapped by skill slug keywords / category
const VIDEO_MAP: Record<string, string> = {
  // Web fundamentals
  html:           'UB1O30fR-EE',
  css:            'yfoY53QXEnI',
  javascript:     'hdI2bqOjy3c',
  'js':           'hdI2bqOjy3c',
  typescript:     'BwuLxPii5-0',
  // Frameworks
  react:          'w7ejDZ8SWv8',
  nextjs:         'ZVnjOPwW6ZA',
  vue:            'FXpIoQ_rT_c',
  angular:        '3qBXWUpoPHo',
  // Backend
  nodejs:         'ENrzD9HAZK4',
  node:           'ENrzD9HAZK4',
  express:        'SccSCuHhOw0',
  python:         'rfscVS0vtbw',
  // Data
  sql:            'HXV3zeQKqGY',
  postgresql:     'qw--VYLpxAU',
  mongodb:        '-56x56UppqQ',
  redis:          'jgpVtp1LlbU',
  // Tools
  git:            'RGOj5yH7evk',
  docker:         'fqMOX6JJhGo',
  kubernetes:     'X48VuDVv0do',
  // CS
  algorithms:     '8hly31xKli0',
  'data-structures': '8hly31xKli0',
  // Categories fallback
  fullstack:      'ysEN5RaKOlA',
  frontend:       'nu_pCVPKzTk',
  backend:        'XBu54nfzxAQ',
  devops:         'j5Zsa_eOXeY',
  'data-science': 'ua-CiDNNj30',
};

function getYouTubeId(resourceUrl: string | null, slug: string, category: string): string | null {
  // 1. Extract from resourceUrl if it's a YouTube link
  if (resourceUrl) {
    const m = resourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    if (m) return m[1];
  }

  // 2. Match slug keywords
  const slugLower = slug.toLowerCase();
  for (const [key, id] of Object.entries(VIDEO_MAP)) {
    if (slugLower.includes(key)) return id;
  }

  // 3. Match category
  return VIDEO_MAP[category.toLowerCase()] ?? VIDEO_MAP['fullstack']!;
}

const LEVEL_COLORS = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-red-100 text-red-700',
};

export interface SkillForModal {
  nodeId:       string;
  skillId:      string;
  slug:         string;
  name:         string;
  description:  string | null;
  category:     string;
  level:        'beginner' | 'intermediate' | 'advanced';
  estimatedHrs: number;
  resourceUrl:  string | null;
  isCompleted:  boolean;
}

interface Props {
  skill:     SkillForModal;
  roadmapId: string;
  onClose:   () => void;
  onComplete: (nodeId: string) => void;
}

export function SkillModal({ skill, roadmapId, onClose, onComplete }: Props) {
  const router  = useRouter();
  const [loading,   setLoading]   = useState(false);
  const [completed, setCompleted] = useState(skill.isCompleted);
  const [error,     setError]     = useState('');

  const videoId = getYouTubeId(skill.resourceUrl, skill.slug, skill.category);

  const markComplete = async () => {
    if (completed) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/roadmap/complete', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nodeId: skill.nodeId, roadmapId }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Something went wrong');
      return;
    }

    setCompleted(true);
    onComplete(skill.nodeId);
    router.refresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${LEVEL_COLORS[skill.level]}`}>
                {skill.level}
              </span>
              <span className="text-xs text-gray-400 capitalize">{skill.category}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{skill.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* YouTube embed */}
          {videoId && (
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={`${skill.name} tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          <div className="p-6 space-y-4">

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                ~{skill.estimatedHrs}h to complete
              </span>
              {skill.resourceUrl && (
                <a
                  href={skill.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-brand-500 hover:text-brand-600"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open resource
                </a>
              )}
            </div>

            {/* Description */}
            {skill.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{skill.description}</p>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer — Mark Complete */}
        <div className="p-6 border-t bg-gray-50">
          {completed ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Marked as completed
            </div>
          ) : (
            <button
              onClick={markComplete}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Marking complete...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Completed
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
