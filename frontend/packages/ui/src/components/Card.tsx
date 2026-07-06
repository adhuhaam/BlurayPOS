import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface-elevated shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          {title && <h3 className="text-lg font-semibold text-text">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
