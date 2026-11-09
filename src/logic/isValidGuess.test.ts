import { describe, expect, it } from 'vitest';
import { isValidGuess } from './isValidGuess';

describe('isValidGuess', () => {
  it('accepts guesses with the required length, valid digits, and no repeats', () => {
    expect(isValidGuess('0123', 4, 10)).toBe(true);
    expect(isValidGuess('01', 2, 2)).toBe(true);
  });

  it('rejects guesses with the wrong length', () => {
    expect(isValidGuess('123', 4, 10)).toBe(false);
    expect(isValidGuess('12345', 4, 10)).toBe(false);
  });

  it('rejects digits outside the selected base', () => {
    expect(isValidGuess('1283', 4, 8)).toBe(false);
    expect(isValidGuess('01g3', 4, 16)).toBe(false);
  });

  it('rejects repeated digits, treating hexadecimal case as equivalent', () => {
    expect(isValidGuess('0120', 4, 10)).toBe(false);
    expect(isValidGuess('aA23', 4, 16)).toBe(false);
  });

  it('rejects invalid length or base settings', () => {
    expect(isValidGuess('01', 3, 2)).toBe(false);
    expect(isValidGuess('01', 2, 1)).toBe(false);
  });
});
