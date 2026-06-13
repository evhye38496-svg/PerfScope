import * as vscode from 'vscode';
import type { TurboUiState } from '../state/turbo-state';
import { createCspNonce } from '../utils/csp-nonce';
import { resolveDashboardCommand } from './dashboard-messages';
import { renderSidebarHtml } from './sidebar-renderer';
import { executeTurboCommand } from './turbo-command-dispatch';

export class TurboSidebarProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private state: TurboUiState = {};

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly getState: () => TurboUiState
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    this.state = this.getState();
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.onDidReceiveMessage((message) => {
      const command = resolveDashboardCommand(message);
      if (command) {
        executeTurboCommand(command, 'sidebar');
      }
    });

    this.render();
  }

  update(state: TurboUiState): void {
    this.state = state;
    this.render();
  }

  private render(): void {
    if (!this.view) {
      return;
    }

    this.view.webview.html = renderSidebarHtml({
      cspSource: this.view.webview.cspSource,
      nonce: createCspNonce(),
      result: this.state.lastResult,
      operation: this.state.lastOperation
    });
  }
}
