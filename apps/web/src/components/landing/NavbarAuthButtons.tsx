'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function NavbarAuthButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-9 w-32 rounded-lg bg-gray-100 animate-pulse" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          Welcome, <span className="font-semibold text-gray-900">{session.user.name?.split(' ')[0]}</span>
        </span>
        <Link
          href="/home"
          className="text-sm font-semibold bg-brand-500 text-white px-5 py-2 rounded-lg hover:bg-brand-600 transition shadow-sm"
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="text-sm font-semibold bg-brand-500 text-white px-5 py-2 rounded-lg hover:bg-brand-600 transition shadow-sm"
      >
        Get started free
      </Link>
    </div>
  );
}
