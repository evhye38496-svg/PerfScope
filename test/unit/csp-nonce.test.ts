import assert from 'node:assert/strict';
import test from 'node:test';
import { createCspNonce } from '../../src/utils/csp-nonce';

test('CSP nonce uses crypto-safe base64url output', () => {
  const first = createCspNonce();
  const second = createCspNonce();

  assert.match(first, /^[A-Za-z0-9_-]{22}$/);
  assert.match(second, /^[A-Za-z0-9_-]{22}$/);
  assert.notEqual(first, second);
});
