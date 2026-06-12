import * as vscode from 'vscode';
import type { ChangeLog, RollbackResult } from '../types';
import { clearWorkspaceChangeLog, getWorkspaceId } from './change-log-manager';
import { getRollbackValue, shouldRollbackEntry } from './rollback-rules';

export async function rollbackWorkspaceChangeLog(
  context: vscode.ExtensionContext,
  changeLog: ChangeLog
): Promise<RollbackResult> {
  let restored = 0;
  let skipped = 0;
  let failed = 0;

  if (changeLog.workspaceId !== getWorkspaceId()) {
    return { restored, skipped: changeLog.entries.length, failed };
  }

  const config = vscode.workspace.getConfiguration();

  for (const entry of changeLog.entries) {
    try {
      const current = config.inspect(entry.key)?.workspaceValue;
      if (!shouldRollbackEntry(current, entry.newValue)) {
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
      failed += 1;
    }
  }

  if (restored > 0 && skipped === 0 && failed === 0) {
    await clearWorkspaceChangeLog(context);
  }

  return { restored, skipped, failed };
}
