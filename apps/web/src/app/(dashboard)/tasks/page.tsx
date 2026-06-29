import { auth } from '@/lib/auth';
import { fetchDailyTasks, fetchRoadmap } from '@/lib/api';
import { mintServiceToken } from '@/lib/service-token';
import { TaskBoard } from '@/components/client/dashboard/TaskBoard';

export default async function TasksPage() {
  const session = await auth();
  if (!session) return null;

  const token      = mintServiceToken({ ...session.user, role: (session.user as any).role });
  const targetRole = (session.user as any).targetRole ?? 'fullstack';
  const roadmap    = await fetchRoadmap(token, targetRole).catch(() => null);
  const tasks      = roadmap ? await fetchDailyTasks(token, roadmap.roadmapId).catch(() => []) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Today&apos;s tasks</h1>
      <p className="text-sm text-gray-500">
        Tasks are saved to your device immediately. They sync to the server when you are online.
      </p>
      <TaskBoard initialTasks={tasks} />
    </div>
  );
}
