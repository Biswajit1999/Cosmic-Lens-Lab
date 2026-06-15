import { useEffect, useRef } from 'react';
import type { LensScene, RenderMode, RenderStats } from '@cosmiclens/physics-core';
import { renderViewport } from '../render/lensingCanvas';
import { downloadCanvas } from '../utils/download';
import { slug } from '../utils/format';

const RENDER_MODES: RenderMode[] = ['lensed', 'magnification', 'time-delay', 'parity', 'source-plane', 'residual'];

const RENDER_LABEL: Record<RenderMode, string> = {
  lensed: 'Lensed',
  magnification: 'Magnification',
  'time-delay': 'Fermat',
  parity: 'Parity',
  'source-plane': 'Source',
  residual: 'Residual',
};

interface LensingViewportProps {
  scene: LensScene;
  renderMode: RenderMode;
  phase: number;
  fps: number;
  playing: boolean;
  reducedMotion: boolean;
  pixels: number;
  showVectors: boolean;
  showOverlays: boolean;
  fermatValid: boolean;
  onRenderMode: (mode: RenderMode) => void;
  onTogglePlay: () => void;
  onToggleOverlays: () => void;
  onStats: (stats: RenderStats) => void;
}

export function LensingViewport({
  scene,
  renderMode,
  phase,
  fps,
  playing,
  reducedMotion,
  pixels,
  showVectors,
  showOverlays,
  fermatValid,
  onRenderMode,
  onTogglePlay,
  onToggleOverlays,
  onStats,
}: LensingViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stats = renderViewport(canvas, scene, {
      renderMode,
      pixels,
      phase,
      drift: reducedMotion ? 0 : 1,
      showVectors,
      showOverlays,
    });
    if (stats) onStats(stats);
  }, [scene, renderMode, pixels, phase, reducedMotion, showVectors, showOverlays, onStats]);

  function handleExport() {
    const canvas = canvasRef.current;
    if (canvas) downloadCanvas(canvas, `${slug(scene.name)}-${renderMode}.png`);
  }

  const fermatActive = renderMode === 'time-delay';

  return (
    <section className="viewport" aria-label="Gravitational lensing viewport">
      <div className="viewport__toolbar">
        <div className="viewport__status">
          <span className={`live-dot${playing && !reducedMotion ? ' on' : ''}`} aria-hidden="true" />
          <strong>{reducedMotion ? 'STATIC FRAME' : playing ? 'LIVE RENDER' : 'PAUSED'}</strong>
          <em>{fps} fps</em>
        </div>
        <div className="render-pills" role="tablist" aria-label="Render mode">
          {RENDER_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={renderMode === mode}
              className={`render-pill${renderMode === mode ? ' active' : ''}`}
              onClick={() => onRenderMode(mode)}
            >
              {RENDER_LABEL[mode]}
            </button>
          ))}
        </div>
        <div className="viewport__actions">
          <button type="button" className="icon-button" onClick={onToggleOverlays} aria-pressed={showOverlays}>
            {showOverlays ? 'Curves on' : 'Curves off'}
          </button>
          <button type="button" className="icon-button" onClick={onTogglePlay} aria-pressed={playing}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="icon-button primary" onClick={handleExport}>
            Export PNG
          </button>
        </div>
      </div>

      <div className="viewport__stage">
        <canvas ref={canvasRef} className="viewport__canvas" aria-label="Cinematic lensing render" />
        {fermatActive && !fermatValid && (
          <div className="viewport__notice" role="status">
            Fermat surface is undefined for NFW components in this scene. Showing geometric term only — full NFW
            potential is on the roadmap.
          </div>
        )}
        <div className="viewport__legend" aria-hidden="true">
          <span><i className="legend-line amber" /> Critical curve (image plane)</span>
          <span><i className="legend-line cyan" /> Caustic (source plane)</span>
          <span><i className="legend-dot" /> Source β</span>
        </div>
      </div>
    </section>
  );
}
