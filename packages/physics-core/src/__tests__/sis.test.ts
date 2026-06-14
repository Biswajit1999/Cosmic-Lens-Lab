import { describe, expect, it } from 'vitest';
import { sisImagePositions1D } from '../models/sis';

describe('SIS lens', () => {
  it('has two images inside the Einstein radius', () => {
    expect(sisImagePositions1D(0.3, 1.0)).toHaveLength(2);
  });

  it('has one image outside the Einstein radius', () => {
    expect(sisImagePositions1D(1.3, 1.0)).toHaveLength(1);
  });
});
