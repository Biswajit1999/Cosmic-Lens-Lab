import { EPS } from '../constants';
import type { Vec2 } from '../types';
import { norm, sub } from '../vector';

const SMALL_X = 0.1;

/**
 * Circular NFW helper g(x) used by the reduced deflection
 * alpha(x) = 4 kappa_s theta_s g(x) / x.
 *
 * At small x, direct evaluation subtracts nearly equal logarithmic terms. The
 * series branch is carried through x^6 and is continuous with the analytic form
 * to better than 1e-6 relative near the switch.
 */
export function nfwG(xRaw: number): number {
  const x = Math.max(xRaw, EPS);
  if (x < SMALL_X) return nfwSmallG(x);
  if (Math.abs(x - 1) < 1e-5) return Math.log(0.5) + 1;
  if (x < 1) {
    const a = Math.sqrt((1 - x) / (1 + x));
    return Math.log(x / 2) + (2 / Math.sqrt(1 - x * x)) * atanh(a);
  }
  const a = Math.sqrt((x - 1) / (1 + x));
  return Math.log(x / 2) + (2 / Math.sqrt(x * x - 1)) * Math.atan(a);
}

/**
 * Dimensionless circular NFW lens potential shape h(x), where dh/dx = 2 g(x)/x.
 * With psi = 2 kappa_s theta_s^2 h(x), its spatial gradient is the same
 * reduced deflection returned by nfwDeflection.
 */
export function nfwPotentialShape(xRaw: number): number {
  const x = Math.max(xRaw, EPS);
  if (x < SMALL_X) return nfwSmallPotentialShape(x);
  if (Math.abs(x - 1) < 1e-5) return Math.log(0.5) ** 2;
  if (x < 1) {
    const q = Math.sqrt(1 - x * x);
    return Math.log(x / 2) ** 2 - atanh(q) ** 2;
  }
  const q = Math.sqrt(x * x - 1);
  return Math.log(x / 2) ** 2 + Math.atan(q) ** 2;
}

/**
 * Small-x expansion of g(x). It is derived from the same potential expansion
 * below, so the numerical identity dh/dx = 2g/x is maintained at the switch.
 */
function nfwSmallG(x: number): number {
  const logTerm = Math.log(2 / x);
  const x2 = x * x;
  const x4 = x2 * x2;
  const x6 = x4 * x2;
  return x2 * (0.5 * logTerm - 0.25)
    + x4 * ((3 * logTerm) / 8 - 7 / 32)
    + x6 * ((5 * logTerm) / 16 - 37 / 192);
}

/**
 * Small-x expansion of h(x) through x^6. The direct expression
 * log(x/2)^2 - atanh(sqrt(1-x^2))^2 loses precision near the origin.
 */
function nfwSmallPotentialShape(x: number): number {
  const logTerm = Math.log(2 / x);
  const x2 = x * x;
  const x4 = x2 * x2;
  const x6 = x4 * x2;
  return x2 * (0.5 * logTerm)
    + x4 * ((3 * logTerm) / 16 - 1 / 16)
    + x6 * ((5 * logTerm) / 48 - 3 / 64);
}

export function nfwDeflection(theta: Vec2, center: Vec2, kappaS: number, radiusScale: number): Vec2 {
  const d = sub(theta, center);
  const rPhysical = norm(d);
  if (rPhysical < EPS) return [0, 0];
  const rs = Math.max(radiusScale, EPS);
  const x = rPhysical / rs;
  const alphaMag = 4 * kappaS * rs * nfwG(x) / x;
  return [alphaMag * d[0] / rPhysical, alphaMag * d[1] / rPhysical];
}

/**
 * Analytic circular NFW lens potential in the same angular units as radiusScale.
 * The additive constant is chosen so that psi tends to zero at the halo centre.
 */
export function nfwPotential(theta: Vec2, center: Vec2, kappaS: number, radiusScale: number): number {
  const rs = Math.max(radiusScale, EPS);
  const r = norm(sub(theta, center));
  if (r < EPS) return 0;
  const x = r / rs;
  return 2 * kappaS * rs * rs * nfwPotentialShape(x);
}

function atanh(x: number): number {
  return 0.5 * Math.log((1 + x) / (1 - x));
}
