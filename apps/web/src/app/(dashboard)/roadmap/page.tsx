import { auth } from '@/lib/auth';
import { fetchRoadmap } from '@/lib/api';
import { mintServiceToken } from '@/lib/service-token';
import { RoadmapList } from '@/components/client/roadmap/RoadmapList';

export default async function RoadmapPage() {
  const session = await auth();
  if (!session || !session.user) return null;

  const token      = mintServiceToken({ ...session.user, id: session.user.id ?? '', role: (session.user as any).role });
  const targetRole = (session.user as any).targetRole ?? 'fullstack';
  const roadmap    = await fetchRoadmap(token, targetRole);

  if (!roadmap) {
    return (
      <div className="text-sm text-gray-500">
        No roadmap found. Complete onboarding to generate one.
      </div>
    );
  }

  const pct = roadmap.totalSkills > 0
    ? Math.round((roadmap.doneSkills / roadmap.totalSkills) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{roadmap.title}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {roadmap.doneSkills} of {roadmap.totalSkills} skills complete · ~{roadmap.estimatedDays} days remaining
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">Overall progress</span>
          <span className="text-2xl font-bold text-brand-500">{pct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Clickable skill list */}
      <RoadmapList skills={roadmap.skills} roadmapId={roadmap.roadmapId} />
    </div>
  );
}
