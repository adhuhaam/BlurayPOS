import type { ReactNode } from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary-600 border-t-transparent ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {subtitle && <p className="text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ThemeToggle() {
  const toggle = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('pos-theme', isDark ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-border bg-surface-elevated p-2 text-text hover:bg-border transition-colors"
      aria-label="Toggle theme"
    >
      <span className="dark:hidden">🌙</span>
      <span className="hidden dark:inline">☀️</span>
    </button>
  );
}

export function initTheme(): void {
  const stored = localStorage.getItem('pos-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
}
