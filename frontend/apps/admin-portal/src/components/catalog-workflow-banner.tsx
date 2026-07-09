import { Link } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/auth';
import {
  catalogActiveFromLegacy,
  getCatalogStepsForFeatures,
  type CatalogStepId,
} from '@/lib/catalog-flow';

type CatalogWorkflowBannerProps = {
  active?: CatalogStepId | 'supplies' | 'products' | 'recipes' | 'inventory' | 'categories';
};

export function CatalogWorkflowBanner({ active }: CatalogWorkflowBannerProps) {
  const { tenantFeatures } = useAuth();
  const steps = getCatalogStepsForFeatures(tenantFeatures);

  const activeId = typeof active === 'string' && ['supplies', 'categories'].includes(active)
    ? catalogActiveFromLegacy(active as 'supplies' | 'categories')
    : (active as CatalogStepId | undefined);

  const activeStep = steps.find((s) => s.id === activeId);
  const activeIndex = activeStep ? steps.indexOf(activeStep) : -1;

  return (
    <Card className="border-dashed bg-muted/20">
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Recommended catalog flow</p>
          {activeStep && (
            <span className="text-xs text-muted-foreground">
              Step {activeStep.step} of {steps.length}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.id === activeId;
            const isDone = activeIndex >= 0 && i < activeIndex;

            return (
              <span key={step.id} className="flex items-center gap-1 sm:gap-2">
                {i > 0 && <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />}
                <Link
                  to={step.to}
                  title={step.hint}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted sm:px-3 ${
                    isActive
                      ? 'border-primary bg-primary/10 font-medium text-foreground'
                      : isDone
                        ? 'border-border bg-background text-muted-foreground'
                        : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isDone
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isDone ? <CheckIcon className="size-3" /> : step.step}
                  </span>
                  <Icon className="size-3.5 shrink-0" />
                  {step.label}
                </Link>
              </span>
            );
          })}
        </div>

        {activeStep ? (
          <p className="text-xs text-muted-foreground">{activeStep.guide}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Follow the steps in order: ingredients first, then products, recipes, and retail inventory.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
