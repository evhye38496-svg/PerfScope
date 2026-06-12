function normalize(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((normalized, key) => {
      normalized[key] = normalize((value as Record<string, unknown>)[key]);
      return normalized;
    }, {});
}

export function stableEquals(left: unknown, right: unknown): boolean {
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}
