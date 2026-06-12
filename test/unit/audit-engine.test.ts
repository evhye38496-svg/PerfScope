import assert from 'node:assert/strict';
import test from 'node:test';
import { auditExtensions } from '../../src/engine/audit-engine';
import type { ExtensionSnapshot } from '../../src/types';

function extension(id: string, overrides: Partial<ExtensionSnapshot> = {}): ExtensionSnapshot {
  return {
    id,
    displayName: id,
    description: '',
    publisher: id.split('.')[0] ?? '',
    categories: [],
    keywords: [],
    extensionKind: [],
    isActive: true,
    activationEvents: [],
    ...overrides
  };
}

test('matches known-heavy records case-insensitively', () => {
  const audit = auditExtensions([extension('EAMODIO.GITLENS')]);
  assert.equal(audit.knownHeavyCount, 1);
  assert.equal(audit.items[0]?.knowledgeBaseMatches.some((match) => match.kind === 'known-heavy'), true);
});

test('does not create knowledge-base matches for unknown extensions', () => {
  const audit = auditExtensions([extension('unknown.extension')]);
  assert.equal(audit.knownHeavyCount, 0);
  assert.equal(audit.alternativeCount, 0);
});

test('creates suggestion-only alternative data without changing known-heavy count', () => {
  const audit = auditExtensions([extension('esbenp.prettier-vscode')]);
  assert.equal(audit.knownHeavyCount, 0);
  assert.equal(audit.alternativeCount, 1);
  assert.equal(audit.items[0]?.alternative?.alternative, 'biomejs.biome');
});

test('produces stable category counts', () => {
  const audit = auditExtensions([
    extension('theme.extension', { categories: ['Themes'] }),
    extension('lint.extension', { keywords: ['formatter'] })
  ]);
  assert.equal(audit.categoryCounts['theme-icon'], 1);
  assert.equal(audit.categoryCounts['lint-format'], 1);
  assert.equal(audit.categoryCounts.unknown, 0);
});
