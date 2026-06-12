import * as vscode from 'vscode';
import type { FixPreviewItem, FixProposal } from '../types';
import { createWorkspaceFixProposals, type WorkspaceConfigValues } from '../fix/fix-engine';
import { loadWorkspaceChangeLog } from '../fix/change-log-manager';
import { applyWorkspaceFixes } from '../fix/settings-writer';
import { rollbackWorkspaceChangeLog } from '../fix/rollback';

function inspectWorkspaceValue<T>(key: string): T | undefined {
  return vscode.workspace.getConfiguration().inspect<T>(key)?.workspaceValue;
}

function readWorkspaceConfigValues(): WorkspaceConfigValues {
  return {
    watcherExclude: inspectWorkspaceValue<Record<string, unknown>>('files.watcherExclude'),
    searchExclude: inspectWorkspaceValue<Record<string, unknown>>('search.exclude'),
    searchFollowSymlinks: inspectWorkspaceValue<boolean>('search.followSymlinks')
  };
}

function toPreviewItem(proposal: FixProposal): FixPreviewItem {
  const added = proposal.addedKeys.length === 1 ? '1 change' : `${proposal.addedKeys.length} changes`;
  return {
    label: proposal.title,
    description: `Workspace - ${proposal.key}`,
    detail: `${added}; Deep Merge + User Wins. ${proposal.description}`,
    proposal
  };
}

export async function applySafeFixesCommand(context: vscode.ExtensionContext): Promise<void> {
  const proposals = createWorkspaceFixProposals(readWorkspaceConfigValues());

  if (proposals.length === 0) {
    void vscode.window.showInformationMessage('Turbo: No workspace safe fixes are available.');
    return;
  }

  const selected = await vscode.window.showQuickPick(proposals.map(toPreviewItem), {
    canPickMany: true,
    title: 'Turbo Fix - Workspace Safe Fixes',
    placeHolder: 'Select workspace configuration fixes to apply'
  });

  if (!selected || selected.length === 0) {
    return;
  }

  const result = await applyWorkspaceFixes(
    context,
    selected.map((item) => item.proposal)
  );

  void vscode.window.showInformationMessage(
    `Turbo Fix complete - applied ${result.applied}, skipped ${result.skipped}, failed ${result.failed}. Run Turbo Scan again to refresh the report.`
  );
}

export async function undoLastFixCommand(context: vscode.ExtensionContext): Promise<void> {
  const changeLog = loadWorkspaceChangeLog(context);

  if (!changeLog) {
    void vscode.window.showInformationMessage('Turbo: No workspace fix Change Log found.');
    return;
  }

  const result = await rollbackWorkspaceChangeLog(context, changeLog);
  void vscode.window.showInformationMessage(
    `Turbo Undo complete - restored ${result.restored}, skipped ${result.skipped}, failed ${result.failed}.`
  );
}
