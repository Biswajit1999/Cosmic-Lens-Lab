/**
 * Deterministic, GPU-free starfield + deep-space gradient. A fixed PRNG seeds
 * star positions so the field is stable frame-to-frame; `drift` (set to 0 for
 * reduced motion) gives a slow parallax sweep.
 */

function hash(i: number): number {
  const s = Math.sin(i * 91.137) * 43758.5453;
  return s - Math.floor(s);
}

export function drawDeepSpace(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  ctx.fillStyle = '#02040a';
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.46,
    0,
    width * 0.5,
    height * 0.46,
    Math.max(width, height) * 0.78,
  );
  glow.addColorStop(0, 'rgba(28, 38, 60, 0.72)');
  glow.addColorStop(0.42, 'rgba(6, 10, 22, 0.86)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 1)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: number,
  drift: number,
  count = 220,
): void {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const baseX = hash(i) * width;
    const layer = (i % 3) - 1;
    const x = (baseX + phase * 24 * layer * drift + width) % width;
    const y = hash(i + 7.13) * height;
    const radius = 0.4 + ((i * 13) % 7) * 0.18;
    const twinkle = drift === 0 ? 0 : 0.12 * Math.sin(phase * Math.PI * 2 + i);
    const alpha = Math.min(1, 0.18 + ((i * 29) % 11) / 18 + twinkle);
    ctx.fillStyle = `rgba(220, 240, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Faint coloured cosmic dust to break up the black field. */
export function drawCosmicDust(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const clouds: [number, number, number, string][] = [
    [0.74, 0.22, 0.42, 'rgba(139, 92, 246, 0.10)'],
    [0.2, 0.66, 0.5, 'rgba(71, 215, 255, 0.07)'],
    [0.52, 0.84, 0.4, 'rgba(255, 181, 71, 0.05)'],
  ];
  ctx.save();
  for (const [fx, fy, fr, color] of clouds) {
    const g = ctx.createRadialGradient(
      width * fx,
      height * fy,
      0,
      width * fx,
      height * fy,
      Math.max(width, height) * fr,
    );
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}
