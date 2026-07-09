import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  TagsIcon,
  StoreIcon,
  ArrowLeftRightIcon,
  ScrollTextIcon,
  UsersIcon,
  CreditCardIcon,
  SettingsIcon,
  LogOutIcon,
  ShoppingCartIcon,
  BarChart3Icon,
  PuzzleIcon,
  LayoutGridIcon,
} from 'lucide-react';
import { useAuth, useIsPosFrontStaff } from '@/auth';
import { getModuleSidebarNavItems, type ModuleNavItem } from '@/lib/plan-modules';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  getCatalogStepsForFeatures,
  isCatalogStepActive,
  type CatalogStepId,
} from '@/lib/catalog-flow';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  roles?: string[];
  permission?: string;
};

const overviewNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingCartIcon, permission: 'Order.View' },
];

const operationsNav: NavItem[] = [
  { to: '/branches', label: 'Branches', icon: StoreIcon, roles: ['OrgAdmin', 'StoreManager'] },
  { to: '/transfers', label: 'Stock Transfers', icon: ArrowLeftRightIcon, roles: ['OrgAdmin', 'StoreManager'] },
];

const reportsNav: NavItem[] = [
  { to: '/audit-logs', label: 'Audit Log', icon: ScrollTextIcon, roles: ['OrgAdmin', 'StoreManager'] },
];

const settingsNav: NavItem[] = [
  { to: '/users', label: 'Users & Roles', icon: UsersIcon, roles: ['OrgAdmin'] },
  { to: '/billing', label: 'Billing & Plan', icon: CreditCardIcon, roles: ['OrgAdmin'] },
  { to: '/settings', label: 'Store Settings', icon: SettingsIcon, roles: ['OrgAdmin'] },
];

const catalogExtras: NavItem[] = [
  { to: '/categories', label: 'Categories', icon: TagsIcon, roles: ['OrgAdmin', 'StoreManager'] },
];

function filterNav(
  items: NavItem[],
  roles: string[],
  hasPermission: (code: string) => boolean,
  isPosFrontStaff: boolean,
) {
  return items.filter((item) => {
    if (isPosFrontStaff && item.to !== '/orders') return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.roles && !item.roles.some((r) => roles.includes(r))) return false;
    return true;
  });
}

function canAccessCatalog(roles: string[], isPosFrontStaff: boolean) {
  if (isPosFrontStaff) return false;
  return roles.includes('OrgAdmin') || roles.includes('StoreManager');
}

function isNavActive(item: NavItem, pathname: string) {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function ModuleNavList({ items }: { items: ModuleNavItem[] }) {
  const location = useLocation();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.end
          ? location.pathname === item.to
          : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              tooltip={item.label}
              isActive={active}
              render={<NavLink to={item.to} end={item.end} />}
            >
              <Icon />
              <span className={cn('flex-1 truncate', item.indent && 'pl-2')}>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function NavItemsList({ items }: { items: NavItem[] }) {
  const location = useLocation();
  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = isNavActive(item, location.pathname);
        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              isActive={isActive}
              tooltip={item.label}
              render={<NavLink to={item.to} end={item.end} />}
            >
              <Icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function TenantSidebar() {
  const { user, roles, logout, subscription, hasPermission, tenantFeatures, businessType } = useAuth();
  const isPosFrontStaff = useIsPosFrontStaff();
  const location = useLocation();

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'AD'
    : 'AD';

  const primaryRole = roles.includes('OrgAdmin') ? 'Manager'
    : roles.includes('StoreManager') ? 'Branch Manager'
    : roles.includes('Waiter') ? 'Waiter'
    : roles.includes('Cashier') ? 'Cashier'
    : roles[0] ?? 'User';

  const visibleOverview = filterNav(overviewNav, roles, hasPermission, isPosFrontStaff);
  const showCatalog = canAccessCatalog(roles, isPosFrontStaff);
  const visibleCatalogExtras = filterNav(catalogExtras, roles, hasPermission, isPosFrontStaff);
  const moduleNav = getModuleSidebarNavItems(subscription, tenantFeatures, roles, businessType);

  const visibleOperations = filterNav(operationsNav, roles, hasPermission, isPosFrontStaff);
  const restaurantOps: NavItem[] =
    tenantFeatures?.posTables && !isPosFrontStaff
      ? [{ to: '/tables', label: 'Tables & Areas', icon: LayoutGridIcon, roles: ['OrgAdmin', 'StoreManager'] }]
      : [];
  const visibleRestaurantOps = filterNav(restaurantOps, roles, hasPermission, isPosFrontStaff);
  const visibleReports = filterNav(reportsNav, roles, hasPermission, isPosFrontStaff);
  const visibleSettings = filterNav(
    settingsNav,
    roles,
    hasPermission,
    isPosFrontStaff,
  );

  const catalogSteps = getCatalogStepsForFeatures(tenantFeatures);
  const catalogActiveId = (catalogSteps.find((s) =>
    isCatalogStepActive(s.id, location.pathname, location.search),
  )?.id ?? null) as CatalogStepId | null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            B
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">BlurayPOS</span>
            <span className="text-xs text-muted-foreground">
              {isPosFrontStaff ? 'Orders' : roles.includes('StoreManager') ? 'Branch Manager' : 'Store Admin'}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {visibleOverview.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavItemsList items={visibleOverview} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showCatalog && (
          <SidebarGroup>
            <SidebarGroupLabel>Catalog setup</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {catalogSteps.map((step) => {
                  const Icon = step.icon;
                  const isActive = catalogActiveId === step.id;
                  return (
                    <SidebarMenuItem key={step.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={`${step.step}. ${step.label}`}
                        render={<NavLink to={step.to} />}
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[10px] font-bold text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
                          {step.step}
                        </span>
                        <Icon />
                        <span>{step.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                {visibleCatalogExtras.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavActive(item, location.pathname);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={<NavLink to={item.to} />}
                      >
                        <Icon />
                        <span className="text-muted-foreground">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {moduleNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-1.5">
              <PuzzleIcon className="size-3.5 opacity-60" />
              Modules
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal uppercase tracking-wide group-data-[collapsible=icon]:hidden">
                Module
              </Badge>
              {subscription && (
                <span className="ml-auto truncate text-[10px] font-normal text-muted-foreground group-data-[collapsible=icon]:hidden">
                  {subscription.planName}
                </span>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <ModuleNavList items={moduleNav} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(visibleOperations.length > 0 || visibleRestaurantOps.length > 0) && (
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavItemsList items={[...visibleOperations, ...visibleRestaurantOps]} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleReports.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-1.5">
              <BarChart3Icon className="size-3.5 opacity-60" />
              Reports
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <NavItemsList items={visibleReports} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleSettings.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavItemsList items={visibleSettings} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user?.firstName} {user?.lastName}</span>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">{primaryRole}</Badge>
              {subscription && <span className="truncate text-xs text-muted-foreground">{subscription.planName}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 pb-2 group-data-[collapsible=icon]:flex-col">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="flex-1 justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0" onClick={logout}>
            <LogOutIcon data-icon="inline-start" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
