import { EPS } from '../constants';
import type { Vec2 } from '../types';
import { norm, sub } from '../vector';

export function sisDeflection(theta: Vec2, center: Vec2, thetaE: number): Vec2 {
  const d = sub(theta, center);
  const r = Math.max(norm(d), EPS);
  return [thetaE * d[0] / r, thetaE * d[1] / r];
}

export function sisPotential(theta: Vec2, center: Vec2, thetaE: number): number {
  const d = sub(theta, center);
  return thetaE * Math.max(norm(d), EPS);
}

export function sisImagePositions1D(beta: number, thetaE: number): number[] {
  if (Math.abs(beta) >= thetaE) {
    return [beta + Math.sign(beta || 1) * thetaE];
  }
  return [beta + thetaE, beta - thetaE];
}
