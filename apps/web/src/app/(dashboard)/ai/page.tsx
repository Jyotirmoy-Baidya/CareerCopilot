import { auth } from '@/lib/auth';
import { MentorChat } from '@/components/client/ai/MentorChat';
import { fetchRoadmap } from '@/lib/api';

export default async function AIPage() {
  const session = await auth();
  if (!session) return null;

  const targetRole = (session.user as any).targetRole ?? 'fullstack';
  const roadmap    = await fetchRoadmap(session.accessToken, targetRole).catch(() => null);

  // Pass the first incomplete skill as context so the AI knows where the user is
  const currentSkill = roadmap?.skills?.find((s: any) => !s.isCompleted)?.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Mentor</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask anything about your current skill, career path, or get a quiz.
        </p>
      </div>
      <MentorChat targetRole={targetRole} currentSkill={currentSkill} />
    </div>
  );
}
