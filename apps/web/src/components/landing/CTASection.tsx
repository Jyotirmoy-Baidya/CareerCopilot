'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-brand-500 rounded-3xl px-10 py-16 text-center text-white"
        >
          {/* decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full" />

          <p className="relative text-sm font-semibold uppercase tracking-widest text-brand-50/80 mb-4">
            Ready to level up?
          </p>
          <h2 className="relative text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            Start your career journey today.
          </h2>
          <p className="relative text-brand-50/80 text-lg max-w-xl mx-auto mb-10">
            Free to use. No credit card required. Your personalised roadmap is one click away.
          </p>
          <Link
            href="/register"
            className="relative inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-8 py-4 rounded-xl hover:bg-brand-50 transition shadow-lg shadow-black/10 text-base"
          >
            Create your account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
