import type { Jacobian, LensComponent, LensPlane, LensSample, SourceProfile, Vec2 } from './types';
import { add, scale, sub } from './vector';
import { EPS } from './constants';
import {
  externalShearDeflection,
  externalShearPotential,
  nfwDeflection,
  pointMassDeflection,
  pointMassPotential,
  sisDeflection,
  sisPotential,
  softenedIsothermalEllipseDeflection,
  softenedIsothermalEllipsePotential,
} from './models';

export function componentDeflection(theta: Vec2, component: LensComponent): Vec2 {
  switch (component.type) {
    case 'PointMass':
    case 'SubhaloPointMass':
      return pointMassDeflection(theta, component.center, component.thetaE);
    case 'SIS':
      return sisDeflection(theta, component.center, component.thetaE);
    case 'SoftenedIsothermalEllipse':
      return softenedIsothermalEllipseDeflection(theta, component.center, component.thetaE, component.q, component.phiDeg, component.core);
    case 'ExternalShear':
      return externalShearDeflection(theta, component.gamma, component.phiDeg);
    case 'NFW':
      return nfwDeflection(theta, component.center, component.kappaS, component.radiusScale);
    default: {
      const neverComponent: never = component;
      throw new Error(`Unknown component ${(neverComponent as LensComponent).type}`);
    }
  }
}

export function componentPotential(theta: Vec2, component: LensComponent): number {
  switch (component.type) {
    case 'PointMass':
    case 'SubhaloPointMass':
      return pointMassPotential(theta, component.center, component.thetaE);
    case 'SIS':
      return sisPotential(theta, component.center, component.thetaE);
    case 'SoftenedIsothermalEllipse':
      return softenedIsothermalEllipsePotential(theta, component.center, component.thetaE, component.q, component.phiDeg, component.core);
    case 'ExternalShear':
      return externalShearPotential(theta, component.gamma, component.phiDeg);
    case 'NFW': {
      // Potential omitted in MVP; keep Fermat map valid for non-NFW demos.
      return 0;
    }
  }
}

export function totalDeflection(theta: Vec2, planes: LensPlane[]): Vec2 {
  let alpha: Vec2 = [0, 0];
  for (const plane of planes) {
    for (const component of plane.components) {
      alpha = add(alpha, componentDeflection(theta, component));
    }
  }
  return alpha;
}

export function totalPotential(theta: Vec2, planes: LensPlane[]): number {
  let psi = 0;
  for (const plane of planes) {
    for (const component of plane.components) {
      psi += componentPotential(theta, component);
    }
  }
  return psi;
}

export function lensEquation(theta: Vec2, planes: LensPlane[]): Vec2 {
  return sub(theta, totalDeflection(theta, planes));
}

export function fermatPotential(theta: Vec2, beta: Vec2, planes: LensPlane[]): number {
  const d = sub(theta, beta);
  return 0.5 * (d[0] * d[0] + d[1] * d[1]) - totalPotential(theta, planes);
}

export function finiteDifferenceJacobian(theta: Vec2, planes: LensPlane[], h = 1e-4): Jacobian {
  const bx1 = lensEquation([theta[0] + h, theta[1]], planes);
  const bx0 = lensEquation([theta[0] - h, theta[1]], planes);
  const by1 = lensEquation([theta[0], theta[1] + h], planes);
  const by0 = lensEquation([theta[0], theta[1] - h], planes);
  return {
    a11: (bx1[0] - bx0[0]) / (2 * h),
    a21: (bx1[1] - bx0[1]) / (2 * h),
    a12: (by1[0] - by0[0]) / (2 * h),
    a22: (by1[1] - by0[1]) / (2 * h),
  };
}

export function determinantA(j: Jacobian): number {
  return j.a11 * j.a22 - j.a12 * j.a21;
}

export function magnificationFromDet(detA: number): number {
  if (Math.abs(detA) < EPS) return Math.sign(detA || 1) * Number.POSITIVE_INFINITY;
  return 1 / detA;
}

export function sourceBrightness(beta: Vec2, source: SourceProfile): number {
  const dx = beta[0] - source.center[0];
  const dy = beta[1] - source.center[1];
  const q = source.axisRatio ?? 1;
  const phi = (source.phiDeg ?? 0) * Math.PI / 180;
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const x = c * dx + s * dy;
  const y = -s * dx + c * dy;
  const r = Math.sqrt(x * x + (y * y) / (q * q));
  const radius = Math.max(source.radius, EPS);

  if (source.type === 'SersicLight') {
    const n = source.n ?? 1;
    const bn = 1.9992 * n - 0.3271;
    return source.flux * Math.exp(-bn * (Math.pow(r / radius, 1 / n) - 1));
  }

  return source.flux * Math.exp(-0.5 * (r / radius) ** 2);
}

export function sampleLens(theta: Vec2, planes: LensPlane[], source: SourceProfile): LensSample {
  const alpha = totalDeflection(theta, planes);
  const beta = sub(theta, alpha);
  const jac = finiteDifferenceJacobian(theta, planes);
  const detA = determinantA(jac);
  const mu = magnificationFromDet(detA);
  const intensity = sourceBrightness(beta, source);
  return { theta, beta, alpha, detA, mu, intensity };
}

export function makeGrid(halfWidth: number, pixels: number): Vec2[] {
  const out: Vec2[] = [];
  const n = Math.max(2, Math.floor(pixels));
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -halfWidth + (2 * halfWidth * i) / (n - 1);
      const y = halfWidth - (2 * halfWidth * j) / (n - 1);
      out.push([x, y]);
    }
  }
  return out;
}

export function traceGrid(planes: LensPlane[], source: SourceProfile, halfWidth: number, pixels: number): LensSample[] {
  return makeGrid(halfWidth, pixels).map((theta) => sampleLens(theta, planes, source));
}

export function criticalCurveCells(planes: LensPlane[], halfWidth: number, cells: number): Vec2[] {
  const pts: Vec2[] = [];
  const n = Math.max(8, Math.floor(cells));
  const det = (x: number, y: number) => determinantA(finiteDifferenceJacobian([x, y], planes, 1e-3));
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const x0 = -halfWidth + (2 * halfWidth * i) / (n - 1);
      const y0 = halfWidth - (2 * halfWidth * j) / (n - 1);
      const x1 = -halfWidth + (2 * halfWidth * (i + 1)) / (n - 1);
      const y1 = halfWidth - (2 * halfWidth * (j + 1)) / (n - 1);
      const vals = [det(x0, y0), det(x1, y0), det(x0, y1), det(x1, y1)];
      const hasPos = vals.some((v) => v > 0);
      const hasNeg = vals.some((v) => v < 0);
      if (hasPos && hasNeg) pts.push([(x0 + x1) / 2, (y0 + y1) / 2]);
    }
  }
  return pts;
}

export function mapCaustics(criticalPts: Vec2[], planes: LensPlane[]): Vec2[] {
  return criticalPts.map((theta) => lensEquation(theta, planes));
}

export function addScaled(a: Vec2, b: Vec2, s: number): Vec2 {
  return add(a, scale(b, s));
}
