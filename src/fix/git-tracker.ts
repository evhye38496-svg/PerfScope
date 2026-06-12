import * as path from 'path';
import * as vscode from 'vscode';
import { detectGitRiskForRoots, type GitRisk } from './git-risk';

export async function detectWorkspaceGitRisk(): Promise<GitRisk> {
  const roots = getWorkspaceRootUris();
  return detectGitRiskForRoots(
    roots.map((root) => root.toString()),
    async (rootId) => {
      const root = roots.find((candidate) => candidate.toString() === rootId);
      if (!root) {
        return false;
      }

      try {
        await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, '.git'));
        return true;
      } catch (error) {
        if (isFileNotFound(error)) {
          return false;
        }

        throw error;
      }
    }
  );
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'FileNotFound'
  );
}

function getWorkspaceRootUris(): vscode.Uri[] {
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    return vscode.workspace.workspaceFolders.map((folder) => folder.uri);
  }

  if (vscode.workspace.workspaceFile) {
    return [vscode.Uri.file(path.dirname(vscode.workspace.workspaceFile.fsPath))];
  }

  return [];
}
