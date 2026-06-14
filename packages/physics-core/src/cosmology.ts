import { C_KM_S } from './constants';

export interface FlatLCDM {
  H0: number;
  Om0: number;
}

export function eZ(z: number, cosmo: FlatLCDM): number {
  const ol0 = 1 - cosmo.Om0;
  return Math.sqrt(cosmo.Om0 * (1 + z) ** 3 + ol0);
}

export function comovingDistanceMpc(z: number, cosmo: FlatLCDM, n = 2048): number {
  const steps = n % 2 === 0 ? n : n + 1;
  const h = z / steps;
  let sum = 1 / eZ(0, cosmo) + 1 / eZ(z, cosmo);
  for (let i = 1; i < steps; i++) {
    const zi = i * h;
    sum += (i % 2 === 0 ? 2 : 4) / eZ(zi, cosmo);
  }
  return (C_KM_S / cosmo.H0) * (h / 3) * sum;
}

export function angularDiameterDistanceMpc(z: number, cosmo: FlatLCDM): number {
  return comovingDistanceMpc(z, cosmo) / (1 + z);
}

export function angularDiameterDistanceBetweenMpc(z1: number, z2: number, cosmo: FlatLCDM): number {
  if (z2 <= z1) return 0;
  return (comovingDistanceMpc(z2, cosmo) - comovingDistanceMpc(z1, cosmo)) / (1 + z2);
}

export function timeDelayDistanceMpc(zD: number, zS: number, cosmo: FlatLCDM): number {
  const dd = angularDiameterDistanceMpc(zD, cosmo);
  const ds = angularDiameterDistanceMpc(zS, cosmo);
  const dds = angularDiameterDistanceBetweenMpc(zD, zS, cosmo);
  return (dd * ds) / Math.max(dds, 1e-9);
}
