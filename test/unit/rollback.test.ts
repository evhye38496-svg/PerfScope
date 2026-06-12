import assert from 'node:assert/strict';
import test from 'node:test';
import { canRollbackEntryInScope, createRemainingChangeLog, getRollbackValue, shouldRollbackEntry } from '../../src/fix/rollback-rules';

test('rollback deletes workspace key when it did not exist before', () => {
  assert.equal(getRollbackValue(false, 'ignored'), undefined);
});

test('rollback restores previous value when it existed before', () => {
  assert.deepEqual(getRollbackValue(true, { a: false }), { a: false });
});

test('rollback skips dirty values', () => {
  assert.equal(shouldRollbackEntry({ a: true }, { a: true }), true);
  assert.equal(shouldRollbackEntry({ a: false }, { a: true }), false);
});

test('rollback comparison ignores object key order', () => {
  assert.equal(shouldRollbackEntry({ b: false, a: true }, { a: true, b: false }), true);
});

test('partial rollback Change Log keeps only remaining entries', () => {
  const changeLog = {
    workspaceId: 'workspace-a',
    timestamp: 1234,
    entries: [
      {
        key: 'files.watcherExclude' as const,
        target: 'workspace' as const,
        existedBefore: false,
        newValue: {},
        workspaceId: 'workspace-a',
        timestamp: 1234
      },
      {
        key: 'search.exclude' as const,
        target: 'workspace' as const,
        existedBefore: true,
        previousValue: { '**/dist': false },
        newValue: { '**/dist': false, '**/build': true },
        workspaceId: 'workspace-a',
        timestamp: 1234
      }
    ]
  };

  const remaining = createRemainingChangeLog(changeLog, [changeLog.entries[1]]);

  assert.equal(remaining.entries.length, 1);
  assert.equal(remaining.entries[0].key, 'search.exclude');
});

test('rollback skips Workspace Folder entries when the folder is unavailable', () => {
  assert.equal(
    canRollbackEntryInScope(
      {
        key: 'search.exclude',
        target: 'workspaceFolder',
        existedBefore: false,
        newValue: {},
        workspaceId: 'workspace-a',
        timestamp: 1234,
        workspaceFolderUri: 'file:///repo/app'
      },
      ['file:///repo/other']
    ),
    false
  );
  assert.equal(
    canRollbackEntryInScope(
      {
        key: 'search.exclude',
        target: 'workspaceFolder',
        existedBefore: false,
        newValue: {},
        workspaceId: 'workspace-a',
        timestamp: 1234,
        workspaceFolderUri: 'file:///repo/app'
      },
      ['file:///repo/app']
    ),
    true
  );
});
