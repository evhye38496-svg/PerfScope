import * as vscode from 'vscode';
import { loadWorkspaceChangeLog } from '../fix/change-log-manager';
import { createDefaultReportFileName, createMarkdownReport } from '../report/markdown-report';
import type { ScanResult } from '../types';
import type { TurboOperationSummary } from '../state/turbo-state';
import { TurboNotifier } from '../ui/notifications';
import { TurboStatusBar } from '../ui/status-bar';

export interface ExportReportDependencies {
  context: vscode.ExtensionContext;
  getLastResult(): ScanResult | undefined;
  notifier: TurboNotifier;
  statusBar: TurboStatusBar;
  recordOperation(operation: Omit<TurboOperationSummary, 'timestamp'>): void;
}

export async function exportReportCommand(deps: ExportReportDependencies): Promise<void> {
  const result = deps.getLastResult();
  if (!result) {
    deps.statusBar.setIdle();
    deps.recordOperation({
      kind: 'export',
      status: 'skipped',
      message: 'Run a scan before exporting a Markdown report.'
    });
    deps.notifier.showNoReport();
    return;
  }

  const target = await vscode.window.showSaveDialog({
    defaultUri: getDefaultReportUri(),
    filters: {
      Markdown: ['md']
    },
    saveLabel: 'Export Turbo Report',
    title: 'Export Turbo Report'
  });

  if (!target) {
    deps.statusBar.setIdle();
    deps.recordOperation({
      kind: 'export',
      status: 'canceled',
      message: 'Markdown report export was canceled.'
    });
    deps.notifier.showExportCanceled();
    return;
  }

  deps.statusBar.setExporting();

  try {
    const markdown = createMarkdownReport(result, loadWorkspaceChangeLog(deps.context));
    await vscode.workspace.fs.writeFile(target, new TextEncoder().encode(markdown));
    deps.statusBar.setIdle();
    deps.recordOperation({
      kind: 'export',
      status: 'success',
      message: `Markdown report exported to ${target.fsPath}.`
    });
    deps.notifier.showExportComplete(target.fsPath);
  } catch (error) {
    deps.statusBar.setError('Export failed');
    deps.recordOperation({
      kind: 'export',
      status: 'failed',
      message: 'Markdown report export failed.'
    });
    deps.notifier.showError('export', error);
  }
}

function getDefaultReportUri(): vscode.Uri | undefined {
  const fileName = createDefaultReportFileName();
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (workspaceFolder) {
    return vscode.Uri.joinPath(workspaceFolder, fileName);
  }

  return undefined;
}
