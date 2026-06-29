'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/home',     label: 'Home'      },
  { href: '/roadmap',  label: 'Roadmap'   },
  { href: '/tasks',    label: 'Tasks'     },
  { href: '/progress', label: 'Progress'  },
  { href: '/groups',   label: 'Groups'    },
  { href: '/ai',       label: 'AI Mentor' },
];

interface Props {
  userName: string;
}

export function MobileNav({ userName }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(v => !v)}
        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-down drawer */}
      <div
        className={`md:hidden fixed left-0 right-0 top-[57px] z-40 bg-white border-b shadow-lg transition-all duration-200 origin-top ${
          open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'
        }`}
      >
        <nav className="px-4 py-3 flex flex-col gap-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition ${
                pathname === l.href
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="px-8 py-3 border-t text-sm text-gray-400">
          Signed in as <span className="font-medium text-gray-600">{userName}</span>
        </div>
      </div>
    </>
  );
}
