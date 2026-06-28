/**
 * Canvas compositor for the central lensing viewport and diagnostic insets.
 *
 * The scientific image data (surface brightness, magnification, parity, Fermat,
 * residual) all come from `renderLensFrame` in the physics core. This module is
 * responsible only for presentation: deep-space backdrop, the rendered lensing
 * field, critical-curve / caustic overlays, and UI furniture.
 */
import type { LensScene, RenderFrame, RenderMode, RenderStats, Vec2 } from '@cosmiclens/physics-core';
import { lensEquation, renderLensFrame } from '@cosmiclens/physics-core';
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

/**
 * Draw the actual thin-lens mapping from image-plane samples theta to their
 * source-plane coordinates beta(theta). Length is capped only to keep arrows
 * inside the viewport; direction and sampling use the same physics core as the
 * lens image, rather than a procedural distortion animation.
 */
function drawRayShootingVectors(
  ctx: CanvasRenderingContext2D,
  scene: LensScene,
  width: number,
  height: number,
  halfWidth: number,
  dpr: number,
): void {
  const cells = 8;
  const maximumPx = Math.min(width, height) * 0.14;
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = 'rgba(148, 245, 225, 0.82)';
  ctx.fillStyle = 'rgba(148, 245, 225, 0.82)';
  ctx.lineWidth = 0.9 * dpr;

  for (let j = 1; j < cells; j++) {
    for (let i = 1; i < cells; i++) {
      const theta: Vec2 = [
        -halfWidth + (2 * halfWidth * i) / cells,
        -halfWidth + (2 * halfWidth * j) / cells,
      ];
      const beta = lensEquation(theta, scene.planes);
      const [x0, y0] = worldToCanvas(theta, width, height, halfWidth);
      const [xBeta, yBeta] = worldToCanvas(beta, width, height, halfWidth);
      const dx = xBeta - x0;
      const dy = yBeta - y0;
      const length = Math.hypot(dx, dy);
      if (!Number.isFinite(length) || length < 1.5) continue;
      const scale = Math.min(1, maximumPx / length);
      const x1 = x0 + dx * scale;
      const y1 = y0 + dy * scale;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      const angle = Math.atan2(y1 - y0, x1 - x0);
      const head = 3.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - head * Math.cos(angle - Math.PI / 6), y1 - head * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x1 - head * Math.cos(angle + Math.PI / 6), y1 - head * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.globalAlpha = 0.9;
  ctx.font = `${10 * dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillText('ray shooting: θ → β(θ)', 18 * dpr, height - 22 * dpr);
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
  blitFrame(ctx, frame, width, height, 0.86);
  drawLensGlow(ctx, width, height, opts.phase, opts.drift);

  if (opts.showOverlays) {
    drawOverlayPoints(ctx, frame.criticalCurve, width, height, halfWidth, 'rgba(255, 181, 71, 0.95)', 1.2 * dpr, 'rgba(255, 181, 71, 0.9)');
    drawOverlayPoints(ctx, frame.caustic, width, height, halfWidth, 'rgba(71, 215, 255, 0.95)', 1.4 * dpr, 'rgba(71, 215, 255, 0.95)');
  }

  drawSourceMarker(ctx, scene.source.profile.center, width, height, halfWidth, dpr);
  if (opts.showVectors) drawRayShootingVectors(ctx, scene, width, height, halfWidth, dpr);

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
