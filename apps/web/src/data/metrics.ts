/**
 * Telemetry derivation.
 *
 * Everything in this file is computed from the real @cosmiclens/physics-core
 * thin-lens implementation and standard textbook relations. No value here is a
 * decorative placeholder — when a quantity is only valid for a subset of models
 * (e.g. an SIS-equivalent velocity dispersion) the caveat is encoded in the
 * field's `note` so the UI can label it honestly.
 */
import type { LensComponent, LensScene, RenderStats, Vec2 } from '@cosmiclens/physics-core';
import {
  C_KM_S,
  G_SI,
  ARCSEC_TO_RAD,
  angularDiameterDistanceMpc,
  angularDiameterDistanceBetweenMpc,
  timeDelayDistanceMpc,
  finiteDifferenceJacobian,
} from '@cosmiclens/physics-core';

const MPC_IN_M = 3.0856775815e22;
const M_SUN_KG = 1.98847e30;
const C_M_S = C_KM_S * 1000;

export interface TelemetryField {
  key: string;
  label: string;
  symbol?: string;
  value: string;
  unit?: string;
  note?: string;
  /** Raw numeric value for sparklines / charts, when meaningful. */
  raw?: number;
}

export function primaryMass(scene: LensScene): LensComponent | undefined {
  return scene.planes[0]?.components.find((c) => c.type !== 'ExternalShear');
}

export function shearComponent(scene: LensScene): LensComponent | undefined {
  return scene.planes[0]?.components.find((c) => c.type === 'ExternalShear');
}

export function einsteinRadius(scene: LensScene): number | null {
  const c = primaryMass(scene);
  if (c && 'thetaE' in c) return c.thetaE;
  return null;
}

/** Angular-diameter distances (Mpc) for the dominant lens plane and source. */
export function distances(scene: LensScene): { dd: number; ds: number; dds: number; ddt: number } {
  const cosmo = { H0: scene.cosmology.H0, Om0: scene.cosmology.Om0 };
  const zl = scene.planes[0]?.z ?? 0;
  const zs = scene.source.z;
  return {
    dd: angularDiameterDistanceMpc(zl, cosmo),
    ds: angularDiameterDistanceMpc(zs, cosmo),
    dds: angularDiameterDistanceBetweenMpc(zl, zs, cosmo),
    ddt: timeDelayDistanceMpc(zl, zs, cosmo),
  };
}

/**
 * SIS-equivalent velocity dispersion from θE = 4π (σ/c)² D_ds/D_s.
 * Returns null when the source is in front of the lens (D_ds ≤ 0).
 */
export function velocityDispersion(scene: LensScene): number | null {
  const thetaE = einsteinRadius(scene);
  if (thetaE === null) return null;
  const { ds, dds } = distances(scene);
  if (dds <= 0 || ds <= 0) return null;
  const thetaRad = thetaE * ARCSEC_TO_RAD;
  const sigma = C_KM_S * Math.sqrt((thetaRad / (4 * Math.PI)) * (ds / dds));
  return sigma;
}

/**
 * Projected lensing mass enclosed within the Einstein radius:
 * M(<θE) = (c²/4G) θE² D_d D_s / D_ds.  Returns solar masses.
 */
export function einsteinMass(scene: LensScene): number | null {
  const thetaE = einsteinRadius(scene);
  if (thetaE === null) return null;
  const { dd, ds, dds } = distances(scene);
  if (dds <= 0) return null;
  const thetaRad = thetaE * ARCSEC_TO_RAD;
  const dEff = (dd * ds) / dds; // Mpc
  const mass = ((C_M_S * C_M_S) / (4 * G_SI)) * thetaRad * thetaRad * dEff * MPC_IN_M;
  return mass / M_SUN_KG;
}

/**
 * Convergence κ and shear γ evaluated at a representative radius along +x.
 * Uses the lens Jacobian A = ∂β/∂θ: κ = 1 − ½ tr A, γ = |(½(A11−A22), A12)|.
 */
