import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { ShimmerText } from '@/components/ShimmerText';
import { useMarketing } from '@/context/MarketingContext';
import { formatMvr } from '@/lib/planUtils';
import { links } from '../config';

export function CtaBanner() {
  const { proPlan } = useMarketing();
  return (
    <section className="relative overflow-hidden border-t border-border py-14 sm:py-20">
      <div className="hero-gradient absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgb(43_107_255/0.35),transparent_60%)]" aria-hidden />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-5 lg:px-8">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-blue-100 backdrop-blur-sm">
            <Sparkles size={12} aria-hidden />
            Handheld terminal included on Pro
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Ready to run your restaurant on{' '}
            <ShimmerText variant="light">BlurayPOS?</ShimmerText>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-blue-100/90 sm:text-lg">
            Start free today with cloud POS and Office dashboard. Upgrade to {proPlan?.name ?? 'Pro'}
            {proPlan ? ` (${formatMvr(proPlan.priceYearly)}/year)` : ''} when you want the
            professional handheld terminal with built-in 58mm bill & receipt printer — lightweight and easy to use.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full bg-white text-[#0b1f6d] shadow-lg hover:bg-blue-50 sm:w-auto"
              render={<a href={links.officeRegister} />}
            >
              <Zap size={16} aria-hidden />
              Register Free — Start Now
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"
              render={<a href="#terminal" />}
            >
              Explore the Terminal
            </Button>
          </div>
          <p className="mt-4 text-sm text-blue-200/70">
            No credit card required · Free plan stays free for life
          </p>
        </Reveal>
      </div>
    </section>
  );
}
