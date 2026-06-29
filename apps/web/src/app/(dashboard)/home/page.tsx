import { auth } from '@/lib/auth';
import { fetchRoadmap, fetchDailyTasks } from '@/lib/api';
import { mintServiceToken } from '@/lib/service-token';
import { RoadmapCard } from '@/components/server/RoadmapCard';
import { TaskList }    from '@/components/server/TaskList';
import { ProgressChart } from '@/components/client/dashboard/ProgressChart';
import { TaskBoard }     from '@/components/client/dashboard/TaskBoard';

export default async function HomePage() {
  const session = await auth();
  if (!session || !session.user) return null;

  const token      = mintServiceToken({ ...session.user, id: session.user.id ?? '', role: (session.user as any).role });
  const targetRole = (session.user as any).targetRole ?? 'fullstack';

  const roadmap = await fetchRoadmap(token, targetRole);
  const tasks   = roadmap
    ? await fetchDailyTasks(token, roadmap.roadmapId).catch(() => [])
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Good to see you, {session.user?.name?.split(' ')[0]}</h1>

      {roadmap ? (
        <RoadmapCard roadmap={roadmap} />
      ) : (
        <div className="bg-white rounded-xl border p-5 text-sm text-gray-500">
          Complete onboarding to generate your roadmap.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold">Today&apos;s tasks</h2>
          {tasks.length > 0
            ? <TaskBoard initialTasks={tasks} />
            : <TaskList tasks={tasks} />
          }
        </div>

        {roadmap && (
          <div>
            <h2 className="font-semibold mb-4">Progress</h2>
            <ProgressChart doneSkills={roadmap.doneSkills} totalSkills={roadmap.totalSkills} />
          </div>
        )}
      </div>
    </div>
  );
}
