import type { ScanResult } from '../types';
import { escapeHtml } from '../utils/html-escape';
import type { TurboOperationSummary } from '../state/turbo-state';
import { renderWebviewStyles } from './webview-styles';

export function renderSidebarHtml(params: {
  cspSource: string;
  nonce: string;
  result?: ScanResult;
  operation?: TurboOperationSummary;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${params.nonce}' ${params.cspSource}; script-src 'nonce-${params.nonce}' ${params.cspSource}; img-src ${params.cspSource} data:; font-src ${params.cspSource}; connect-src 'none';">
  <title>One-Click Turbo</title>
  <style nonce="${params.nonce}">
    ${renderWebviewStyles('sidebar')}
    .score-meter-fill { width: ${params.result ? clampScore(params.result.score) : 0}%; }
    .sidebar-actions { display: grid; gap: 7px; }
    .sidebar-actions .action-button { width: 100%; justify-content: flex-start; }
    .sidebar-metrics { display: grid; gap: 6px; }
    .sidebar-metric { display: flex; justify-content: space-between; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--turbo-border); }
    .sidebar-metric:last-child { border-bottom: 0; }
  </style>
</head>
<body>
  <main>
    <section class="launcher-shell">
      <header>
        <h1>One-Click Turbo</h1>
      </header>
      ${params.result ? renderSummary(params.result) : renderEmptyState()}
      ${renderOperation(params.operation)}
      <section>
        <h2>Actions</h2>
        ${renderActions()}
      </section>
    </section>
  </main>
  <script nonce="${params.nonce}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('[data-command]').forEach((button) => {
      button.addEventListener('click', () => {
        vscode.postMessage({ command: button.getAttribute('data-command') });
      });
    });
  </script>
</body>
</html>`;
}

function renderOperation(operation?: TurboOperationSummary): string {
  if (!operation) {
    return '';
  }

  return `<section class="card panel-card">
  <h2>Recent Activity</h2>
  <p>${escapeHtml(operation.message)}</p>
  <div class="tag-row"><span class="tag">${escapeHtml(operation.kind)}</span><span class="tag">${escapeHtml(operation.status)}</span></div>
</section>`;
}

function renderEmptyState(): string {
  return `<section class="card score-hero">
  <span class="eyebrow">Ready</span>
  <strong class="score-value">Turbo</strong>
  <p>Run a scan to light up your performance console.</p>
  ${renderReleaseBadges()}
  <div class="score-meter" aria-hidden="true"><div class="score-meter-fill"></div></div>
</section>`;
}

function renderSummary(result: ScanResult): string {
  return `<section class="card score-hero">
  <span class="eyebrow">Turbo Score</span>
  <div class="score-line">
    <strong class="score-value">${result.score}</strong>
    <span class="score-grade">${escapeHtml(result.grade)}</span>
  </div>
  <div class="score-meter" aria-hidden="true"><div class="score-meter-fill"></div></div>
  <p>Last scan: ${escapeHtml(result.generatedAt)}</p>
  ${renderReleaseBadges()}
  ${result.kind === 'quick-audit' ? '<p>Extension audit only. Workspace configuration and environment stats were not measured.</p>' : ''}
</section>
<section class="card panel-card sidebar-metrics">
  <div class="sidebar-metric"><span>Issues</span><strong>${result.issues.length}</strong></div>
  <div class="sidebar-metric"><span>Extensions</span><strong>${result.stats.totalExtensions}</strong></div>
  <div class="sidebar-metric"><span>Active</span><strong>${result.stats.activeExtensions}</strong></div>
</section>`;
}

function renderReleaseBadges(): string {
  return '<div class="tag-row"><span class="tag">V1.0</span><span class="tag">Offline</span><span class="tag">Local</span></div>';
}

function renderActions(): string {
  return `<nav class="sidebar-actions" aria-label="Turbo commands">
  <button class="action-button primary-action" type="button" data-command="runFullScan">Run Full Scan</button>
  <button class="action-button secondary" type="button" data-command="quickAudit">Quick Audit</button>
  <button class="action-button secondary" type="button" data-command="applySafeFixes">Apply Safe Fixes</button>
  <button class="action-button secondary" type="button" data-command="undoLastFix">Undo Last Fix</button>
  <button class="action-button secondary" type="button" data-command="exportReport">Export Report</button>
  <button class="action-button secondary" type="button" data-command="openFullDashboard">Open Full Dashboard</button>
</nav>`;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
