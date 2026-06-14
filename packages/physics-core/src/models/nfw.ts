import { EPS } from '../constants';
import type { Vec2 } from '../types';
import { norm, sub } from '../vector';

export function nfwG(xRaw: number): number {
  const x = Math.max(xRaw, EPS);
  if (Math.abs(x - 1) < 1e-5) return Math.log(0.5) + 1;
  if (x < 1) {
    const a = Math.sqrt((1 - x) / (1 + x));
    return Math.log(x / 2) + (2 / Math.sqrt(1 - x * x)) * atanh(a);
  }
  const a = Math.sqrt((x - 1) / (1 + x));
  return Math.log(x / 2) + (2 / Math.sqrt(x * x - 1)) * Math.atan(a);
}

export function nfwDeflection(theta: Vec2, center: Vec2, kappaS: number, radiusScale: number): Vec2 {
  const d = sub(theta, center);
  const r = Math.max(norm(d), EPS);
  const x = r / Math.max(radiusScale, EPS);
  const alphaMag = 4 * kappaS * radiusScale * nfwG(x) / x;
  return [alphaMag * d[0] / r, alphaMag * d[1] / r];
}

function atanh(x: number): number {
  return 0.5 * Math.log((1 + x) / (1 - x));
}
