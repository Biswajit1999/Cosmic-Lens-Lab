import { expect, it } from 'vitest';
import { nfwPotentialShape } from './nfw';
it('is finite', () => expect(Number.isFinite(nfwPotentialShape(1))).toBe(true));
