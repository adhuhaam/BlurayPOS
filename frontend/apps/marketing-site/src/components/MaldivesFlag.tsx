import { cn } from '@/lib/utils';

/**
 * Official Maldives flag (2:3) — red border, green panel, white crescent facing fly.
 * Geometry per Wikimedia / Maldivian constitution construction sheet.
 */
export function MaldivesFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 480"
      className={cn('aspect-[3/2] h-5 w-7 shrink-0 overflow-hidden rounded-sm shadow-sm ring-1 ring-border/60', className)}
      role="img"
      aria-label="Maldives flag"
    >
      <rect fill="#007E3A" stroke="#D21034" strokeWidth="120" width="600" height="360" x="60" y="60" />
      <circle fill="#FFFFFF" cx="390" cy="240" r="80" />
      <circle fill="#007E3A" cx="420" cy="240" r="80" />
    </svg>
  );
}
