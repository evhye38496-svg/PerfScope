import assert from 'node:assert/strict';
import test from 'node:test';
import { renderSidebarHtml } from '../../src/ui/sidebar-renderer';
import type { ExtensionCategory, ScanResult } from '../../src/types';

const categoryCounts = {
  'theme-icon': 0,
  'lint-format': 0,
  'language-support': 0,
  'ai-completion': 0,
  'git-version-control': 0,
  snippets: 0,
  'utility-productivity': 0,
  'build-task-debug': 0,
  unknown: 1
} satisfies Record<ExtensionCategory, number>;

function scanResult(): ScanResult {
  return {
    score: 91,
    grade: 'Excellent',
    generatedAt: '<script>alert(1)</script>',
    stats: {
      totalExtensions: 12,
      activeExtensions: 7,
      alwaysOnExtensions: 0,
      startupFinishedExtensions: 0,
      knownHeavyExtensions: 0,
      alternativeSuggestions: 0,
      redundancyHints: 0,
      extensionHostHeapMB: 100,
      extensionHostRssMB: 140,
      osFreeMemoryMB: 4096
    },
    breakdown: {
      startup: 100,
      configuration: 90,
      extensionInventory: 100,
      environment: 100
    },
    issues: [
      {
        id: 'issue',
        title: 'Unsafe',
        description: 'Unsafe',
        severity: 'info',
        fixKind: 'suggestion-only',
        source: 'environment'
      }
    ],
    audit: {
      items: [],
      categoryCounts,
      knownHeavyCount: 0,
      alternativeCount: 0,
      redundancyHints: []
    }
  };
}

test('sidebar empty state includes compact actions', () => {
  const html = renderSidebarHtml({
    cspSource: 'vscode-resource:',
    nonce: 'abc'
  });

  assert.match(html, /Run Full Scan/);
  assert.match(html, /Quick Audit/);
  assert.match(html, /Apply Safe Fixes/);
  assert.match(html, /Undo Last Fix/);
  assert.match(html, /Export Report/);
  assert.match(html, /Open Full Dashboard/);
  assert.match(html, /V1\.0/);
  assert.match(html, /Offline/);
  assert.match(html, /primary-action/);
  assert.match(html, /score-meter/);
  assert.match(html, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /setInterval/);
  assert.doesNotMatch(html, /requestAnimationFrame/);
  assert.doesNotMatch(html, /<canvas/);
});

test('sidebar summary shows score and escapes scan strings', () => {
  const html = renderSidebarHtml({
    cspSource: 'vscode-resource:',
    nonce: 'abc',
    result: scanResult(),
    operation: {
      kind: 'fix',
      status: 'skipped',
      message: 'No workspace settings were written; skipped 2; failed 0.',
      timestamp: '2026-06-12T07:00:00.000Z'
    }
  });

  assert.match(html, /91/);
  assert.match(html, /Issues/);
  assert.match(html, /Extensions/);
  assert.match(html, /12/);
  assert.match(html, /style="--score: 91%"/);
  assert.match(html, /Recent Activity/);
  assert.match(html, /No workspace settings were written/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});
