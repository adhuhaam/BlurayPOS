import { Link } from 'react-router-dom';
import { ArrowRightIcon, ChefHatIcon, PackageIcon, WarehouseIcon, FlaskConicalIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const steps = [
  { icon: FlaskConicalIcon, label: 'Ingredients', to: '/supplies', hint: 'Set up supplies first for recipes' },
  { icon: PackageIcon, label: 'Products', to: '/products', hint: 'Create your menu / catalog' },
  { icon: ChefHatIcon, label: 'Recipes', to: '/products', hint: 'Link ingredients to recipe items' },
  { icon: WarehouseIcon, label: 'Inventory', to: '/inventory', hint: 'Track retail stock levels' },
];

type CatalogWorkflowBannerProps = {
  active?: 'supplies' | 'products' | 'inventory' | 'categories';
};

export function CatalogWorkflowBanner({ active }: CatalogWorkflowBannerProps) {
  return (
    <Card className="border-dashed bg-muted/20">
      <CardContent className="flex flex-col gap-3 pt-4">
        <p className="text-sm font-medium">Recommended catalog flow</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive =
              (active === 'supplies' && step.label === 'Ingredients') ||
              (active === 'products' && step.label === 'Products') ||
              (active === 'inventory' && step.label === 'Inventory') ||
              (active === 'categories' && step.label === 'Products');
            return (
              <span key={step.label} className="flex items-center gap-2">
                {i > 0 && <ArrowRightIcon className="size-3.5 text-muted-foreground" />}
                <Link
                  to={step.to}
                  title={step.hint}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 transition-colors hover:bg-muted ${
                    isActive ? 'border-primary bg-primary/10 font-medium' : 'border-transparent'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {step.label}
                </Link>
              </span>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Create a product first, then add its recipe on the next step. Categories can be added inline while creating a product.
        </p>
      </CardContent>
    </Card>
  );
}
