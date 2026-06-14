export interface WebGPUCapabilityReport {
  available: boolean;
  reason?: string;
  features: string[];
  limits?: Record<string, number>;
}

type NavigatorWithGPU = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<GPUAdapter | null>;
  };
};

type GPUAdapter = {
  features?: Set<string>;
  limits?: Record<string, number>;
  requestDevice?: () => Promise<unknown>;
};

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export async function requestWebGPUAdapter(): Promise<GPUAdapter | null> {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as NavigatorWithGPU;
  if (!nav.gpu) return null;
  return await nav.gpu.requestAdapter();
}

export async function inspectWebGPU(): Promise<WebGPUCapabilityReport> {
  if (!isWebGPUAvailable()) return { available: false, reason: 'navigator.gpu is not exposed in this browser context.', features: [] };
  const adapter = await requestWebGPUAdapter();
  if (!adapter) return { available: false, reason: 'WebGPU adapter request returned null.', features: [] };
  return {
    available: true,
    features: adapter.features ? Array.from(adapter.features) : [],
    limits: adapter.limits ? { ...adapter.limits } : undefined,
  };
}

export const KAPPA_TO_ALPHA_WGSL_SKETCH = `
// WGSL sketch for the future production WebGPU pipeline.
// Current public build keeps the authoritative renderer in TypeScript for transparency.
@group(0) @binding(0) var<storage, read> kappa : array<f32>;
@group(0) @binding(1) var<storage, read_write> alphaX : array<f32>;
@group(0) @binding(2) var<storage, read_write> alphaY : array<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  // Production path will use FFT-space Poisson solve: psi_hat = -2 kappa_hat / |k|^2.
}
`;

export const WEBGPU_STATUS = 'ready-capability-layer';
