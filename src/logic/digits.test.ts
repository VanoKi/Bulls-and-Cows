import { describe, expect, it } from 'vitest';
import { createDigitValidator } from './digits';

describe('createDigitValidator', () => {
  it('accepts only binary digits for base 2', () => {
    const isBinaryDigit = createDigitValidator(2);

    expect(isBinaryDigit('0')).toBe(true);
    expect(isBinaryDigit('1')).toBe(true);
    expect(isBinaryDigit('2')).toBe(false);
  });

  it('accepts decimal digits below the selected base', () => {
    const isDecimalDigit = createDigitValidator(10);

    expect(isDecimalDigit('0')).toBe(true);
    expect(isDecimalDigit('9')).toBe(true);
    expect(isDecimalDigit('a')).toBe(false);
  });

  it('accepts hexadecimal letters without regard to case', () => {
    const isHexDigit = createDigitValidator(16);

    expect(isHexDigit('a')).toBe(true);
    expect(isHexDigit('A')).toBe(true);
    expect(isHexDigit('f')).toBe(true);
    expect(isHexDigit('F')).toBe(true);
    expect(isHexDigit('g')).toBe(false);
  });

  it('rejects multi-character strings and invalid bases', () => {
    expect(createDigitValidator(8)('10')).toBe(false);
    expect(createDigitValidator(1)('0')).toBe(false);
    expect(createDigitValidator(17)('g')).toBe(false);
  });
});
