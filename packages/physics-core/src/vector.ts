import type { Vec2 } from './types';

export function add(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]];
}

export function scale(a: Vec2, s: number): Vec2 {
  return [a[0] * s, a[1] * s];
}

export function dot(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function norm2(a: Vec2): number {
  return dot(a, a);
}

export function norm(a: Vec2): number {
  return Math.sqrt(norm2(a));
}

export function rotate(a: Vec2, phiRad: number): Vec2 {
  const c = Math.cos(phiRad);
  const s = Math.sin(phiRad);
  return [c * a[0] - s * a[1], s * a[0] + c * a[1]];
}

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}
