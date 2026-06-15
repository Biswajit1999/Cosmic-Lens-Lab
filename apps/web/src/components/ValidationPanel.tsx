import { useState } from 'react';
import type { AnimationMode, LensScene } from '@cosmiclens/physics-core';
import { evolveScene } from '@cosmiclens/physics-core';
import { parseScene, serialiseScene } from '@cosmiclens/schema';
import { downloadBlob } from '../utils/download';
import { slug } from '../utils/format';
import { Overlay } from './Overlay';

interface ValidationItem {
  label: string;
  detail: string;
  status: 'verified' | 'browser' | 'roadmap';
}

const VALIDATION: ValidationItem[] = [
  { label: 'Point-mass ring & double', detail: 'TypeScript output checked against the Python reference (pytest).', status: 'verified' },
  { label: 'SIS deflection & images', detail: 'Analytic singular-isothermal-sphere parity test.', status: 'verified' },
  { label: 'FrameGrid determinism', detail: 'Animation states are reproducible from the scene + mode + phase.', status: 'verified' },
  { label: 'Scene JSON round-trip', detail: 'Browser and Python tools consume the same scene schema.', status: 'browser' },
  { label: 'SIE / external shear', detail: 'Implemented in the browser core; broader regression fixtures pending.', status: 'browser' },
  { label: 'NFW lensing potential', detail: 'Deflection only; potential / Fermat surface not yet implemented.', status: 'roadmap' },
  { label: 'Multi-plane lensing', detail: 'Single thin-lens plane today; multi-plane is a planned extension.', status: 'roadmap' },
];

const STATUS_TONE: Record<ValidationItem['status'], string> = {
  verified: 'green',
  browser: 'cyan',
  roadmap: 'violet',
};

const STATUS_TEXT: Record<ValidationItem['status'], string> = {
  verified: 'Python-validated',
  browser: 'Browser core',
  roadmap: 'Roadmap',
};

interface ValidationPanelProps {
  open: boolean;
  scene: LensScene;
  mode: AnimationMode;
  onClose: () => void;
  onScene: (scene: LensScene) => void;
}

export function ValidationPanel({ open, scene, mode, onClose, onScene }: ValidationPanelProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  function loadCurrent() {
    setJsonText(serialiseScene(scene));
    setError(null);
  }

  function importJson() {
    try {
      onScene(parseScene(jsonText));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid scene JSON');
    }
  }

  function downloadScene() {
    downloadBlob(new Blob([serialiseScene(scene)], { type: 'application/json' }), `${slug(scene.name)}.json`);
  }

  function exportTimeline() {
    const frames = Array.from({ length: 24 }, (_, i) => evolveScene(scene, mode, i / 24, scene.animation?.amplitude ?? 1));
    downloadBlob(
      new Blob([JSON.stringify({ scene: scene.name, mode, frames }, null, 2)], { type: 'application/json' }),
      `cosmiclens-${mode}-timeline.json`,
    );
  }

  return (
    <Overlay open={open} title="Validation & reproducibility" eyebrow="Scientific honesty" onClose={onClose}>
      <p className="overlay__lead">
        CosmicLens Lab is a browser thin-lens laboratory, not a production lens-modelling pipeline. The table below
        states exactly what is verified, what runs in the browser core, and what is still on the roadmap.
      </p>

      <ul className="validation-list">
        {VALIDATION.map((item) => (
          <li key={item.label} className="validation-row">
            <span className={`status-badge tone-${STATUS_TONE[item.status]}`}>{STATUS_TEXT[item.status]}</span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="drawer-subhead">Scene JSON console</h3>
      <p className="micro-copy">The browser renderer and the Python validation tools consume this exact object.</p>
      <textarea
        className="json-area"
        value={jsonText}
        spellCheck={false}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder="Load the current scene, edit it, then import it back into the live console."
        aria-label="Scene JSON editor"
      />
      {error && <p className="json-error" role="alert">{error}</p>}
      <div className="button-grid">
        <button type="button" onClick={loadCurrent}>Load current scene</button>
        <button type="button" onClick={importJson}>Import edited JSON</button>
        <button type="button" onClick={downloadScene}>Download scene</button>
        <button type="button" onClick={exportTimeline}>Export timeline</button>
      </div>
    </Overlay>
  );
}
