import { type ReactNode } from 'react';
import {
  Check,
  Crown,
  Headphones,
  Package,
  Printer,
  RefreshCw,
  Send,
  Smartphone,
  Sparkles,
  Store,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { PlanDto } from '@pos/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Reveal } from '@/components/Reveal';
import { useMarketing } from '@/context/MarketingContext';
import { formatLimit, formatMvr, hasProTerminal, isUnlimited } from '@/lib/planUtils';
import { cn } from '@/lib/utils';
import { links } from '../config';

function FeatureRow({ ok, children, highlight }: { ok: boolean; children: ReactNode; highlight?: boolean }) {
  return (
    <li
      className={cn(
        'flex items-start gap-2.5 text-sm',
        ok ? 'text-foreground' : 'text-muted-foreground',
        highlight && ok && 'font-medium',
      )}
    >
      {ok ? (
        <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
      ) : (
        <X size={16} className="mt-0.5 shrink-0 text-muted-foreground/50" aria-hidden />
      )}
      {children}
    </li>
  );
}

function CellIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <Check size={16} className="mx-auto text-primary" aria-hidden />
  ) : (
    <X size={16} className="mx-auto text-muted-foreground/40" aria-hidden />
  );
}

function ComparisonRow({
  label,
  free,
  basic,
  pro,
  proHighlight,
}: {
  label: string;
  free: ReactNode;
  basic: ReactNode;
  pro: ReactNode;
  proHighlight?: boolean;
}) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="py-3 pr-4 text-sm text-muted-foreground">{label}</td>
      <td className="py-3 text-center text-sm font-medium">{free}</td>
      <td className="py-3 text-center text-sm font-medium">{basic}</td>
      <td className={cn('py-3 text-center text-sm font-medium', proHighlight && 'text-primary')}>{pro}</td>
    </tr>
  );
}

function PlanCardSkeleton() {
  return <Card className="h-[520px] animate-pulse bg-muted/40" />;
}

function renderPlanFeatures(plan: PlanDto, isPro: boolean) {
  if (isPro) {
    return (
      <>
        <FeatureRow ok highlight>
          <span className="flex items-center gap-1.5">
            <Printer size={14} className="text-primary" aria-hidden />
            Handheld POS terminal included
          </span>
        </FeatureRow>
        <FeatureRow ok highlight>{formatLimit(plan.maxStores)} branches</FeatureRow>
        <FeatureRow ok highlight>{formatLimit(plan.maxUsers)} users</FeatureRow>
        <FeatureRow ok highlight>{formatLimit(plan.maxProducts)} products</FeatureRow>
        <FeatureRow ok highlight>{formatLimit(plan.maxMonthlyOrders)} orders / month</FeatureRow>
        <FeatureRow ok={plan.hasInventory}>Inventory & recipe tracking</FeatureRow>
        <FeatureRow ok={plan.hasKitchen}>Kitchen display module</FeatureRow>
        <FeatureRow ok={plan.hasDelivery}>Delivery management</FeatureRow>
        <FeatureRow ok={plan.hasOnlineMenu}>Online menu (restaurant)</FeatureRow>
        <FeatureRow ok={plan.hasOnlineOrdering}>Online ordering</FeatureRow>
        <FeatureRow ok={plan.hasAccounting}>Accounting module</FeatureRow>
        <FeatureRow ok={plan.hasAdvancedReports}>Advanced reports & analytics</FeatureRow>
        <FeatureRow ok={plan.hasApi}>API access</FeatureRow>
        <FeatureRow ok={plan.hasPurchases}>Purchases & suppliers</FeatureRow>
      </>
    );
  }

  return (
    <>
      <FeatureRow ok>{formatLimit(plan.maxStores)} branch</FeatureRow>
      <FeatureRow ok>Up to {plan.maxUsers} users</FeatureRow>
      <FeatureRow ok>Up to {formatLimit(plan.maxProducts)} products</FeatureRow>
      <FeatureRow ok>Up to {formatLimit(plan.maxMonthlyOrders)} orders / month</FeatureRow>
      <FeatureRow ok highlight>Android app (phone & tablet)</FeatureRow>
      <FeatureRow ok>Basic sales reports</FeatureRow>
      <FeatureRow ok={hasProTerminal(plan)}>POS terminal access</FeatureRow>
      <FeatureRow ok={plan.hasInventory}>Inventory & recipes</FeatureRow>
      <FeatureRow ok={plan.hasKitchen || plan.hasDelivery || plan.hasAccounting || plan.hasAdvancedReports}>
        Advanced modules
      </FeatureRow>
    </>
  );
}

