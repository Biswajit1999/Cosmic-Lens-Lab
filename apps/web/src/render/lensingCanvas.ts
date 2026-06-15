/**
 * Canvas compositor for the central lensing viewport and diagnostic insets.
 *
 * The scientific image data (surface brightness, magnification, parity, Fermat,
 * residual) all come from `renderLensFrame` in the physics core. This module is
 * responsible only for presentation: deep-space backdrop, distortion mesh,
 * foreground lens glow, critical-curve / caustic overlays and HUD furniture.
 */
import type { LensScene, RenderFrame, RenderMode, RenderStats, Vec2 } from '@cosmiclens/physics-core';
import { renderLensFrame } from '@cosmiclens/physics-core';
import { drawCosmicDust, drawDeepSpace, drawStarfield } from './starfield';
import { drawCornerBrackets, drawScaleBar, drawScanlines, drawSourceMarker, drawViewportHud } from './hudOverlays';

export function worldToCanvas(
  theta: readonly [number, number],
  width: number,
  height: number,
  halfWidth: number,
): [number, number] {
  const usable = Math.min(width, height) * 0.9;
  const offsetX = (width - usable) / 2;
  const offsetY = (height - usable) / 2;
  return [
    offsetX + ((theta[0] + halfWidth) / (2 * halfWidth)) * usable,
    offsetY + ((halfWidth - theta[1]) / (2 * halfWidth)) * usable,
  ];
}

function blitFrame(ctx: CanvasRenderingContext2D, frame: RenderFrame, width: number, height: number, alpha: number): void {
  const raw = document.createElement('canvas');
  raw.width = frame.width;
  raw.height = frame.height;
  const rawCtx = raw.getContext('2d');
  if (!rawCtx) return;
  const image = rawCtx.createImageData(frame.width, frame.height);
  image.data.set(frame.data);
  rawCtx.putImageData(image, 0, 0);

  const size = Math.min(width, height) * 0.9;
  const x = (width - size) / 2;
  const y = (height - size) / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(raw, x, y, size, size);
  ctx.restore();
}

function drawDistortionGrid(ctx: CanvasRenderingContext2D, width: number, height: number, phase: number, drift: number): void {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  const gap = Math.max(42, Math.min(width, height) / 13);
  const cx = width * 0.5;
  const cy = height * 0.48;
  const wob = drift === 0 ? 0 : 1;

  ctx.strokeStyle = 'rgba(85, 205, 255, 0.12)';
  for (let gx = -gap; gx < width + gap; gx += gap) {
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.025) {
      const y = t * height;
      const pull = (38 * Math.sin(t * Math.PI)) / (1 + Math.abs(gx - cx) / 120);
      const x = gx + pull * Math.sin(phase * Math.PI * 2 * wob + y * 0.007);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 181, 71, 0.1)';
  for (let gy = -gap; gy < height + gap; gy += gap) {
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.025) {
      const x = t * width;
      const pull = (38 * Math.sin(t * Math.PI)) / (1 + Math.abs(gy - cy) / 120);
      const y = gy + pull * Math.cos(phase * Math.PI * 2 * wob + x * 0.007);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawLensGlow(ctx: CanvasRenderingContext2D, width: number, height: number, phase: number, drift: number): void {
  ctx.save();
  const cx = width * 0.5;
  const cy = height * 0.485;
  const pulse = 1 + (drift === 0 ? 0 : 0.04 * Math.sin(phase * Math.PI * 2));
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.34 * pulse);
  halo.addColorStop(0, 'rgba(255, 245, 220, 0.92)');
  halo.addColorStop(0.08, 'rgba(255, 199, 111, 0.5)');
  halo.addColorStop(0.24, 'rgba(139, 92, 246, 0.15)');
  halo.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawOverlayPoints(
  ctx: CanvasRenderingContext2D,
  points: Vec2[],
  width: number,
  height: number,
  halfWidth: number,
  color: string,
  radius: number,
  glow: string,
): void {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  for (const p of points) {
    const [x, y] = worldToCanvas(p, width, height, halfWidth);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export interface ViewportOptions {
  renderMode: RenderMode;
  pixels: number;
  phase: number;
  drift: number;
  showVectors: boolean;
  showOverlays: boolean;
}

/** Renders the full cinematic viewport into `canvas`; returns physics stats. */
export function renderViewport(canvas: HTMLCanvasElement, scene: LensScene, opts: ViewportOptions): RenderStats | null {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(720, Math.floor(rect.width * dpr));
  const height = Math.max(520, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const frame = renderLensFrame(scene, {
    pixels: opts.pixels,
    mode: opts.renderMode,
    overlayResolution: 150,
    gamma: 0.48,
    exposure: 1.1,
  });
  const halfWidth = scene.viewport.halfWidthArcsec;

  drawDeepSpace(ctx, width, height);
  drawStarfield(ctx, width, height, opts.phase, opts.drift);
  drawCosmicDust(ctx, width, height);
  drawDistortionGrid(ctx, width, height, opts.phase, opts.drift);
  blitFrame(ctx, frame, width, height, 0.86);
  drawLensGlow(ctx, width, height, opts.phase, opts.drift);

  if (opts.showOverlays) {
    drawOverlayPoints(ctx, frame.criticalCurve, width, height, halfWidth, 'rgba(255, 181, 71, 0.95)', 1.2 * dpr, 'rgba(255, 181, 71, 0.9)');
    drawOverlayPoints(ctx, frame.caustic, width, height, halfWidth, 'rgba(71, 215, 255, 0.95)', 1.4 * dpr, 'rgba(71, 215, 255, 0.95)');
  }

  drawSourceMarker(ctx, scene.source.profile.center, width, height, halfWidth, dpr);

  if (opts.showVectors) {
    ctx.save();
    ctx.globalAlpha = 0.46;
    ctx.strokeStyle = 'rgba(148, 245, 225, 0.7)';
    ctx.lineWidth = 1;
    const beta = scene.source.profile.center;
    for (let j = 1; j < 9; j++) {
      for (let i = 1; i < 9; i++) {
        const x = -halfWidth + (2 * halfWidth * i) / 9;
        const y = -halfWidth + (2 * halfWidth * j) / 9;
        const [cx, cy] = worldToCanvas([x, y], width, height, halfWidth);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (beta[0] - x) * 18, cy - (beta[1] - y) * 18);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawScanlines(ctx, width, height, opts.phase);
  drawCornerBrackets(ctx, width, height, dpr);
  drawScaleBar(ctx, width, height, halfWidth, dpr);
  drawViewportHud(ctx, width, height, scene, opts.renderMode, opts.phase, dpr);

  return frame.stats;
}

/** Compact inset renderer used by the diagnostics rail. */
export function renderInset(
  canvas: HTMLCanvasElement,
  scene: LensScene,
  mode: RenderMode,
  showOverlays = true,
): RenderStats | null {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const frame = renderLensFrame(scene, { pixels: 150, mode, overlayResolution: 66 });
  drawDeepSpace(ctx, width, height);
  drawStarfield(ctx, width, height, 0.2, 0, 70);
  blitFrame(ctx, frame, width, height, 0.92);
  if (showOverlays) {
    drawOverlayPoints(ctx, frame.criticalCurve, width, height, scene.viewport.halfWidthArcsec, 'rgba(255, 181, 71, 0.9)', 0.8, 'rgba(255, 181, 71, 0.8)');
    drawOverlayPoints(ctx, frame.caustic, width, height, scene.viewport.halfWidthArcsec, 'rgba(71, 215, 255, 0.9)', 0.9, 'rgba(71, 215, 255, 0.8)');
  }
  return frame.stats;
}
