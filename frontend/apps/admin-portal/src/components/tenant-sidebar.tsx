import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  PackageIcon,
  TagsIcon,
  WarehouseIcon,
  FlaskConicalIcon,
  StoreIcon,
  ArrowLeftRightIcon,
  ScrollTextIcon,
  UsersIcon,
  CreditCardIcon,
  SettingsIcon,
  LogOutIcon,
  ShoppingCartIcon,
} from 'lucide-react';
import { useAuth, useIsPosFrontStaff } from '@/auth';
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

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  roles?: string[];
  permission?: string;
};

const nav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingCartIcon, permission: 'Order.View' },
  { to: '/products', label: 'Products', icon: PackageIcon },
  { to: '/categories', label: 'Categories', icon: TagsIcon },
  { to: '/inventory', label: 'Inventory', icon: WarehouseIcon },
  { to: '/supplies', label: 'Supplies', icon: FlaskConicalIcon, roles: ['OrgAdmin', 'StoreManager'] },
  { to: '/branches', label: 'Branches', icon: StoreIcon, roles: ['OrgAdmin', 'StoreManager'] },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRightIcon, roles: ['OrgAdmin', 'StoreManager'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollTextIcon, roles: ['OrgAdmin', 'StoreManager'] },
  { to: '/users', label: 'Users', icon: UsersIcon, roles: ['OrgAdmin'] },
  { to: '/billing', label: 'Billing', icon: CreditCardIcon, roles: ['OrgAdmin'] },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['OrgAdmin'] },
];

function filterNav(items: NavItem[], roles: string[], hasPermission: (code: string) => boolean, isPosFrontStaff: boolean) {
  return items.filter((item) => {
    if (isPosFrontStaff && item.to !== '/orders') return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.roles && !item.roles.some((r) => roles.includes(r))) return false;
    return true;
  });
}

export function TenantSidebar() {
  const { user, roles, logout, subscription, hasPermission } = useAuth();
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

  const visibleNav = filterNav(nav, roles, hasPermission, isPosFrontStaff);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            B
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">BlurayPOS</span>
            <span className="text-xs text-muted-foreground">{isPosFrontStaff ? 'Orders' : 'Store Admin'}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Store</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                const Icon = item.icon;
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
          </SidebarGroupContent>
        </SidebarGroup>
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
