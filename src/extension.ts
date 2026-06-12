import * as vscode from 'vscode';
import { quickAuditCommand, runFullScanCommand } from './commands/scan';
import type { ScanResult } from './types';
import { TurboDashboard } from './ui/dashboard';
import { TurboStatusBar } from './ui/status-bar';

let lastResult: ScanResult | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const dashboard = new TurboDashboard(context.extensionUri);
  const statusBar = new TurboStatusBar();
  statusBar.show();

  context.subscriptions.push(
    statusBar,
    vscode.commands.registerCommand('turbo.runFullScan', () =>
      runFullScanCommand({
        dashboard,
        statusBar,
        setLastResult(result) {
          lastResult = result;
        }
      })
    ),
    vscode.commands.registerCommand('turbo.showDashboard', () => {
      if (lastResult) {
        dashboard.update(lastResult);
      }
      dashboard.show();
    }),
    vscode.commands.registerCommand('turbo.quickAudit', () =>
      quickAuditCommand({
        dashboard,
        statusBar,
        setLastResult(result) {
          lastResult = result;
        }
      })
    ),
    vscode.commands.registerCommand('turbo.exportReport', () => {
      void vscode.window.showInformationMessage('Turbo: Export Report is planned for V0.2+.');
    }),
    vscode.commands.registerCommand('turbo.applySafeFixes', () => {
      void vscode.window.showInformationMessage('Turbo: Apply Safe Fixes is not implemented in V0.1. This build is read-only.');
    }),
    vscode.commands.registerCommand('turbo.undoLastFix', () => {
      void vscode.window.showInformationMessage('Turbo: Undo Last Fix is not implemented in V0.1 because no fixes are written.');
    }),
    vscode.commands.registerCommand('turbo.purge', () => {
      void vscode.window.showInformationMessage('Turbo: Purge is planned for a later milestone.');
    })
  );
}

export function deactivate(): void {
  lastResult = undefined;
}
