import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ShimmerText({ children, className, variant = 'dark' }: { children: ReactNode; className?: string; variant?: 'dark' | 'light' }) {
  return (
    <span
      className={cn(
        'bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-shimmer-text',
        variant === 'light'
          ? 'bg-gradient-to-r from-white via-[#7ec0ff] to-[#2b6bff]'
          : 'bg-gradient-to-r from-primary via-primary/80 to-primary',
        className,
      )}
    >
      {children}
    </span>
  );
}
