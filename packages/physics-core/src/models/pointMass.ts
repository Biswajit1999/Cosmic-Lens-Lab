import { EPS } from '../constants';
import type { Vec2 } from '../types';
import { norm2, sub } from '../vector';

export function pointMassDeflection(theta: Vec2, center: Vec2, thetaE: number): Vec2 {
  const d = sub(theta, center);
  const r2 = Math.max(norm2(d), EPS * EPS);
  const f = (thetaE * thetaE) / r2;
  return [f * d[0], f * d[1]];
}

export function pointMassPotential(theta: Vec2, center: Vec2, thetaE: number): number {
  const d = sub(theta, center);
  return thetaE * thetaE * Math.log(Math.sqrt(Math.max(norm2(d), EPS * EPS)));
}

export function pointMassImagePositions1D(beta: number, thetaE: number): [number, number] {
  const disc = Math.sqrt(beta * beta + 4 * thetaE * thetaE);
  return [0.5 * (beta + disc), 0.5 * (beta - disc)];
}

export function pointMassMagnifications1D(beta: number, thetaE: number): [number, number] {
  const u = Math.max(Math.abs(beta / thetaE), EPS);
  const term = (u * u + 2) / (2 * u * Math.sqrt(u * u + 4));
  return [0.5 + term, 0.5 - term];
}
