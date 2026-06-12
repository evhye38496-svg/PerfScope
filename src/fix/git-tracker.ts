import * as path from 'path';
import * as vscode from 'vscode';
import { detectGitRiskForRoots, expandGitSearchRootIds, type GitRisk } from './git-risk';

export async function detectWorkspaceGitRisk(rootIds?: readonly string[]): Promise<GitRisk> {
  const roots = rootIds && rootIds.length > 0
    ? rootIds.map((rootId) => vscode.Uri.parse(rootId))
    : getWorkspaceRootUris();
  const candidates = expandGitSearchUris(roots);
  return detectGitRiskForRoots(
    candidates.map((root) => root.toString()),
    async (rootId) => {
      const root = candidates.find((candidate) => candidate.toString() === rootId);
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

export function expandGitSearchUris(roots: readonly vscode.Uri[], maxDepth = 6): vscode.Uri[] {
  const rootById = new Map(roots.map((root) => [root.toString(), root]));
  const expandedIds = expandGitSearchRootIds(
    roots.map((root) => root.toString()),
    (rootId) => {
      const root = rootById.get(rootId);
      const parent = root ? getParentUri(root) : undefined;
      if (parent) {
        rootById.set(parent.toString(), parent);
      }
      return parent?.toString();
    },
    maxDepth
  );

  return expandedIds.map((id) => rootById.get(id)).filter((root): root is vscode.Uri => root !== undefined);
}

function getParentUri(uri: vscode.Uri): vscode.Uri | undefined {
  const parentPath = path.dirname(uri.fsPath);
  if (!parentPath || parentPath === uri.fsPath) {
    return undefined;
  }

  return uri.scheme === 'file' ? vscode.Uri.file(parentPath) : uri.with({ path: path.dirname(uri.path) });
}
