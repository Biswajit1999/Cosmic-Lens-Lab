import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { AnimationMode, LensComponent, LensScene, RenderMode, Vec2 } from '@cosmiclens/physics-core';
import {
  describeAnimationMode,
  evolveScene,
  renderAnimationFrameGrid,
  renderLensFrame,
} from '@cosmiclens/physics-core';
import { makeDefaultScene, makeScenePresets, parseScene, serialiseScene } from '@cosmiclens/schema';
import './styles.css';

const animationModes: AnimationMode[] = [
  'source-orbit',
  'caustic-breathing',
  'shear-rotation',
  'subhalo-flyby',
  'einstein-radius-pulse',
  'time-delay-sweep',
];

const renderModes: RenderMode[] = ['lensed', 'magnification', 'time-delay', 'parity', 'source-plane', 'residual'];

type CanvasHandle = HTMLCanvasElement | null;

type Capability = {
  label: string;
  value: string;
  tone: 'cyan' | 'amber' | 'violet' | 'rose' | 'green';
};

type SceneReadout = {
  label: string;
  value: string;
  detail: string;
};

const capabilities: Capability[] = [
  { label: 'Lens equation', value: 'β = θ − α(θ)', tone: 'cyan' },
  { label: 'Critical topology', value: 'det A ≈ 0', tone: 'amber' },
  { label: 'FrameGrid states', value: 'deterministic', tone: 'violet' },
  { label: 'Python parity', value: 'validation-ready', tone: 'green' },
  { label: 'Substructure', value: 'flyby mode', tone: 'rose' },
  { label: 'Time delay', value: 'Fermat φ', tone: 'cyan' },
];

function cloneScene(scene: LensScene): LensScene {
  return JSON.parse(JSON.stringify(scene)) as LensScene;
}

function primaryMassComponent(scene: LensScene): LensComponent | undefined {
  return scene.planes[0]?.components.find((component) => component.type !== 'ExternalShear');
}

function shearComponent(scene: LensScene): LensComponent | undefined {
  return scene.planes[0]?.components.find((component) => component.type === 'ExternalShear');
}

function setComponentParam(scene: LensScene, key: string, value: number): LensScene {
  const next = cloneScene(scene);
  const comp = primaryMassComponent(next);
  if (!comp) return next;

  if (key === 'thetaE' && 'thetaE' in comp) comp.thetaE = value;
  if (key === 'q' && comp.type === 'SoftenedIsothermalEllipse') comp.q = value;
  if (key === 'phiDeg' && comp.type === 'SoftenedIsothermalEllipse') comp.phiDeg = value;
  if (key === 'sourceX') next.source.profile.center = [value, next.source.profile.center[1]];
  if (key === 'sourceY') next.source.profile.center = [next.source.profile.center[0], value];
  if (key === 'sourceR') next.source.profile.radius = value;
  if (key === 'halfWidth') next.viewport.halfWidthArcsec = value;

  const shear = shearComponent(next);
  if (key === 'shear' && shear?.type === 'ExternalShear') shear.gamma = value;
  if (key === 'shearPA' && shear?.type === 'ExternalShear') shear.phiDeg = value;

  return next;
}

function worldToCanvas(theta: Vec2, canvasWidth: number, canvasHeight: number, halfWidth: number): [number, number] {
  const usable = Math.min(canvasWidth, canvasHeight) * 0.9;
  const offsetX = (canvasWidth - usable) / 2;
  const offsetY = (canvasHeight - usable) / 2;
  return [
    offsetX + ((theta[0] + halfWidth) / (2 * halfWidth)) * usable,
    offsetY + ((halfWidth - theta[1]) / (2 * halfWidth)) * usable,
  ];
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  URL.revokeObjectURL(url);
}

