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
}

export function createWorkspaceFixProposals(config: WorkspaceConfigValues): FixProposal[] {
  const proposals: FixProposal[] = [];
  const watcher = mergeMissingObjectKeys(config.watcherExclude, recommendedWatcherExclude);
  const search = mergeMissingObjectKeys(config.searchExclude, recommendedSearchExclude);

  if (watcher.addedKeys.length > 0) {
    proposals.push({
      id: 'workspace.files.watcherExclude',
      key: 'files.watcherExclude',
      target: 'workspace',
      title: 'Add workspace watcher exclusions',
      description: 'Adds missing generated, dependency, and cache folders to files.watcherExclude.',
      currentValue: config.watcherExclude,
      proposedValue: watcher.mergedValue,
      addedKeys: watcher.addedKeys
    });
  }

  if (search.addedKeys.length > 0) {
    proposals.push({
      id: 'workspace.search.exclude',
      key: 'search.exclude',
      target: 'workspace',
      title: 'Add workspace search exclusions',
      description: 'Adds missing generated and dependency folders to search.exclude.',
      currentValue: config.searchExclude,
      proposedValue: search.mergedValue,
      addedKeys: search.addedKeys
    });
  }

  if (config.searchFollowSymlinks === undefined) {
    proposals.push({
      id: 'workspace.search.followSymlinks',
      key: 'search.followSymlinks',
      target: 'workspace',
      title: 'Disable following symlinks for workspace search',
      description: 'Sets search.followSymlinks to false at Workspace scope when it is not explicitly configured.',
      currentValue: undefined,
      proposedValue: false,
      addedKeys: ['search.followSymlinks']
    });
  }

  return proposals;
}
