import assert from 'node:assert/strict';
import test from 'node:test';
import { createExtensionReadIssue, snapshotExtension } from '../../src/engine/extension-snapshot';

test('extension snapshot normalizes manifest metadata', () => {
  const snapshot = snapshotExtension({
    id: 'publisher.sample',
    isActive: true,
    packageJSON: {
      displayName: 'Sample',
      publisher: 'publisher',
      categories: ['Linters', 1],
      keywords: ['javascript'],
      extensionKind: 'workspace',
      activationEvents: ['onStartupFinished']
    }
  });

  assert.equal(snapshot.displayName, 'Sample');
  assert.deepEqual(snapshot.categories, ['Linters']);
  assert.deepEqual(snapshot.extensionKind, ['workspace']);
  assert.deepEqual(snapshot.activationEvents, ['onStartupFinished']);
});

test('extension manifest read issue is info level and suggestion-only', () => {
  const issue = createExtensionReadIssue('broken.extension', new Error('bad manifest'));

  assert.equal(issue.id, 'extension.manifestRead.broken.extension');
  assert.equal(issue.severity, 'info');
  assert.equal(issue.fixKind, 'suggestion-only');
  assert.match(issue.description, /bad manifest/);
});
