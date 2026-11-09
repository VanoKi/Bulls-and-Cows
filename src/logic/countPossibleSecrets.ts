const resultCache = new Map<string, number>();

export const countPossibleSecrets = (length: number, base: number): number => {
  if (
    !Number.isInteger(length) ||
    !Number.isInteger(base) ||
    length < 0 ||
    base < 0 ||
    length > base
  ) {
    return 0;
  }

  if (length === 0) {
    return 1;
  }

  const cacheKey = `${length}:${base}`;
  const cachedResult = resultCache.get(cacheKey);

  if (cachedResult !== undefined) {
    return cachedResult;
  }

  const result = base * countPossibleSecrets(length - 1, base - 1);
  resultCache.set(cacheKey, result);

  return result;
};
