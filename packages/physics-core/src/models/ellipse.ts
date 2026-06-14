import { DEG, EPS } from '../constants';
import type { Vec2 } from '../types';
import { rotate, sub } from '../vector';

/**
 * Interactive softened isothermal ellipse approximation.
 *
 * This is not a strict Kormann SIE implementation. It is a stable visual model
 * for MVP interaction and should be replaced by a fully documented SIE later.
 */
export function softenedIsothermalEllipseDeflection(
  theta: Vec2,
  center: Vec2,
  thetaE: number,
  q: number,
  phiDeg: number,
  core: number,
): Vec2 {
  const qp = Math.max(0.2, Math.min(1.0, q));
  const local = rotate(sub(theta, center), -phiDeg * DEG);
  const x = local[0];
  const y = local[1];
  const m = Math.sqrt(core * core + qp * qp * x * x + y * y / (qp * qp) + EPS * EPS);
  const axLocal = thetaE * qp * x / m;
  const ayLocal = thetaE * y / (qp * m);
  return rotate([axLocal, ayLocal], phiDeg * DEG);
}

export function softenedIsothermalEllipsePotential(
  theta: Vec2,
  center: Vec2,
  thetaE: number,
  q: number,
  phiDeg: number,
  core: number,
): number {
  const qp = Math.max(0.2, Math.min(1.0, q));
  const local = rotate(sub(theta, center), -phiDeg * DEG);
  const x = local[0];
  const y = local[1];
  const m = Math.sqrt(core * core + qp * qp * x * x + y * y / (qp * qp) + EPS * EPS);
  return thetaE * m;
}
