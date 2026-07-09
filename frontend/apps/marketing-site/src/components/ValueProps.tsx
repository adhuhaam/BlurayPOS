import { BarChart3, Cloud, Headphones, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Reveal } from '@/components/Reveal';

const items = [
  {
    icon: Shield,
    title: 'Secure & Reliable',
    desc: 'Encrypted connections, role-based access, and audit logs keep your business data protected.',
  },
  {
    icon: Cloud,
    title: 'Access Anywhere',
    desc: 'Cloud-based SaaS — manage your restaurant from Office on any device, anywhere in Maldives.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Reports',
    desc: 'Track daily sales, order counts, and top-selling items as orders come in from POS.',
  },
  {
    icon: Headphones,
    title: 'Local Support',
    desc: 'Built for Maldivian restaurants with local onboarding help and ongoing support.',
  },
];

export function ValueProps() {
  return (
    <section className="border-t border-border bg-muted/30 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-8 max-w-xl text-center sm:mb-10">
            <Badge variant="secondary" className="mb-3">Why BlurayPOS</Badge>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Built for Maldivian businesses
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <Card size="sm" className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-primary/10">
                <CardContent className="flex items-center gap-3 pt-0 min-[520px]:flex-col min-[520px]:items-center min-[520px]:text-center">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-12">
                    <item.icon size={20} className="sm:hidden" aria-hidden />
                    <item.icon size={22} className="hidden sm:block" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:mt-1">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
