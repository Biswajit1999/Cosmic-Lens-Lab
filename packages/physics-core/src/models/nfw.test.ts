import { describe, expect, it } from 'vitest';
import { nfwDeflection, nfwPotential, nfwPotentialShape } from './nfw';

const center: [number, number] = [0.14, -0.09];
const kappaS = 0.19;
const radiusScale = 0.62;

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(1e-12, Math.abs(expected));
}

describe('NFW potential', () => {
  it('is finite from the centre through and beyond the scale radius', () => {
    expect(nfwPotential(center, center, kappaS, radiusScale)).toBe(0);
    for (const x of [1e-8, 1e-6, 1e-4, 1e-3, 0.01, 0.1, 0.9, 1, 1.1, 5]) {
      expect(Number.isFinite(nfwPotentialShape(x))).toBe(true);
    }
  });

  it('has numerical derivatives consistent with the reduced deflection', () => {
    for (const radius of [1e-4, 5e-4, 0.001, 0.006, 0.03, 0.11, 0.37, 0.61, 0.93, 2.2]) {
      const theta: [number, number] = [center[0] + radius, center[1] + 0.37 * radius];
      const h = Math.max(1e-9, radius * 1e-5);
      const dx = (nfwPotential([theta[0] + h, theta[1]], center, kappaS, radiusScale) - nfwPotential([theta[0] - h, theta[1]], center, kappaS, radiusScale)) / (2 * h);
      const dy = (nfwPotential([theta[0], theta[1] + h], center, kappaS, radiusScale) - nfwPotential([theta[0], theta[1] - h], center, kappaS, radiusScale)) / (2 * h);
      const alpha = nfwDeflection(theta, center, kappaS, radiusScale);
      expect(relativeError(dx, alpha[0])).toBeLessThan(2e-5);
      expect(relativeError(dy, alpha[1])).toBeLessThan(2e-5);
    }
  });
});
