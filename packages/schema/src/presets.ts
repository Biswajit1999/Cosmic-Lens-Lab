import type { LensScene } from '@cosmiclens/physics-core';
import { makeDefaultScene } from './index';

export type PresetId = 'quad-lab' | 'einstein-ring' | 'subhalo-anomaly' | 'cluster-nfw' | 'time-delay';

export interface ScenePreset {
  id: PresetId;
  title: string;
  description: string;
  scene: LensScene;
}

export function makeScenePresets(): ScenePreset[] {
  const quad = makeDefaultScene();
  quad.name = 'Cinematic SIE Quad Lab';
  quad.animation = { mode: 'caustic-breathing', durationSec: 10, frames: 16, amplitude: 1 };

  const ring = makeDefaultScene();
  ring.name = 'Einstein Ring Pulse';
  ring.planes[0].components = [{ type: 'PointMass', center: [0, 0], thetaE: 1.05 }];
  ring.source.profile.center = [0.01, 0.0];
  ring.source.profile.radius = 0.055;
  ring.animation = { mode: 'einstein-radius-pulse', durationSec: 8, frames: 12, amplitude: 1 };

  const subhalo = makeDefaultScene();
  subhalo.name = 'Subhalo Perturbation Theatre';
  subhalo.planes[0].components.push({ type: 'SubhaloPointMass', center: [-1.0, -0.35], thetaE: 0.065 });
  subhalo.source.profile.center = [0.11, 0.035];
  subhalo.animation = { mode: 'subhalo-flyby', durationSec: 12, frames: 20, amplitude: 1.1 };

  const cluster = makeDefaultScene();
  cluster.name = 'NFW Cluster Arc Factory';
  cluster.viewport.halfWidthArcsec = 3.2;
  cluster.planes[0].components = [
    { type: 'NFW', center: [0, 0], kappaS: 0.38, radiusScale: 1.25 },
    { type: 'SIS', center: [-0.85, 0.45], thetaE: 0.36 },
    { type: 'SIS', center: [0.8, -0.35], thetaE: 0.24 },
    { type: 'ExternalShear', gamma: 0.055, phiDeg: 42 },
  ];
  cluster.source.profile = { type: 'SersicLight', center: [0.2, 0.1], radius: 0.14, flux: 1, n: 1.2, axisRatio: 0.55, phiDeg: 35 };
  cluster.animation = { mode: 'source-orbit', durationSec: 14, frames: 16, amplitude: 1.25 };

  const delay = makeDefaultScene();
  delay.name = 'Fermat Time-Delay Sandbox';
  delay.source.profile.center = [0.15, -0.02];
  delay.animation = { mode: 'time-delay-sweep', durationSec: 10, frames: 12, amplitude: 1 };

  return [
    { id: 'quad-lab', title: 'Quad Lab', description: 'Elliptical galaxy lens with shear, caustics, and critical curves.', scene: quad },
    { id: 'einstein-ring', title: 'Einstein Ring', description: 'Exact point-mass ring demo with mass-scale pulse animation.', scene: ring },
    { id: 'subhalo-anomaly', title: 'Subhalo Flyby', description: 'Compact perturber moving across a quad field to reveal anomaly signatures.', scene: subhalo },
    { id: 'cluster-nfw', title: 'Cluster Arc Factory', description: 'NFW halo plus galaxy perturbers for wide arc formation.', scene: cluster },
    { id: 'time-delay', title: 'Time Delay', description: 'Fermat-potential sweep for toy cosmography storytelling.', scene: delay },
  ];
}
