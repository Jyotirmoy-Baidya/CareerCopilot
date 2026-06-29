import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Footer } from '@/components/server/Footer';
import { SyncIndicator } from '@/components/client/sync/SyncIndicator';
import { SyncStoreInitializer } from '@/components/client/sync/SyncStoreInitializer';
import { SignOutButton } from '@/components/client/dashboard/SignOutButton';
import { NotificationBell } from '@/components/client/notifications/NotificationBell';
import { MobileNav } from '@/components/client/dashboard/MobileNav';
import { NavLinks } from '@/components/client/dashboard/NavLinks';


export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');
  if (!(session.user as any).isOnboarded) redirect('/onboard');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Single sync engine — drives both SyncIndicator and OfflineBanner */}
      <SyncStoreInitializer />

      <header className="border-b bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.svg" alt="CareerCopilot" width={140} height={24} />
        </Link>
        <NavLinks />
        <div className="flex items-center gap-3">
          <SyncIndicator />
          <NotificationBell />
          <span className="hidden md:block text-sm text-gray-600">{session.user?.name}</span>
          <SignOutButton />
          <MobileNav userName={session.user?.name ?? ''} />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
