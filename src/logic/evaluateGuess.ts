export type GuessEvaluation = {
  bulls: number;
  cows: number;
};

export const evaluateGuess = (
  secret: string,
  guess: string,
): GuessEvaluation => {
  const secretDigits = secret.toLowerCase().split('');
  const guessDigits = guess.toLowerCase().split('');
  const bulls = guessDigits
    .map((digit, index) => digit === secretDigits[index])
    .filter(Boolean).length;
  const matchingDigits = guessDigits.filter((digit) =>
    secretDigits.includes(digit),
  ).length;

  return {
    bulls,
    cows: matchingDigits - bulls,
  };
};
