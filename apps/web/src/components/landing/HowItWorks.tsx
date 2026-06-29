import { FadeIn } from './FadeIn';

const steps = [
  {
    number: '01',
    title: 'Tell us your goal',
    description:
      'Enter your target role — Frontend Engineer, Data Scientist, DevOps, whatever it is. Then answer a quick skill quiz.',
  },
  {
    number: '02',
    title: 'Get your roadmap',
    description:
      'Our AI analyses your gaps and generates a prioritised roadmap with resources, estimated hours, and milestones.',
  },
  {
    number: '03',
    title: 'Learn every day',
    description:
      'Check off your daily tasks, watch demo videos, and collaborate with teammates. Your progress syncs in real time.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-white" id="how-it-works">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <FadeIn>
            <p className="text-sm font-semibold text-brand-500 uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-4xl font-bold text-gray-900">
              From zero to hired in three steps
            </h2>
          </FadeIn>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-5 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-brand-500/20 via-brand-500 to-brand-500/20" />

          <div className="grid lg:grid-cols-3 gap-10 lg:gap-6">
            {steps.map(({ number, title, description }, i) => (
              <FadeIn key={number} delay={i * 0.15}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-bold text-sm mb-6 shadow-lg shadow-brand-500/30">
                    {number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
