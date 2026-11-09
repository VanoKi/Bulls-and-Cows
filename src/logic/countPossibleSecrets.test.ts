import { describe, expect, it } from 'vitest';
import { countPossibleSecrets } from './countPossibleSecrets';

describe('countPossibleSecrets', () => {
  it('counts permutations without repeated digits', () => {
    expect(countPossibleSecrets(4, 10)).toBe(5040);
    expect(countPossibleSecrets(2, 2)).toBe(2);
    expect(countPossibleSecrets(4, 16)).toBe(43680);
  });

  it('counts a zero-length sequence as one possible sequence', () => {
    expect(countPossibleSecrets(0, 10)).toBe(1);
  });

  it('returns zero when the length exceeds the available digit count', () => {
    expect(countPossibleSecrets(3, 2)).toBe(0);
  });

  it('returns zero for invalid negative or fractional inputs', () => {
    expect(countPossibleSecrets(-1, 10)).toBe(0);
    expect(countPossibleSecrets(2, -1)).toBe(0);
    expect(countPossibleSecrets(1.5, 10)).toBe(0);
  });

  it('returns the same count on repeated calls', () => {
    expect(countPossibleSecrets(5, 10)).toBe(30240);
    expect(countPossibleSecrets(5, 10)).toBe(30240);
  });
});
