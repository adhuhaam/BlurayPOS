import {
  Battery,
  Check,
  Feather,
  Printer,
  ScanLine,
  Smartphone,
  Sparkles,
  Tablet,
  Wifi,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Reveal } from '@/components/Reveal';
import { useMarketing } from '@/context/MarketingContext';
import { formatMvr } from '@/lib/planUtils';
import { links } from '../config';

const specs = [
  { icon: Tablet, title: '5.5" HD Touchscreen', desc: 'Bright, responsive display — simple to navigate for fast order entry.' },
  { icon: Printer, title: 'Built-in 58mm Printer', desc: 'Print bills and customer receipts instantly. Logo & thank-you on every slip.' },
  { icon: Feather, title: 'Lightweight & Handheld', desc: 'Compact and light enough to carry all day — from counter to tableside.' },
  { icon: Sparkles, title: 'Easy to Use', desc: 'Clean POS interface designed for staff to learn quickly with minimal training.' },
  { icon: Smartphone, title: 'Android 13 / 14', desc: 'Modern, secure OS with smooth performance and app compatibility.' },
  { icon: Battery, title: 'All-Day Battery', desc: 'Designed for full restaurant shifts without constant charging.' },
  { icon: Wifi, title: 'Cloud Connected', desc: 'Orders sync live to your office dashboard. Works online — offline mode coming soon.' },
  { icon: ScanLine, title: 'Barcode Scanner', desc: 'Scan product barcodes for quick item lookup and faster order entry.' },
];

const terminalHighlights = [
  'Lightweight handheld design — easy to carry and use',
  'Take orders tableside or at the counter',
  'Print branded bills & receipts in seconds',
  'Included with the BlurayPOS Pro plan',
];

export function PosTerminalSection() {
  const { proPlan } = useMarketing();

  return (
    <section id="terminal" className="scroll-mt-20 border-b border-border bg-background py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal direction="right">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 blur-2xl" />
              <img
                src="/hero-devices.png"
                alt="BlurayPOS handheld POS terminal with receipt printing"
                className="relative mx-auto w-full max-w-lg object-contain motion-safe:animate-float drop-shadow-2xl"
              />
              <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
                {['58mm', 'Light', '5.5"'].map((tag) => (
                  <Badge key={tag} variant="secondary" className="shadow-sm">{tag}</Badge>
                ))}
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <Badge variant="secondary" className="mb-3">Handheld POS Terminal</Badge>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Your counter.{' '}
                <span className="text-primary">In your hand.</span>
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The BlurayPOS handheld terminal is purpose-built for restaurants and retail in the Maldives.
                Take orders, build bills, and print professional receipts — lightweight, easy to use, and always in your hand.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <ul className="mt-6 space-y-2.5">
                {terminalHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check size={12} className="text-primary" aria-hidden />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button render={<a href="#plans" />}>
                  Get {proPlan?.name ?? 'Pro'}
                  {proPlan ? ` — ${formatMvr(proPlan.priceYearly)}/yr` : ' — Terminal Included'}
                </Button>
                <Button variant="outline" render={<a href={links.pos} />}>Try POS App</Button>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="mt-14 grid gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {specs.map((spec, i) => (
            <Reveal key={spec.title} delay={i * 60}>
              <Card className="group h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-primary/20">
                <CardContent className="pt-0">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110">
                    <spec.icon size={20} aria-hidden />
                  </div>
                  <h3 className="font-semibold leading-snug">{spec.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{spec.desc}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
