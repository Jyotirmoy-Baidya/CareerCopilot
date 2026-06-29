import Link from 'next/link';
import { NavbarAuthButtons } from './NavbarAuthButtons';

export function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.svg" alt="CareerCopilot AI" width={160} height={26} />
        </Link>
        <NavbarAuthButtons />
      </div>
    </nav>
  );
}
