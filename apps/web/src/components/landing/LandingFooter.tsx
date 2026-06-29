import Link from 'next/link';
// eslint-disable-next-line @typescript-eslint/no-deprecated
import { Github, Linkedin, Mail } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Creator', href: '#creator' },
];

const authLinks = [
  { label: 'Sign in', href: '/login' },
  { label: 'Register', href: '/register' },
];

const socialLinks = [
  { icon: Github, href: 'https://github.com/Jyotirmoy-Baidya', label: 'GitHub' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/jyotirmoy-baidya/', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:jyotirmoybaidya408@gmail.com', label: 'Email' },
];

export function LandingFooter() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12 pb-12 border-b border-gray-800">
          {/* Brand */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.svg" alt="CareerCopilot AI" width={140} height={22} className="brightness-0 invert mb-4" />
            <p className="text-sm leading-relaxed max-w-xs">
              AI-powered career mentoring that maps your skills to your dream role — step by step.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-brand-500 transition"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">
              Platform
            </h4>
            <ul className="space-y-3">
              {navLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm hover:text-white transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">
              Account
            </h4>
            <ul className="space-y-3">
              {authLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm hover:text-white transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} CareerCopilot AI · Jb Creates</p>
          <p>
            Built by{' '}
            <a
              href="https://github.com/Jyotirmoy-Baidya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
            >
              Jyotirmoy Baidya
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
