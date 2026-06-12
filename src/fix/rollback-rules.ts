import { stableEquals } from '../utils/stable-equality';
import type { ChangeLog, ChangeLogEntry } from '../types';

export function getRollbackValue(existedBefore: boolean, previousValue: unknown): unknown {
  return existedBefore ? previousValue : undefined;
}

export function shouldRollbackEntry(currentValue: unknown, expectedNewValue: unknown): boolean {
  return stableEquals(currentValue, expectedNewValue);
}

export function createRemainingChangeLog(changeLog: ChangeLog, entries: readonly ChangeLogEntry[]): ChangeLog {
  return {
    ...changeLog,
    entries: [...entries]
  };
}

export function canRollbackEntryInScope(entry: ChangeLogEntry, availableWorkspaceFolderUris: readonly string[]): boolean {
  return entry.target !== 'workspaceFolder' || (
    typeof entry.workspaceFolderUri === 'string' &&
    availableWorkspaceFolderUris.includes(entry.workspaceFolderUri)
  );
}
