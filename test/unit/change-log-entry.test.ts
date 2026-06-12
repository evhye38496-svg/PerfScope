import assert from 'node:assert/strict';
import test from 'node:test';
import { createChangeLogEntry } from '../../src/fix/change-log-entry';
import type { FixProposal } from '../../src/types';

function proposal(overrides: Partial<FixProposal> = {}): FixProposal {
  return {
    id: 'workspace.search.followSymlinks',
    key: 'search.followSymlinks',
    target: 'workspace',
    title: 'Disable following symlinks for workspace search',
    description: 'Sets search.followSymlinks to false at Workspace scope.',
    currentValue: undefined,
    proposedValue: false,
    addedKeys: ['search.followSymlinks'],
    ...overrides
  };
}

test('change log entry records existedBefore and values', () => {
  const entry = createChangeLogEntry(proposal(), true, true, 'workspace-a', 1234);

  assert.equal(entry.key, 'search.followSymlinks');
  assert.equal(entry.target, 'workspace');
  assert.equal(entry.existedBefore, true);
  assert.equal(entry.previousValue, true);
  assert.equal(entry.newValue, false);
  assert.equal(entry.workspaceId, 'workspace-a');
  assert.equal(entry.timestamp, 1234);
});

test('change log entry records missing previous workspace value', () => {
  const entry = createChangeLogEntry(proposal(), false, undefined, 'workspace-a', 1234);

  assert.equal(entry.existedBefore, false);
  assert.equal(entry.previousValue, undefined);
});
