'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Users, WifiOff } from 'lucide-react';

const stats = [
  { icon: Zap, label: 'AI-powered', value: 'Smart roadmaps' },
  { icon: WifiOff, label: 'Offline-first', value: 'Works anywhere' },
  { icon: Users, label: 'Collaborative', value: 'Study together' },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 bg-brand-50 border border-brand-500/20 text-brand-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6"
      >
        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
        <p className='pb-[1px]'>
          Know your gaps. Own your path.
        </p>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 max-w-4xl leading-[1.08]"
      >
        Your AI career mentor
        <span className="block text-brand-500">that never sleeps.</span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed"
      >
        CareerCopilot maps your current skills against your target role and builds a
        day-by-day learning plan. Study offline, collaborate with teammates, and get
        AI guidance exactly when you need it.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-brand-500 text-white rounded-xl font-semibold text-base hover:bg-brand-600 transition shadow-lg shadow-brand-500/25"
        >
          Start for free
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-50 transition shadow-sm"
        >
          Sign in
        </Link>
      </motion.div>

      {/* Stat chips */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="mt-16 flex flex-wrap justify-center gap-4"
      >
        {stats.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
