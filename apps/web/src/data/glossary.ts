/** Compact, scientifically-correct reference shown in the Physics drawer. */

export interface GlossaryEntry {
  symbol: string;
  term: string;
  detail: string;
}

export const LENS_EQUATION = 'β = θ − α(θ)';
export const FERMAT_POTENTIAL = 'φ(θ,β) = ½|θ − β|² − ψ(θ)';
export const TIME_DELAY = 'Δt = (DΔt / c) · Δφ';
export const MAGNIFICATION = 'μ = 1 / det A,  A = ∂β/∂θ';

export const GLOSSARY: GlossaryEntry[] = [
  { symbol: 'θ', term: 'Image plane', detail: 'Observed angular position of a lensed image on the sky.' },
  { symbol: 'β', term: 'Source plane', detail: 'Unlensed angular position the light would occupy without the lens.' },
  { symbol: 'α', term: 'Deflection', detail: 'Scaled deflection angle produced by the projected mass distribution.' },
  { symbol: 'κ', term: 'Convergence', detail: 'Dimensionless surface mass density, Σ / Σ_crit; κ = 1 − ½ tr A.' },
  { symbol: 'γ', term: 'Shear', detail: 'Anisotropic stretching of images; sets ellipticity of the distortion.' },
  { symbol: 'μ', term: 'Magnification', detail: 'Flux amplification 1/det A; diverges on critical curves.' },
  { symbol: 'φ', term: 'Fermat potential', detail: 'Geometric + gravitational arrival-time surface; images form at its stationary points.' },
  { symbol: 'DΔt', term: 'Time-delay distance', detail: 'D_d D_s / D_ds; sets the absolute scale of measured time delays and ∝ 1/H₀.' },
];

export interface ModelEntry {
  tag: string;
  name: string;
  detail: string;
  status: 'live' | 'prototype';
}

export const MODELS: ModelEntry[] = [
  { tag: 'POINT', name: 'Point mass', detail: 'Exact analytic ring / double; benchmark against Python fixtures.', status: 'live' },
  { tag: 'SIS', name: 'Singular isothermal sphere', detail: 'Flat rotation curve lens; α = θE θ̂.', status: 'live' },
  { tag: 'SIE', name: 'Softened isothermal ellipse', detail: 'Elliptical galaxy lens with core; produces quads, folds, cusps.', status: 'live' },
  { tag: 'SHEAR', name: 'External shear', detail: 'Tidal field from line-of-sight structure; breaks azimuthal symmetry.', status: 'live' },
  { tag: 'NFW', name: 'Navarro–Frenk–White halo', detail: 'Cluster / dark-matter halo deflection. Potential term is a roadmap item.', status: 'prototype' },
  { tag: 'SUBHALO', name: 'Compact subhalo', detail: 'Point-mass perturber for flux-ratio / time-delay anomaly studies.', status: 'live' },
];

export const RENDER_MODE_HELP: Record<string, string> = {
  lensed: 'Surface-brightness reconstruction in the image plane.',
  magnification: 'Log-scaled |μ| field around the critical region.',
  'time-delay': 'Relative Fermat arrival-time surface (analytic-potential models).',
  parity: 'Image parity / det A sign map (saddle vs. minimum).',
  'source-plane': 'Intrinsic source brightness before lensing.',
  residual: 'Perturbation-sensitive residual proxy for anomaly hunting.',
};
