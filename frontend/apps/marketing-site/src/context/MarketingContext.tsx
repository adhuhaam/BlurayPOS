import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type PlanDto, type PublicMarketingDto } from '@pos/api-client';
import { getPlanBySlug } from '@/lib/planUtils';

type MarketingContextValue = {
  data: PublicMarketingDto | null;
  loading: boolean;
  error: string | null;
  plans: PlanDto[];
  freePlan: PlanDto | undefined;
  basicPlan: PlanDto | undefined;
  proPlan: PlanDto | undefined;
  reload: () => void;
};

const MarketingContext = createContext<MarketingContextValue | null>(null);

export function MarketingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PublicMarketingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getPublicMarketing()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(async (err: unknown) => {
        if (cancelled) return;
        try {
          const plans = await api.getPlans();
          setData({
            plans,
            customers: [],
            stats: {
              organizationCount: 0,
              storeCount: 0,
              proCount: 0,
              freeCount: 0,
            },
          });
        } catch {
          setError(err instanceof Error ? err.message : 'Failed to load marketing data');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const plans = data?.plans ?? [];
  const value = useMemo<MarketingContextValue>(
    () => ({
      data,
      loading,
      error,
      plans,
      freePlan: getPlanBySlug(plans, 'free'),
      basicPlan: getPlanBySlug(plans, 'basic'),
      proPlan: getPlanBySlug(plans, 'pro'),
      reload: () => setReloadKey((key) => key + 1),
    }),
    [data, loading, error, plans],
  );

  return <MarketingContext.Provider value={value}>{children}</MarketingContext.Provider>;
}

export function useMarketing() {
  const context = useContext(MarketingContext);
  if (!context) {
    throw new Error('useMarketing must be used within MarketingProvider');
  }
  return context;
}
