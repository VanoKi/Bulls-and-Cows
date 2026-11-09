import { describe, expect, it } from 'vitest';
import { evaluateGuess } from './evaluateGuess';

describe('evaluateGuess', () => {
  it('counts bulls and cows for a partially correct guess', () => {
    expect(evaluateGuess('4271', '7241')).toEqual({ bulls: 2, cows: 2 });
  });

  it('counts an exact match as all bulls and no cows', () => {
    expect(evaluateGuess('5072', '5072')).toEqual({ bulls: 4, cows: 0 });
  });

  it('compares hexadecimal digits without regard to case', () => {
    expect(evaluateGuess('A2fB', 'aF2b')).toEqual({ bulls: 2, cows: 2 });
  });

  it('returns zero counts when the guess shares no digits', () => {
    expect(evaluateGuess('0123', '4567')).toEqual({ bulls: 0, cows: 0 });
  });
});
