import * as vscode from 'vscode';
import type { ChangeLog, ChangeLogEntry, RollbackResult } from '../types';
import { clearWorkspaceChangeLog, getWorkspaceId, saveWorkspaceChangeLog } from './change-log-manager';
import { canRollbackEntryInScope, createRemainingChangeLog, getRollbackValue, shouldRollbackEntry } from './rollback-rules';

function findWorkspaceFolder(uriString: string | undefined): vscode.WorkspaceFolder | undefined {
  if (!uriString) {
    return undefined;
  }

  return vscode.workspace.workspaceFolders?.find((folder) => folder.uri.toString() === uriString);
}

function getEntryScope(entry: ChangeLogEntry): vscode.Uri | undefined {
  if (entry.target !== 'workspaceFolder') {
    return undefined;
  }

  return findWorkspaceFolder(entry.workspaceFolderUri)?.uri;
}

function getAvailableWorkspaceFolderUris(): string[] {
  return vscode.workspace.workspaceFolders?.map((folder) => folder.uri.toString()) ?? [];
}

function getEntryTarget(entry: ChangeLogEntry): vscode.ConfigurationTarget {
  return entry.target === 'workspaceFolder'
    ? vscode.ConfigurationTarget.WorkspaceFolder
    : vscode.ConfigurationTarget.Workspace;
}

function inspectEntryValue(entry: ChangeLogEntry): unknown {
  const inspected = vscode.workspace.getConfiguration(undefined, getEntryScope(entry)).inspect(entry.key);
  return entry.target === 'workspaceFolder' ? inspected?.workspaceFolderValue : inspected?.workspaceValue;
}

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

  for (const entry of changeLog.entries) {
    try {
      if (!canRollbackEntryInScope(entry, getAvailableWorkspaceFolderUris())) {
        remainingEntries.push(entry);
        skipped += 1;
        continue;
      }

      const current = inspectEntryValue(entry);
      if (!shouldRollbackEntry(current, entry.newValue)) {
        remainingEntries.push(entry);
        skipped += 1;
        continue;
      }

      await vscode.workspace
        .getConfiguration(undefined, getEntryScope(entry))
        .update(entry.key, getRollbackValue(entry.existedBefore, entry.previousValue), getEntryTarget(entry));
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
