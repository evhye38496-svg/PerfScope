import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultReportFileName, createMarkdownReport, markdownCell } from '../../src/report/markdown-report';
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
    score: 76,
    grade: 'Good',
    generatedAt: '2026-06-12T06:30:00.000Z',
    stats: {
      totalExtensions: 2,
      activeExtensions: 1,
      alwaysOnExtensions: 1,
      startupFinishedExtensions: 0,
      knownHeavyExtensions: 1,
      alternativeSuggestions: 1,
      redundancyHints: 1,
      extensionHostHeapMB: 100,
      extensionHostRssMB: 150,
      osFreeMemoryMB: 2048
    },
    breakdown: {
      startup: 80,
      configuration: 70,
      extensionInventory: 75,
      environment: 100
    },
    issues: [
      {
        id: 'config.issue',
        title: 'Missing | watcher',
        description: 'Avoid <script>alert(1)</script>\nnew lines',
        severity: 'warning',
        fixKind: 'safe-auto-fix',
        source: 'configuration'
      }
    ],
    audit: {
      items: [
        {
          id: 'publisher.extension',
          displayName: 'Heavy | Extension',
          publisher: 'pub<script>',
          description: 'unsafe',
          category: 'lint-format',
          isActive: true,
          activationEvents: [],
          knowledgeBaseMatches: [
            {
              kind: 'known-heavy',
              safeWording: 'May add work | in large projects',
              confidence: 'medium',
              lastVerified: '2026-06-12'
            }
          ],
          alternative: {
            extensionId: 'publisher.extension',
            alternative: 'Light Tool',
            safeWording: 'Consider a lighter option',
            confidence: 'low',
            lastVerified: '2026-06-12'
          }
        }
      ],
      categoryCounts,
      knownHeavyCount: 1,
      alternativeCount: 1,
      redundancyHints: [
        {
          id: 'redundancy',
          extensionIds: ['a', 'b'],
          category: 'lint-format',
          languageScope: 'javascript',
          safeWording: 'Two tools overlap'
        }
      ]
    }
  };
}

test('markdown report includes score, stats, issues, audit, and fix status', () => {
  const report = createMarkdownReport(scanResult(), {
    workspaceId: 'workspace',
    timestamp: 1781234567890,
    entries: [
      {
        key: 'files.watcherExclude',
        target: 'workspaceFolder',
        existedBefore: false,
        newValue: {},
        workspaceId: 'workspace',
        timestamp: 1781234567890,
        workspaceFolderUri: 'file:///repo/app'
      }
    ]
  });

  assert.match(report, /Turbo Score: 76/);
  assert.match(report, /Release: One-Click Turbo 1\.0\.0/);
  assert.match(report, /## Issues/);
  assert.match(report, /## Extension Audit/);
  assert.match(report, /Known Guidance and Alternatives/);
  assert.match(report, /Safe Fix and Undo Status/);
  assert.match(report, /Last successful workspace write Change Log/);
  assert.match(report, /latest Turbo run that actually wrote Workspace settings/);
  assert.match(report, /Purge Behavior/);
  assert.match(report, /Workspace Folder scope/);
  assert.match(report, /file:\/\/\/repo\/app/);
  assert.match(report, /files\.watcherExclude/);
});

test('markdown cells escape table separators, newlines, and html', () => {
  assert.equal(markdownCell('a | b\n<script>'), 'a \\| b &lt;script&gt;');
  const report = createMarkdownReport(scanResult());
  assert.doesNotMatch(report, /<script>/);
  assert.match(report, /Missing \\| watcher/);
});

test('default report filename is stable and timestamped', () => {
  assert.equal(createDefaultReportFileName(new Date('2026-06-12T06:05:00')), 'turbo-report-2026-06-12-0605.md');
});
