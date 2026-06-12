import * as vscode from 'vscode';
import { TURBO_GLOBAL_STATE_KEYS, TURBO_WORKSPACE_STATE_KEYS } from '../fix/change-log-manager';
import type { PurgeResult } from '../types';
import { TurboNotifier } from '../ui/notifications';
import { TurboStatusBar } from '../ui/status-bar';
import type { TurboOperationSummary } from '../state/turbo-state';

export interface PurgeCommandDependencies {
  context: vscode.ExtensionContext;
  notifier: TurboNotifier;
  statusBar: TurboStatusBar;
  hasUiState(): boolean;
  clearUiState(): void;
  recordOperation(operation: Omit<TurboOperationSummary, 'timestamp'>): void;
}

export async function purgeCommand(deps: PurgeCommandDependencies): Promise<void> {
  const hasWorkspaceState = TURBO_WORKSPACE_STATE_KEYS.some((key) => deps.context.workspaceState.get(key) !== undefined);
  const hasGlobalState = TURBO_GLOBAL_STATE_KEYS.some((key) => deps.context.globalState.get(key) !== undefined);
  const hasUiState = deps.hasUiState();

  if (!hasWorkspaceState && !hasGlobalState && !hasUiState) {
    deps.statusBar.setIdle();
    deps.recordOperation({
      kind: 'purge',
      status: 'skipped',
      message: 'No Turbo state was available to purge.'
    });
    deps.notifier.showPurgeComplete({ clearedWorkspaceState: false, clearedGlobalState: false, clearedUiState: false, canceled: false });
    return;
  }

  const choice = await vscode.window.showWarningMessage(
    'Turbo will clear only its own saved state and recent UI report data. It will not modify settings, uninstall extensions, or delete files. Continue?',
    { modal: true },
    'Continue',
    'Cancel'
  );

  if (choice !== 'Continue') {
    deps.statusBar.setIdle();
    deps.recordOperation({
      kind: 'purge',
      status: 'canceled',
      message: 'Turbo purge was canceled before clearing state.'
    });
    deps.notifier.showPurgeComplete({ clearedWorkspaceState: false, clearedGlobalState: false, clearedUiState: false, canceled: true });
    return;
  }

  const result = await clearTurboState(deps.context, hasUiState, deps.clearUiState);
  deps.statusBar.setIdle();
  deps.recordOperation({
    kind: 'purge',
    status: 'success',
    message: 'Turbo saved state was cleared. Workspace settings were not modified.'
  });
  deps.notifier.showPurgeComplete(result);
}

export async function clearTurboState(
  context: vscode.ExtensionContext,
  clearUiState: boolean,
  clearUiStateFn: () => void
): Promise<PurgeResult> {
  const hadWorkspaceState = TURBO_WORKSPACE_STATE_KEYS.some((key) => context.workspaceState.get(key) !== undefined);
  const hadGlobalState = TURBO_GLOBAL_STATE_KEYS.some((key) => context.globalState.get(key) !== undefined);

  await Promise.all([
    ...TURBO_WORKSPACE_STATE_KEYS.map((key) => context.workspaceState.update(key, undefined)),
    ...TURBO_GLOBAL_STATE_KEYS.map((key) => context.globalState.update(key, undefined))
  ]);

  if (clearUiState) {
    clearUiStateFn();
  }

  return {
    clearedWorkspaceState: hadWorkspaceState,
    clearedGlobalState: hadGlobalState,
    clearedUiState: clearUiState,
    canceled: false
  };
}