export function PlansSection() {
  const { freePlan, basicPlan, proPlan, loading, error, reload } = useMarketing();

  if (loading) {
    return (
      <section id="plans" className="scroll-mt-20 border-b border-border bg-background py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
          </div>
        </div>
      </section>
    );
  }

  if (!freePlan || !basicPlan || !proPlan) {
    return (
      <section id="plans" className="scroll-mt-20 border-b border-border bg-background py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl px-4 text-center">
          <p className="text-muted-foreground">
            {error ?? 'Plan information is not available right now.'}
          </p>
          <Button variant="outline" className="mt-4" onClick={reload}>
            <RefreshCw data-icon="inline-start" />
            Retry
          </Button>
        </div>
      </section>
    );
  }

  const proMonthly = proPlan.priceYearly > 0 ? Math.round(proPlan.priceYearly / 12) : proPlan.priceMonthly;

  return (
    <section id="plans" className="scroll-mt-20 border-b border-border bg-background py-14 sm:scroll-mt-24 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Sparkles size={12} aria-hidden />
              Pricing
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Simple plans.{' '}
              <span className="text-primary">Free, Basic, or Pro.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Live plan limits from BlurayPOS — start on {freePlan.name} for basic POS, step up to {basicPlan.name} for core modules, or {proPlan.name} for unlimited growth and the handheld terminal.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          <Reveal delay={0}>
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                    <Send size={20} aria-hidden />
                  </div>
                  <Badge variant="secondary">Free for life</Badge>
                </div>
                <CardTitle className="text-xl">{freePlan.name}</CardTitle>
                <CardDescription className="text-base">
                  <span className="text-3xl font-bold text-foreground">{formatMvr(freePlan.priceYearly)}</span>
                  <span className="text-muted-foreground"> / forever</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {freePlan.description}
                </p>
                <ul className="space-y-2.5">{renderPlanFeatures(freePlan, false)}</ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="lg" render={<a href={links.officeRegister} />}>
                  Get Started — It&apos;s Free
                </Button>
              </CardFooter>
            </Card>
          </Reveal>

          <Reveal delay={50}>
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                  <Package size={20} aria-hidden />
                </div>
                <CardTitle className="text-xl">{basicPlan.name}</CardTitle>
                <CardDescription className="text-base">
                  <span className="text-3xl font-bold text-foreground">{formatMvr(basicPlan.priceYearly)}</span>
                  <span className="text-muted-foreground"> / year</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{basicPlan.description}</p>
                <ul className="space-y-2.5">{renderPlanFeatures(basicPlan, false)}</ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="lg" render={<a href={links.officeRegister} />}>
                  Start with {basicPlan.name}
                </Button>
              </CardFooter>
            </Card>
          </Reveal>

          <Reveal delay={100}>
            <Card className="relative h-full overflow-hidden ring-2 ring-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
              <Badge className="absolute right-4 top-4 gap-1">
                <Crown size={12} aria-hidden />
                Recommended
              </Badge>
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Crown size={20} aria-hidden />
                </div>
                <CardTitle className="text-xl">{proPlan.name}</CardTitle>
                <CardDescription className="text-base">
                  <span className="text-3xl font-bold text-foreground">{formatMvr(proPlan.priceYearly)}</span>
                  <span className="text-muted-foreground"> / year</span>
                  {proMonthly > 0 && (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      ≈ {formatMvr(proMonthly)} / month
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{proPlan.description}</p>
                <ul className="space-y-2.5">{renderPlanFeatures(proPlan, true)}</ul>
              </CardContent>
              <CardFooter className="flex-col gap-2 sm:flex-col">
                <Button className="w-full" size="lg" render={<a href={links.officeRegister} />}>
                  <Zap size={16} aria-hidden />
                  Get {proPlan.name} — {formatMvr(proPlan.priceYearly)} / yr
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Pay annually · Upgrade anytime from Office
                </p>
              </CardFooter>
            </Card>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <Card className="mt-10 overflow-hidden lg:mt-14">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-lg">Full comparison</CardTitle>
              <CardDescription>Live limits from the BlurayPOS system</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto pt-0">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 pr-4 text-left text-sm font-medium text-muted-foreground">Feature</th>
                    <th className="py-3 text-center text-sm font-semibold">{freePlan.name}</th>
                    <th className="py-3 text-center text-sm font-semibold">{basicPlan.name}</th>
                    <th className="py-3 text-center text-sm font-semibold text-primary">{proPlan.name}</th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow
                    label="Annual price"
                    free={formatMvr(freePlan.priceYearly)}
                    basic={formatMvr(basicPlan.priceYearly)}
                    pro={formatMvr(proPlan.priceYearly)}
                    proHighlight
                  />
                  <ComparisonRow label="Branches" free={formatLimit(freePlan.maxStores)} basic={formatLimit(basicPlan.maxStores)} pro={formatLimit(proPlan.maxStores)} />
                  <ComparisonRow label="Users" free={formatLimit(freePlan.maxUsers)} basic={formatLimit(basicPlan.maxUsers)} pro={formatLimit(proPlan.maxUsers)} />
                  <ComparisonRow label="Products" free={formatLimit(freePlan.maxProducts)} basic={formatLimit(basicPlan.maxProducts)} pro={formatLimit(proPlan.maxProducts)} />
                  <ComparisonRow label="Orders / month" free={formatLimit(freePlan.maxMonthlyOrders)} basic={formatLimit(basicPlan.maxMonthlyOrders)} pro={formatLimit(proPlan.maxMonthlyOrders)} />
                  <ComparisonRow label="POS terminals" free={String(freePlan.maxTerminals)} basic={String(basicPlan.maxTerminals)} pro={formatLimit(proPlan.maxTerminals)} proHighlight />
                  <ComparisonRow
                    label="Handheld POS terminal"
                    free={<CellIcon ok={hasProTerminal(freePlan)} />}
                    basic={<CellIcon ok={hasProTerminal(basicPlan)} />}
                    pro={<CellIcon ok={hasProTerminal(proPlan)} />}
                    proHighlight
                  />
                  <ComparisonRow label="Inventory" free={<CellIcon ok={freePlan.hasInventory} />} basic={<CellIcon ok={basicPlan.hasInventory} />} pro={<CellIcon ok={proPlan.hasInventory} />} />
                  <ComparisonRow label="Kitchen display" free={<CellIcon ok={freePlan.hasKitchen} />} basic={<CellIcon ok={basicPlan.hasKitchen} />} pro={<CellIcon ok={proPlan.hasKitchen} />} />
                  <ComparisonRow label="Online menu" free={<CellIcon ok={freePlan.hasOnlineMenu} />} basic={<CellIcon ok={basicPlan.hasOnlineMenu} />} pro={<CellIcon ok={proPlan.hasOnlineMenu} />} />
                  <ComparisonRow label="Online ordering" free={<CellIcon ok={freePlan.hasOnlineOrdering} />} basic={<CellIcon ok={basicPlan.hasOnlineOrdering} />} pro={<CellIcon ok={proPlan.hasOnlineOrdering} />} />
                  <ComparisonRow label="Delivery" free={<CellIcon ok={freePlan.hasDelivery} />} basic={<CellIcon ok={basicPlan.hasDelivery} />} pro={<CellIcon ok={proPlan.hasDelivery} />} />
                  <ComparisonRow label="Accounting" free={<CellIcon ok={freePlan.hasAccounting} />} basic={<CellIcon ok={basicPlan.hasAccounting} />} pro={<CellIcon ok={proPlan.hasAccounting} />} />
                  <ComparisonRow label="Advanced reports" free={<CellIcon ok={freePlan.hasAdvancedReports} />} basic={<CellIcon ok={basicPlan.hasAdvancedReports} />} pro={<CellIcon ok={proPlan.hasAdvancedReports} />} />
                  <ComparisonRow label="API access" free={<CellIcon ok={freePlan.hasApi} />} basic={<CellIcon ok={basicPlan.hasApi} />} pro={<CellIcon ok={proPlan.hasApi} />} />
                  <ComparisonRow label="Purchases" free={<CellIcon ok={freePlan.hasPurchases} />} basic={<CellIcon ok={basicPlan.hasPurchases} />} pro={<CellIcon ok={proPlan.hasPurchases} />} />
                </tbody>
              </table>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:mt-14">
            {[
              {
                icon: Store,
                title: isUnlimited(proPlan.maxStores) ? 'Scale to many branches' : `${formatLimit(freePlan.maxStores)} branch on Free`,
                desc: `${freePlan.name} starts with ${formatLimit(freePlan.maxStores)} branch. ${basicPlan.name} supports ${formatLimit(basicPlan.maxStores).toLowerCase()}. ${proPlan.name} is unlimited.`,
              },
              {
                icon: Users,
                title: 'Team-ready',
                desc: `Up to ${freePlan.maxUsers} users on ${freePlan.name}, ${basicPlan.maxUsers} on ${basicPlan.name}, ${formatLimit(proPlan.maxUsers).toLowerCase()} on ${proPlan.name}.`,
              },
              {
                icon: Headphones,
                title: 'Local support',
                desc: 'Maldives-based team to help you onboard and grow.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon size={18} aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={250}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <Package size={14} aria-hidden />
            <span>{proPlan.name} includes physical handheld terminal hardware ·</span>
            <Smartphone size={14} aria-hidden />
            <span>{freePlan.name} uses the Android POS app</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
