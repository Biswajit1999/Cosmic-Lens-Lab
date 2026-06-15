/**
 * UI metadata layered on top of the canonical scene presets exported by
 * @cosmiclens/schema. The scenes themselves are the source of truth; this file
 * only adds display copy, a model-family tag, and an honest implementation
 * status so the gallery never overclaims what the browser core computes.
 */
import { makeScenePresets, type ScenePreset } from '@cosmiclens/schema';

export type FeatureStatus = 'live' | 'prototype' | 'roadmap';

export interface PresetCard {
  preset: ScenePreset;
  family: string;
  config: string;
  status: FeatureStatus;
  caveat?: string;
}

const META: Record<string, Omit<PresetCard, 'preset'>> = {
  'quad-lab': {
    family: 'SIE + external shear',
    config: 'Quad / fold + cusp',
    status: 'live',
  },
  'einstein-ring': {
    family: 'Point mass',
    config: 'Complete ring',
    status: 'live',
  },
  'subhalo-anomaly': {
    family: 'SIE + compact perturber',
    config: 'Flux-ratio anomaly',
    status: 'live',
  },
  'cluster-nfw': {
    family: 'NFW halo + galaxies',
    config: 'Giant arcs',
    status: 'prototype',
    caveat: 'NFW potential omitted in core — Fermat / time-delay maps are not defined for this scene yet.',
  },
  'time-delay': {
    family: 'SIE + shear',
    config: 'Cosmography sandbox',
    status: 'live',
  },
};

export function buildPresetCards(): PresetCard[] {
  return makeScenePresets().map((preset) => ({
    preset,
    ...(META[preset.id] ?? { family: 'Custom', config: 'Scene', status: 'live' as FeatureStatus }),
  }));
}

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  live: 'Live',
  prototype: 'Prototype',
  roadmap: 'Roadmap',
};
