import * as vscode from 'vscode';
import { loadWorkspaceChangeLog } from '../fix/change-log-manager';
import { createDefaultReportFileName, createMarkdownReport } from '../report/markdown-report';
import type { ScanResult } from '../types';
import { TurboNotifier } from '../ui/notifications';
import { TurboStatusBar } from '../ui/status-bar';

export interface ExportReportDependencies {
  context: vscode.ExtensionContext;
  getLastResult(): ScanResult | undefined;
  notifier: TurboNotifier;
  statusBar: TurboStatusBar;
}

export async function exportReportCommand(deps: ExportReportDependencies): Promise<void> {
  const result = deps.getLastResult();
  if (!result) {
    deps.statusBar.setIdle();
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
    deps.notifier.showExportCanceled();
    return;
  }

  deps.statusBar.setExporting();

  try {
    const markdown = createMarkdownReport(result, loadWorkspaceChangeLog(deps.context));
    await vscode.workspace.fs.writeFile(target, new TextEncoder().encode(markdown));
    deps.statusBar.setIdle();
    deps.notifier.showExportComplete(target.fsPath);
  } catch (error) {
    deps.statusBar.setError('Export failed');
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
