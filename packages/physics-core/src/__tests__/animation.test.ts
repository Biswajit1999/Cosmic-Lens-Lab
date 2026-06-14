import { describe, expect, it } from 'vitest';
import { evolveScene, makeTimeline } from '../animation';
import type { LensScene } from '../types';

const scene: LensScene = {
  version: '1.0',
  name: 'test',
  cosmology: { kind: 'flatLCDM', H0: 70, Om0: 0.3 },
  planes: [{ z: 0.35, components: [{ type: 'PointMass', center: [0, 0], thetaE: 1 }] }],
  source: { z: 1.5, profile: { type: 'Gaussian', center: [0.1, 0.0], radius: 0.08, flux: 1 } },
  viewport: { halfWidthArcsec: 2, pixels: 120 },
};

describe('animation engine', () => {
  it('creates deterministic timeline frames', () => {
    const frames = makeTimeline(scene, { mode: 'source-orbit', frames: 6 });
    expect(frames).toHaveLength(6);
    expect(frames[0].source.profile.center[0]).not.toEqual(frames[3].source.profile.center[0]);
  });

  it('does not mutate the input scene', () => {
    const before = scene.source.profile.center[0];
    evolveScene(scene, 'source-orbit', 0.25, 1);
    expect(scene.source.profile.center[0]).toEqual(before);
  });
});
