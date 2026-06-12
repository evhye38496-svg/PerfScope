import * as vscode from 'vscode';
import type { ScanResult } from '../types';
import { resolveDashboardCommand } from './dashboard-messages';
import { renderDashboardHtml, type DashboardViewMode } from './dashboard-renderer';

export class TurboDashboard {
  private panel: vscode.WebviewPanel | undefined;
  private lastResult: ScanResult | undefined;
  private viewMode: DashboardViewMode = 'scan';

  constructor(private readonly extensionUri: vscode.Uri) {}

  show(viewMode: DashboardViewMode = this.viewMode): void {
    this.viewMode = viewMode;
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'turboDashboard',
        'One-Click Turbo',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [this.extensionUri]
        }
      );

      this.panel.webview.onDidReceiveMessage((message) => {
        const command = resolveDashboardCommand(message);
        if (command) {
          executeDashboardCommand(command);
        }
      });

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    this.render();
    this.panel.reveal(vscode.ViewColumn.One);
  }

  update(result: ScanResult, viewMode: DashboardViewMode = this.viewMode): void {
    this.lastResult = result;
    this.viewMode = viewMode;
    if (this.panel) {
      this.render();
    }
  }

  private render(): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.html = renderDashboardHtml({
      cspSource: this.panel.webview.cspSource,
      nonce: createNonce(),
      result: this.lastResult,
      viewMode: this.viewMode
    });
  }
}

function executeDashboardCommand(command: string): void {
  switch (command) {
    case 'turbo.runFullScan':
      void vscode.commands.executeCommand('turbo.runFullScan');
      return;
    case 'turbo.quickAudit':
      void vscode.commands.executeCommand('turbo.quickAudit');
      return;
    case 'turbo.applySafeFixes':
      void vscode.commands.executeCommand('turbo.applySafeFixes');
      return;
    case 'turbo.undoLastFix':
      void vscode.commands.executeCommand('turbo.undoLastFix');
      return;
    case 'turbo.exportReport':
      void vscode.commands.executeCommand('turbo.exportReport');
      return;
    default:
      return;
  }
}

function createNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';

  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}
