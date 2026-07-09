import {
  BarChart3,
  Building2,
  Cloud,
  Layers,
  Monitor,
  Package,
  Receipt,
  Shield,
  Smartphone,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Reveal } from '@/components/Reveal';

const features = [
  {
    icon: Monitor,
    title: 'Office Dashboard',
    desc: 'Manage products, categories, staff, and branches from a modern web portal. Real-time sales overview and top items.',
  },
  {
    icon: Smartphone,
    title: 'POS Terminal & App',
    desc: 'Lightweight handheld terminal with built-in 58mm printer on Pro, or use the Android app on the Free plan.',
  },
  {
    icon: Receipt,
    title: 'Bill & Receipt Printing',
    desc: '58mm thermal printing with your logo, itemised bills, MVR totals, and thank-you message on every slip.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Reports',
    desc: 'Track daily sales, order counts, best-selling items, and branch performance — updated live as orders come in.',
  },
  {
    icon: Building2,
    title: 'Multi-Branch',
    desc: 'Run multiple restaurant locations from one account. Each branch has its own inventory and staff access.',
  },
  {
    icon: Users,
    title: 'Staff & Roles',
    desc: 'Cashier, waiter, manager roles with permissions. Control who can void, discount, or access settings.',
  },
  {
    icon: Package,
    title: 'Inventory & Recipes',
    desc: 'Track stock, manage ingredients, and auto-deduct supplies when recipe-based products are sold.',
  },
  {
    icon: Cloud,
    title: 'Cloud SaaS',
    desc: 'No servers to maintain. Access from anywhere in Maldives. Automatic backups and secure data storage.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    desc: 'Encrypted connections, role-based access, and audit logs. Your business data stays protected.',
  },
];

export function PlatformFeatures() {
  return (
    <section id="features" className="scroll-mt-20 border-b border-border bg-muted/30 py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">Everything included</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              One platform.{' '}
              <span className="text-primary">Every tool you need.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              BlurayPOS is a complete cloud point-of-sale system — from the handheld terminal at your counter
              to the office dashboard on your laptop. Built for Maldivian businesses.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 50}>
              <Card className="group h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/15">
                <CardContent className="flex gap-4 pt-0">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                    <f.icon size={22} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Wifi, label: 'Live sync' },
              { icon: Zap, label: 'Fast checkout' },
              { icon: Layers, label: 'Multi-tenant SaaS' },
              { icon: Receipt, label: 'MVR currency' },
            ].map((tag) => (
              <div
                key={tag.label}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <tag.icon size={16} className="text-primary" aria-hidden />
                {tag.label}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
