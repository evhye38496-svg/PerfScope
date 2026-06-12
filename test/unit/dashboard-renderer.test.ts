import assert from 'node:assert/strict';
import test from 'node:test';
import { renderDashboardHtml } from '../../src/ui/dashboard-renderer';
import type { ExtensionCategory, ScanResult } from '../../src/types';

const categoryCounts = {
  'theme-icon': 0,
  'lint-format': 1,
  'language-support': 0,
  'ai-completion': 0,
  'git-version-control': 0,
  snippets: 0,
  'utility-productivity': 0,
  'build-task-debug': 0,
  unknown: 0
} satisfies Record<ExtensionCategory, number>;

function scanResult(): ScanResult {
  return {
    score: 88,
    grade: 'Good',
    generatedAt: '2026-06-12T06:00:00.000Z',
    stats: {
      totalExtensions: 1,
      activeExtensions: 1,
      alwaysOnExtensions: 0,
      startupFinishedExtensions: 0,
      knownHeavyExtensions: 1,
      alternativeSuggestions: 0,
      redundancyHints: 0,
      extensionHostHeapMB: 120,
      extensionHostRssMB: 180,
      osFreeMemoryMB: 4096
    },
    breakdown: {
      startup: 100,
      configuration: 90,
      extensionInventory: 80,
      environment: 100
    },
    issues: [
      {
        id: 'issue.one',
        title: '<Unsafe Issue>',
        description: 'Description with <script>alert(1)</script>',
        severity: 'warning',
        fixKind: 'safe-auto-fix',
        source: 'configuration'
      }
    ],
    audit: {
      items: [
        {
          id: 'bad.publisher',
          displayName: '<img src=x onerror=alert(1)>',
          publisher: 'bad<script>',
          description: 'unsafe <b>description</b>',
          category: 'lint-format',
          isActive: true,
          activationEvents: [],
          knowledgeBaseMatches: [],
          alternative: undefined
        }
      ],
      categoryCounts,
      knownHeavyCount: 1,
      alternativeCount: 0,
      redundancyHints: []
    }
  };
}

test('dashboard renders V0.7 launcher command buttons and score UI', () => {
  const html = renderDashboardHtml({
    cspSource: 'vscode-resource:',
    nonce: 'abc',
    viewMode: 'scan'
  });

  assert.match(html, /data-command="runFullScan"/);
  assert.match(html, /data-command="quickAudit"/);
  assert.match(html, /data-command="applySafeFixes"/);
  assert.match(html, /data-command="undoLastFix"/);
  assert.match(html, /data-command="exportReport"/);
  assert.match(html, /launcher-actions/);
  assert.match(html, /primary-action/);
  assert.match(html, /score-meter/);
  assert.match(html, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /setInterval/);
  assert.doesNotMatch(html, /requestAnimationFrame/);
  assert.doesNotMatch(html, /<canvas/);
});

test('dashboard renders launcher-style result sections', () => {
  const html = renderDashboardHtml({
    cspSource: 'vscode-resource:',
    nonce: 'abc',
    result: scanResult(),
    operation: {
      kind: 'undo',
      status: 'success',
      message: 'Restored 1 workspace settings; skipped 0; failed 0.',
      timestamp: '2026-06-12T07:05:00.000Z'
    },
    viewMode: 'scan'
  });

  assert.match(html, /score-hero/);
  assert.match(html, /section-grid/);
  assert.match(html, /panel-card/);
  assert.match(html, /issue-card/);
  assert.match(html, /Recent Activity/);
  assert.match(html, /Restored 1 workspace settings/);
  assert.match(html, /style="--score: 88%"/);
});

test('dashboard escapes scan and manifest strings', () => {
  const html = renderDashboardHtml({
    cspSource: 'vscode-resource:',
    nonce: 'abc',
    result: scanResult(),
    viewMode: 'audit'
  });

  assert.match(html, /&lt;Unsafe Issue&gt;/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /bad&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});
