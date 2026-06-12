import * as vscode from 'vscode';
import { exportReportCommand } from './commands/export-report';
import { applySafeFixesCommand, undoLastFixCommand } from './commands/fix';
import { quickAuditCommand, runFullScanCommand } from './commands/scan';
import { TurboState } from './state/turbo-state';
import { TurboDashboard } from './ui/dashboard';
import { TurboNotifier } from './ui/notifications';
import { TurboSidebarProvider } from './ui/sidebar';
import { TurboStatusBar } from './ui/status-bar';
import { shouldRevealDashboard, type TurboCommandOptions } from './ui/turbo-command-options';

export function activate(context: vscode.ExtensionContext): void {
  const dashboard = new TurboDashboard(context.extensionUri);
  const notifier = new TurboNotifier();
  const state = new TurboState();
  const sidebar = new TurboSidebarProvider(context.extensionUri, () => state.getSnapshot());
  const statusBar = new TurboStatusBar();
  statusBar.show();

  context.subscriptions.push(
    state,
    state.onDidChange((snapshot) => {
      sidebar.update(snapshot);
      dashboard.updateState(snapshot);
    }),
    vscode.window.registerWebviewViewProvider('turbo.dashboard', sidebar)
  );

  context.subscriptions.push(
    statusBar,
    vscode.commands.registerCommand('turbo.runFullScan', (options?: TurboCommandOptions) =>
      runFullScanCommand({
        dashboard,
        notifier,
        statusBar,
        revealDashboard: shouldRevealDashboard(options),
        setLastResult(result, kind) {
          state.setLastResult(result, kind);
        }
      })
    ),
    vscode.commands.registerCommand('turbo.showDashboard', () => {
      dashboard.updateState(state.getSnapshot());
      dashboard.show();
    }),
    vscode.commands.registerCommand('turbo.quickAudit', (options?: TurboCommandOptions) =>
      quickAuditCommand({
        dashboard,
        notifier,
        statusBar,
        revealDashboard: shouldRevealDashboard(options),
        setLastResult(result, kind) {
          state.setLastResult(result, kind);
        }
      })
    ),
    vscode.commands.registerCommand('turbo.exportReport', () =>
      exportReportCommand({
        context,
        getLastResult() {
          return state.getLastResult();
        },
        notifier,
        statusBar,
        recordOperation(operation) {
          state.setLastOperation(operation);
        }
      })
    ),
    vscode.commands.registerCommand('turbo.applySafeFixes', () =>
      applySafeFixesCommand({
        context,
        notifier,
        statusBar,
        recordOperation(operation) {
          state.setLastOperation(operation);
        }
      })
    ),
    vscode.commands.registerCommand('turbo.undoLastFix', () =>
      undoLastFixCommand({
        context,
        notifier,
        statusBar,
        recordOperation(operation) {
          state.setLastOperation(operation);
        }
      })
    ),
    vscode.commands.registerCommand('turbo.purge', () => {
      void vscode.window.showInformationMessage('Turbo: Purge is planned for a later milestone.');
    })
  );
}

export function deactivate(): void {
}
