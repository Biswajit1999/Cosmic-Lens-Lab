/**
 * Pure scene-mutation helpers. Each returns a new LensScene; the live physics
 * core is never mutated in place so React state stays predictable.
 */
import type { LensComponent, LensScene } from '@cosmiclens/physics-core';
import { primaryMass, shearComponent } from './metrics';

export function cloneScene(scene: LensScene): LensScene {
  return JSON.parse(JSON.stringify(scene)) as LensScene;
}

export type ParamKey =
  | 'thetaE'
  | 'q'
  | 'phiDeg'
  | 'sourceX'
  | 'sourceY'
  | 'sourceR'
  | 'halfWidth'
  | 'shear'
  | 'shearPA';

export function setComponentParam(scene: LensScene, key: ParamKey, value: number): LensScene {
  const next = cloneScene(scene);
  const comp = primaryMass(next);

  if (comp) {
    if (key === 'thetaE' && 'thetaE' in comp) comp.thetaE = value;
    if (key === 'q' && comp.type === 'SoftenedIsothermalEllipse') comp.q = value;
    if (key === 'phiDeg' && comp.type === 'SoftenedIsothermalEllipse') comp.phiDeg = value;
  }

  if (key === 'sourceX') next.source.profile.center = [value, next.source.profile.center[1]];
  if (key === 'sourceY') next.source.profile.center = [next.source.profile.center[0], value];
  if (key === 'sourceR') next.source.profile.radius = value;
  if (key === 'halfWidth') next.viewport.halfWidthArcsec = value;

  const shear = shearComponent(next);
  if (key === 'shear' && shear?.type === 'ExternalShear') shear.gamma = value;
  if (key === 'shearPA' && shear?.type === 'ExternalShear') shear.phiDeg = value;

  return next;
}

export function componentSummary(scene: LensScene): string {
  const labels = scene.planes
    .flatMap((plane) => plane.components.map((c) => modelTag(c)))
    .filter((tag, index, all) => all.indexOf(tag) === index);
  return labels.join(' · ');
}

export function modelTag(component: LensComponent): string {
  switch (component.type) {
    case 'PointMass':
      return 'POINT';
    case 'SIS':
      return 'SIS';
    case 'SoftenedIsothermalEllipse':
      return 'SIE';
    case 'ExternalShear':
      return 'SHEAR';
    case 'NFW':
      return 'NFW';
    case 'SubhaloPointMass':
      return 'SUBHALO';
    default:
      return 'MODEL';
  }
}
