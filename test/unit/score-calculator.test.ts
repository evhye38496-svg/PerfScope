import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBreakdown, calculateTurboScore, gradeScore } from '../../src/engine/score-calculator';
import type { Issue, ScanStats } from '../../src/types';

function baseStats(overrides: Partial<ScanStats> = {}): ScanStats {
  return {
    totalExtensions: 20,
    activeExtensions: 10,
    alwaysOnExtensions: 0,
    startupFinishedExtensions: 0,
    knownHeavyExtensions: 0,
    alternativeSuggestions: 0,
    redundancyHints: 0,
    extensionHostHeapMB: 120,
    extensionHostRssMB: 180,
    osFreeMemoryMB: 8192,
    ...overrides
  };
}

test('calculates a perfect score for a clean scan', () => {
  const breakdown = calculateBreakdown(baseStats(), []);
  assert.deepEqual(breakdown, {
    startup: 100,
    configuration: 100,
    extensionInventory: 100,
    environment: 100
  });
  assert.equal(calculateTurboScore(breakdown), 100);
  assert.equal(gradeScore(100), 'Excellent');
});

test('applies weighted penalties to startup and inventory scores', () => {
  const breakdown = calculateBreakdown(
    baseStats({
      activeExtensions: 35,
      alwaysOnExtensions: 2,
      startupFinishedExtensions: 1,
      knownHeavyExtensions: 2
    }),
    []
  );

  assert.equal(breakdown.startup, 82);
  assert.equal(breakdown.extensionInventory, 84);
  assert.equal(calculateTurboScore(breakdown), 90);
});

test('configuration warnings reduce configuration breakdown only', () => {
  const issues: Issue[] = [
    {
      id: 'config.watcher.node_modules',
      title: 'Watcher issue',
      description: 'Missing watcher exclude.',
      severity: 'warning',
      fixKind: 'safe-auto-fix',
      source: 'configuration'
    }
  ];

  const breakdown = calculateBreakdown(baseStats(), issues);
  assert.equal(breakdown.configuration, 90);
  assert.equal(breakdown.startup, 100);
});

test('grades score ranges', () => {
  assert.equal(gradeScore(90), 'Excellent');
  assert.equal(gradeScore(70), 'Good');
  assert.equal(gradeScore(50), 'Needs Attention');
  assert.equal(gradeScore(49), 'Critical');
});
