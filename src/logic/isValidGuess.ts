import { createDigitValidator } from './digits';

export const isValidGuess = (
  guess: string,
  length: number,
  base: number,
): boolean => {
  if (
    !Number.isInteger(length) ||
    length < 1 ||
    !Number.isInteger(base) ||
    base < 2 ||
    base > 16 ||
    length > base ||
    guess.length !== length
  ) {
    return false;
  }

  const isValidDigit = createDigitValidator(base);
  const normalizedDigits = guess.toLowerCase().split('');

  return (
    normalizedDigits.every(isValidDigit) &&
    new Set(normalizedDigits).size === length
  );
};
