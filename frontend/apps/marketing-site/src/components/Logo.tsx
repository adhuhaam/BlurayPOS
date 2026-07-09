import { cn } from '@/lib/utils';

type LogoMarkProps = {
  className?: string;
  variant?: 'icon' | 'mark';
};

/** BlurayPOS brand mark — stylized B with POS chip and diagonal slash */
export function LogoMark({ className, variant = 'icon' }: LogoMarkProps) {
  const src = variant === 'icon' ? '/logo.svg' : '/logo-mark.svg';

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={cn('object-contain', className)}
    />
  );
}

type LogoSize = 'sm' | 'md' | 'lg';

const iconSize: Record<LogoSize, string> = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
};

const textSize: Record<LogoSize, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Logo({ size = 'md', className, variant = 'dark' }: { size?: LogoSize; className?: string; variant?: 'dark' | 'light' }) {
  const light = variant === 'light';
  return (
    <div className={cn('group flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-xl shadow-md transition-all duration-300',
          light ? 'ring-1 ring-white/20 group-hover:shadow-lg group-hover:shadow-blue-500/30' : 'ring-1 ring-primary/20 group-hover:shadow-lg group-hover:shadow-primary/25 group-hover:ring-primary/40',
          iconSize[size],
        )}
      >
        <img src="/logo.png" alt="" aria-hidden className="size-full object-cover" />
      </div>
      <div>
        <p className={cn('font-bold leading-none', light ? 'text-white' : 'text-foreground', textSize[size])}>BlurayPOS</p>
        {size !== 'sm' && (
          <p className={cn('mt-0.5 text-xs font-medium', light ? 'text-blue-200/80' : 'text-muted-foreground')}>
            Smart POS. Smarter Business.
          </p>
        )}
      </div>
    </div>
  );
}
