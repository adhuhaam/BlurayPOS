import type { BusinessType, SubscriptionDto, TenantFeaturesDto } from './types';

const PLAN_MODULE_FLAGS: Record<
  string,
  Pick<SubscriptionDto, 'hasInventory' | 'hasCoupons' | 'hasOnlineMenu' | 'hasOnlineOrdering' | 'hasHr'>
> = {
  free: { hasInventory: false, hasCoupons: false, hasOnlineMenu: false, hasOnlineOrdering: false, hasHr: false },
  basic: { hasInventory: true, hasCoupons: false, hasOnlineMenu: false, hasOnlineOrdering: false, hasHr: false },
  pro: { hasInventory: true, hasCoupons: true, hasOnlineMenu: true, hasOnlineOrdering: true, hasHr: true },
};

/** Read a plan module flag from subscription DTO, falling back to plan slug when API omits newer fields. */
export function subscriptionPlanFlag(
  subscription: SubscriptionDto | null,
  flag: keyof Pick<SubscriptionDto, 'hasInventory' | 'hasCoupons' | 'hasOnlineMenu' | 'hasOnlineOrdering' | 'hasHr'>,
): boolean {
  if (!subscription) return false;
  const direct = subscription[flag];
  if (typeof direct === 'boolean') return direct;
  return PLAN_MODULE_FLAGS[subscription.planSlug]?.[flag] ?? false;
}

/** Client-side fallback when /api/auth/me has no tenantFeatures yet */
export function resolveTenantFeatures(
  businessType: BusinessType = 'Hybrid',
  subscription: SubscriptionDto | null = null,
): TenantFeaturesDto {
  const hasInventory = subscriptionPlanFlag(subscription, 'hasInventory');
  const hasKitchen = subscription?.hasKitchen ?? false;
  const hasDelivery = subscription?.hasDelivery ?? false;
  const hasOnlineMenu = subscriptionPlanFlag(subscription, 'hasOnlineMenu');
  const hasOnlineOrdering = subscriptionPlanFlag(subscription, 'hasOnlineOrdering');
  const hasCoupons = subscriptionPlanFlag(subscription, 'hasCoupons');
  const hasHr = subscriptionPlanFlag(subscription, 'hasHr');

  if (businessType === 'Retail') {
    return {
      businessType: 'Retail',
      catalogIngredients: false,
      catalogRecipes: false,
      catalogInventory: hasInventory,
      posBarcodeRetail: true,
      posTables: false,
      posKitchen: false,
      posDelivery: false,
      onlineMenu: false,
      onlineOrdering: hasOnlineOrdering,
      officeCoupons: hasCoupons,
      officeHr: hasHr,
    };
  }

  if (businessType === 'Restaurant') {
    return {
      businessType: 'Restaurant',
      catalogIngredients: true,
      catalogRecipes: true,
      catalogInventory: hasInventory,
      posBarcodeRetail: false,
      posTables: true,
      posKitchen: hasKitchen,
      posDelivery: hasDelivery,
      onlineMenu: hasOnlineMenu,
      onlineOrdering: hasOnlineOrdering,
      officeCoupons: hasCoupons,
      officeHr: hasHr,
    };
  }

  return {
    businessType: 'Hybrid',
    catalogIngredients: true,
    catalogRecipes: true,
    catalogInventory: hasInventory,
    posBarcodeRetail: true,
    posTables: true,
    posKitchen: hasKitchen,
    posDelivery: hasDelivery,
    onlineMenu: hasOnlineMenu,
    onlineOrdering: hasOnlineOrdering,
    officeCoupons: hasCoupons,
    officeHr: hasHr,
  };
}

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string; description: string }[] = [
  {
    value: 'Restaurant',
    label: 'Restaurant / Café',
    description: 'Tables, menu recipes, kitchen flow — ingredients deduct when sold',
  },
  {
    value: 'Retail',
    label: 'Retail / Shop',
    description: 'Barcode scan, fast checkout, finished-goods inventory',
  },
  {
    value: 'Hybrid',
    label: 'Both',
    description: 'Full catalog — retail SKUs plus recipe-based menu items',
  },
];

/** Shown on signup — pick one industry; Hybrid is settings-only for existing stores */
export const REGISTRATION_BUSINESS_TYPE_OPTIONS = BUSINESS_TYPE_OPTIONS.filter(
  (o) => o.value !== 'Hybrid',
);
