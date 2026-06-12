import * as vscode from 'vscode';
import type { ChangeLog } from '../types';

const CHANGE_LOG_KEY = 'turbo.lastWorkspaceChangeLog';

export function getWorkspaceId(): string {
  return vscode.workspace.workspaceFile?.fsPath ?? vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath).join('|') ?? 'empty';
}

export async function saveWorkspaceChangeLog(context: vscode.ExtensionContext, changeLog: ChangeLog): Promise<void> {
  await context.workspaceState.update(CHANGE_LOG_KEY, changeLog);
}

export function loadWorkspaceChangeLog(context: vscode.ExtensionContext): ChangeLog | undefined {
  return context.workspaceState.get<ChangeLog>(CHANGE_LOG_KEY);
}

export async function clearWorkspaceChangeLog(context: vscode.ExtensionContext): Promise<void> {
  await context.workspaceState.update(CHANGE_LOG_KEY, undefined);
}
