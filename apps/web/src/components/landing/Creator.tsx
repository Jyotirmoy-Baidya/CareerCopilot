// eslint-disable-next-line @typescript-eslint/no-deprecated
import { Github, Linkedin } from 'lucide-react';
import { FadeIn } from './FadeIn';
import { CreatorAvatar } from './CreatorAvatar';

export function Creator() {
  return (
    <section className="py-24 px-6 bg-gray-50" id="creator">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-0">
              {/* Photo / avatar panel */}
              <div className="relative w-full md:w-64 flex-shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center py-16 md:py-0 md:self-stretch overflow-hidden min-h-[280px]">
                <CreatorAvatar />
              </div>

              {/* Content */}
              <div className="flex-1 p-10">
                <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-2">
                  Built by
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Jyotirmoy Baidya</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Full-stack engineer who turns ideas into production-ready products — from system
                  design down to pixel-perfect UI.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed mb-7">
                  I work across the entire stack: Next.js and React on the frontend, Node.js
                  microservices and REST APIs on the backend, PostgreSQL and Redis for data, and
                  Docker for deployment. I&apos;m comfortable with real-time systems (WebSockets, CRDTs),
                  AI integrations, and designing scalable monorepo architectures from scratch.
                </p>

                <div className="flex items-center gap-4">
                  <a
                    href="https://github.com/Jyotirmoy-Baidya"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-500 transition"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                  <a
                    href="https://www.linkedin.com/in/jyotirmoy-baidya/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-500 transition"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
