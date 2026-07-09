import type { PlanDto } from '@pos/api-client';

export const UNLIMITED_THRESHOLD = 100_000;

export function formatLimit(value: number): string {
  return value >= UNLIMITED_THRESHOLD ? 'Unlimited' : value.toLocaleString();
}

export function formatMvr(amount: number, currency = 'MVR'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function getPlanBySlug(plans: PlanDto[], slug: string): PlanDto | undefined {
  return plans.find((plan) => plan.slug === slug);
}

export function isUnlimited(value: number): boolean {
  return value >= UNLIMITED_THRESHOLD;
}

export function hasProTerminal(plan: PlanDto | undefined): boolean {
  return plan?.slug === 'pro' || (plan != null && isUnlimited(plan.maxTerminals));
}

export function accentFromId(id: string): string {
  const palette = ['#1a4fd6', '#0b1f6d', '#2563eb', '#1d4ed8', '#3b82f6', '#1e40af'];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export function formatMemberSince(isoDate: string): string {
  const year = new Date(isoDate).getFullYear();
  return Number.isNaN(year) ? '' : String(year);
}