function sceneSlug(scene: LensScene): string {
  return scene.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toneClass(tone: Capability['tone']): string {
  return `tone-${tone}`;
}

function getThetaE(component: LensComponent | undefined): number | null {
  if (!component || !('thetaE' in component)) return null;
  return component.thetaE;
}

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number, phase: number) {
  ctx.save();
  ctx.fillStyle = '#02040a';
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(width * 0.48, height * 0.44, 0, width * 0.48, height * 0.44, Math.max(width, height) * 0.75);
  gradient.addColorStop(0, 'rgba(32, 42, 64, 0.7)');
  gradient.addColorStop(0.44, 'rgba(5, 9, 19, 0.86)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 190; i++) {
    const seed = Math.sin(i * 91.13) * 43758.5453;
    const x = ((seed - Math.floor(seed)) * width + phase * 20 * ((i % 3) - 1)) % width;
    const ySeed = Math.sin(i * 17.71) * 9821.91;
    const y = (ySeed - Math.floor(ySeed)) * height;
    const radius = 0.45 + ((i * 13) % 7) * 0.18;
    const alpha = 0.2 + ((i * 29) % 11) / 18;
    ctx.fillStyle = `rgba(220, 240, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x < 0 ? x + width : x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawDistortionGrid(ctx: CanvasRenderingContext2D, width: number, height: number, phase: number) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = 'rgba(85, 205, 255, 0.13)';
  const gap = Math.max(42, Math.min(width, height) / 13);
  const cx = width * 0.5;
  const cy = height * 0.48;

  for (let gx = -gap; gx < width + gap; gx += gap) {
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.025) {
      const y = t * height;
      const pull = 38 * Math.sin(t * Math.PI) / (1 + Math.abs(gx - cx) / 120);
      const x = gx + pull * Math.sin(phase * Math.PI * 2 + y * 0.007);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255, 181, 71, 0.12)';
  for (let gy = -gap; gy < height + gap; gy += gap) {
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.025) {
      const x = t * width;
      const pull = 38 * Math.sin(t * Math.PI) / (1 + Math.abs(gy - cy) / 120);
      const y = gy + pull * Math.cos(phase * Math.PI * 2 + x * 0.007);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawCentralLensGlow(ctx: CanvasRenderingContext2D, width: number, height: number, phase: number) {
  ctx.save();
  const cx = width * 0.5;
  const cy = height * 0.485;
  const pulse = 1 + 0.04 * Math.sin(phase * Math.PI * 2);
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.34 * pulse);
  halo.addColorStop(0, 'rgba(255, 245, 220, 0.95)');
  halo.addColorStop(0.08, 'rgba(255, 199, 111, 0.52)');
  halo.addColorStop(0.24, 'rgba(139, 92, 246, 0.16)');
  halo.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  ctx.translate(cx, cy);
  ctx.rotate(0.08 + phase * 0.025);
  const disk = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(width, height) * 0.19);
  disk.addColorStop(0, 'rgba(255, 241, 217, 0.92)');
  disk.addColorStop(0.32, 'rgba(224, 174, 110, 0.38)');
  disk.addColorStop(1, 'rgba(255, 181, 71, 0)');
  ctx.scale(1.36, 0.72);
  ctx.fillStyle = disk;
  ctx.beginPath();
  ctx.arc(0, 0, Math.min(width, height) * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFrameTexture(ctx: CanvasRenderingContext2D, frame: ReturnType<typeof renderLensFrame>, width: number, height: number) {
  const raw = document.createElement('canvas');
  raw.width = frame.width;
  raw.height = frame.height;
  const rawCtx = raw.getContext('2d');
  if (!rawCtx) return;
  const rawImage = rawCtx.createImageData(frame.width, frame.height);
  rawImage.data.set(frame.data);
  rawCtx.putImageData(rawImage, 0, 0);

  const size = Math.min(width, height) * 0.9;
  const x = (width - size) / 2;
  const y = (height - size) / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.86;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(raw, x, y, size, size);
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
) {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  for (const p of points) {
    const [x, y] = worldToCanvas(p, width, height, halfWidth);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLensRings(ctx: CanvasRenderingContext2D, width: number, height: number, phase: number) {
  ctx.save();
  const cx = width * 0.5;
  const cy = height * 0.485;
  const base = Math.min(width, height);
  for (let i = 0; i < 5; i++) {
    const r = base * (0.18 + i * 0.065 + 0.008 * Math.sin(phase * Math.PI * 2 + i));
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 181, 71, 0.22)' : 'rgba(71, 215, 255, 0.16)';
    ctx.lineWidth = i === 1 ? 1.5 : 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * (1.16 + i * 0.035), r * (0.72 + i * 0.015), 0.1 + i * 0.04, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawViewportHud(ctx: CanvasRenderingContext2D, width: number, height: number, scene: LensScene, mode: RenderMode, phase: number) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = 'rgba(71, 215, 255, 0.28)';
  ctx.lineWidth = 1;
  const margin = 18;
  const corner = 36;
  ctx.beginPath();
  ctx.moveTo(margin, margin + corner);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + corner, margin);
  ctx.moveTo(width - margin - corner, margin);
  ctx.lineTo(width - margin, margin);
  ctx.lineTo(width - margin, margin + corner);
  ctx.moveTo(margin, height - margin - corner);
  ctx.lineTo(margin, height - margin);
  ctx.lineTo(margin + corner, height - margin);
  ctx.moveTo(width - margin - corner, height - margin);
  ctx.lineTo(width - margin, height - margin);
  ctx.lineTo(width - margin, height - margin - corner);
  ctx.stroke();

  ctx.font = '700 12px JetBrains Mono, ui-monospace, monospace';
  ctx.fillStyle = 'rgba(226, 242, 255, 0.88)';
  ctx.fillText(`SCENE ${scene.name.toUpperCase()}`, margin + 12, margin + 34);
  ctx.fillText(`MODE ${mode.toUpperCase()} · PHASE ${(phase * 360).toFixed(1)}°`, margin + 12, margin + 54);
  ctx.fillStyle = 'rgba(255, 181, 71, 0.88)';
  ctx.fillText(`ZL ${scene.planes[0].z.toFixed(3)} · ZS ${scene.source.z.toFixed(3)} · H0 ${scene.cosmology.H0.toFixed(1)}`, margin + 12, margin + 74);
  ctx.restore();
}

function drawMainViewport(
  canvas: HTMLCanvasElement,
  scene: LensScene,
  renderMode: RenderMode,
  pixels: number,
  phase: number,
  showVectors: boolean,
) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(960, Math.floor(rect.width * dpr));
  const height = Math.max(620, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const frame = renderLensFrame(scene, { pixels, mode: renderMode, overlayResolution: 152, gamma: 0.48, exposure: 1.1 });
  const halfWidth = scene.viewport.halfWidthArcsec;

  drawStars(ctx, width, height, phase);
  drawDistortionGrid(ctx, width, height, phase);
  drawFrameTexture(ctx, frame, width, height);
  drawCentralLensGlow(ctx, width, height, phase);
  drawLensRings(ctx, width, height, phase);

  drawOverlayPoints(ctx, frame.criticalCurve, width, height, halfWidth, 'rgba(255, 181, 71, 0.95)', 1.25, 'rgba(255, 181, 71, 0.9)');
  drawOverlayPoints(ctx, frame.caustic, width, height, halfWidth, 'rgba(71, 215, 255, 0.95)', 1.5, 'rgba(71, 215, 255, 0.95)');

  const [sx, sy] = worldToCanvas(scene.source.profile.center, width, height, halfWidth);
  ctx.save();
  ctx.strokeStyle = '#47d7ff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(71, 215, 255, 1)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(sx, sy, 10 * Math.min(window.devicePixelRatio || 1, 2), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (showVectors) {
    ctx.save();
    ctx.globalAlpha = 0.48;
    ctx.strokeStyle = 'rgba(148, 245, 225, 0.72)';
    ctx.lineWidth = 1;
    for (let j = 1; j < 9; j++) {
      for (let i = 1; i < 9; i++) {
        const x = -halfWidth + (2 * halfWidth * i) / 9;
        const y = -halfWidth + (2 * halfWidth * j) / 9;
        const beta = scene.source.profile.center;
        const dx = beta[0] - x;
        const dy = beta[1] - y;
        const [cx, cy] = worldToCanvas([x, y], width, height, halfWidth);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx * 18, cy - dy * 18);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawViewportHud(ctx, width, height, scene, renderMode, phase);
  return frame.stats;
}

function MiniFrame({ title, scene, mode, caption }: { title: string; scene: LensScene; mode: RenderMode; caption: string }) {
  const ref = useRef<CanvasHandle>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const width = 360;
    const height = 214;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const frame = renderLensFrame(scene, { pixels: 170, mode, overlayResolution: 70 });
    drawStars(ctx, width, height, 0.2);
    drawFrameTexture(ctx, frame, width, height);
    drawOverlayPoints(ctx, frame.criticalCurve, width, height, scene.viewport.halfWidthArcsec, 'rgba(255, 181, 71, 0.9)', 0.8, 'rgba(255, 181, 71, 0.8)');
    drawOverlayPoints(ctx, frame.caustic, width, height, scene.viewport.halfWidthArcsec, 'rgba(71, 215, 255, 0.9)', 0.9, 'rgba(71, 215, 255, 0.8)');
  }, [scene, mode]);

  return (
    <article className="mini-frame glass-panel">
      <div className="mini-frame__header">
        <span>{title}</span>
        <em>{mode}</em>
      </div>
      <canvas ref={ref} aria-label={`${title} preview`} />
      <p>{caption}</p>
    </article>
  );
}

function LabViewport({
  scene,
  mode,
  renderMode,
  playing,
  speed,
  pixels,
  showVectors,
  onStats,
}: {
  scene: LensScene;
  mode: AnimationMode;
  renderMode: RenderMode;
  playing: boolean;
  speed: number;
  pixels: number;
  showVectors: boolean;
  onStats: (stats: SceneReadout[]) => void;
}) {
  const canvasRef = useRef<CanvasHandle>(null);
  const [phase, setPhase] = useState(0);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let fpsAccum = 0;
    let fpsFrames = 0;

    const tick = (timestamp: number) => {
      const dt = Math.min(80, timestamp - last);
      last = timestamp;
      if (playing) {
        setPhase((p) => (p + (dt / 1000) * speed) % 1);
      }
      fpsFrames++;
      fpsAccum += dt;
      if (fpsAccum > 640) {
        setFps(Math.round((1000 * fpsFrames) / fpsAccum));
        fpsAccum = 0;
        fpsFrames = 0;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const animatedScene = useMemo(() => evolveScene(scene, mode, phase, scene.animation?.amplitude ?? 1), [scene, mode, phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stats = drawMainViewport(canvas, animatedScene, renderMode, pixels, phase, showVectors);
    if (stats) {
      onStats([
        { label: 'Mean intensity', value: stats.meanIntensity.toExponential(2), detail: 'rendered source flux' },
        { label: 'Max |μ|', value: stats.maxAbsMu.toFixed(2), detail: 'magnification upper trace' },
        { label: 'Negative parity', value: `${(100 * stats.negativeParityFraction).toFixed(1)}%`, detail: 'saddle-image area fraction' },
        { label: 'Near critical', value: `${(100 * stats.nearCriticalFraction).toFixed(1)}%`, detail: 'pixels with det A close to zero' },
        { label: 'Fermat span', value: (stats.maxDelay - stats.minDelay).toFixed(3), detail: 'relative arrival-time surface' },
      ]);
    }
  }, [animatedScene, renderMode, pixels, phase, showVectors, onStats]);

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadUrl(canvas.toDataURL('image/png'), `${sceneSlug(animatedScene)}-${renderMode}.png`);
  }

  return (
    <section className="viewport-shell glass-panel">
      <div className="viewport-topbar">
        <div>
          <span className="status-dot" />
          <strong>{playing ? 'LIVE RENDER' : 'PAUSED'}</strong>
          <em>{fps} fps UI loop</em>
        </div>
        <div>
          <span>{renderMode}</span>
          <button className="mini-button" onClick={exportPng}>Export PNG</button>
        </div>
      </div>
      <canvas ref={canvasRef} className="lensing-viewport" aria-label="CosmicLens cinematic gravitational lensing viewport" />
      <div className="legend-card">
        <span><i className="legend-line amber" /> Critical curves</span>
        <span><i className="legend-line cyan" /> Caustics</span>
        <span><i className="legend-dot" /> Source</span>
      </div>
      <FrameTimeline scene={scene} mode={mode} renderMode={renderMode} pixels={pixels} />
    </section>
  );
}

function FrameTimeline({ scene, mode, renderMode, pixels }: { scene: LensScene; mode: AnimationMode; renderMode: RenderMode; pixels: number }) {
  const ref = useRef<CanvasHandle>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(760, Math.floor(rect.width * dpr));
    const height = Math.max(120, Math.floor(rect.height * dpr));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frames = 11;
    const grid = renderAnimationFrameGrid(scene, mode, {
      frames,
      columns: frames,
      pixels: Math.min(140, pixels),
      mode: renderMode,
      overlayResolution: 54,
    });
    ctx.fillStyle = 'rgba(2, 6, 23, 0.95)';
    ctx.fillRect(0, 0, width, height);

    const pad = 12 * dpr;
    const stripTop = 16 * dpr;
    const tileGap = 8 * dpr;
    const tileW = (width - pad * 2 - tileGap * (frames - 1)) / frames;
    const tileH = height - 36 * dpr;

    grid.frames.forEach((frame, index) => {
      const raw = document.createElement('canvas');
      raw.width = frame.width;
      raw.height = frame.height;
      const rawCtx = raw.getContext('2d');
      if (!rawCtx) return;
      const image = rawCtx.createImageData(frame.width, frame.height);
      image.data.set(frame.data);
      rawCtx.putImageData(image, 0, 0);
      const x = pad + index * (tileW + tileGap);
      ctx.drawImage(raw, x, stripTop, tileW, tileH);
      ctx.strokeStyle = index === Math.floor(frames * 0.62) ? 'rgba(71, 215, 255, 0.95)' : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = index === Math.floor(frames * 0.62) ? 2 * dpr : 1 * dpr;
      ctx.strokeRect(x, stripTop, tileW, tileH);
    });

    ctx.strokeStyle = 'rgba(71, 215, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(width * 0.62, 0);
    ctx.lineTo(width * 0.62, height);
    ctx.stroke();
  }, [scene, mode, renderMode, pixels]);

  return <canvas className="frame-timeline" ref={ref} aria-label="Animation frame-grid timeline" />;
}

function Control({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : 1;
  return (
    <label className="control-row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <strong>{value.toFixed(decimals)}</strong>
    </label>
  );
}

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <label className="select-row">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function SceneControls({
  scene,
  mode,
  renderMode,
  playing,
  speed,
  pixels,
  showVectors,
  onScene,
  onMode,
  onRenderMode,
  onPlaying,
  onSpeed,
  onPixels,
  onShowVectors,
  onJson,
}: {
  scene: LensScene;
  mode: AnimationMode;
  renderMode: RenderMode;
  playing: boolean;
  speed: number;
  pixels: number;
  showVectors: boolean;
  onScene: (scene: LensScene) => void;
  onMode: (mode: AnimationMode) => void;
  onRenderMode: (mode: RenderMode) => void;
  onPlaying: (playing: boolean) => void;
  onSpeed: (speed: number) => void;
  onPixels: (pixels: number) => void;
  onShowVectors: (show: boolean) => void;
  onJson: (text: string) => void;
}) {
  const main = primaryMassComponent(scene) ?? scene.planes[0].components[0];
  const shear = shearComponent(scene);

  function update(key: string, value: number) {
    onScene(setComponentParam(scene, key, value));
  }

  function downloadScene() {
    downloadBlob(new Blob([serialiseScene(scene)], { type: 'application/json' }), `${sceneSlug(scene)}.json`);
  }

  function exportTimelineJson() {
    const frames = Array.from({ length: 24 }, (_, i) => evolveScene(scene, mode, i / 24, scene.animation?.amplitude ?? 1));
    downloadBlob(new Blob([JSON.stringify({ scene: scene.name, mode, frames }, null, 2)], { type: 'application/json' }), `cosmiclens-${mode}-timeline.json`);
  }

  return (
    <aside className="left-console console-column">
      <section className="glass-panel command-panel">
        <div className="panel-heading">
          <p>Mission console</p>
          <h2>Scene builder</h2>
        </div>
        <Select label="Animation mode" value={mode} options={animationModes} onChange={onMode} />
        <p className="micro-copy">{describeAnimationMode(mode)}</p>
        <Select label="Scientific render" value={renderMode} options={renderModes} onChange={onRenderMode} />
        <Control label="Playback" min={0.01} max={0.38} step={0.01} value={speed} onChange={onSpeed} />
        <Control label="Resolution" min={140} max={540} step={20} value={pixels} onChange={onPixels} />
        <Control label="Viewport" min={1.4} max={3.8} step={0.05} value={scene.viewport.halfWidthArcsec} onChange={(v) => update('halfWidth', v)} />
        {'thetaE' in main && <Control label="Einstein θE" min={0.18} max={2.4} step={0.01} value={main.thetaE} onChange={(v) => update('thetaE', v)} />}
        {main.type === 'SoftenedIsothermalEllipse' && <Control label="Axis ratio q" min={0.35} max={1.0} step={0.01} value={main.q} onChange={(v) => update('q', v)} />}
        {main.type === 'SoftenedIsothermalEllipse' && <Control label="Lens PA" min={0} max={180} step={1} value={main.phiDeg} onChange={(v) => update('phiDeg', v)} />}
        {shear?.type === 'ExternalShear' && <Control label="Shear γ" min={0} max={0.18} step={0.005} value={shear.gamma} onChange={(v) => update('shear', v)} />}
        {shear?.type === 'ExternalShear' && <Control label="Shear PA" min={0} max={180} step={1} value={shear.phiDeg} onChange={(v) => update('shearPA', v)} />}
        <Control label="Source βx" min={-0.75} max={0.75} step={0.01} value={scene.source.profile.center[0]} onChange={(v) => update('sourceX', v)} />
        <Control label="Source βy" min={-0.75} max={0.75} step={0.01} value={scene.source.profile.center[1]} onChange={(v) => update('sourceY', v)} />
        <Control label="Source radius" min={0.02} max={0.42} step={0.005} value={scene.source.profile.radius} onChange={(v) => update('sourceR', v)} />
        <label className="check-row">
          <input type="checkbox" checked={showVectors} onChange={(e) => onShowVectors(e.target.checked)} />
          <span>Show guide vectors</span>
        </label>
        <div className="button-grid">
          <button onClick={() => onPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
          <button onClick={downloadScene}>Scene JSON</button>
          <button onClick={exportTimelineJson}>Timeline</button>
          <button onClick={() => onJson(serialiseScene(scene))}>Inspect JSON</button>
        </div>
      </section>

      <section className="glass-panel equation-card">
        <span>Thin-lens core</span>
        <strong>β = θ − α(θ)</strong>
        <p>Every visible field is generated from the same TypeScript physics core used by the exports and validation fixtures.</p>
      </section>
    </aside>
  );
}

function DiagnosticsPanel({ scene, stats, renderMode }: { scene: LensScene; stats: SceneReadout[]; renderMode: RenderMode }) {
  const theta = getThetaE(primaryMassComponent(scene));
  return (
    <aside className="right-console console-column">
      <section className="glass-panel status-panel">
        <div className="panel-heading">
          <p>Telemetry</p>
          <h2>Live diagnostics</h2>
        </div>
        <div className="readout-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="readout">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <em>{stat.detail}</em>
            </div>
          ))}
        </div>
      </section>

      <MiniFrame title="Magnification field" scene={scene} mode="magnification" caption="Log-scaled amplification structure around the critical region." />
      <MiniFrame title="Fermat surface" scene={scene} mode="time-delay" caption="Relative arrival-time terrain for the active source geometry." />
      <MiniFrame title="Anomaly residual" scene={scene} mode="residual" caption="A visual proxy for perturbation-sensitive regions and model mismatch." />

      <section className="glass-panel model-card">
        <div className="panel-heading">
          <p>Model state</p>
          <h2>{scene.name}</h2>
        </div>
        <dl>
          <div><dt>z lens</dt><dd>{scene.planes[0].z.toFixed(3)}</dd></div>
          <div><dt>z source</dt><dd>{scene.source.z.toFixed(3)}</dd></div>
          <div><dt>θE</dt><dd>{theta === null ? '—' : theta.toFixed(3)}</dd></div>
          <div><dt>render</dt><dd>{renderMode}</dd></div>
          <div><dt>components</dt><dd>{scene.planes[0].components.length}</dd></div>
        </dl>
      </section>
    </aside>
  );
}

function PresetDeck({ activeName, onSelect }: { activeName: string; onSelect: (id: string) => void }) {
  const presets = useMemo(() => makeScenePresets(), []);
  return (
    <section className="preset-deck" id="presets">
      <div className="section-title">
        <p>Curated experiments</p>
        <h2>Preset lensing theatres</h2>
        <span>Each scene is a reproducible JSON object, not a static illustration.</span>
      </div>
      <div className="preset-grid">
        {presets.map((preset, index) => (
          <button className="preset-card glass-panel" key={preset.id} onClick={() => onSelect(preset.id)}>
            <span className="preset-index">0{index + 1}</span>
            <strong>{preset.title}</strong>
            <em>{preset.scene.name === activeName ? 'active scene' : 'load scene'}</em>
            <p>{preset.description}</p>
            <i />
          </button>
        ))}
      </div>
    </section>
  );
}

function CapabilityBand() {
  return (
    <section className="capability-band" id="capabilities">
      {capabilities.map((item) => (
        <article key={item.label} className={`capability-card glass-panel ${toneClass(item.tone)}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

function FrameGridLab({ scene, mode, renderMode, pixels }: { scene: LensScene; mode: AnimationMode; renderMode: RenderMode; pixels: number }) {
  const canvasRef = useRef<CanvasHandle>(null);
  const [frames, setFrames] = useState(15);
  const [cols, setCols] = useState(5);

  function renderGridToCanvas(canvas: HTMLCanvasElement) {
    const grid = renderAnimationFrameGrid(scene, mode, {
      frames,
      columns: cols,
      pixels: Math.min(180, pixels),
      mode: renderMode,
      overlayResolution: 70,
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const tile = 180 * dpr;
    const gutter = 12 * dpr;
    const header = 58 * dpr;
    const width = grid.columns * tile + (grid.columns + 1) * gutter;
    const height = grid.rows * tile + (grid.rows + 1) * gutter + header;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawStars(ctx, width, height, 0.3);
    ctx.fillStyle = 'rgba(4, 7, 13, 0.78)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e8f2ff';
    ctx.font = `${16 * dpr}px JetBrains Mono, ui-monospace, monospace`;
    ctx.fillText(`COSMICLENS FRAMEGRID · ${mode.toUpperCase()} · ${renderMode.toUpperCase()}`, gutter, 34 * dpr);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = `${11 * dpr}px JetBrains Mono, ui-monospace, monospace`;
    ctx.fillText(`${frames} deterministic states · exported from browser physics runtime`, gutter, 52 * dpr);

    grid.frames.forEach((frame, index) => {
      const x = gutter + (index % grid.columns) * (tile + gutter);
      const y = header + gutter + Math.floor(index / grid.columns) * (tile + gutter);
      const off = document.createElement('canvas');
      off.width = frame.width;
      off.height = frame.height;
      const offCtx = off.getContext('2d');
      if (!offCtx) return;
      const image = offCtx.createImageData(frame.width, frame.height);
      image.data.set(frame.data);
      offCtx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, x, y, tile, tile);
      ctx.strokeStyle = index === Math.floor(frames * 0.5) ? 'rgba(71, 215, 255, 0.95)' : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = index === Math.floor(frames * 0.5) ? 2.2 * dpr : 1 * dpr;
      ctx.strokeRect(x, y, tile, tile);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.74)';
      ctx.fillRect(x + 9 * dpr, y + 9 * dpr, 74 * dpr, 24 * dpr);
      ctx.fillStyle = '#ffb547';
      ctx.font = `${11 * dpr}px JetBrains Mono, ui-monospace, monospace`;
      ctx.fillText(`#${String(index + 1).padStart(2, '0')}`, x + 18 * dpr, y + 25 * dpr);
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderGridToCanvas(canvas);
  }, [scene, mode, renderMode, pixels, frames, cols]);

  function exportGrid() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadUrl(canvas.toDataURL('image/png'), `cosmiclens-framegrid-${mode}-${renderMode}.png`);
  }

  return (
    <section className="framegrid-lab glass-panel" id="framegrid">
      <div className="section-title compact">
        <p>Export lab</p>
        <h2>FrameGrid renderer</h2>
        <span>Generate cinematic filmstrips for README banners, teaching slides, social posts, and visual regression.</span>
      </div>
      <div className="framegrid-controls">
        <Control label="Frames" min={6} max={24} step={1} value={frames} onChange={setFrames} />
        <Control label="Columns" min={3} max={6} step={1} value={cols} onChange={setCols} />
        <button onClick={exportGrid}>Export FrameGrid PNG</button>
      </div>
      <canvas ref={canvasRef} className="framegrid-canvas" aria-label="CosmicLens FrameGrid export preview" />
    </section>
  );
}

function JsonConsole({ jsonText, onText, scene, onScene }: { jsonText: string; onText: (text: string) => void; scene: LensScene; onScene: (scene: LensScene) => void }) {
  return (
    <section className="json-console glass-panel" id="json">
      <div className="section-title compact">
        <p>Reproducibility</p>
        <h2>Scene JSON console</h2>
        <span>The browser and Python validation tools use the same scene object.</span>
      </div>
      <textarea value={jsonText} onChange={(e) => onText(e.target.value)} placeholder="Click 'Inspect JSON' in the mission console, edit the scene, then import it back into the live renderer." />
      <div className="json-actions">
        <button onClick={() => onText(serialiseScene(scene))}>Load current scene</button>
        <button onClick={() => onScene(parseScene(jsonText))}>Import edited JSON</button>
        <button onClick={() => navigator.clipboard?.writeText(serialiseScene(scene))}>Copy current scene</button>
      </div>
    </section>
  );
}

function App() {
  const presets = useMemo(() => makeScenePresets(), []);
  const [scene, setScene] = useState<LensScene>(() => makeDefaultScene());
  const [jsonText, setJsonText] = useState('');
  const [mode, setMode] = useState<AnimationMode>('caustic-breathing');
  const [renderMode, setRenderMode] = useState<RenderMode>('lensed');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.065);
  const [pixels, setPixels] = useState(300);
  const [showVectors, setShowVectors] = useState(false);
  const [stats, setStats] = useState<SceneReadout[]>([]);

  function loadPreset(id: string) {
    const preset = presets.find((candidate) => candidate.id === id);
    if (!preset) return;
    setScene(cloneScene(preset.scene));
    setMode(preset.scene.animation?.mode ?? 'source-orbit');
    setJsonText('');
  }

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <a className="brand" href="#top" aria-label="CosmicLens Lab home">
          <span className="brand-orb" />
          <div>
            <strong>CosmicLens Lab</strong>
            <em>browser-native strong-lensing console</em>
          </div>
        </a>
        <div className="nav-links">
          <a href="#capabilities">Capabilities</a>
          <a href="#presets">Presets</a>
          <a href="#framegrid">FrameGrid</a>
          <a href="#json">JSON</a>
          <a href="https://github.com/Biswajit1999/Cosmic-Lens-Lab" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </nav>

      <section className="hero-console" id="top">
        <div className="hero-copy">
          <p className="eyebrow">strong lensing · dark matter · cinematic science UI</p>
          <h1>Operate a gravitational lens like a research instrument.</h1>
          <p>
            Build lens systems, animate caustics, inspect magnification structure, render deterministic frame grids,
            and export reproducible scenes for Python validation.
          </p>
          <div className="hero-actions">
            <a href="#lab">Launch lab</a>
            <a href="#presets">Explore presets</a>
            <a href="docs/physics.md">Read physics</a>
          </div>
        </div>
        <div className="hero-scan glass-panel">
          <span>Active experiment</span>
          <strong>{scene.name}</strong>
          <em>{scene.planes[0].components.length} mass components · source z={scene.source.z}</em>
        </div>
      </section>

      <CapabilityBand />

      <section className="lab-grid" id="lab">
        <SceneControls
          scene={scene}
          mode={mode}
          renderMode={renderMode}
          playing={playing}
          speed={speed}
          pixels={pixels}
          showVectors={showVectors}
          onScene={setScene}
          onMode={setMode}
          onRenderMode={setRenderMode}
          onPlaying={setPlaying}
          onSpeed={setSpeed}
          onPixels={setPixels}
          onShowVectors={setShowVectors}
          onJson={setJsonText}
        />
        <LabViewport
          scene={scene}
          mode={mode}
          renderMode={renderMode}
          playing={playing}
          speed={speed}
          pixels={pixels}
          showVectors={showVectors}
          onStats={setStats}
        />
        <DiagnosticsPanel scene={scene} stats={stats} renderMode={renderMode} />
      </section>

      <PresetDeck activeName={scene.name} onSelect={loadPreset} />
      <FrameGridLab scene={scene} mode={mode} renderMode={renderMode} pixels={pixels} />
      <JsonConsole jsonText={jsonText} onText={setJsonText} scene={scene} onScene={setScene} />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
