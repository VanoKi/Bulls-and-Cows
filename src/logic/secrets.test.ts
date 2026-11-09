import { describe, expect, it } from 'vitest';
import { generateSecret } from './secrets';

describe('generateSecret', () => {
  it('generates a deterministic secret from the provided random source', () => {
    const alwaysSelectFirst = () => 0;

    expect(generateSecret(4, 10, alwaysSelectFirst)).toBe('0123');
  });

  it('keeps the requested length and uses unique digits from the base', () => {
    const secret = generateSecret(6, 16, () => 0.5);
    const digits = [...secret.toLowerCase()];

    expect(secret).toHaveLength(6);
    expect(new Set(digits).size).toBe(6);
    expect(digits.every((digit) => '0123456789abcdef'.includes(digit))).toBe(
      true,
    );
  });

  it('allows the secret to begin with zero', () => {
    expect(generateSecret(2, 8, () => 0).startsWith('0')).toBe(true);
  });

  it('does not require a random value when only one digit is available', () => {
    const random = () => 0;

    expect(generateSecret(2, 2, random)).toBe('01');
  });
});
