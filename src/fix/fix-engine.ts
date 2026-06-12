import type { FixProposal } from '../types';
import { mergeMissingObjectKeys } from './deep-merge';

export const recommendedWatcherExclude: Record<string, true> = {
  '**/node_modules/**': true,
  '**/.git/objects/**': true,
  '**/.git/subtree-cache/**': true,
  '**/dist/**': true,
  '**/build/**': true,
  '**/coverage/**': true,
  '**/.next/**': true,
  '**/.nuxt/**': true,
  '**/target/**': true,
  '**/__pycache__/**': true,
  '**/*.log': true
};

export const recommendedSearchExclude: Record<string, true> = {
  '**/node_modules': true,
  '**/dist': true,
  '**/build': true,
  '**/.git': true,
  '**/coverage': true
};

export interface WorkspaceConfigValues {
  watcherExclude?: Record<string, unknown>;
  searchExclude?: Record<string, unknown>;
  searchFollowSymlinks?: boolean;
  workspaceFolderUri?: string;
  workspaceFolderName?: string;
}

export function createWorkspaceFixProposals(config: WorkspaceConfigValues): FixProposal[] {
  return createScopedFixProposals(config, config.workspaceFolderUri ? 'workspaceFolder' : 'workspace');
}

export function createWorkspaceFolderFixProposals(config: WorkspaceConfigValues): FixProposal[] {
  return createScopedFixProposals(config, 'workspaceFolder');
}

function createScopedFixProposals(config: WorkspaceConfigValues, target: FixProposal['target']): FixProposal[] {
  const proposals: FixProposal[] = [];
  const watcher = mergeMissingObjectKeys(config.watcherExclude, recommendedWatcherExclude);
  const search = mergeMissingObjectKeys(config.searchExclude, recommendedSearchExclude);
  const scopeId = target === 'workspaceFolder' ? `workspaceFolder.${config.workspaceFolderUri ?? 'unknown'}` : 'workspace';
  const scopeLabel = target === 'workspaceFolder' ? `Workspace Folder ${config.workspaceFolderName ?? ''}`.trim() : 'Workspace';
  const scoped = <T extends Omit<FixProposal, 'target' | 'workspaceFolderUri' | 'workspaceFolderName'>>(proposal: T): FixProposal => ({
    ...proposal,
    target,
    workspaceFolderUri: config.workspaceFolderUri,
    workspaceFolderName: config.workspaceFolderName
  });

  if (watcher.addedKeys.length > 0) {
    proposals.push(scoped({
      id: `${scopeId}.files.watcherExclude`,
      key: 'files.watcherExclude',
      title: `Add ${scopeLabel} watcher exclusions`,
      description: 'Adds missing generated, dependency, and cache folders to files.watcherExclude.',
      currentValue: config.watcherExclude,
      proposedValue: watcher.mergedValue,
      addedKeys: watcher.addedKeys
    }));
  }

  if (search.addedKeys.length > 0) {
    proposals.push(scoped({
      id: `${scopeId}.search.exclude`,
      key: 'search.exclude',
      title: `Add ${scopeLabel} search exclusions`,
      description: 'Adds missing generated and dependency folders to search.exclude.',
      currentValue: config.searchExclude,
      proposedValue: search.mergedValue,
      addedKeys: search.addedKeys
    }));
  }

  if (config.searchFollowSymlinks === undefined) {
    proposals.push(scoped({
      id: `${scopeId}.search.followSymlinks`,
      key: 'search.followSymlinks',
      title: `Disable following symlinks for ${scopeLabel} search`,
      description: `Sets search.followSymlinks to false at ${target === 'workspaceFolder' ? 'Workspace Folder' : 'Workspace'} scope when it is not explicitly configured.`,
      currentValue: undefined,
      proposedValue: false,
      addedKeys: ['search.followSymlinks']
    }));
  }

  return proposals;
}
