import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeMissingObjectKeys } from '../../src/fix/deep-merge';

test('deep merge fills missing keys and preserves existing false', () => {
  const result = mergeMissingObjectKeys(
    {
      '**/build/**': false
    },
    {
      '**/build/**': true,
      '**/node_modules/**': true
    }
  );

  assert.deepEqual(result.mergedValue, {
    '**/build/**': false,
    '**/node_modules/**': true
  });
  assert.deepEqual(result.addedKeys, ['**/node_modules/**']);
});

test('deep merge reports no additions when all keys already exist', () => {
  const result = mergeMissingObjectKeys(
    {
      a: false,
      b: true
    },
    {
      a: true,
      b: true
    }
  );

  assert.deepEqual(result.addedKeys, []);
});
