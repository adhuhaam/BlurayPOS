import { useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  LogIn,
  Rocket,
  Smartphone,
  Store,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Reveal } from '@/components/Reveal';
import { useMarketing } from '@/context/MarketingContext';
import { links } from '../config';

export function OnboardingSection() {
  const { freePlan } = useMarketing();
  const maxUsers = freePlan?.maxUsers ?? 3;

  const steps = useMemo(() => [
    {
      num: 1,
      icon: Globe,
      title: 'Open the Office portal',
      desc: 'Visit the registration page from any browser — desktop or mobile.',
      detail: 'office.bluraymaldives.site/register',
      href: links.officeRegister,
      time: '~1 min',
    },
    {
      num: 2,
      icon: UserPlus,
      title: 'Create your free account',
      desc: 'Enter your business name, email, and password. No credit card required.',
      detail: 'You stay on the Free plan by default — free for life.',
      time: '~2 min',
    },
    {
      num: 3,
      icon: Store,
      title: 'Set up your restaurant',
      desc: 'Add your branch, menu categories, products, and prices from the Office dashboard.',
      detail: 'Import your menu or build it from scratch.',
      href: links.office,
      time: '~10 min',
    },
    {
      num: 4,
      icon: Users,
      title: 'Invite your team',
      desc: 'Add cashiers, waiters, and managers with role-based permissions.',
      detail: `Free plan supports up to ${maxUsers} users.`,
      time: '~5 min',
    },
    {
      num: 5,
      icon: Smartphone,
      title: 'Start taking orders',
      desc: 'Open the POS app on Android, or upgrade to Pro for the lightweight handheld terminal with built-in bill printer.',
      detail: 'Receipts print instantly. Sales sync live to Office.',
      href: links.pos,
      time: 'Same day',
    },
    {
      num: 6,
      icon: Rocket,
      title: 'Go live & grow',
      desc: 'Track sales in real time, review reports, and upgrade to Pro when you need the full hardware kit.',
      detail: 'Upgrade anytime from Office → Billing.',
      href: '#plans',
      time: 'Ongoing',
    },
  ], [maxUsers]);

  return (
    <section id="get-started" className="scroll-mt-20 border-b border-border bg-muted/30 py-14 sm:scroll-mt-24 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">Register & onboarding</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              From sign-up to first sale{' '}
              <span className="text-primary">in under 20 minutes.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              BlurayPOS onboarding is simple — register free, set up your menu, and start taking orders
              the same day. No sales calls, no setup fees.
            </p>
          </div>
        </Reveal>

        <div className="relative mx-auto mt-12 max-w-3xl lg:mt-16">
          <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent sm:left-6" aria-hidden />

          <ol className="space-y-5">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 70}>
                <li>
                  <Card className="ml-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/15 sm:ml-4">
                    <CardContent className="flex gap-4 pt-0 sm:gap-5">
                      <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md ring-4 ring-muted/30 sm:size-11">
                        {step.num}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <step.icon size={16} className="text-primary" aria-hidden />
                          <h3 className="font-semibold leading-snug">{step.title}</h3>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {step.time}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                        <p className="mt-1 text-xs text-muted-foreground/80">{step.detail}</p>
                        {step.href && (
                          <Button
                            variant="link"
                            className="mt-2 h-auto p-0 text-sm"
                            render={<a href={step.href} />}
                          >
                            {step.num === 1 ? 'Open register page' : step.num === 5 ? 'Open POS app' : 'View plans'}
                            <ArrowRight data-icon="inline-end" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={200}>
          <Card className="mx-auto mt-12 max-w-3xl border-primary/25 bg-gradient-to-br from-primary/8 via-background to-primary/5 shadow-sm sm:mt-16">
            <CardContent className="flex flex-col items-stretch gap-6 pt-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-primary" aria-hidden />
                  <p className="text-lg font-semibold">Ready to register?</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Create your free account — setup takes minutes and the Free plan stays{' '}
                  <strong className="font-medium text-foreground">free for life</strong>.
                </p>
                <a
                  href={links.officeRegister}
                  className="mt-2 inline-block break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  office.bluraymaldives.site/register
                </a>
              </div>
              <div className="flex flex-col gap-2.5 sm:shrink-0 sm:flex-row">
                <Button size="lg" className="w-full sm:w-auto" render={<a href={links.officeRegister} />}>
                  Register Free
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" render={<a href={links.officeLogin} />}>
                  <LogIn data-icon="inline-start" />
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
