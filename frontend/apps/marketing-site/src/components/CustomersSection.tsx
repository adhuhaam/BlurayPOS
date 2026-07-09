import { MapPin, RefreshCw, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Reveal } from '@/components/Reveal';
import { useMarketing } from '@/context/MarketingContext';
import { accentFromId, formatMemberSince } from '@/lib/planUtils';
import { cn } from '@/lib/utils';

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function CustomerSkeleton() {
  return (
    <Card className="h-full animate-pulse">
      <CardContent className="flex gap-4 pt-0">
        <div className="size-14 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomersSection() {
  const { data, loading, error, reload } = useMarketing();
  const customers = data?.customers ?? [];

  return (
    <section id="customers" className="scroll-mt-20 border-b border-border bg-muted/20 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">Our customers</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Trusted by restaurants &amp; stores{' '}
              <span className="text-primary">across Maldives.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {data
                ? `${data.stats.storeCount} active ${data.stats.storeCount === 1 ? 'store' : 'stores'} across ${data.stats.organizationCount} ${data.stats.organizationCount === 1 ? 'business' : 'businesses'} on BlurayPOS.`
                : 'Businesses across Maldives run their daily sales on BlurayPOS.'}
            </p>
          </div>
        </Reveal>

        {error && (
          <div className="mx-auto mt-8 max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
              <RefreshCw data-icon="inline-start" />
              Retry
            </Button>
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Reveal key={`skeleton-${i}`} delay={i * 60}>
                <CustomerSkeleton />
              </Reveal>
            ))}

          {!loading &&
            customers.map((store, i) => {
              const accent = accentFromId(store.organizationId);
              const showOrganization = store.organizationName !== store.storeName;

              return (
                <Reveal key={store.storeId} delay={i * 60}>
                  <Card className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/15">
                    <CardContent className="pt-0">
                      <div className="flex items-start gap-4">
                        <div
                          className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-105"
                          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
                          aria-hidden
                        >
                          {initials(store.storeName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold leading-snug">{store.storeName}</h3>
                            <Badge
                              variant={store.planSlug === 'pro' ? 'default' : 'secondary'}
                              className={cn('text-[10px]', store.planSlug === 'pro' && 'bg-primary')}
                            >
                              {store.planName}
                            </Badge>
                          </div>
                          {showOrganization && (
                            <p className="mt-1 text-xs text-muted-foreground">{store.organizationName}</p>
                          )}
                          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin size={14} className="shrink-0" aria-hidden />
                            {store.address || 'Maldives'}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              <Store size={12} aria-hidden />
                              {store.currency}
                            </span>
                            {store.memberSince && (
                              <span className="text-xs text-muted-foreground">
                                Since {formatMemberSince(store.memberSince)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
        </div>

        {!loading && !error && customers.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Customer stores will appear here as businesses join BlurayPOS.
          </p>
        )}

        <Reveal delay={200}>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Running a restaurant or store in Maldives?{' '}
            <a href="#get-started" className="font-medium text-primary underline-offset-4 hover:underline">
              Join them on BlurayPOS →
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
