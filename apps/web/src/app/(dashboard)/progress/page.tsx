import { auth } from '@/lib/auth';
import { fetchRoadmap } from '@/lib/api';
import { ProgressChart } from '@/components/client/dashboard/ProgressChart';

const levelColor: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-red-100 text-red-700',
};

export default async function ProgressPage() {
  const session = await auth();
  if (!session) return null;

  const targetRole = (session.user as any).targetRole ?? 'fullstack';
  const roadmap    = await fetchRoadmap(session.accessToken, targetRole).catch(() => null);

  const pct = roadmap && roadmap.totalSkills > 0
    ? Math.round((roadmap.doneSkills / roadmap.totalSkills) * 100)
    : 0;

  const completedSkills = roadmap?.skills.filter((s: any) => s.isCompleted)  ?? [];
  const remainingSkills = roadmap?.skills.filter((s: any) => !s.isCompleted) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your progress</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Skills completed', value: roadmap?.doneSkills ?? 0 },
          { label: 'Skills remaining', value: remainingSkills.length },
          { label: 'Days to goal',     value: roadmap?.estimatedDays ?? 0 },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-brand-500 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {roadmap && (
        <ProgressChart doneSkills={roadmap.doneSkills} totalSkills={roadmap.totalSkills} />
      )}

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-2">Overall completion</h2>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{pct}% complete</p>
      </div>

      {remainingSkills.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">
            Skills remaining
            <span className="ml-2 text-sm font-normal text-gray-400">({remainingSkills.length})</span>
          </h2>
          <ol className="space-y-2">
            {remainingSkills.map((skill: any, i: number) => (
              <li key={skill.skillId} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs font-medium flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${levelColor[skill.level] ?? 'bg-gray-100 text-gray-600'}`}>
                  {skill.level}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">{skill.estimatedHrs}h</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {completedSkills.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4 text-green-700">
            Completed
            <span className="ml-2 text-sm font-normal text-gray-400">({completedSkills.length})</span>
          </h2>
          <ul className="space-y-2">
            {completedSkills.map((skill: any) => (
              <li key={skill.skillId} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-500 line-through">{skill.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
