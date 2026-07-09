import { Building2, Receipt, Smartphone, TrendingUp } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { useMarketing } from '@/context/MarketingContext';
import { formatMvr } from '@/lib/planUtils';

export function StatsBar() {
  const { data, freePlan, proPlan, loading } = useMarketing();
  const stats = data?.stats;

  const items = [
    {
      icon: Building2,
      value: loading ? '—' : String(stats?.storeCount ?? 0),
      label: stats?.storeCount === 1 ? 'Active store' : 'Active stores',
    },
    {
      icon: Smartphone,
      value: loading ? '—' : String(stats?.organizationCount ?? 0),
      label: stats?.organizationCount === 1 ? 'Business on BlurayPOS' : 'Businesses on BlurayPOS',
    },
    {
      icon: Receipt,
      value: loading ? '—' : (proPlan ? formatMvr(proPlan.priceYearly) : '—'),
      label: proPlan ? `${proPlan.name} plan / year` : 'Pro plan / year',
    },
    {
      icon: TrendingUp,
      value: loading ? '—' : (freePlan ? formatMvr(freePlan.priceYearly) : '—'),
      label: freePlan ? `${freePlan.name} forever` : 'Free forever',
    },
  ];

  return (
    <section className="border-b border-border bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {items.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 60}>
              <div className="flex flex-col items-center text-center sm:flex-row sm:gap-3 sm:text-left">
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary sm:mb-0">
                  <stat.icon size={20} aria-hidden />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight sm:text-xl">{stat.value}</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
