import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  LayersIcon,
  Building2Icon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon,
  BarChart3Icon,
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

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
};

const nav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
  { to: '/reports', label: 'Revenue & Sales', icon: BarChart3Icon },
  { to: '/plans', label: 'Plans', icon: LayersIcon },
  { to: '/tenants', label: 'Stores', icon: Building2Icon },
  { to: '/platform-users', label: 'Users', icon: UsersIcon },
  { to: '/platform-settings', label: 'Platform Settings', icon: SettingsIcon },
];

export function PlatformSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'SA'
    : 'SA';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            B
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">BlurayPOS</span>
            <span className="text-xs text-muted-foreground">Super Admin</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
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
            <Badge variant="outline" className="w-fit text-[10px] px-1 py-0">Super Admin</Badge>
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
