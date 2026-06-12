import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDashboardCommand } from '../../src/ui/dashboard-messages';

test('dashboard message allowlist resolves only supported Turbo commands', () => {
  assert.equal(resolveDashboardCommand({ command: 'runFullScan' }), 'turbo.runFullScan');
  assert.equal(resolveDashboardCommand({ command: 'quickAudit' }), 'turbo.quickAudit');
  assert.equal(resolveDashboardCommand({ command: 'applySafeFixes' }), 'turbo.applySafeFixes');
  assert.equal(resolveDashboardCommand({ command: 'undoLastFix' }), 'turbo.undoLastFix');
  assert.equal(resolveDashboardCommand({ command: 'exportReport' }), 'turbo.exportReport');
});

test('dashboard message allowlist ignores unknown or malformed messages', () => {
  assert.equal(resolveDashboardCommand({ command: 'workbench.extensions.action.disableExtension' }), undefined);
  assert.equal(resolveDashboardCommand({ command: 'turbo.purge' }), undefined);
  assert.equal(resolveDashboardCommand({}), undefined);
  assert.equal(resolveDashboardCommand(undefined), undefined);
});
