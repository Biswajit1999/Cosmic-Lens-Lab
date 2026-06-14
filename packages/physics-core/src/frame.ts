import type { AnimationMode, LensScene, Vec2 } from './types';
import { criticalCurveCells, fermatPotential, lensEquation, mapCaustics, sampleLens } from './lens';
import { makeTimeline } from './animation';

export type RenderMode = 'lensed' | 'magnification' | 'time-delay' | 'parity' | 'source-plane' | 'residual';

export interface RenderOptions {
  pixels?: number;
  mode?: RenderMode;
  exposure?: number;
  gamma?: number;
  overlayResolution?: number;
}

export interface RenderStats {
  maxIntensity: number;
  meanIntensity: number;
  maxAbsMu: number;
  negativeParityFraction: number;
  nearCriticalFraction: number;
  minDelay: number;
  maxDelay: number;
}

export interface RenderFrame {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  criticalCurve: Vec2[];
  caustic: Vec2[];
  stats: RenderStats;
}

export interface FrameGrid {
  mode: AnimationMode;
  frames: RenderFrame[];
  columns: number;
  rows: number;
  pixels: number;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function turboish(x: number): [number, number, number] {
  const t = clamp01(x);
  const r = clamp01(0.14 + 2.4 * t - 1.6 * t * t);
  const g = clamp01(0.08 + 1.8 * Math.sin(Math.PI * t));
  const b = clamp01(0.25 + 1.4 * (1 - t) - 0.55 * Math.sin(Math.PI * t));
  return [Math.round(255 * r), Math.round(255 * g), Math.round(255 * b)];
}

function diverging(x: number): [number, number, number] {
  const t = clamp01(0.5 + 0.5 * x);
  if (t < 0.5) {
    const u = t / 0.5;
    return [Math.round(20 + 60 * u), Math.round(80 + 120 * u), Math.round(190 + 40 * u)];
  }
  const u = (t - 0.5) / 0.5;
  return [Math.round(210 + 35 * u), Math.round(210 - 120 * u), Math.round(190 - 150 * u)];
}

export function renderLensFrame(scene: LensScene, options: RenderOptions = {}): RenderFrame {
  const width = Math.max(24, Math.floor(options.pixels ?? Math.min(360, scene.viewport.pixels)));
  const height = width;
  const mode = options.mode ?? 'lensed';
  const halfWidth = scene.viewport.halfWidthArcsec;
  const gamma = Math.max(0.05, options.gamma ?? 0.52);
  const exposure = Math.max(0.1, options.exposure ?? 1);
  const data = new Uint8ClampedArray(width * height * 4);
  const cache: Array<{ intensity: number; detA: number; mu: number; delay: number; beta: Vec2 }> = [];
  let maxIntensity = 1e-12;
  let sumIntensity = 0;
  let maxAbsMu = 1e-12;
  let negativeParity = 0;
  let nearCritical = 0;
  let minDelay = Number.POSITIVE_INFINITY;
  let maxDelay = Number.NEGATIVE_INFINITY;

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = -halfWidth + (2 * halfWidth * i) / (width - 1);
      const y = halfWidth - (2 * halfWidth * j) / (height - 1);
      const theta: Vec2 = [x, y];
      const s = sampleLens(theta, scene.planes, scene.source.profile);
      const beta = lensEquation(theta, scene.planes);
      const delay = fermatPotential(theta, scene.source.profile.center, scene.planes);
      maxIntensity = Math.max(maxIntensity, s.intensity);
      sumIntensity += s.intensity;
      maxAbsMu = Math.max(maxAbsMu, Math.min(1000, Math.abs(s.mu)));
      if (s.detA < 0) negativeParity++;
      if (Math.abs(s.detA) < 0.08) nearCritical++;
      minDelay = Math.min(minDelay, delay);
      maxDelay = Math.max(maxDelay, delay);
      cache.push({ intensity: s.intensity, detA: s.detA, mu: s.mu, delay, beta });
    }
  }

  const delaySpan = Math.max(1e-9, maxDelay - minDelay);
  for (let idx = 0; idx < cache.length; idx++) {
    const s = cache[idx];
    let r = 0, g = 0, b = 0;
    if (mode === 'lensed') {
      const v = Math.pow(clamp01((s.intensity * exposure) / maxIntensity), gamma);
      const detGlow = Math.min(1, Math.exp(-Math.abs(s.detA) * 4.3));
      r = Math.round(5 + 42 * v + 180 * detGlow);
      g = Math.round(12 + 158 * v + 84 * detGlow);
      b = Math.round(30 + 250 * v);
    } else if (mode === 'magnification') {
      [r, g, b] = turboish(Math.log1p(Math.min(160, Math.abs(s.mu))) / Math.log1p(Math.max(8, maxAbsMu)));
    } else if (mode === 'time-delay') {
      [r, g, b] = turboish((s.delay - minDelay) / delaySpan);
    } else if (mode === 'parity') {
      [r, g, b] = s.detA >= 0 ? [64, 220, 180] : [248, 82, 82];
    } else if (mode === 'source-plane') {
      const bx = clamp01((s.beta[0] + halfWidth) / (2 * halfWidth));
      const by = clamp01((s.beta[1] + halfWidth) / (2 * halfWidth));
      r = Math.round(40 + 180 * bx);
      g = Math.round(30 + 180 * by);
      b = Math.round(120 + 90 * (1 - bx));
    } else if (mode === 'residual') {
      const v = Math.tanh(8 * s.intensity / maxIntensity - 0.6 * Math.abs(s.detA));
      [r, g, b] = diverging(v);
    }
    data[idx * 4 + 0] = r;
    data[idx * 4 + 1] = g;
    data[idx * 4 + 2] = b;
    data[idx * 4 + 3] = 255;
  }

  const total = width * height;
  const criticalCurve = criticalCurveCells(scene.planes, halfWidth, options.overlayResolution ?? 96);
  const caustic = mapCaustics(criticalCurve, scene.planes);

  return {
    width,
    height,
    data,
    criticalCurve,
    caustic,
    stats: {
      maxIntensity,
      meanIntensity: sumIntensity / total,
      maxAbsMu,
      negativeParityFraction: negativeParity / total,
      nearCriticalFraction: nearCritical / total,
      minDelay,
      maxDelay,
    },
  };
}

export function renderAnimationFrameGrid(scene: LensScene, mode: AnimationMode, options: RenderOptions & { frames?: number; columns?: number; amplitude?: number } = {}): FrameGrid {
  const frames = Math.max(2, Math.floor(options.frames ?? 12));
  const columns = Math.max(2, Math.floor(options.columns ?? Math.ceil(Math.sqrt(frames))));
  const rows = Math.ceil(frames / columns);
  const timeline = makeTimeline(scene, { mode, frames, amplitude: options.amplitude ?? scene.animation?.amplitude ?? 1 });
  return {
    mode,
    frames: timeline.map((frameScene) => renderLensFrame(frameScene, options)),
    columns,
    rows,
    pixels: Math.max(24, Math.floor(options.pixels ?? 180)),
  };
}
