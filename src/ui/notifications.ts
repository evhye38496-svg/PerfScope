import * as vscode from 'vscode';
import type { ApplyFixResult, PurgeResult, RollbackResult, ScanResult } from '../types';
import {
  auditCompleteMessage,
  errorMessage,
  exportCanceledMessage,
  exportCompleteMessage,
  fixCompleteMessage,
  noChangeLogMessage,
  noFixesMessage,
  noReportMessage,
  purgeCompleteMessage,
  rollbackCompleteMessage,
  scanCompleteMessage
} from './notification-messages';

const OPEN_DASHBOARD = 'Open Dashboard';
const RUN_SCAN_AGAIN = 'Run Scan Again';

export class TurboNotifier {
  showScanComplete(result: ScanResult): void {
    void vscode.window.showInformationMessage(scanCompleteMessage(result), OPEN_DASHBOARD).then(runAction);
  }

  showAuditComplete(result: ScanResult): void {
    void vscode.window.showInformationMessage(auditCompleteMessage(result), OPEN_DASHBOARD).then(runAction);
  }

  showFixComplete(result: ApplyFixResult): void {
    void vscode.window.showInformationMessage(`${fixCompleteMessage(result)} Run Turbo Scan again to refresh the report.`, RUN_SCAN_AGAIN).then(runAction);
  }

  showRollbackComplete(result: RollbackResult): void {
    void vscode.window.showInformationMessage(rollbackCompleteMessage(result), RUN_SCAN_AGAIN).then(runAction);
  }

  showExportComplete(filePath: string): void {
    void vscode.window.showInformationMessage(exportCompleteMessage(filePath), OPEN_DASHBOARD).then(runAction);
  }

  showExportCanceled(): void {
    void vscode.window.showInformationMessage(exportCanceledMessage());
  }

  showPurgeComplete(result: PurgeResult): void {
    void vscode.window.showInformationMessage(purgeCompleteMessage(result), OPEN_DASHBOARD).then(runAction);
  }

  showNoReport(): void {
    void vscode.window.showInformationMessage(noReportMessage(), RUN_SCAN_AGAIN).then(runAction);
  }

  showNoFixes(): void {
    void vscode.window.showInformationMessage(noFixesMessage());
  }

  showNoChangeLog(): void {
    void vscode.window.showInformationMessage(noChangeLogMessage());
  }

  showError(action: string, error: unknown): void {
    void vscode.window.showErrorMessage(errorMessage(action, error), OPEN_DASHBOARD).then(runAction);
  }
}

function runAction(action: string | undefined): void {
  if (action === OPEN_DASHBOARD) {
    void vscode.commands.executeCommand('turbo.showDashboard');
    return;
  }

  if (action === RUN_SCAN_AGAIN) {
    void vscode.commands.executeCommand('turbo.runFullScan');
  }
}
