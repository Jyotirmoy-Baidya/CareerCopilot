import { Navbar }        from '@/components/landing/Navbar';
import { Hero }          from '@/components/landing/Hero';
import { Features }      from '@/components/landing/Features';
import { HowItWorks }   from '@/components/landing/HowItWorks';
import { Creator }       from '@/components/landing/Creator';
import { CTASection }    from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <main className="bg-white text-gray-900">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Creator />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
