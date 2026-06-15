/**
 * Small numeric / string formatting helpers used across the console UI.
 * Kept dependency-free and pure so they can be unit-tested in isolation.
 */

export function fixed(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(decimals);
}

export function sci(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e-3 && abs < 1e5) return value.toFixed(decimals);
  return value.toExponential(decimals);
}

export function percent(fraction: number, decimals = 1): string {
  if (!Number.isFinite(fraction)) return '—';
  return `${(100 * fraction).toFixed(decimals)}%`;
}

/** Format large solar-mass numbers compactly, e.g. 4.2e11 M⊙. */
export function solarMass(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  const exp = Math.floor(Math.log10(value));
  const mantissa = value / 10 ** exp;
  return `${mantissa.toFixed(2)}×10^${exp}`;
}

export function degrees(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(1)}°`;
}

export function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function phaseDegrees(phase: number): string {
  return `${((phase % 1) * 360).toFixed(1)}°`;
}
