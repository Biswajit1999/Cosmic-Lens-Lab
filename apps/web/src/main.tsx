import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { AnimationMode, LensScene, RenderMode, Vec2 } from '@cosmiclens/physics-core';
import {
  describeAnimationMode,
  evolveScene,
  renderAnimationFrameGrid,
  renderLensFrame,
} from '@cosmiclens/physics-core';
import { makeDefaultScene, makeScenePresets, parseScene, serialiseScene } from '@cosmiclens/schema';
import './styles.css';

const animationModes: AnimationMode[] = ['source-orbit', 'caustic-breathing', 'shear-rotation', 'subhalo-flyby', 'einstein-radius-pulse', 'time-delay-sweep'];
const renderModes: RenderMode[] = ['lensed', 'magnification', 'time-delay', 'parity', 'source-plane', 'residual'];

type CanvasHandle = HTMLCanvasElement | null;

function cloneScene(scene: LensScene): LensScene {
  return JSON.parse(JSON.stringify(scene)) as LensScene;
}

function setComponentParam(scene: LensScene, key: string, value: number): LensScene {
  const next = cloneScene(scene);
  const comp = next.planes[0]?.components.find((c) => c.type !== 'ExternalShear');
  if (!comp) return next;
  if (key === 'thetaE' && 'thetaE' in comp) comp.thetaE = value;
  if (key === 'q' && comp.type === 'SoftenedIsothermalEllipse') comp.q = value;
  if (key === 'phiDeg' && comp.type === 'SoftenedIsothermalEllipse') comp.phiDeg = value;
  if (key === 'sourceX') next.source.profile.center = [value, next.source.profile.center[1]];
  if (key === 'sourceY') next.source.profile.center = [next.source.profile.center[0], value];
  if (key === 'sourceR') next.source.profile.radius = value;
  const shear = next.planes[0].components.find((c) => c.type === 'ExternalShear');
  if (key === 'shear' && shear?.type === 'ExternalShear') shear.gamma = value;
  return next;
}

