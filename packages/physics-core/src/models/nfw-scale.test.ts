import { expect, it } from 'vitest';
import { nfwPotentialShape } from './nfw';
it('keeps the NFW potential finite near the scale radius', () => expect(Number.isFinite(nfwPotentialShape(1))).toBe(true));
