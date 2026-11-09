const DIGITS = '0123456789abcdef';

export const generateSecret = (
  length: number,
  base: number,
  random: () => number = Math.random,
): string => {
  if (
    !Number.isInteger(length) ||
    !Number.isInteger(base) ||
    base < 2 ||
    base > DIGITS.length ||
    length < 1 ||
    length > base
  ) {
    throw new RangeError('Length must be between 1 and the base (2–16).');
  }

  const initialDigits = DIGITS.slice(0, base).split('');

  return Array.from({ length }).reduce<{
    availableDigits: string[];
    secret: string;
  }>(
    (state) => {
      const randomIndex = Math.floor(random() * state.availableDigits.length);
      const digit = state.availableDigits[randomIndex];

      return {
        availableDigits: state.availableDigits.filter(
          (_, index) => index !== randomIndex,
        ),
        secret: state.secret + digit,
      };
    },
    { availableDigits: initialDigits, secret: '' },
  ).secret;
};
