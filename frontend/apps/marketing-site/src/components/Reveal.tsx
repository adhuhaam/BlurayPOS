import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
};

const slideClass = {
  up: 'slide-in-from-bottom-6',
  down: 'slide-in-from-top-6',
  left: 'slide-in-from-right-6',
  right: 'slide-in-from-left-6',
  none: '',
};

export function Reveal({ children, className, delay = 0, direction = 'up' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        !visible && 'opacity-0',
        visible && 'animate-in fade-in duration-700 fill-mode-both',
        visible && slideClass[direction],
        className,
      )}
      style={visible && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
