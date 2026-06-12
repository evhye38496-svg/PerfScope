import * as vscode from 'vscode';
import type { ApplyFixResult, ChangeLog, ChangeLogEntry, FixProposal } from '../types';
import { stableEquals } from '../utils/stable-equality';
import { createChangeLogEntry } from './change-log-entry';
import { getWorkspaceId, loadWorkspaceChangeLog, saveWorkspaceChangeLog } from './change-log-manager';

function inspectWorkspaceValue(key: string): { existedBefore: boolean; value: unknown } {
  const inspected = vscode.workspace.getConfiguration().inspect(key);
  return {
    existedBefore: inspected?.workspaceValue !== undefined,
    value: inspected?.workspaceValue
  };
}

export async function applyWorkspaceFixes(
  context: vscode.ExtensionContext,
  proposals: readonly FixProposal[]
): Promise<ApplyFixResult> {
  let applied = 0;
  let skipped = 0;
  let failed = 0;
  const entries: ChangeLogEntry[] = [];
  const workspaceId = getWorkspaceId();
  const timestamp = Date.now();
  const config = vscode.workspace.getConfiguration();
  const previousChangeLog = loadWorkspaceChangeLog(context);

  for (const proposal of proposals) {
    try {
      const before = inspectWorkspaceValue(proposal.key);
      if (!stableEquals(before.value, proposal.currentValue)) {
        skipped += 1;
        continue;
      }

      await config.update(proposal.key, proposal.proposedValue, vscode.ConfigurationTarget.Workspace);
      entries.push(createChangeLogEntry(proposal, before.existedBefore, before.value, workspaceId, timestamp));
      applied += 1;
    } catch {
      failed += 1;
    }
  }

  const changeLog: ChangeLog | undefined =
    entries.length > 0
      ? {
          workspaceId,
          timestamp,
          entries
        }
      : undefined;

  if (changeLog) {
    await saveWorkspaceChangeLog(context, changeLog);
  }

  return {
    applied,
    skipped,
    failed,
    changeLog,
    retainedPreviousChangeLog: !changeLog && previousChangeLog !== undefined
  };
}
