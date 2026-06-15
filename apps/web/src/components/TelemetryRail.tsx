import type { AnimationMode, LensScene } from '@cosmiclens/physics-core';
import { describeAnimationMode } from '@cosmiclens/physics-core';
import type { TelemetryField } from '../data/metrics';
import { primaryMass, shearComponent } from '../data/metrics';
import { componentSummary, type ParamKey } from '../data/scene';
import { LENS_EQUATION } from '../data/glossary';
import { Control, Select, Toggle } from './Controls';
import { MetricTile } from './MetricTile';
import { StatusBadge } from './StatusBadge';

const ANIMATION_MODES: AnimationMode[] = [
  'source-orbit',
  'caustic-breathing',
  'shear-rotation',
  'subhalo-flyby',
  'einstein-radius-pulse',
  'time-delay-sweep',
];

interface TelemetryRailProps {
  scene: LensScene;
  mode: AnimationMode;
  speed: number;
  pixels: number;
  showVectors: boolean;
  telemetry: TelemetryField[];
  history: Record<string, number[]>;
  onMode: (mode: AnimationMode) => void;
  onSpeed: (speed: number) => void;
  onPixels: (pixels: number) => void;
  onShowVectors: (value: boolean) => void;
  onParam: (key: ParamKey, value: number) => void;
}

export function TelemetryRail({
  scene,
  mode,
  speed,
  pixels,
  showVectors,
  telemetry,
  history,
  onMode,
  onSpeed,
  onPixels,
  onShowVectors,
  onParam,
}: TelemetryRailProps) {
  const main = primaryMass(scene) ?? scene.planes[0].components[0];
  const shear = shearComponent(scene);

  return (
    <aside className="rail rail--left" aria-label="Telemetry and scene controls">
      <section className="panel">
        <div className="panel__head">
          <p className="panel__eyebrow">Active model</p>
          <h2 className="panel__title">{scene.name}</h2>
          <p className="panel__sub">{componentSummary(scene)}</p>
        </div>
        <div className="cosmo-strip">
          <div><span>zL</span><strong>{scene.planes[0].z.toFixed(2)}</strong></div>
          <div><span>zS</span><strong>{scene.source.z.toFixed(2)}</strong></div>
          <div><span>H₀</span><strong>{scene.cosmology.H0.toFixed(0)}</strong></div>
          <div><span>Ωm</span><strong>{scene.cosmology.Om0.toFixed(2)}</strong></div>
        </div>
        <StatusBadge tone="green" label="Forward-modelled · deterministic" />
      </section>

      <section className="panel">
        <div className="panel__head compact">
          <p className="panel__eyebrow">Telemetry</p>
          <h3 className="panel__title sm">Live diagnostics</h3>
        </div>
        <div className="metric-grid">
          {telemetry.map((field) => (
            <MetricTile key={field.key} field={field} history={history[field.key]} />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__head compact">
          <p className="panel__eyebrow">Scene console</p>
          <h3 className="panel__title sm">Lens & source controls</h3>
        </div>
        <Select label="Animation" value={mode} options={ANIMATION_MODES} onChange={onMode} />
        <p className="micro-copy">{describeAnimationMode(mode)}</p>
        <Control label="Playback" min={0.01} max={0.38} step={0.01} value={speed} onChange={onSpeed} />
        <Control label="Resolution" min={140} max={520} step={20} value={pixels} unit="px" onChange={onPixels} />
        <Control
          label="Field of view"
          min={1.4}
          max={3.8}
          step={0.05}
          value={scene.viewport.halfWidthArcsec}
          unit="″"
          onChange={(v) => onParam('halfWidth', v)}
        />
        {'thetaE' in main && (
          <Control label="Einstein θE" min={0.18} max={2.4} step={0.01} value={main.thetaE} unit="″" onChange={(v) => onParam('thetaE', v)} />
        )}
        {main.type === 'SoftenedIsothermalEllipse' && (
          <Control label="Axis ratio q" min={0.35} max={1} step={0.01} value={main.q} onChange={(v) => onParam('q', v)} />
        )}
        {main.type === 'SoftenedIsothermalEllipse' && (
          <Control label="Lens PA" min={0} max={180} step={1} value={main.phiDeg} unit="°" onChange={(v) => onParam('phiDeg', v)} />
        )}
        {shear?.type === 'ExternalShear' && (
          <Control label="Shear γ" min={0} max={0.18} step={0.005} value={shear.gamma} onChange={(v) => onParam('shear', v)} />
        )}
        {shear?.type === 'ExternalShear' && (
          <Control label="Shear PA" min={0} max={180} step={1} value={shear.phiDeg} unit="°" onChange={(v) => onParam('shearPA', v)} />
        )}
        <Control label="Source βx" min={-0.75} max={0.75} step={0.01} value={scene.source.profile.center[0]} onChange={(v) => onParam('sourceX', v)} />
        <Control label="Source βy" min={-0.75} max={0.75} step={0.01} value={scene.source.profile.center[1]} onChange={(v) => onParam('sourceY', v)} />
        <Control label="Source radius" min={0.02} max={0.42} step={0.005} value={scene.source.profile.radius} unit="″" onChange={(v) => onParam('sourceR', v)} />
        <Toggle label="Show ray-shooting vectors" checked={showVectors} onChange={onShowVectors} />
      </section>

      <section className="panel equation-panel">
        <p className="panel__eyebrow">Thin-lens core</p>
        <strong className="equation">{LENS_EQUATION}</strong>
        <p className="micro-copy">
          Every field above is generated from the same TypeScript physics core used by the PNG/JSON exports and the
          Python parity fixtures.
        </p>
      </section>
    </aside>
  );
}
