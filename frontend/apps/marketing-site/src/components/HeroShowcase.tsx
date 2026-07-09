import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTilt } from '@/hooks/useTilt';
import {
  Battery,
  Feather,
  Printer,
  Receipt,
  Smartphone,
  Tablet,
  TrendingUp,
  Wifi,
} from 'lucide-react';

const deviceCallouts = [
  { icon: Printer, label: '58mm thermal', sub: 'Bills & receipts', side: 'left' as const, top: '12%' },
  { icon: Tablet, label: '5.5" touchscreen', sub: 'Easy to use', side: 'left' as const, top: '42%' },
  { icon: Feather, label: 'Lightweight', sub: 'Handheld design', side: 'right' as const, top: '20%' },
  { icon: Wifi, label: 'Cloud sync', sub: 'Live with office', side: 'right' as const, top: '55%' },
];

const floatingStats = [
  { icon: TrendingUp, label: 'MVR 24K+', sub: 'sales tracked', className: 'left-0 top-[6%] motion-safe:animate-float-delayed' },
  { icon: Receipt, label: 'Receipt #1042', sub: 'printed in 2s', className: 'right-0 top-[4%] motion-safe:animate-float' },
  { icon: Battery, label: 'All-day battery', sub: 'Built for shifts', className: 'left-[6%] bottom-[18%] hidden motion-safe:animate-float-slow lg:flex' },
];

export function HeroShowcase() {
  const { ref, onMove, onLeave } = useTilt(6);

  return (
    <div
      className="group relative w-full px-1 sm:px-0 lg:-mr-10 xl:-mr-16 2xl:-mr-20"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2b6bff]/30 blur-3xl motion-safe:animate-glow-pulse" />

      <div className="relative mx-auto max-w-[min(100%,520px)] sm:max-w-[580px] md:max-w-[640px] lg:max-w-none">
        {floatingStats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'absolute z-20 hidden transition-all duration-300 sm:block',
              'hover:scale-105 hover:shadow-lg',
              stat.className,
            )}
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 shadow-lg backdrop-blur-md">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#2b6bff]/30 text-[#7ec0ff]">
                <stat.icon size={16} aria-hidden />
              </div>
              <div>
                <p className="text-xs font-bold leading-none text-white">{stat.label}</p>
                <p className="mt-0.5 text-[10px] text-blue-200/80">{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}

        {deviceCallouts.map((c) => (
          <div
            key={c.label}
            className={cn(
              'absolute z-20 hidden transition-all duration-300 md:block',
              'hover:scale-105',
              c.side === 'left' ? 'left-0' : 'right-0',
              'motion-safe:animate-float',
            )}
            style={{ top: c.top, animationDelay: `${deviceCallouts.indexOf(c) * 0.4}s` }}
          >
            <div className="flex items-center gap-2 rounded-full border border-[#7ec0ff]/30 bg-[#0b1f6d]/80 px-3 py-1.5 shadow-md backdrop-blur-sm">
              <c.icon size={14} className="text-[#7ec0ff]" aria-hidden />
              <div>
                <p className="text-[10px] font-semibold leading-none text-white">{c.label}</p>
                <p className="text-[9px] text-blue-200/70">{c.sub}</p>
              </div>
            </div>
          </div>
        ))}

        <div
          ref={ref}
          className="hero-tilt relative transition-transform duration-300 ease-out"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <img
            src="/hero-devices.png"
            alt="BlurayPOS handheld POS terminal printing a receipt with laptop office dashboard"
            className={cn(
              'relative z-10 mx-auto w-full object-contain motion-safe:animate-float',
              'lg:min-h-[500px] lg:w-[118%]',
              'xl:min-h-[560px] xl:w-[128%] xl:scale-[1.05]',
              '2xl:min-h-[600px] 2xl:w-[135%] 2xl:scale-[1.08]',
              'drop-shadow-[0_32px_64px_rgba(0,0,0,0.45)] transition-all duration-500',
              'group-hover:lg:drop-shadow-[0_48px_96px_rgba(43,107,255,0.35)]',
              'group-hover:lg:scale-[1.02]',
            )}
            width={1024}
            height={682}
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-4 lg:gap-3">
        {[
          { icon: Printer, label: '58mm printer' },
          { icon: Feather, label: 'Lightweight' },
          { icon: Smartphone, label: 'Android 13/14' },
          { icon: Wifi, label: 'Cloud sync' },
        ].map((tag, i) => (
          <div
            key={tag.label}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2 py-2 backdrop-blur-sm transition-all duration-300 hover:border-[#7ec0ff]/40 hover:bg-white/10',
              'motion-safe:animate-in fade-in slide-in-from-bottom-2 fill-mode-both',
            )}
            style={{ animationDelay: `${600 + i * 80}ms` }}
          >
            <tag.icon size={14} className="shrink-0 text-[#7ec0ff]" aria-hidden />
            <span className="text-[10px] font-medium text-blue-50 sm:text-xs">{tag.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
