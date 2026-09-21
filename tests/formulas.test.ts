import { expect, test, describe } from 'vitest';
import { calculate1RM, calculateVolumeLoad, sanitizeCanonical } from '../src/lib/formulas';

describe('Formulas', () => {
  test('calculate1RM', () => {
    expect(calculate1RM(100, 1)).toBe(100);
    expect(calculate1RM(100, 5)).toBe(116.7);
    expect(calculate1RM(0, 5)).toBe(0);
    expect(calculate1RM(100, 0)).toBe(0);
  });

  test('calculateVolumeLoad', () => {
    expect(calculateVolumeLoad(100, 5)).toBe(500);
    expect(calculateVolumeLoad(0, 5)).toBe(0);
  });

  test('sanitizeCanonical', () => {
    expect(sanitizeCanonical('Supino Reto')).toBe('supino reto');
    expect(sanitizeCanonical(' Elevação Pélvica ')).toBe('elevacao pelvica');
    expect(sanitizeCanonical('Tríceps-Test')).toBe('triceps-test');
  });
});
