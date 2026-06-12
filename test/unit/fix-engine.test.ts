import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkspaceFixProposals, createWorkspaceFolderFixProposals } from '../../src/fix/fix-engine';

test('creates proposals only for missing workspace values', () => {
  const proposals = createWorkspaceFixProposals({
    watcherExclude: {},
    searchExclude: {},
    searchFollowSymlinks: undefined
  });

  assert.deepEqual(
    proposals.map((proposal) => proposal.key),
    ['files.watcherExclude', 'search.exclude', 'search.followSymlinks']
  );
});

test('does not override explicitly configured search.followSymlinks', () => {
  const proposals = createWorkspaceFixProposals({
    watcherExclude: {
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
    },
    searchExclude: {
      '**/node_modules': true,
      '**/dist': true,
      '**/build': true,
      '**/.git': true,
      '**/coverage': true
    },
    searchFollowSymlinks: true
  });

  assert.equal(proposals.length, 0);
});

test('records only missing object keys in proposal metadata', () => {
  const proposals = createWorkspaceFixProposals({
    watcherExclude: {
      '**/node_modules/**': false
    },
    searchExclude: undefined,
    searchFollowSymlinks: false
  });

  const watcher = proposals.find((proposal) => proposal.key === 'files.watcherExclude');
  assert.ok(watcher);
  assert.equal(watcher.addedKeys.includes('**/node_modules/**'), false);
});

test('single-root proposals target Workspace scope', () => {
  const proposals = createWorkspaceFixProposals({
    watcherExclude: {},
    searchExclude: {},
    searchFollowSymlinks: undefined
  });

  assert.ok(proposals.length > 0);
  assert.ok(proposals.every((proposal) => proposal.target === 'workspace'));
});

test('multi-root proposals target Workspace Folder scope', () => {
  const proposals = createWorkspaceFolderFixProposals({
    watcherExclude: {},
    searchExclude: {},
    searchFollowSymlinks: undefined,
    workspaceFolderUri: 'file:///repo/app',
    workspaceFolderName: 'app'
  });

  assert.ok(proposals.length > 0);
  assert.ok(proposals.every((proposal) => proposal.target === 'workspaceFolder'));
  assert.ok(proposals.every((proposal) => proposal.workspaceFolderUri === 'file:///repo/app'));
  assert.match(proposals[0].title, /app/);
});
