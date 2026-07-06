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
  LogOutIcon,
  Building2Icon,
  CreditCardIcon,
  SettingsIcon,
} from 'lucide-react';
import { useAuth } from '@/auth';
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

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; end?: boolean; roles?: string[] };

const platformNav: NavItem[] = [
  { to: '/organizations', label: 'Organizations', icon: Building2Icon, roles: ['SuperAdmin'] },
];

const orgNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
  { to: '/products', label: 'Products', icon: PackageIcon },
  { to: '/categories', label: 'Categories', icon: TagsIcon },
  { to: '/inventory', label: 'Inventory', icon: WarehouseIcon },
  { to: '/supplies', label: 'Supplies', icon: FlaskConicalIcon, roles: ['OrgAdmin', 'SuperAdmin', 'StoreManager'] },
  { to: '/stores', label: 'Stores', icon: StoreIcon, roles: ['OrgAdmin', 'SuperAdmin', 'StoreManager'] },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRightIcon },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollTextIcon, roles: ['OrgAdmin', 'SuperAdmin', 'StoreManager'] },
  { to: '/users', label: 'Users', icon: UsersIcon, roles: ['OrgAdmin', 'SuperAdmin'] },
  { to: '/billing', label: 'Billing', icon: CreditCardIcon, roles: ['OrgAdmin', 'SuperAdmin'] },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['OrgAdmin', 'SuperAdmin'] },
];

function filterNav(items: NavItem[], roles: string[]) {
  return items.filter((item) => !item.roles || item.roles.some((r) => roles.includes(r)));
}

export function AppSidebar() {
  const { user, roles, logout, isSuperAdmin, subscription } = useAuth();
  const location = useLocation();
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'AD'
    : 'AD';

  const primaryRole = roles.includes('SuperAdmin') ? 'SuperAdmin'
    : roles.includes('OrgAdmin') ? 'OrgAdmin'
    : roles.includes('StoreManager') ? 'StoreManager'
    : roles[0] ?? 'User';

  const renderNav = (items: NavItem[], label: string) => {
    const filtered = filterNav(items, roles);
    if (filtered.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {filtered.map((item) => {
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
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            P
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">POS Admin</span>
            <span className="text-xs text-muted-foreground">SaaS Console</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isSuperAdmin && renderNav(platformNav, 'Platform')}
        {renderNav(orgNav, isSuperAdmin ? 'Tenant' : 'Management')}
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

