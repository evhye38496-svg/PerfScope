import assert from 'node:assert/strict';
import test from 'node:test';
import { getRollbackValue, shouldRollbackEntry } from '../../src/fix/rollback-rules';

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
