import { useEffect, useRef } from 'react';
import type { PublicMenuCategoryDto } from '@pos/api-client';

interface CategoryChipsProps {
  categories: PublicMenuCategoryDto[];
  activeId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryChips({ categories, activeId, onSelect }: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!activeId) return;
    chipRefs.current[activeId]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeId]);

  return (
    <div
      ref={scrollRef}
      className="sticky top-0 z-20 -mx-4 border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-zinc-50/80"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeId === null
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-zinc-700 ring-1 ring-zinc-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            ref={(node) => {
              chipRefs.current[category.id] = node;
            }}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeId === category.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-zinc-700 ring-1 ring-zinc-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
