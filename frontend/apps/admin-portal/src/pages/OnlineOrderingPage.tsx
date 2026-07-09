import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLinkIcon, ShoppingBagIcon } from 'lucide-react';
import { api } from '@pos/api-client';
import { ModulePageHeader } from '@/components/page-header';
import { OnlineOrderingSettingsCard } from '@/components/online-ordering-settings';
import { Button } from '@/components/ui/button';
import { orderUrlForSlug } from '@/config';

export function OnlineOrderingPage() {
  const [orgSlug, setOrgSlug] = useState('your-store');

  useEffect(() => {
    api.getOrganization().then((org) => setOrgSlug(org.slug)).catch(() => {});
  }, []);

  const publicOrderUrl = orderUrlForSlug(orgSlug);

  return (
    <div className="flex flex-col gap-6">
      <ModulePageHeader
        title="Online Ordering"
        description="Configure how customers order online and manage incoming web orders."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" render={<Link to="/orders" />}>
              <ShoppingBagIcon data-icon="inline-start" />
              Online orders inbox
            </Button>
            <Button variant="outline" render={<a href={publicOrderUrl} target="_blank" rel="noopener noreferrer" />}>
              <ExternalLinkIcon data-icon="inline-start" />
              Preview store page
            </Button>
          </div>
        }
      />

      <OnlineOrderingSettingsCard />
    </div>
  );
}
