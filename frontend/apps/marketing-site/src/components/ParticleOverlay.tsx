type Particle = {
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  opacity?: number;
};

function buildParticles(count: number, seed = 1): Particle[] {
  const out: Particle[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      left: `${5 + rand() * 90}%`,
      top: `${5 + rand() * 90}%`,
      size: rand() > 0.85 ? 4 + rand() * 3 : 1.5 + rand() * 2.5,
      delay: rand() * 6,
      duration: 10 + rand() * 14,
      opacity: 0.25 + rand() * 0.55,
    });
  }
  return out;
}

const dots = buildParticles(40, 42);
const glowOrbs = buildParticles(10, 99).map((p) => ({ ...p, size: 40 + p.size * 12 }));
const twinkles = buildParticles(18, 7);
const rising = Array.from({ length: 14 }, (_, i) => ({
  left: `${8 + (i * 6.5) % 84}%`,
  delay: i * 0.7,
  duration: 12 + (i % 5) * 3,
  size: 2 + (i % 3),
}));

/** Floating particle overlay — dots, glow orbs, twinkles, rising embers */
export function ParticleOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden>
      {/* Soft glow orbs */}
      {glowOrbs.map((p, i) => (
        <span
          key={`glow-${i}`}
          className="hero-particle-glow absolute rounded-full motion-safe:animate-particle-drift"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.12 + (i % 3) * 0.06,
          }}
        />
      ))}

      {/* Small floating dots */}
      {dots.map((p, i) => (
        <span
          key={`dot-${i}`}
          className="hero-particle-dot absolute rounded-full motion-safe:animate-particle-float"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Twinkling stars */}
      {twinkles.map((p, i) => (
        <span
          key={`twinkle-${i}`}
          className="hero-particle-twinkle absolute motion-safe:animate-particle-twinkle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size + 1,
            height: p.size + 1,
            animationDelay: `${p.delay}s`,
            animationDuration: `${3 + (i % 4)}s`,
          }}
        />
      ))}

      {/* Rising particles from bottom */}
      {rising.map((p, i) => (
        <span
          key={`rise-${i}`}
          className="hero-particle-rise absolute bottom-0 rounded-full motion-safe:animate-particle-rise"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
