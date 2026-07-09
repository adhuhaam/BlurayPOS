import {
  TicketIcon,
  UtensilsCrossedIcon,
  ShoppingBagIcon,
  BriefcaseIcon,
  UsersIcon,
  WalletIcon,
  ClockIcon,
  CalendarIcon,
  CalendarDaysIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  resolveTenantFeatures,
  subscriptionPlanFlag,
  type BusinessType,
  type SubscriptionDto,
  type TenantFeaturesDto,
} from '@pos/api-client';

/** Industry/catalog from server; plan-gated modules from subscription resolution. */
export function mergeTenantFeatures(
  server: TenantFeaturesDto | null,
  businessType: BusinessType | null,
  subscription: SubscriptionDto | null,
): TenantFeaturesDto | null {
  const type = businessType ?? (subscription ? ('Hybrid' as BusinessType) : null);
  const resolved = type ? resolveTenantFeatures(type, subscription) : null;
  if (!server) return resolved;
  if (!resolved) return server;
  return {
    ...server,
    ...resolved,
    onlineMenu: resolved.onlineMenu,
    onlineOrdering: resolved.onlineOrdering,
    officeCoupons: resolved.officeCoupons,
    officeHr: resolved.officeHr,
    posKitchen: resolved.posKitchen,
    posDelivery: resolved.posDelivery,
    catalogInventory: resolved.catalogInventory,
  };
}

export interface PlanModuleDef {
  id: string;
  label: string;
  icon: LucideIcon;
  planFlag: keyof Pick<SubscriptionDto, 'hasCoupons' | 'hasOnlineMenu' | 'hasOnlineOrdering' | 'hasHr'>;
  tenantFlag: keyof Pick<TenantFeaturesDto, 'officeCoupons' | 'onlineMenu' | 'onlineOrdering' | 'officeHr'>;
  /** In-portal route opened from the Modules sidebar. */
  portalPath: string;
  roles: string[];
}

export interface ModuleNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Nested under a parent module (e.g. HR sub-pages). */
  indent?: boolean;
}

const PLAN_MODULES: PlanModuleDef[] = [
  {
    id: 'coupons',
    label: 'Coupons & Lucky Draw',
    icon: TicketIcon,
    planFlag: 'hasCoupons',
    tenantFlag: 'officeCoupons',
    portalPath: '/coupons',
    roles: ['OrgAdmin', 'StoreManager'],
  },
  {
    id: 'onlineMenu',
    label: 'Online Menu',
    icon: UtensilsCrossedIcon,
    planFlag: 'hasOnlineMenu',
    tenantFlag: 'onlineMenu',
    portalPath: '/online-menu',
    roles: ['OrgAdmin', 'StoreManager'],
  },
  {
    id: 'onlineOrdering',
    label: 'Online Ordering',
    icon: ShoppingBagIcon,
    planFlag: 'hasOnlineOrdering',
    tenantFlag: 'onlineOrdering',
    portalPath: '/online-ordering',
    roles: ['OrgAdmin', 'StoreManager'],
  },
  {
    id: 'hr',
    label: 'Human Resources',
    icon: BriefcaseIcon,
    planFlag: 'hasHr',
    tenantFlag: 'officeHr',
    portalPath: '/hr',
    roles: ['OrgAdmin', 'StoreManager'],
  },
];

const HR_SUB_NAV: Omit<ModuleNavItem, 'indent'>[] = [
  { to: '/hr/employees', label: 'Employees', icon: UsersIcon },
  { to: '/hr/payroll', label: 'Payroll', icon: WalletIcon },
  { to: '/hr/attendance', label: 'Attendance', icon: ClockIcon },
  { to: '/hr/leave', label: 'Leave', icon: CalendarIcon },
  { to: '/hr/scheduling', label: 'Scheduling', icon: CalendarDaysIcon },
];

function resolveFeatures(
  subscription: SubscriptionDto | null,
  tenantFeatures: TenantFeaturesDto | null,
  businessType: BusinessType | null,
): TenantFeaturesDto | null {
  return mergeTenantFeatures(tenantFeatures, businessType, subscription);
}

function canAccessModules(roles: string[]): boolean {
  return roles.includes('OrgAdmin') || roles.includes('StoreManager');
}

function isModuleEnabled(
  mod: PlanModuleDef,
  subscription: SubscriptionDto | null,
  tenantFeatures: TenantFeaturesDto | null,
  roles: string[],
  businessType: BusinessType | null,
): boolean {
  if (!subscription || !canAccessModules(roles)) return false;
  const features = resolveFeatures(subscription, tenantFeatures, businessType);
  if (!features) return false;
  if (!subscriptionPlanFlag(subscription, mod.planFlag)) return false;
  if (!features[mod.tenantFlag]) return false;
  if (!mod.roles.some((r) => roles.includes(r))) return false;
  return true;
}

/** Modules included in the tenant subscription plan (plan flag + business-type gate). */
function getVisiblePlanModules(
  subscription: SubscriptionDto | null,
  tenantFeatures: TenantFeaturesDto | null,
  roles: string[],
  businessType: BusinessType | null = null,
): PlanModuleDef[] {
  return PLAN_MODULES.filter((mod) => isModuleEnabled(mod, subscription, tenantFeatures, roles, businessType));
}

/** Flat sidebar list: each subscribed module plus nested HR pages. */
export function getModuleSidebarNavItems(
  subscription: SubscriptionDto | null,
  tenantFeatures: TenantFeaturesDto | null,
  roles: string[],
  businessType: BusinessType | null = null,
): ModuleNavItem[] {
  const items: ModuleNavItem[] = [];

  for (const mod of getVisiblePlanModules(subscription, tenantFeatures, roles, businessType)) {
    items.push({
      to: mod.portalPath,
      label: mod.label,
      icon: mod.icon,
      end: mod.id === 'hr',
    });
    if (mod.id === 'hr') {
      for (const sub of HR_SUB_NAV) {
        items.push({ ...sub, indent: true });
      }
    }
  }

  return items;
}
