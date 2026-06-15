/** Instrument-style overlays drawn on top of the lensing viewport. */
import type { LensScene, RenderMode } from '@cosmiclens/physics-core';
import { worldToCanvas } from './lensingCanvas';

const CYAN = 'rgba(71, 215, 255, 0.55)';
const FAINT = 'rgba(71, 215, 255, 0.22)';
const MONO = '700 12px "JetBrains Mono", ui-monospace, monospace';

export function drawCornerBrackets(ctx: CanvasRenderingContext2D, width: number, height: number, scale: number): void {
  ctx.save();
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 1.2 * scale;
  const m = 16 * scale;
  const len = 30 * scale;
  const corners: [number, number, number, number][] = [
    [m, m, 1, 1],
    [width - m, m, -1, 1],
    [m, height - m, 1, -1],
    [width - m, height - m, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + sx * len, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * len);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawScanlines(ctx: CanvasRenderingContext2D, width: number, height: number, phase: number): void {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#7fd8ff';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  // a single brighter sweep line
  const sweepY = ((phase * 1.3) % 1) * height;
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.moveTo(0, sweepY);
  ctx.lineTo(width, sweepY);
  ctx.stroke();
  ctx.restore();
}

/** Angular scale bar (arcsec) bottom-left, derived from the real viewport. */
export function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  halfWidth: number,
  scale: number,
): void {
  const usable = Math.min(width, height) * 0.9;
  const pxPerArcsec = usable / (2 * halfWidth);
  const barArcsec = 1;
  const barPx = barArcsec * pxPerArcsec;
  const x0 = 28 * scale;
  const y0 = height - 30 * scale;
  ctx.save();
  ctx.strokeStyle = 'rgba(226, 242, 255, 0.85)';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + barPx, y0);
  ctx.moveTo(x0, y0 - 4 * scale);
  ctx.lineTo(x0, y0 + 4 * scale);
  ctx.moveTo(x0 + barPx, y0 - 4 * scale);
  ctx.lineTo(x0 + barPx, y0 + 4 * scale);
  ctx.stroke();
  ctx.fillStyle = 'rgba(226, 242, 255, 0.85)';
  ctx.font = `${11 * scale}px "JetBrains Mono", monospace`;
  ctx.fillText('1.0″', x0, y0 - 8 * scale);
  ctx.restore();
}

export function drawViewportHud(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: LensScene,
  mode: RenderMode,
  phase: number,
  scale: number,
): void {
  ctx.save();
  ctx.font = MONO;
  ctx.textBaseline = 'top';
  const x = 28 * scale;
  let y = 26 * scale;
  const lh = 18 * scale;
  ctx.fillStyle = 'rgba(226, 242, 255, 0.9)';
  ctx.fillText(`SCENE · ${scene.name.toUpperCase()}`, x, y);
  y += lh;
  ctx.fillStyle = CYAN;
  ctx.fillText(`MODE ${mode.toUpperCase()} · φ ${(phase * 360).toFixed(0).padStart(3, '0')}°`, x, y);
  y += lh;
  ctx.fillStyle = 'rgba(255, 181, 71, 0.85)';
  ctx.fillText(
    `zL ${scene.planes[0].z.toFixed(2)}  zS ${scene.source.z.toFixed(2)}  H0 ${scene.cosmology.H0.toFixed(0)}`,
    x,
    y,
  );

  // top-right reticle text
  ctx.fillStyle = FAINT;
  ctx.textAlign = 'right';
  ctx.fillText('THIN-LENS · BROWSER SIM', width - 28 * scale, 26 * scale);
  ctx.restore();
}

/** Soft crosshair on the source-plane marker location. */
export function drawSourceMarker(
  ctx: CanvasRenderingContext2D,
  center: readonly [number, number],
  width: number,
  height: number,
  halfWidth: number,
  scale: number,
): void {
  const [sx, sy] = worldToCanvas(center, width, height, halfWidth);
  ctx.save();
  ctx.strokeStyle = '#47d7ff';
  ctx.lineWidth = 2 * scale;
  ctx.shadowColor = 'rgba(71, 215, 255, 0.9)';
  ctx.shadowBlur = 16 * scale;
  ctx.beginPath();
  ctx.arc(sx, sy, 9 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx - 16 * scale, sy);
  ctx.lineTo(sx - 11 * scale, sy);
  ctx.moveTo(sx + 11 * scale, sy);
  ctx.lineTo(sx + 16 * scale, sy);
  ctx.moveTo(sx, sy - 16 * scale);
  ctx.lineTo(sx, sy - 11 * scale);
  ctx.moveTo(sx, sy + 11 * scale);
  ctx.lineTo(sx, sy + 16 * scale);
  ctx.stroke();
  ctx.restore();
}
