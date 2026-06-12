import assert from 'node:assert/strict';
import test from 'node:test';
import { findRedundancyHints } from '../../src/engine/redundancy-checker';
import type { ExtensionAuditItem } from '../../src/types';

function item(id: string, activationEvents: string[]): ExtensionAuditItem {
  return {
    id,
    displayName: id,
    publisher: id.split('.')[0] ?? '',
    description: '',
    category: 'lint-format',
    isActive: true,
    activationEvents,
    knowledgeBaseMatches: []
  };
}

test('does not flag whitelisted ESLint and Prettier pair', () => {
  const hints = findRedundancyHints([
    item('dbaeumer.vscode-eslint', ['onLanguage:javascript']),
    item('esbenp.prettier-vscode', ['onLanguage:javascript'])
  ]);
  assert.equal(hints.length, 0);
});

test('flags overlapping lint-format extensions for the same language', () => {
  const hints = findRedundancyHints([
    item('example.linter-a', ['onLanguage:javascript']),
    item('example.linter-b', ['onLanguage:javascript'])
  ]);
  assert.equal(hints.length, 1);
  assert.equal(hints[0]?.languageScope, 'javascript');
});

test('does not flag extensions without language overlap', () => {
  const hints = findRedundancyHints([
    item('example.linter-a', ['onLanguage:javascript']),
    item('example.linter-b', ['onLanguage:cpp'])
  ]);
  assert.equal(hints.length, 0);
});
