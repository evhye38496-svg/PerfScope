import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('webview security regressions stay blocked', () => {
  const dashboard = readFileSync('src/ui/dashboard-renderer.ts', 'utf8');
  const sidebar = readFileSync('src/ui/sidebar-renderer.ts', 'utf8');
  const dashboardProvider = readFileSync('src/ui/dashboard.ts', 'utf8');
  const sidebarProvider = readFileSync('src/ui/sidebar.ts', 'utf8');

  assert.doesNotMatch(`${dashboard}\n${sidebar}`, /unsafe-inline/);
  assert.doesNotMatch(`${dashboard}\n${sidebar}`, /style="/);
  assert.doesNotMatch(`${dashboardProvider}\n${sidebarProvider}`, /Math\.random/);
});

test('quick audit command uses the lightweight audit path', () => {
  const commandSource = readFileSync('src/commands/scan.ts', 'utf8');
  const fullScanBody = commandSource.slice(
    commandSource.indexOf('export async function runFullScanCommand'),
    commandSource.indexOf('export async function quickAuditCommand')
  );
  const quickAuditBody = commandSource.slice(commandSource.indexOf('export async function quickAuditCommand'));

  assert.match(commandSource, /runQuickAudit/);
  assert.match(fullScanBody, /const result = await runScan\(\);/);
  assert.match(quickAuditBody, /const result = await runQuickAudit\(\);/);
});
