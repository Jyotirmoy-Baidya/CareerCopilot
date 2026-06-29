'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/home',     label: 'Home'      },
  { href: '/roadmap',  label: 'Roadmap'   },
  { href: '/tasks',    label: 'Tasks'     },
  { href: '/progress', label: 'Progress'  },
  { href: '/groups',   label: 'Groups'    },
  { href: '/ai',       label: 'AI Mentor' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navLinks.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm px-3 py-1.5 rounded-md font-medium transition ${
            pathname === l.href || (l.href !== '/home' && pathname.startsWith(l.href))
              ? 'bg-brand-50 text-brand-600'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
