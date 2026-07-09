import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Alias used by some pages */
  actions?: ReactNode;
  /** Small label above the title (e.g. "Module") */
  category?: string;
};

export function PageHeader({ title, description, action, actions, category }: PageHeaderProps) {
  const actionSlot = action ?? actions;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1.5">
        {category && (
          <Badge variant="secondary" className="w-fit text-[10px] font-medium uppercase tracking-wide">
            {category}
          </Badge>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actionSlot && <div className="flex shrink-0 flex-wrap items-center gap-2">{actionSlot}</div>}
    </div>
  );
}

/** Standard header for plan-gated module pages in Office. */
export function ModulePageHeader(props: Omit<PageHeaderProps, 'category'>) {
  return <PageHeader {...props} category="Module" />;
}
