import { useEffect, useRef } from 'react';
import type { AnimationMode, LensScene, RenderMode } from '@cosmiclens/physics-core';
import { renderTimeline } from '../render/frameGrid';

interface FrameGridTimelineProps {
  scene: LensScene;
  mode: AnimationMode;
  renderMode: RenderMode;
  pixels: number;
  phase: number;
  frames: number;
  playing: boolean;
  onScrub: (phase: number) => void;
  onFrames: (frames: number) => void;
  onTogglePlay: () => void;
  onExport: () => void;
}

export function FrameGridTimeline({
  scene,
  mode,
  renderMode,
  pixels,
  phase,
  frames,
  playing,
  onScrub,
  onFrames,
  onTogglePlay,
  onExport,
}: FrameGridTimelineProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const activeIndex = Math.min(frames - 1, Math.floor(phase * frames));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    renderTimeline(canvas, scene, mode, renderMode, { frames, activeIndex, pixels });
  }, [scene, mode, renderMode, frames, activeIndex, pixels]);

  return (
    <section className="timeline" aria-label="FrameGrid timeline">
      <div className="timeline__bar">
        <div className="timeline__meta">
          <span className="timeline__tag">FRAMEGRID</span>
          <span className="mono">{mode.toUpperCase()}</span>
          <span className="mono dim">{renderMode.toUpperCase()}</span>
        </div>
        <div className="timeline__index mono">
          FRAME <strong>{String(activeIndex + 1).padStart(2, '0')}</strong> / {frames}
          <span className="dim"> · φ {(phase * 360).toFixed(0)}°</span>
        </div>
        <div className="timeline__actions">
          <label className="inline-control mono">
            FRAMES
            <input
              type="range"
              min={6}
              max={24}
              step={1}
              value={frames}
              onChange={(e) => onFrames(Number(e.target.value))}
              aria-label="Frame count"
            />
            <strong>{frames}</strong>
          </label>
          <button type="button" className="icon-button" onClick={onTogglePlay} aria-pressed={playing}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="icon-button" onClick={onExport}>
            Export grid
          </button>
        </div>
      </div>
      <canvas ref={ref} className="timeline__canvas" aria-label="Animation filmstrip" />
      <input
        type="range"
        className="scrubber"
        min={0}
        max={1}
        step={0.001}
        value={phase}
        onChange={(e) => onScrub(Number(e.target.value))}
        aria-label="Timeline scrubber"
      />
    </section>
  );
}
