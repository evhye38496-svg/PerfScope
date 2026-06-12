import * as vscode from 'vscode';
import { createTurboCommandOptions, type TurboCommandSource } from './turbo-command-options';

export function executeTurboCommand(command: string, source: TurboCommandSource): void {
  const options = createTurboCommandOptions(source);
  switch (command) {
    case 'turbo.runFullScan':
      void vscode.commands.executeCommand('turbo.runFullScan', options);
      return;
    case 'turbo.quickAudit':
      void vscode.commands.executeCommand('turbo.quickAudit', options);
      return;
    case 'turbo.applySafeFixes':
      void vscode.commands.executeCommand('turbo.applySafeFixes', options);
      return;
    case 'turbo.undoLastFix':
      void vscode.commands.executeCommand('turbo.undoLastFix', options);
      return;
    case 'turbo.exportReport':
      void vscode.commands.executeCommand('turbo.exportReport', options);
      return;
    case 'turbo.showDashboard':
      void vscode.commands.executeCommand('turbo.showDashboard', options);
      return;
    default:
      return;
  }
}
