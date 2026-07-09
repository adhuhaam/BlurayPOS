import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { PlatformSidebar } from '@/components/platform-sidebar';
import { TenantSidebar } from '@/components/tenant-sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/auth';
import { SubscriptionReadOnlyBanner } from '@/components/SubscriptionReadOnlyBanner';

export function AdminLayout() {
  const { isSuperAdmin } = useAuth();

  return (
    <TooltipProvider>
      <SidebarProvider>
        {isSuperAdmin ? <PlatformSidebar /> : <TenantSidebar />}
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground">
              {isSuperAdmin ? 'Platform administration' : 'Store administration'}
            </span>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {!isSuperAdmin && <SubscriptionReadOnlyBanner />}
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
