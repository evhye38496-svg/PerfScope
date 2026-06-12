import assert from 'node:assert/strict';
import test from 'node:test';
import { stableEquals } from '../../src/utils/stable-equality';

test('stable equality ignores object key insertion order', () => {
  assert.equal(stableEquals({ b: true, a: { y: 2, x: 1 } }, { a: { x: 1, y: 2 }, b: true }), true);
});

test('stable equality keeps array order significant', () => {
  assert.equal(stableEquals(['a', 'b'], ['b', 'a']), false);
});
