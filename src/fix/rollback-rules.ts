function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function getRollbackValue(existedBefore: boolean, previousValue: unknown): unknown {
  return existedBefore ? previousValue : undefined;
}

export function shouldRollbackEntry(currentValue: unknown, expectedNewValue: unknown): boolean {
  return valuesEqual(currentValue, expectedNewValue);
}
