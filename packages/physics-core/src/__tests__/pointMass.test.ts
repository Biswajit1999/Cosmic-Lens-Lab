import { describe, expect, it } from 'vitest';
import { pointMassImagePositions1D, pointMassMagnifications1D } from '../models/pointMass';

describe('point mass lens', () => {
  it('solves the exact 1D image positions', () => {
    const [plus, minus] = pointMassImagePositions1D(0.3, 1.0);
    expect(plus).toBeCloseTo(1.1611874208, 9);
    expect(minus).toBeCloseTo(-0.8611874208, 9);
  });

  it('preserves signed magnification parity', () => {
    const [muPlus, muMinus] = pointMassMagnifications1D(0.3, 1.0);
    expect(muPlus).toBeGreaterThan(0);
    expect(muMinus).toBeLessThan(0);
    expect(Math.abs(muPlus) + Math.abs(muMinus)).toBeGreaterThan(1);
  });
});
