import * as vscode from 'vscode';
import type { ChangeLog, ChangeLogEntry, RollbackResult } from '../types';
import { clearWorkspaceChangeLog, getWorkspaceId, saveWorkspaceChangeLog } from './change-log-manager';
import { createRemainingChangeLog, getRollbackValue, shouldRollbackEntry } from './rollback-rules';

export async function rollbackWorkspaceChangeLog(
  context: vscode.ExtensionContext,
  changeLog: ChangeLog
): Promise<RollbackResult> {
  let restored = 0;
  let skipped = 0;
  let failed = 0;
  const remainingEntries: ChangeLogEntry[] = [];

  if (changeLog.workspaceId !== getWorkspaceId()) {
    return { restored, skipped: changeLog.entries.length, failed };
  }

  const config = vscode.workspace.getConfiguration();

  for (const entry of changeLog.entries) {
    try {
      const current = config.inspect(entry.key)?.workspaceValue;
      if (!shouldRollbackEntry(current, entry.newValue)) {
        remainingEntries.push(entry);
        skipped += 1;
        continue;
      }

      await config.update(
        entry.key,
        getRollbackValue(entry.existedBefore, entry.previousValue),
        vscode.ConfigurationTarget.Workspace
      );
      restored += 1;
    } catch {
      remainingEntries.push(entry);
      failed += 1;
    }
  }

  if (remainingEntries.length === 0) {
    await clearWorkspaceChangeLog(context);
    return { restored, skipped, failed };
  }

  const remainingChangeLog = createRemainingChangeLog(changeLog, remainingEntries);
  await saveWorkspaceChangeLog(context, remainingChangeLog);

  return { restored, skipped, failed, remainingChangeLog };
}
