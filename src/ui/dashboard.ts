import * as vscode from 'vscode';
import type { ScanResult } from '../types';
import type { TurboUiState } from '../state/turbo-state';
import { resolveDashboardCommand } from './dashboard-messages';
import { renderDashboardHtml, type DashboardViewMode } from './dashboard-renderer';
import { executeTurboCommand } from './turbo-command-dispatch';

export class TurboDashboard {
  private panel: vscode.WebviewPanel | undefined;
  private lastResult: ScanResult | undefined;
  private lastState: TurboUiState = {};
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
          executeTurboCommand(command, 'dashboard');
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
    this.lastState = {
      ...this.lastState,
      lastResult: result
    };
    this.viewMode = viewMode;
    if (this.panel) {
      this.render();
    }
  }

  updateState(state: TurboUiState, viewMode: DashboardViewMode = this.viewMode): void {
    this.lastState = state;
    this.lastResult = state.lastResult;
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
      operation: this.lastState.lastOperation,
      viewMode: this.viewMode
    });
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
