import type { LensScene } from '@cosmiclens/physics-core';

export const SCENE_VERSION = '1.0';

export function makeDefaultScene(): LensScene {
  return {
    version: SCENE_VERSION,
    name: 'SIE-like quad demo',
    cosmology: { kind: 'flatLCDM', H0: 70, Om0: 0.3 },
    planes: [
      {
        z: 0.35,
        components: [
          { type: 'SoftenedIsothermalEllipse', center: [0, 0], thetaE: 1.05, q: 0.72, phiDeg: 32, core: 0.04 },
          { type: 'ExternalShear', gamma: 0.04, phiDeg: 78 },
        ],
      },
    ],
    source: {
      z: 1.5,
      profile: { type: 'Gaussian', center: [0.08, 0.03], radius: 0.08, flux: 1 },
    },
    viewport: { halfWidthArcsec: 2.2, pixels: 260 },
  };
}

export function serialiseScene(scene: LensScene): string {
  return JSON.stringify(scene, null, 2);
}

export function parseScene(text: string): LensScene {
  const parsed = JSON.parse(text) as LensScene;
  if (!parsed.version || !parsed.planes || !parsed.source) {
    throw new Error('Invalid CosmicLens scene: missing required fields.');
  }
  return parsed;
}

export * from './presets';