export function convergenceShear(scene: LensScene, radiusArcsec: number): { kappa: number; gamma: number } {
  const point: Vec2 = [Math.max(radiusArcsec, 0.05), 0];
  const a = finiteDifferenceJacobian(point, scene.planes);
  const kappa = 1 - 0.5 * (a.a11 + a.a22);
  const g1 = -0.5 * (a.a11 - a.a22);
  const g2 = -0.5 * (a.a12 + a.a21);
  const gamma = Math.hypot(g1, g2);
  return { kappa, gamma };
}

/** True when every lens component has an analytic potential (Fermat surface is valid). */
export function fermatDefined(scene: LensScene): boolean {
  return scene.planes.every((plane) => plane.components.every((c) => c.type !== 'NFW'));
}

/**
 * Assemble the left-rail telemetry block. Pulls real render statistics in for
 * magnification / parity / Fermat span and derives the physical quantities.
 */
export function buildTelemetry(scene: LensScene, stats: RenderStats | null): TelemetryField[] {
  const thetaE = einsteinRadius(scene);
  const sigma = velocityDispersion(scene);
  const mass = einsteinMass(scene);
  const { kappa, gamma } = convergenceShear(scene, thetaE ?? 1);
  const shear = shearComponent(scene);
  const extGamma = shear && shear.type === 'ExternalShear' ? shear.gamma : null;
  const { ddt } = distances(scene);
  const hasFermatPotential = fermatDefined(scene);
  const fermatSpan = hasFermatPotential && stats ? stats.maxDelay - stats.minDelay : undefined;

  const fields: TelemetryField[] = [
    {
      key: 'thetaE',
      label: 'Einstein radius',
      symbol: 'θE',
      value: thetaE === null ? '—' : thetaE.toFixed(3),
      unit: '″',
      raw: thetaE ?? undefined,
    },
    {
      key: 'sigma',
      label: 'Velocity dispersion',
      symbol: 'σv',
      value: sigma === null ? '—' : sigma.toFixed(0),
      unit: 'km/s',
      note: 'SIS-equivalent',
      raw: sigma ?? undefined,
    },
    {
      key: 'mass',
      label: 'Mass within θE',
      symbol: 'M',
      value: mass === null ? '—' : formatMass(mass),
      unit: 'M⊙',
      raw: mass ?? undefined,
    },
    {
      key: 'kappa',
      label: 'Convergence',
      symbol: 'κ',
      value: kappa.toFixed(3),
      note: `at θ≈${(thetaE ?? 1).toFixed(2)}″`,
      raw: kappa,
    },
    {
      key: 'gamma',
      label: 'Total shear',
      symbol: 'γ',
      value: gamma.toFixed(3),
      note: extGamma === null ? 'model Jacobian' : `ext γ=${extGamma.toFixed(3)}`,
      raw: gamma,
    },
    {
      key: 'mu',
      label: 'Peak magnification',
      symbol: '|μ|',
      value: stats ? stats.maxAbsMu.toFixed(1) : '—',
      raw: stats?.maxAbsMu,
    },
    {
      key: 'parity',
      label: 'Negative-parity area',
      symbol: '∂',
      value: stats ? `${(100 * stats.negativeParityFraction).toFixed(1)}%` : '—',
      note: 'saddle-image region',
      raw: stats?.negativeParityFraction,
    },
    {
      key: 'fermat',
      label: 'Fermat span',
      symbol: 'Δφ',
      value: fermatSpan === undefined ? '—' : fermatSpan.toFixed(3),
      note: hasFermatPotential ? 'relative arrival-time' : 'NFW potential not implemented',
      raw: fermatSpan,
    },
    {
      key: 'ddt',
      label: 'Time-delay distance',
      symbol: 'DΔt',
      value: ddt > 0 ? Math.round(ddt).toLocaleString() : '—',
      unit: 'Mpc',
      raw: ddt,
    },
  ];
  return fields;
}

function formatMass(value: number): string {
  const exp = Math.floor(Math.log10(value));
  const mantissa = value / 10 ** exp;
  return `${mantissa.toFixed(2)}e${exp}`;
}
