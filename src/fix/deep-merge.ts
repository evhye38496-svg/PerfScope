export function mergeMissingObjectKeys(
  currentValue: Record<string, unknown> | undefined,
  recommendedValue: Record<string, unknown>
): { mergedValue: Record<string, unknown>; addedKeys: string[] } {
  const mergedValue: Record<string, unknown> = { ...(currentValue ?? {}) };
  const addedKeys: string[] = [];

  for (const [key, value] of Object.entries(recommendedValue)) {
    if (!Object.prototype.hasOwnProperty.call(mergedValue, key)) {
      mergedValue[key] = value;
      addedKeys.push(key);
    }
  }

  return { mergedValue, addedKeys };
}
