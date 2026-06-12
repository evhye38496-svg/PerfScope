import * as vscode from 'vscode';
import type { ApplyFixResult, ChangeLog, ChangeLogEntry, FixProposal } from '../types';
import { stableEquals } from '../utils/stable-equality';
import { createChangeLogEntry } from './change-log-entry';
import { getWorkspaceId, loadWorkspaceChangeLog, saveWorkspaceChangeLog } from './change-log-manager';

function getProposalScope(proposal: FixProposal): vscode.Uri | undefined {
  return proposal.workspaceFolderUri ? vscode.Uri.parse(proposal.workspaceFolderUri) : undefined;
}

function getConfigurationTarget(proposal: FixProposal): vscode.ConfigurationTarget {
  return proposal.target === 'workspaceFolder'
    ? vscode.ConfigurationTarget.WorkspaceFolder
    : vscode.ConfigurationTarget.Workspace;
}

function inspectProposalValue(proposal: FixProposal): { existedBefore: boolean; value: unknown } {
  const inspected = vscode.workspace.getConfiguration(undefined, getProposalScope(proposal)).inspect(proposal.key);
  const value = proposal.target === 'workspaceFolder' ? inspected?.workspaceFolderValue : inspected?.workspaceValue;
  return {
    existedBefore: value !== undefined,
    value
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
  const previousChangeLog = loadWorkspaceChangeLog(context);

  for (const proposal of proposals) {
    try {
      const before = inspectProposalValue(proposal);
      if (!stableEquals(before.value, proposal.currentValue)) {
        skipped += 1;
        continue;
      }

      await vscode.workspace
        .getConfiguration(undefined, getProposalScope(proposal))
        .update(proposal.key, proposal.proposedValue, getConfigurationTarget(proposal));
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
