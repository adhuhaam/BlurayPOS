import {
  FlaskConicalIcon,
  PackageIcon,
  ChefHatIcon,
  WarehouseIcon,
  type LucideIcon,
} from 'lucide-react';

export type CatalogStepId = 'ingredients' | 'products' | 'recipes' | 'inventory';

export type CatalogStep = {
  id: CatalogStepId;
  step: number;
  label: string;
  to: string;
  icon: LucideIcon;
  hint: string;
  guide: string;
};

export const CATALOG_STEPS: CatalogStep[] = [
  {
    id: 'ingredients',
    step: 1,
    label: 'Ingredients',
    to: '/supplies',
    icon: FlaskConicalIcon,
    hint: 'Raw materials, packaging, and components',
    guide: 'Start here — add everything you buy and use (flour, chicken, cups, etc.).',
  },
  {
    id: 'products',
    step: 2,
    label: 'Products',
    to: '/products',
    icon: PackageIcon,
    hint: 'Menu items with name, price, and type',
    guide: 'Create retail or recipe-based menu items. Categories can be added inline.',
  },
  {
    id: 'recipes',
    step: 3,
    label: 'Recipes',
    to: '/products?view=recipes',
    icon: ChefHatIcon,
    hint: 'Link ingredients to recipe products',
    guide: 'Attach ingredients and quantities — stock deducts automatically when sold.',
  },
  {
    id: 'inventory',
    step: 4,
    label: 'Inventory',
    to: '/inventory',
    icon: WarehouseIcon,
    hint: 'Finished retail stock per branch',
    guide: 'Track retail product stock. Recipe items use Ingredients instead.',
  },
];

/** Map legacy banner `active` props to catalog step ids */
export function catalogActiveFromLegacy(
  active?: 'supplies' | 'products' | 'recipes' | 'inventory' | 'categories',
): CatalogStepId | undefined {
  if (!active) return undefined;
  if (active === 'supplies') return 'ingredients';
  if (active === 'categories') return 'products';
  return active;
}

export function isCatalogStepActive(
  stepId: CatalogStepId,
  pathname: string,
  search: string,
): boolean {
  if (stepId === 'recipes') {
    return pathname === '/products' && search.includes('view=recipes');
  }
  if (stepId === 'products') {
    return pathname === '/products' && !search.includes('view=recipes');
  }
  const step = CATALOG_STEPS.find((s) => s.id === stepId);
  return step ? pathname === step.to || pathname.startsWith(`${step.to}/`) : false;
}

export function getCatalogStepsForFeatures(
  features: { catalogIngredients: boolean; catalogRecipes: boolean; catalogInventory: boolean } | null,
): CatalogStep[] {
  if (!features) return CATALOG_STEPS;

  const filtered = CATALOG_STEPS.filter((step) => {
    if (step.id === 'ingredients') return features.catalogIngredients;
    if (step.id === 'recipes') return features.catalogRecipes;
    if (step.id === 'inventory') return features.catalogInventory;
    return true;
  });

  return filtered.map((step, index) => ({ ...step, step: index + 1 }));
}
