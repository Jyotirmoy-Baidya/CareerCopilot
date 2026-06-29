import { Brain, Map, BookOpen, Users, WifiOff, Bell } from 'lucide-react';
import { FadeIn } from './FadeIn';

const features = [
  {
    icon: Brain,
    title: 'AI Skill Assessment',
    description:
      'Answer a short onboarding quiz. Our model scores your current level across 20+ domains and finds your exact gaps.',
  },
  {
    icon: Map,
    title: 'Personalized Roadmap',
    description:
      'Get a step-by-step learning path ordered by dependency and priority — not generic, built for your career target.',
  },
  {
    icon: BookOpen,
    title: 'Daily Learning Tasks',
    description:
      'Each morning you receive three bite-sized tasks. Complete them and your roadmap progress updates automatically.',
  },
  {
    icon: Users,
    title: 'Collaborative Groups',
    description:
      'Create study rooms, invite peers, and share notes using a real-time collaborative editor powered by CRDTs.',
  },
  {
    icon: WifiOff,
    title: 'Offline-first',
    description:
      'Notes and tasks sync to IndexedDB so you keep learning even without an internet connection.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Get nudges when teammates complete shared goals or when your daily tasks are ready — never miss a beat.',
  },
];

export function Features() {
  return (
    <section className="py-24 px-6 bg-gray-50" id="features">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <FadeIn>
            <p className="text-sm font-semibold text-brand-500 uppercase tracking-widest mb-3">
              Platform
            </p>
            <h2 className="text-4xl font-bold text-gray-900">
              Everything you need to level up faster
            </h2>
          </FadeIn>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }, i) => (
            <FadeIn key={title} delay={i * 0.08}>
              <div className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 h-full">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-5 group-hover:bg-brand-500 transition-colors">
                  <Icon className="w-5 h-5 text-brand-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
