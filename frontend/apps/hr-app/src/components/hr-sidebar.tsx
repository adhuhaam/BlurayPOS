import { NavLink, useLocation } from 'react-router-dom';
import {
  BriefcaseIcon,
  UsersIcon,
  WalletIcon,
  ClockIcon,
  CalendarIcon,
  CalendarDaysIcon,
  LogOutIcon,
  ExternalLinkIcon,
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
import { links } from '@hr/config';

const hrNav = [
  { to: '/', label: 'Overview', icon: BriefcaseIcon, end: true },
  { to: '/employees', label: 'Employees', icon: UsersIcon },
  { to: '/payroll', label: 'Payroll', icon: WalletIcon },
  { to: '/attendance', label: 'Attendance', icon: ClockIcon },
  { to: '/leave', label: 'Leave', icon: CalendarIcon },
  { to: '/scheduling', label: 'Scheduling', icon: CalendarDaysIcon },
];

function isNavActive(to: string, pathname: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function HrSidebar() {
  const { user, roles, logout, subscription } = useAuth();
  const location = useLocation();

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'HR'
    : 'HR';

  const primaryRole = roles.includes('OrgAdmin') ? 'Manager'
    : roles.includes('StoreManager') ? 'Branch Manager'
    : roles[0] ?? 'User';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            HR
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">BlurayPOS HR</span>
            <span className="text-xs text-muted-foreground">Human Resources</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>HR</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hrNav.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.to, location.pathname, item.end);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton isActive={active} tooltip={item.label} render={<NavLink to={item.to} end={item.end} />}>
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Office</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Back to Store Admin"
                  render={<a href={links.office} target="_blank" rel="noopener noreferrer" />}
                >
                  <ExternalLinkIcon />
                  <span>Store Admin</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