function worldToCanvas(theta: readonly [number, number], size: number, halfWidth: number): [number, number] {
  return [((theta[0] + halfWidth) / (2 * halfWidth)) * size, ((halfWidth - theta[1]) / (2 * halfWidth)) * size];
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

function drawFrameToCanvas(canvas: HTMLCanvasElement, scene: LensScene, renderMode: RenderMode, pixels: number, phase: number, showVectors: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = 860;
  const frame = renderLensFrame(scene, { pixels, mode: renderMode, overlayResolution: 118 });
  const halfWidth = scene.viewport.halfWidthArcsec;
  canvas.width = size;
  canvas.height = size;

  const raw = document.createElement('canvas');
  raw.width = frame.width;
  raw.height = frame.height;
  const rawCtx = raw.getContext('2d');
  if (rawCtx) {
    const rawImage = rawCtx.createImageData(frame.width, frame.height);
    rawImage.data.set(frame.data);
    rawCtx.putImageData(rawImage, 0, 0);
  }

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(raw, 0, 0, size, size);

  const gridAlpha = renderMode === 'lensed' ? 0.28 : 0.18;
  ctx.globalAlpha = gridAlpha;
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
  ctx.lineWidth = 1;
  for (let k = 1; k < 10; k++) {
    const p = (k * size) / 10;
    ctx.beginPath();
    ctx.moveTo(p, 0); ctx.lineTo(p, size);
    ctx.moveTo(0, p); ctx.lineTo(size, p);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#f59e0b';
  for (const p of frame.criticalCurve) {
    const [x, y] = worldToCanvas(p, size, halfWidth);
    ctx.fillRect(x - 1.4, y - 1.4, 2.8, 2.8);
  }

  ctx.fillStyle = '#fb7185';
  for (const p of frame.caustic) {
    const [x, y] = worldToCanvas(p, size, halfWidth);
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }

  const [sx, sy] = worldToCanvas(scene.source.profile.center, size, halfWidth);
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(sx, sy, 8, 0, Math.PI * 2);
  ctx.stroke();

  if (showVectors) {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1;
    const vectorStep = 8;
    for (let j = 1; j < vectorStep; j++) {
      for (let i = 1; i < vectorStep; i++) {
        const x = -halfWidth + (2 * halfWidth * i) / vectorStep;
        const y = -halfWidth + (2 * halfWidth * j) / vectorStep;
        const beta = scene.source.profile.center;
        const dx = beta[0] - x;
        const dy = beta[1] - y;
        const [cx, cy] = worldToCanvas([x, y], size, halfWidth);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx * 14, cy - dy * 14);
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.68)';
  ctx.fillRect(16, 16, 310, 96);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.strokeRect(16, 16, 310, 96);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 13px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`mode: ${renderMode}`, 28, 40);
  ctx.fillText(`phase: ${(phase * 100).toFixed(1)}%`, 28, 62);
  ctx.fillText(`orange=critical · red=caustic · cyan=source`, 28, 84);
  ctx.fillText(`near-critical ${(100 * frame.stats.nearCriticalFraction).toFixed(1)}%`, 28, 104);
}

function LensCanvas({ scene, mode, renderMode, playing, speed, pixels, showVectors }: { scene: LensScene; mode: AnimationMode; renderMode: RenderMode; playing: boolean; speed: number; pixels: number; showVectors: boolean }) {
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
      if (fpsAccum > 600) {
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
    drawFrameToCanvas(canvas, animatedScene, renderMode, pixels, phase, showVectors);
  }, [animatedScene, renderMode, pixels, phase, showVectors]);

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadUrl(canvas.toDataURL('image/png'), `${animatedScene.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${renderMode}.png`);
  }

  return (
    <section className="canvas-stage panel">
      <div className="canvas-toolbar">
        <span className="pill live">{playing ? 'LIVE ANIMATION' : 'PAUSED'}</span>
        <span className="pill">{fps} fps UI loop</span>
        <button className="small" onClick={exportPng}>Export current PNG</button>
      </div>
      <canvas className="lens-canvas" ref={canvasRef} aria-label="Cinematic gravitational lensing renderer" />
    </section>
  );
}

function Diagnostics({ scene, renderMode, pixels }: { scene: LensScene; renderMode: RenderMode; pixels: number }) {
  const diagnostics = useMemo(() => renderLensFrame(scene, { pixels: Math.min(180, pixels), mode: renderMode, overlayResolution: 80 }).stats, [scene, renderMode, pixels]);
  return (
    <section className="panel diagnostics">
      <h2>Live diagnostics</h2>
      <div className="metric"><span>Mean intensity</span><strong>{diagnostics.meanIntensity.toExponential(2)}</strong></div>
      <div className="metric"><span>Max |μ|</span><strong>{diagnostics.maxAbsMu.toFixed(2)}</strong></div>
      <div className="metric"><span>Negative parity</span><strong>{(100 * diagnostics.negativeParityFraction).toFixed(1)}%</strong></div>
      <div className="metric"><span>Near critical</span><strong>{(100 * diagnostics.nearCriticalFraction).toFixed(1)}%</strong></div>
      <div className="metric"><span>Fermat span</span><strong>{(diagnostics.maxDelay - diagnostics.minDelay).toFixed(3)}</strong></div>
      <p className="note">Frame diagnostics are computed from the same TypeScript physics core used by the animation and frame-grid exporters.</p>
    </section>
  );
}

