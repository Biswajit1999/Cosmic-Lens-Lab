import { DEG } from '../constants';
import type { Vec2 } from '../types';

export function externalShearDeflection(theta: Vec2, gamma: number, phiDeg: number): Vec2 {
  const t = 2 * phiDeg * DEG;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [gamma * (c * theta[0] + s * theta[1]), gamma * (s * theta[0] - c * theta[1])];
}

export function externalShearPotential(theta: Vec2, gamma: number, phiDeg: number): number {
  const t = 2 * phiDeg * DEG;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const x = theta[0];
  const y = theta[1];
  return 0.5 * gamma * (c * (x * x - y * y) + 2 * s * x * y);
}
