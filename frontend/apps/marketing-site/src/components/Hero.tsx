import { ArrowRight, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeroAnimationLayer } from '@/components/HeroAnimationLayer';
import { ParticleOverlay } from '@/components/ParticleOverlay';
import { HeroReveal } from '@/components/HeroReveal';
import { HeroShowcase } from '@/components/HeroShowcase';
import { ShimmerText } from '@/components/ShimmerText';
import { useMarketing } from '@/context/MarketingContext';
import { formatMvr } from '@/lib/planUtils';
import { links } from '../config';
import { cn } from '@/lib/utils';

const highlights = [
  { text: 'Handheld POS terminal — lightweight, easy to use, print bills anywhere', delay: 0 },
  { text: 'Built-in 58mm printer for instant customer receipts', delay: 80 },
  { text: 'Free POS for life on the Free plan — our core promise', delay: 160 },
];

const quickStats = [
  { value: '58mm', label: 'Bill & receipt printer' },
  { value: '5.5"', label: 'Touch display' },
  { value: 'Light', label: 'Handheld design' },
  { value: 'Free', label: 'For life plan' },
];

export function Hero() {
  const { proPlan } = useMarketing();

  return (
    <section className="relative overflow-x-clip border-b border-white/10">
      <div className="hero-gradient absolute inset-0" aria-hidden />
      <HeroAnimationLayer />
      <ParticleOverlay />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-5 sm:pb-16 sm:pt-28 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-6">
          <div className="min-w-0">
            <HeroReveal delay={0}>
              <Badge className="mb-3 gap-1.5 border-white/20 bg-white/10 text-xs text-white backdrop-blur-sm sm:mb-4 sm:text-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#7ec0ff] opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#7ec0ff]" />
                </span>
                <Sparkles size={12} aria-hidden />
                Handheld POS · Cloud Dashboard · Maldives
              </Badge>
            </HeroReveal>

            <HeroReveal delay={80}>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#7ec0ff]">Our core vision</p>
              <h1 className="text-[1.9rem] font-bold leading-[1.12] tracking-tight text-white sm:text-4xl sm:leading-tight lg:text-[3.35rem] lg:leading-[1.08]">
                <span className="block">Free POS.</span>
                <span className="mt-1 block">
                  <ShimmerText variant="light">For life.</ShimmerText>
                </span>
              </h1>
            </HeroReveal>

            <HeroReveal delay={140}>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-blue-100/90 sm:mt-5 sm:text-lg">
                BlurayPOS gives Maldivian restaurants a <strong className="text-white">lightweight handheld terminal</strong>
                for taking orders and printing 58mm bills & receipts — plus a powerful office dashboard, with our Free plan staying{' '}
                <strong className="text-white">free forever</strong>.
              </p>
            </HeroReveal>

            <HeroReveal delay={200}>
              <ul className="mt-5 space-y-2 sm:mt-6">
                {highlights.map((item) => (
                  <li
                    key={item.text}
                    className={cn(
                      'group flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm text-blue-50/90 transition-all duration-300',
                      'hover:bg-white/5 hover:translate-x-1',
                      'motion-safe:animate-in fade-in slide-in-from-left-4 fill-mode-both',
                    )}
                    style={{ animationDelay: `${300 + item.delay}ms` }}
                  >
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#7ec0ff] group-hover:scale-110 transition-transform" aria-hidden />
                    {item.text}
                  </li>
                ))}
              </ul>
            </HeroReveal>

            <HeroReveal delay={360}>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {quickStats.map((s, i) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center backdrop-blur-sm transition-all hover:border-[#7ec0ff]/30 hover:bg-white/10 motion-safe:animate-in fade-in zoom-in-95 fill-mode-both"
                    style={{ animationDelay: `${450 + i * 60}ms` }}
                  >
                    <p className="text-lg font-bold text-white sm:text-xl">{s.value}</p>
                    <p className="text-[10px] text-blue-200/70 sm:text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </HeroReveal>

            <HeroReveal delay={480}>
              <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
                <Button
                  size="lg"
                  className="group/btn w-full bg-white text-[#0b1f6d] shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 sm:w-auto"
                  render={<a href={links.officeRegister} />}
                >
                  <Zap size={16} className="transition-transform duration-300 group-hover/btn:rotate-12" aria-hidden />
                  Start Free Today
                  <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-0.5" data-icon="inline-end" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/30 bg-transparent text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 sm:w-auto"
                  render={<a href="#terminal" />}
                >
                  Explore the Terminal
                </Button>
              </div>
              <p className="mt-3 text-center text-sm text-blue-200/70 sm:mt-4 sm:text-left">
                {proPlan
                  ? `${proPlan.name} plan (${formatMvr(proPlan.priceYearly)}/yr) includes the handheld POS device ·`
                  : 'Pro plan includes the handheld POS device ·'}{' '}
                <a href={links.officeLogin} className="font-medium text-white hover:text-[#7ec0ff] hover:underline">
                  Sign in to Office →
                </a>
              </p>
            </HeroReveal>
          </div>

          <HeroReveal delay={200} direction="left" className="min-w-0">
            <HeroShowcase />
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
