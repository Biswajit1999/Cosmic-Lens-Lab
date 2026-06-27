import { expect, it } from 'vitest';
import { nfwPotentialShape } from './nfw';

function relativeError(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
}

it('keeps the potential smooth at the NFW scale radius', () => {
  const below = nfwPotentialShape(1 - 1e-8);
  const atScale = nfwPotentialShape(1);
  const above = nfwPotentialShape(1 + 1e-8);
  expect(Number.isFinite(atScale)).toBe(true);
  expect(relativeError(below, atScale)).toBeLessThan(1e-5);
  expect(relativeError(above, atScale)).toBeLessThan(1e-5);
});
