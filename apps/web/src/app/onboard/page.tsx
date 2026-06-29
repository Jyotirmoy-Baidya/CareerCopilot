import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OnboardClient } from './OnboardClient';

export default async function OnboardPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if ((session.user as any).isOnboarded) redirect('/home');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-brand-500">CareerCopilot</span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Let&apos;s set up your path</h1>
          <p className="mt-2 text-gray-500">Answer 3 quick questions so we can build your personalised roadmap.</p>
        </div>
        <OnboardClient name={session.user?.name?.split(' ')[0] ?? 'there'} />
      </div>
    </div>
  );
}
