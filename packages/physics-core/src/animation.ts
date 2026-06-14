import type { AnimationMode, LensComponent, LensScene, Vec2 } from './types';

export interface TimelineOptions {
  mode: AnimationMode;
  frames: number;
  amplitude?: number;
  includeEndpoint?: boolean;
}

export function cloneScene(scene: LensScene): LensScene {
  return JSON.parse(JSON.stringify(scene)) as LensScene;
}

function firstMainComponent(scene: LensScene): LensComponent | undefined {
  return scene.planes[0]?.components.find((component) => component.type !== 'ExternalShear');
}

function shearComponent(scene: LensScene): Extract<LensComponent, { type: 'ExternalShear' }> | undefined {
  return scene.planes[0]?.components.find((component): component is Extract<LensComponent, { type: 'ExternalShear' }> => component.type === 'ExternalShear');
}

function subhaloComponent(scene: LensScene): Extract<LensComponent, { type: 'SubhaloPointMass' }> | undefined {
  return scene.planes[0]?.components.find((component): component is Extract<LensComponent, { type: 'SubhaloPointMass' }> => component.type === 'SubhaloPointMass');
}

function setSource(scene: LensScene, center: Vec2): void {
  scene.source.profile.center = center;
}

function phase01(phase: number): number {
  const wrapped = phase - Math.floor(phase);
  return wrapped < 0 ? wrapped + 1 : wrapped;
}

export function evolveScene(scene: LensScene, mode: AnimationMode, phase: number, amplitude = 1): LensScene {
  const next = cloneScene(scene);
  const p = phase01(phase);
  const angle = 2 * Math.PI * p;
  const base = scene.source.profile.center;
  const amp = Math.max(0.05, amplitude);
  const main = firstMainComponent(next);
  const shear = shearComponent(next);

  if (mode === 'source-orbit') {
    const orbit = 0.18 * amp;
    setSource(next, [base[0] + orbit * Math.cos(angle), base[1] + 0.62 * orbit * Math.sin(angle)]);
  }

  if (mode === 'caustic-breathing') {
    if (main && 'q' in main) main.q = Math.max(0.38, Math.min(0.98, main.q + 0.12 * amp * Math.sin(angle)));
    if (main && 'phiDeg' in main) main.phiDeg = (main.phiDeg + 18 * amp * Math.sin(angle / 2)) % 180;
    if (shear) shear.gamma = Math.max(0, Math.min(0.18, shear.gamma + 0.035 * amp * Math.cos(angle)));
  }

  if (mode === 'shear-rotation') {
    if (shear) {
      shear.phiDeg = (shear.phiDeg + 360 * p) % 180;
      shear.gamma = Math.max(0.005, Math.min(0.16, shear.gamma + 0.02 * amp * Math.sin(angle)));
    }
  }

  if (mode === 'subhalo-flyby') {
    let subhalo = subhaloComponent(next);
    if (!subhalo) {
      subhalo = { type: 'SubhaloPointMass', center: [-1.5, -0.6], thetaE: 0.055 };
      next.planes[0]?.components.push(subhalo);
    }
    subhalo.center = [-1.65 + 3.3 * p, -0.55 + 0.42 * Math.sin(angle)] as Vec2;
    subhalo.thetaE = 0.035 + 0.03 * amp;
  }

  if (mode === 'einstein-radius-pulse') {
    if (main && 'thetaE' in main) main.thetaE = Math.max(0.25, main.thetaE * (1 + 0.16 * amp * Math.sin(angle)));
  }

  if (mode === 'time-delay-sweep') {
    setSource(next, [base[0] + 0.22 * amp * Math.sin(angle), base[1] + 0.1 * amp * Math.sin(2 * angle)]);
    if (main && 'thetaE' in main) main.thetaE = Math.max(0.25, main.thetaE + 0.08 * amp * Math.cos(angle));
  }

  next.name = `${scene.name} · ${mode} · ${(p * 100).toFixed(0)}%`;
  return next;
}

export function makeTimeline(scene: LensScene, options: TimelineOptions): LensScene[] {
  const frames = Math.max(1, Math.floor(options.frames));
  const denom = options.includeEndpoint && frames > 1 ? frames - 1 : frames;
  return Array.from({ length: frames }, (_, i) => evolveScene(scene, options.mode, i / denom, options.amplitude ?? 1));
}

export function describeAnimationMode(mode: AnimationMode): string {
  switch (mode) {
    case 'source-orbit': return 'Source orbit: moves the background source through caustic topology to reveal changing image multiplicity.';
    case 'caustic-breathing': return 'Caustic breathing: modulates ellipticity and shear so critical curves open, fold, and contract.';
    case 'shear-rotation': return 'Shear rotation: rotates the environmental tidal field and exposes model-mismatch behaviour.';
    case 'subhalo-flyby': return 'Subhalo flyby: injects a compact perturbing mass and shows local residual/anomaly signatures.';
    case 'einstein-radius-pulse': return 'Einstein-radius pulse: changes lens mass scale and reveals ring growth and contraction.';
    case 'time-delay-sweep': return 'Time-delay sweep: moves the source while tracking the Fermat surface and relative delay pattern.';
  }
}