function FrameGridPanel({ scene, mode, renderMode, pixels }: { scene: LensScene; mode: AnimationMode; renderMode: RenderMode; pixels: number }) {
  const canvasRef = useRef<CanvasHandle>(null);
  const [frames, setFrames] = useState(12);
  const [cols, setCols] = useState(4);

  function renderGridToCanvas(canvas: HTMLCanvasElement) {
    const grid = renderAnimationFrameGrid(scene, mode, { frames, columns: cols, pixels: Math.min(150, pixels), mode: renderMode, overlayResolution: 64 });
    const tile = 180;
    const gutter = 10;
    const w = grid.columns * tile + (grid.columns + 1) * gutter;
    const h = grid.rows * tile + (grid.rows + 1) * gutter + 44;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 16px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`FrameGrid · ${mode} · ${renderMode} · ${frames} frames`, gutter, 28);

    grid.frames.forEach((frame, index) => {
      const x = gutter + (index % grid.columns) * (tile + gutter);
      const y = gutter + 44 + Math.floor(index / grid.columns) * (tile + gutter);
      const off = document.createElement('canvas');
      off.width = frame.width;
      off.height = frame.height;
      const offCtx = off.getContext('2d');
      if (offCtx) {
        const image = offCtx.createImageData(frame.width, frame.height);
        image.data.set(frame.data);
        offCtx.putImageData(image, 0, 0);
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, x, y, tile, tile);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.strokeRect(x, y, tile, tile);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
      ctx.fillRect(x + 8, y + 8, 68, 24);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 12px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`#${String(index + 1).padStart(2, '0')}`, x + 18, y + 25);
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
    <section className="panel framegrid">
      <div className="section-head">
        <div>
          <p className="eyebrow">render lab</p>
          <h2>FrameGrid exporter</h2>
        </div>
        <button className="small" onClick={exportGrid}>Export FrameGrid PNG</button>
      </div>
      <p className="note">A frame-grid is a scientific filmstrip: same physics scene, sampled over time, exported as one shareable image for README banners, papers, LinkedIn posts, and visual regression tests.</p>
      <div className="mini-controls">
        <label>Frames <input type="range" min="6" max="24" step="1" value={frames} onChange={(e) => setFrames(Number(e.target.value))} /><strong>{frames}</strong></label>
        <label>Columns <input type="range" min="3" max="6" step="1" value={cols} onChange={(e) => setCols(Number(e.target.value))} /><strong>{cols}</strong></label>
      </div>
      <canvas className="framegrid-canvas" ref={canvasRef} />
    </section>
  );
}

