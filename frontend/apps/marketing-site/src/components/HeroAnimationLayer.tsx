/** Base background layer — grid, aurora, beam */
export function HeroAnimationLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <div className="hero-grid absolute inset-0" />
      <div className="hero-noise absolute inset-0 opacity-[0.03]" />

      <div className="hero-aurora hero-aurora-a absolute -left-1/4 top-0 size-[70%] rounded-full bg-[#2b6bff]/30 blur-[100px] motion-safe:animate-aurora-a" />
      <div className="hero-aurora hero-aurora-b absolute -right-1/4 bottom-0 size-[60%] rounded-full bg-[#1a4fd6]/25 blur-[90px] motion-safe:animate-aurora-b" />
      <div className="hero-aurora hero-aurora-c absolute left-1/3 top-1/2 size-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7ec0ff]/15 blur-[80px] motion-safe:animate-aurora-c" />

      <div className="hero-beam absolute inset-0 motion-safe:animate-beam-sweep" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0b1f6d]/80 to-transparent" />
    </div>
  );
}
