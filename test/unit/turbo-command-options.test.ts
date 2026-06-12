import assert from 'node:assert/strict';
import test from 'node:test';
import { createTurboCommandOptions, shouldRevealDashboard } from '../../src/ui/turbo-command-options';

test('webview command options preserve source', () => {
  assert.deepEqual(createTurboCommandOptions('sidebar'), { source: 'sidebar' });
  assert.deepEqual(createTurboCommandOptions('dashboard'), { source: 'dashboard' });
});

test('sidebar commands do not reveal the full Dashboard automatically', () => {
  assert.equal(shouldRevealDashboard(createTurboCommandOptions('sidebar')), false);
  assert.equal(shouldRevealDashboard(createTurboCommandOptions('dashboard')), true);
  assert.equal(shouldRevealDashboard(undefined), true);
});