function Control({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="control">
      <span>{label}<strong>{value.toFixed(step < 0.01 ? 3 : 2)}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <label className="select-control">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function App() {
  const presets = useMemo(() => makeScenePresets(), []);
  const [scene, setScene] = useState<LensScene>(() => makeDefaultScene());
  const [jsonText, setJsonText] = useState('');
  const [mode, setMode] = useState<AnimationMode>('caustic-breathing');
  const [renderMode, setRenderMode] = useState<RenderMode>('lensed');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.07);
  const [pixels, setPixels] = useState(260);
  const [showVectors, setShowVectors] = useState(false);
  const main = scene.planes[0].components.find((c) => c.type !== 'ExternalShear') ?? scene.planes[0].components[0];
  const shear = scene.planes[0].components.find((c) => c.type === 'ExternalShear');

  function update(key: string, value: number) {
    setScene((s) => setComponentParam(s, key, value));
  }

  function downloadScene() {
    downloadBlob(new Blob([serialiseScene(scene)], { type: 'application/json' }), `${scene.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`);
  }

  function loadPreset(id: string) {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setScene(cloneScene(preset.scene));
    setMode(preset.scene.animation?.mode ?? 'source-orbit');
  }

  function exportTimelineJson() {
    const frames = Array.from({ length: 18 }, (_, i) => evolveScene(scene, mode, i / 18, scene.animation?.amplitude ?? 1));
    downloadBlob(new Blob([JSON.stringify({ scene: scene.name, mode, frames }, null, 2)], { type: 'application/json' }), `cosmiclens-${mode}-timeline.json`);
  }

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">strong lensing · dark matter · cinematic frame rendering · browser physics</p>
          <h1>CosmicLens Lab</h1>
          <p className="subtitle">A next-level gravitational-lensing laboratory with live animation, scientific render modes, frame-grid exports, caustic diagnostics, and Python-validation-ready scene JSON.</p>
        </div>
        <div className="hero-card">
          <span>Active scene</span>
          <strong>{scene.name}</strong>
          <small>z<sub>d</sub>={scene.planes[0].z} · z<sub>s</sub>={scene.source.z} · {scene.planes[0].components.length} mass components</small>
        </div>
      </header>

      <div className="preset-strip">
        {presets.map((preset) => (
          <button key={preset.id} onClick={() => loadPreset(preset.id)}>
            <strong>{preset.title}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>

      <div className="workspace">
        <aside className="panel controls">
          <h2>Scene builder</h2>
          <Select label="Animation" value={mode} options={animationModes} onChange={setMode} />
          <p className="note tight">{describeAnimationMode(mode)}</p>
          <Select label="Render mode" value={renderMode} options={renderModes} onChange={setRenderMode} />
          <Control label="Playback speed" min={0.01} max={0.32} step={0.01} value={speed} onChange={setSpeed} />
          <Control label="Render resolution" min={120} max={460} step={20} value={pixels} onChange={setPixels} />
          {'thetaE' in main && <Control label="Einstein radius θE" min={0.2} max={2.2} step={0.01} value={main.thetaE} onChange={(v) => update('thetaE', v)} />}
          {main.type === 'SoftenedIsothermalEllipse' && <Control label="Axis ratio q" min={0.35} max={1.0} step={0.01} value={main.q} onChange={(v) => update('q', v)} />}
          {main.type === 'SoftenedIsothermalEllipse' && <Control label="Position angle" min={0} max={180} step={1} value={main.phiDeg} onChange={(v) => update('phiDeg', v)} />}
          {shear?.type === 'ExternalShear' && <Control label="External shear γ" min={0} max={0.16} step={0.005} value={shear.gamma} onChange={(v) => update('shear', v)} />}
          <Control label="Source βx" min={-0.65} max={0.65} step={0.01} value={scene.source.profile.center[0]} onChange={(v) => update('sourceX', v)} />
          <Control label="Source βy" min={-0.65} max={0.65} step={0.01} value={scene.source.profile.center[1]} onChange={(v) => update('sourceY', v)} />
          <Control label="Source radius" min={0.02} max={0.35} step={0.005} value={scene.source.profile.radius} onChange={(v) => update('sourceR', v)} />
          <label className="checkbox"><input type="checkbox" checked={showVectors} onChange={(e) => setShowVectors(e.target.checked)} />Show guide vectors</label>
          <button onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause animation' : 'Play animation'}</button>
          <button onClick={downloadScene}>Export scene JSON</button>
          <button onClick={exportTimelineJson}>Export timeline JSON</button>
          <button onClick={() => setJsonText(serialiseScene(scene))}>Show JSON</button>
          <button onClick={() => setScene(makeDefaultScene())}>Reset</button>
        </aside>

        <LensCanvas scene={scene} mode={mode} renderMode={renderMode} playing={playing} speed={speed} pixels={pixels} showVectors={showVectors} />

        <Diagnostics scene={scene} renderMode={renderMode} pixels={pixels} />
      </div>

      <FrameGridPanel scene={scene} mode={mode} renderMode={renderMode} pixels={pixels} />

      <section className="json-panel panel">
        <div className="section-head">
          <div><p className="eyebrow">reproducibility</p><h2>Scene JSON console</h2></div>
          <button className="small" onClick={() => navigator.clipboard?.writeText(serialiseScene(scene))}>Copy current scene</button>
        </div>
        <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder="Click 'Show JSON', edit, then import. This is the exact object used by the browser renderer and Python validation tools." />
        <div className="row">
          <button onClick={() => setScene(parseScene(jsonText))}>Import JSON</button>
          <button onClick={() => setJsonText('')}>Clear editor</button>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
