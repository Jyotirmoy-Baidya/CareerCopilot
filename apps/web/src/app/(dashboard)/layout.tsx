import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Footer } from '@/components/server/Footer';
import { SyncIndicator } from '@/components/client/sync/SyncIndicator';
import { SyncStoreInitializer } from '@/components/client/sync/SyncStoreInitializer';
import { SignOutButton } from '@/components/client/dashboard/SignOutButton';
import { NotificationBell } from '@/components/client/notifications/NotificationBell';

const navLinks = [
  { href: '/home',     label: 'Home'      },
  { href: '/roadmap',  label: 'Roadmap'   },
  { href: '/tasks',    label: 'Tasks'     },
  { href: '/progress', label: 'Progress'  },
  { href: '/groups',   label: 'Groups'    },
  { href: '/ai',       label: 'AI Mentor' },
];

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
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <SyncIndicator />
          <NotificationBell />
          <span className="text-sm text-gray-600">{session.user?.name}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
