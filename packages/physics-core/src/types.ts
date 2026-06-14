export type Vec2 = readonly [number, number];

export type LensComponent =
  | { type: 'PointMass'; center: Vec2; thetaE: number }
  | { type: 'SIS'; center: Vec2; thetaE: number }
  | { type: 'SoftenedIsothermalEllipse'; center: Vec2; thetaE: number; q: number; phiDeg: number; core: number }
  | { type: 'ExternalShear'; gamma: number; phiDeg: number }
  | { type: 'NFW'; center: Vec2; kappaS: number; radiusScale: number }
  | { type: 'SubhaloPointMass'; center: Vec2; thetaE: number };

export interface LensPlane {
  z: number;
  components: LensComponent[];
}

export interface SourceProfile {
  type: 'Gaussian' | 'SersicLight';
  center: Vec2;
  radius: number;
  flux: number;
  n?: number;
  axisRatio?: number;
  phiDeg?: number;
}

export interface LensScene {
  version: string;
  name: string;
  cosmology: {
    kind: 'flatLCDM';
    H0: number;
    Om0: number;
  };
  planes: LensPlane[];
  source: {
    z: number;
    profile: SourceProfile;
  };
  viewport: {
    halfWidthArcsec: number;
    pixels: number;
  };
  instrument?: {
    pixelScaleArcsec?: number;
    psfFwhmArcsec?: number;
    skyBackground?: number;
    readNoise?: number;
  };
  animation?: {
    mode?: AnimationMode;
    durationSec?: number;
    frames?: number;
    amplitude?: number;
  };
}

export type AnimationMode =
  | 'source-orbit'
  | 'caustic-breathing'
  | 'shear-rotation'
  | 'subhalo-flyby'
  | 'einstein-radius-pulse'
  | 'time-delay-sweep';

export interface Jacobian {
  a11: number;
  a12: number;
  a21: number;
  a22: number;
}

export interface LensSample {
  theta: Vec2;
  beta: Vec2;
  alpha: Vec2;
  detA: number;
  mu: number;
  intensity: number;
}
