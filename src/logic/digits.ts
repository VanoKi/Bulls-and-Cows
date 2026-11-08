const DIGITS = '0123456789abcdef';

export const createDigitValidator =
  (base: number) =>
  (char: string): boolean => {
    if (
      !Number.isInteger(base) ||
      base < 2 ||
      base > DIGITS.length ||
      char.length !== 1
    ) {
      return false;
    }

    return DIGITS.slice(0, base).includes(char.toLowerCase());
  };
