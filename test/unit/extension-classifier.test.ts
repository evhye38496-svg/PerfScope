import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyExtension } from '../../src/engine/extension-classifier';
import type { ExtensionSnapshot } from '../../src/types';

function snapshot(overrides: Partial<ExtensionSnapshot>): ExtensionSnapshot {
  return {
    id: 'example.extension',
    displayName: 'Example',
    description: '',
    publisher: 'example',
    categories: [],
    keywords: [],
    extensionKind: [],
    isActive: true,
    activationEvents: [],
    ...overrides
  };
}

test('classifies by manifest categories first', () => {
  assert.equal(classifyExtension(snapshot({ categories: ['Linters'] })), 'lint-format');
});

test('classifies by keywords', () => {
  assert.equal(classifyExtension(snapshot({ keywords: ['copilot', 'completion'] })), 'ai-completion');
});

test('classifies by description fallback', () => {
  assert.equal(classifyExtension(snapshot({ description: 'A tiny Git blame helper' })), 'git-version-control');
});

test('uses unknown when no rule matches', () => {
  assert.equal(classifyExtension(snapshot({ description: 'Something else' })), 'unknown');
});
