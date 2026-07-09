import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type HeroRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
};

const slideClass = {
  up: 'slide-in-from-bottom-8',
  down: 'slide-in-from-top-8',
  left: 'slide-in-from-right-8',
  right: 'slide-in-from-left-8',
  none: '',
};

/** Above-the-fold reveal — animates on mount, not scroll */
export function HeroReveal({ children, className, delay = 0, direction = 'up' }: HeroRevealProps) {
  return (
    <div
      className={cn(
        'animate-in fade-in duration-700 fill-mode-both',
        slideClass[direction],
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
