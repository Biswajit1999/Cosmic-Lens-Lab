import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnimationMode, LensScene, RenderMode, RenderStats } from '@cosmiclens/physics-core';
import { evolveScene } from '@cosmiclens/physics-core';
import { makeDefaultScene, makeScenePresets } from '@cosmiclens/schema';
import { buildTelemetry } from '../data/metrics';
import { cloneScene, setComponentParam, type ParamKey } from '../data/scene';
import { renderExportGrid } from '../render/frameGrid';
import { downloadCanvas } from '../utils/download';
import { slug } from '../utils/format';
import { useAnimationClock, useReducedMotion } from '../utils/animation';
import { TopNav } from './TopNav';
import { TelemetryRail } from './TelemetryRail';
import { LensingViewport } from './LensingViewport';
import { DiagnosticsRail } from './DiagnosticsRail';
import { FrameGridTimeline } from './FrameGridTimeline';
import { PresetGallery } from './PresetGallery';
import { PhysicsDrawer } from './PhysicsDrawer';
import { ValidationPanel } from './ValidationPanel';
import { Footer } from './Footer';

const HISTORY_LENGTH = 48;
const SPARKLINE_KEYS = ['thetaE', 'mu', 'kappa', 'gamma', 'parity', 'fermat'];

export function AstroConsole() {
  const presets = useMemo(() => makeScenePresets(), []);
  const reducedMotion = useReducedMotion();

  const [scene, setScene] = useState<LensScene>(() => makeDefaultScene());
  const [mode, setMode] = useState<AnimationMode>('caustic-breathing');
  const [renderMode, setRenderMode] = useState<RenderMode>('lensed');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.065);
  const [pixels, setPixels] = useState(300);
  const [showVectors, setShowVectors] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [frames, setFrames] = useState(12);
  const [stats, setStats] = useState<RenderStats | null>(null);
  const [history, setHistory] = useState<Record<string, number[]>>({});

  const [presetsOpen, setPresetsOpen] = useState(false);
  const [physicsOpen, setPhysicsOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);

  const { phase, fps, setPhase } = useAnimationClock(playing, speed, reducedMotion);

  const animatedScene = useMemo(
    () => evolveScene(scene, mode, phase, scene.animation?.amplitude ?? 1),
    [scene, mode, phase],
  );

  const telemetry = useMemo(() => buildTelemetry(animatedScene, stats), [animatedScene, stats]);

  useEffect(() => {
    setHistory((prev) => {
      const next: Record<string, number[]> = { ...prev };
      for (const field of telemetry) {
        if (!SPARKLINE_KEYS.includes(field.key) || field.raw === undefined) continue;
        const series = (next[field.key] ?? []).concat(field.raw);
        next[field.key] = series.slice(-HISTORY_LENGTH);
      }
      return next;
    });
  }, [telemetry]);

  const handleParam = useCallback(
    (key: ParamKey, value: number) => setScene((s) => setComponentParam(s, key, value)),
    [],
  );

  const handleStats = useCallback((next: RenderStats) => setStats(next), []);

  const loadPreset = useCallback(
    (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) return;
      setScene(cloneScene(preset.scene));
      setMode(preset.scene.animation?.mode ?? 'source-orbit');
      setHistory({});
    },
    [presets],
  );

  const scrub = useCallback(
    (value: number) => {
      setPlaying(false);
      setPhase(value);
    },
    [setPhase],
  );

  const exportGrid = useCallback(() => {
    const canvas = document.createElement('canvas');
    renderExportGrid(canvas, scene, mode, renderMode, { frames, columns: Math.min(6, Math.ceil(Math.sqrt(frames))), pixels });
    downloadCanvas(canvas, `cosmiclens-framegrid-${slug(scene.name)}-${mode}.png`);
  }, [scene, mode, renderMode, frames, pixels]);

  return (
    <div className="console" id="console">
      <TopNav
        sceneName={scene.name}
        playing={playing}
        reducedMotion={reducedMotion}
        onOpenPresets={() => setPresetsOpen(true)}
        onOpenPhysics={() => setPhysicsOpen(true)}
        onOpenValidation={() => setValidationOpen(true)}
      />

      <main className="console__grid" aria-label="Lensing console">
        <TelemetryRail
          scene={animatedScene}
          mode={mode}
          speed={speed}
          pixels={pixels}
          showVectors={showVectors}
          telemetry={telemetry}
          history={history}
          onMode={setMode}
          onSpeed={setSpeed}
          onPixels={setPixels}
          onShowVectors={setShowVectors}
          onParam={handleParam}
        />

        <LensingViewport
          scene={animatedScene}
          renderMode={renderMode}
          phase={phase}
          fps={fps}
          playing={playing}
          reducedMotion={reducedMotion}
          pixels={pixels}
          showVectors={showVectors}
          showOverlays={showOverlays}
          onRenderMode={setRenderMode}
          onTogglePlay={() => setPlaying((p) => !p)}
          onToggleOverlays={() => setShowOverlays((v) => !v)}
          onStats={handleStats}
        />

        <DiagnosticsRail scene={animatedScene} />
      </main>

      <FrameGridTimeline
        scene={scene}
        mode={mode}
        renderMode={renderMode}
        pixels={pixels}
        phase={phase}
        frames={frames}
        playing={playing}
        onScrub={scrub}
        onFrames={setFrames}
        onTogglePlay={() => setPlaying((p) => !p)}
        onExport={exportGrid}
      />

      <Footer />

      <PresetGallery
        open={presetsOpen}
        activeName={scene.name}
        onClose={() => setPresetsOpen(false)}
        onSelect={loadPreset}
      />
      <PhysicsDrawer open={physicsOpen} onClose={() => setPhysicsOpen(false)} />
      <ValidationPanel
        open={validationOpen}
        scene={scene}
        mode={mode}
        onClose={() => setValidationOpen(false)}
        onScene={(next) => {
          setScene(next);
          setHistory({});
        }}
      />
    </div>
  );
}
