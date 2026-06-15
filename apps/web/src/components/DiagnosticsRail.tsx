import { useEffect, useRef } from 'react';
import type { LensScene, RenderMode } from '@cosmiclens/physics-core';
import { renderInset } from '../render/lensingCanvas';
import { fermatDefined } from '../data/metrics';

interface InsetProps {
  title: string;
  mode: RenderMode;
  scene: LensScene;
  caption: string;
  colorbar: 'turbo' | 'diverging' | 'mono';
  disabled?: boolean;
  disabledNote?: string;
}

function Inset({ title, mode, scene, caption, colorbar, disabled, disabledNote }: InsetProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = 320;
    canvas.height = 190;
    if (disabled) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#05080f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    renderInset(canvas, scene, mode);
  }, [scene, mode, disabled]);

  return (
    <article className="inset">
      <div className="inset__head">
        <span>{title}</span>
        <em>{mode}</em>
      </div>
      <div className="inset__stage">
        <canvas ref={ref} aria-label={`${title} inset`} />
        {disabled && <div className="inset__disabled">{disabledNote}</div>}
      </div>
      <div className={`colorbar colorbar--${colorbar}`} aria-hidden="true" />
      <p className="inset__caption">{caption}</p>
    </article>
  );
}

interface DiagnosticsRailProps {
  scene: LensScene;
}

export function DiagnosticsRail({ scene }: DiagnosticsRailProps) {
  const fermatOk = fermatDefined(scene);
  return (
    <aside className="rail rail--right" aria-label="Diagnostics">
      <section className="panel">
        <div className="panel__head compact">
          <p className="panel__eyebrow">Diagnostics</p>
          <h3 className="panel__title sm">Analysis insets</h3>
        </div>
        <Inset
          title="Magnification μ"
          mode="magnification"
          scene={scene}
          colorbar="turbo"
          caption="Log-scaled amplification structure around the critical region."
        />
        <Inset
          title="Anomaly residual"
          mode="residual"
          scene={scene}
          colorbar="diverging"
          caption="Perturbation-sensitive proxy for flux-ratio / substructure signatures."
        />
        <Inset
          title="Image parity"
          mode="parity"
          scene={scene}
          colorbar="diverging"
          caption="Saddle vs. minimum images from the sign of det A."
        />
        <Inset
          title="Fermat surface φ"
          mode="time-delay"
          scene={scene}
          colorbar="mono"
          caption="Relative arrival-time terrain for the active source geometry."
          disabled={!fermatOk}
          disabledNote="NFW potential omitted — roadmap"
        />
      </section>
    </aside>
  );
}
