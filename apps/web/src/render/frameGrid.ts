/** Renders a deterministic FrameGrid filmstrip into a canvas (timeline + export). */
import type { AnimationMode, LensScene, RenderMode } from '@cosmiclens/physics-core';
import { renderAnimationFrameGrid } from '@cosmiclens/physics-core';
import { drawDeepSpace } from './starfield';

function blit(ctx: CanvasRenderingContext2D, data: Uint8ClampedArray, fw: number, fh: number, x: number, y: number, w: number, h: number): void {
  const off = document.createElement('canvas');
  off.width = fw;
  off.height = fh;
  const offCtx = off.getContext('2d');
  if (!offCtx) return;
  const image = offCtx.createImageData(fw, fh);
  image.data.set(data);
  offCtx.putImageData(image, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, x, y, w, h);
}

export interface TimelineOptions {
  frames: number;
  activeIndex: number;
  pixels: number;
}

/** Horizontal filmstrip used in the bottom timeline. */
export function renderTimeline(
  canvas: HTMLCanvasElement,
  scene: LensScene,
  mode: AnimationMode,
  renderMode: RenderMode,
  opts: TimelineOptions,
): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(640, Math.floor(rect.width * dpr));
  const height = Math.max(96, Math.floor(rect.height * dpr));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const frames = opts.frames;
  const grid = renderAnimationFrameGrid(scene, mode, {
    frames,
    columns: frames,
    pixels: Math.min(120, opts.pixels),
    mode: renderMode,
    overlayResolution: 48,
  });

  drawDeepSpace(ctx, width, height);

  const pad = 10 * dpr;
  const gap = 6 * dpr;
  const top = 8 * dpr;
  const tileW = (width - pad * 2 - gap * (frames - 1)) / frames;
  const tileH = height - 28 * dpr;
  const active = Math.min(frames - 1, Math.max(0, opts.activeIndex));

  grid.frames.forEach((frame, index) => {
    const x = pad + index * (tileW + gap);
    blit(ctx, frame.data, frame.width, frame.height, x, top, tileW, tileH);
    const isActive = index === active;
    ctx.strokeStyle = isActive ? 'rgba(71, 215, 255, 0.95)' : 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = isActive ? 2 * dpr : 1 * dpr;
    ctx.strokeRect(x, top, tileW, tileH);
    ctx.fillStyle = isActive ? '#47d7ff' : 'rgba(148, 163, 184, 0.7)';
    ctx.font = `${9 * dpr}px "JetBrains Mono", monospace`;
    ctx.fillText(String(index + 1).padStart(2, '0'), x + 3 * dpr, top + tileH + 14 * dpr);
  });

  // scrubber
  const scrubX = pad + active * (tileW + gap) + tileW / 2;
  ctx.strokeStyle = 'rgba(71, 215, 255, 0.6)';
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.moveTo(scrubX, 2 * dpr);
  ctx.lineTo(scrubX, height - 2 * dpr);
  ctx.stroke();
}

export interface GridOptions {
  frames: number;
  columns: number;
  pixels: number;
}

/** Large export grid (README banners, slides) — returns nothing, draws in place. */
export function renderExportGrid(
  canvas: HTMLCanvasElement,
  scene: LensScene,
  mode: AnimationMode,
  renderMode: RenderMode,
  opts: GridOptions,
): void {
  const grid = renderAnimationFrameGrid(scene, mode, {
    frames: opts.frames,
    columns: opts.columns,
    pixels: Math.min(170, opts.pixels),
    mode: renderMode,
    overlayResolution: 64,
  });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const tile = 170 * dpr;
  const gutter = 12 * dpr;
  const header = 56 * dpr;
  const width = grid.columns * tile + (grid.columns + 1) * gutter;
  const height = grid.rows * tile + (grid.rows + 1) * gutter + header;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  drawDeepSpace(ctx, width, height);
  ctx.fillStyle = 'rgba(4, 7, 13, 0.7)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#e8f2ff';
  ctx.font = `${15 * dpr}px "JetBrains Mono", monospace`;
  ctx.fillText(`COSMICLENS FRAMEGRID · ${mode.toUpperCase()} · ${renderMode.toUpperCase()}`, gutter, 32 * dpr);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
  ctx.font = `${10 * dpr}px "JetBrains Mono", monospace`;
  ctx.fillText(`${opts.frames} deterministic states · browser thin-lens runtime`, gutter, 48 * dpr);

  grid.frames.forEach((frame, index) => {
    const x = gutter + (index % grid.columns) * (tile + gutter);
    const y = header + gutter + Math.floor(index / grid.columns) * (tile + gutter);
    blit(ctx, frame.data, frame.width, frame.height, x, y, tile, tile);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1 * dpr;
    ctx.strokeRect(x, y, tile, tile);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.74)';
    ctx.fillRect(x + 8 * dpr, y + 8 * dpr, 60 * dpr, 22 * dpr);
    ctx.fillStyle = '#ffb547';
    ctx.font = `${10 * dpr}px "JetBrains Mono", monospace`;
    ctx.fillText(`#${String(index + 1).padStart(2, '0')}`, x + 15 * dpr, y + 23 * dpr);
  });
}
