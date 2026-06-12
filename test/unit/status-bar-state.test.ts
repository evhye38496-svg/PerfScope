import assert from 'node:assert/strict';
import test from 'node:test';
import { createStatusPresentation } from '../../src/ui/status-bar-state';

test('status bar presents active states with spinner text', () => {
  assert.deepEqual(createStatusPresentation({ kind: 'scanning' }), {
    text: '$(sync~spin) Turbo',
    tooltip: 'One-Click Turbo: full scan is running'
  });
  assert.equal(createStatusPresentation({ kind: 'auditing' }).text, '$(sync~spin) Audit');
  assert.equal(createStatusPresentation({ kind: 'fixing' }).text, '$(sync~spin) Fix');
  assert.equal(createStatusPresentation({ kind: 'undoing' }).text, '$(sync~spin) Undo');
  assert.equal(createStatusPresentation({ kind: 'exporting' }).text, '$(sync~spin) Export');
});

test('status bar presents score and error states', () => {
  const score = createStatusPresentation({
    kind: 'score',
    score: 91,
    grade: 'Excellent',
    lastScanAt: '2026-06-12T06:00:00.000Z'
  });
  assert.equal(score.text, '$(zap) 91');
  assert.match(score.tooltip, /Excellent/);
  assert.match(score.tooltip, /2026-06-12/);

  const error = createStatusPresentation({ kind: 'error', message: 'Scan failed' });
  assert.equal(error.text, '$(warning) Turbo');
  assert.match(error.tooltip, /Scan failed/);
});
