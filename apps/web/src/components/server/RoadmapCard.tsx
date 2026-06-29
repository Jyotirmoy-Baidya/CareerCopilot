import type { GeneratedRoadmap } from '@careercopliot/types';

interface RoadmapCardProps {
  roadmap: GeneratedRoadmap;
}

export function RoadmapCard({ roadmap }: RoadmapCardProps) {
  const pct = roadmap.totalSkills > 0
    ? Math.round((roadmap.doneSkills / roadmap.totalSkills) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Your roadmap</p>
          <h2 className="text-lg font-semibold mt-0.5">{roadmap.title}</h2>
        </div>
        <span className="text-2xl font-bold text-brand-500">{pct}%</span>
      </div>

      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex gap-4 text-sm text-gray-600">
        <span>{roadmap.doneSkills} / {roadmap.totalSkills} skills</span>
        <span>~{roadmap.estimatedDays} days left</span>
      </div>
    </div>
  );
}
