import type { ExtensionCategory, ScanResult } from '../types';
import { escapeHtml } from '../utils/html-escape';
import type { TurboOperationSummary } from '../state/turbo-state';
import { renderWebviewStyles } from './webview-styles';

export type DashboardViewMode = 'scan' | 'audit';

const categoryLabels: Record<ExtensionCategory, string> = {
  'theme-icon': 'Theme / Icon',
  'lint-format': 'Lint / Format',
  'language-support': 'Language Support',
  'ai-completion': 'AI / Completion',
  'git-version-control': 'Git / Version Control',
  snippets: 'Snippets',
  'utility-productivity': 'Utility / Productivity',
  'build-task-debug': 'Build / Task / Debug',
  unknown: 'Unknown'
};

export function renderDashboardHtml(params: {
  cspSource: string;
  nonce: string;
  result?: ScanResult;
  operation?: TurboOperationSummary;
  viewMode: DashboardViewMode;
}): string {
  const content = params.result ? renderResult(params.result, params.viewMode, params.operation) : renderEmptyState(params.operation);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${params.nonce}' ${params.cspSource}; script-src 'nonce-${params.nonce}' ${params.cspSource}; img-src ${params.cspSource} data:; font-src ${params.cspSource}; connect-src 'none';">
  <title>One-Click Turbo</title>
  <style nonce="${params.nonce}">
    ${renderWebviewStyles('dashboard')}
    .score-meter-fill { width: ${params.result ? clampScore(params.result.score) : 0}%; }
  </style>
</head>
<body>
  <main>${content}</main>
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

function renderToolbar(): string {
  return `<nav class="toolbar launcher-actions" aria-label="Turbo commands">
  <button class="action-button primary-action" type="button" data-command="runFullScan">Run Full Scan</button>
  <button class="action-button secondary" type="button" data-command="quickAudit">Quick Audit</button>
  <button class="action-button secondary" type="button" data-command="applySafeFixes">Apply Safe Fixes</button>
  <button class="action-button secondary" type="button" data-command="undoLastFix">Undo Last Fix</button>
  <button class="action-button secondary" type="button" data-command="exportReport">Export Report</button>
</nav>`;
}

function renderReleaseBadges(): string {
  return '<div class="tag-row"><span class="tag">V1.0</span><span class="tag">Offline</span><span class="tag">Preview-before-write</span></div>';
}

function renderEmptyState(operation?: TurboOperationSummary): string {
  return `<section class="launcher-shell">
  <header class="hero-grid">
    <section class="card score-hero">
      <span class="eyebrow">Ready</span>
      <h1>One-Click Turbo</h1>
      <p>Run a scan to build your VS Code performance report.</p>
      ${renderReleaseBadges()}
      <div class="score-meter" aria-hidden="true"><div class="score-meter-fill"></div></div>
    </section>
    <section class="card score-hero">
      <span class="eyebrow">Launcher</span>
      ${renderToolbar()}
    </section>
  </header>
  <section class="section-grid">
    <article class="panel-card"><h2>Scan</h2><p>Measure extension inventory, activation signals, and workspace configuration.</p></article>
    <article class="panel-card"><h2>Audit</h2><p>Review known guidance, alternatives, and low-risk overlap hints.</p></article>
    <article class="panel-card"><h2>Fix</h2><p>Preview workspace safe fixes before any setting is written.</p></article>
  </section>
  ${renderOperation(operation)}
</section>`;
}

function renderResult(result: ScanResult, viewMode: DashboardViewMode, operation?: TurboOperationSummary): string {
  const audit = renderAudit(result);

  return `<section class="launcher-shell">
  <header class="hero-grid">
    <section class="card score-hero">
      <span class="eyebrow">Turbo Score</span>
      <div class="score-line">
        <strong class="score-value">${result.score}</strong>
        <span class="score-grade">${escapeHtml(result.grade)}</span>
      </div>
      <div class="score-meter" aria-hidden="true"><div class="score-meter-fill"></div></div>
      <p>Last scan: ${escapeHtml(result.generatedAt)}</p>
      ${renderReleaseBadges()}
    </section>
    <section class="card score-hero">
      <span class="eyebrow">Quick Actions</span>
      <h1>One-Click Turbo</h1>
      ${renderToolbar()}
    </section>
  </header>
  <section class="section-grid">
    <article class="panel-card"><h2>${result.kind === 'quick-audit' ? 'Quick Audit' : 'Scan'}</h2><p>${renderScanSummary(result)}</p></article>
    <article class="panel-card"><h2>Audit</h2><p>${result.audit.items.length} extensions, ${result.audit.knownHeavyCount} guidance matches, ${result.audit.redundancyHints.length} overlap hints.</p></article>
    <article class="panel-card"><h2>Fix</h2><p>Workspace safe fixes remain preview-first and undoable through the last Change Log.</p></article>
  </section>
  <section class="section-grid">
    ${renderStats(result)}
  </section>
  ${renderOperation(operation)}
  ${viewMode === 'audit' ? audit : ''}
  ${renderIssues(result)}
  ${viewMode === 'scan' ? audit : ''}
</section>`;
}

function renderScanSummary(result: ScanResult): string {
  if (result.kind === 'quick-audit') {
    return `${result.issues.length} audit issues found across ${result.stats.totalExtensions} extensions. Workspace configuration and environment stats were not measured.`;
  }

  return `${result.issues.length} issues found across ${result.stats.totalExtensions} extensions.`;
}

function renderOperation(operation?: TurboOperationSummary): string {
  if (!operation) {
    return '';
  }

  return `<section>
  <h2>Recent Activity</h2>
  <article class="panel-card">
    <div class="tag-row"><span class="tag">${escapeHtml(operation.kind)}</span><span class="tag">${escapeHtml(operation.status)}</span></div>
    <p>${escapeHtml(operation.message)}</p>
    <p class="muted">${escapeHtml(operation.timestamp)}</p>
  </article>
</section>`;
}

function renderStats(result: ScanResult): string {
  return [
    ['Extensions', result.stats.totalExtensions],
    ['Active', result.stats.activeExtensions],
    ['Always-on', result.stats.alwaysOnExtensions],
    ['Known guidance', result.stats.knownHeavyExtensions],
    ['Alternatives', result.stats.alternativeSuggestions],
    ['Heap', `${result.stats.extensionHostHeapMB} MB`]
  ]
    .map(([label, value]) => `<article class="metric-card"><span>${escapeHtml(String(label))}</span><strong>${escapeHtml(String(value))}</strong></article>`)
    .join('');
}

function renderIssues(result: ScanResult): string {
  const issues = result.issues.length
    ? result.issues
        .map(
          (issue) => `<article class="issue-card ${issue.severity}">
  <h3>${escapeHtml(issue.title)}</h3>
  <p>${escapeHtml(issue.description)}</p>
  <div class="tag-row"><span class="tag">${escapeHtml(issue.severity)}</span><span class="tag">${escapeHtml(issue.fixKind)}</span><span class="tag">${escapeHtml(issue.source)}</span></div>
</article>`
        )
        .join('')
    : '<p class="empty">No issues found in the latest scan.</p>';

  return `<section>
  <h2>Issues (${result.issues.length})</h2>
  <div class="issue-list">${issues}</div>
</section>`;
}

function renderAudit(result: ScanResult): string {
  const categoryCounts = Object.entries(result.audit.categoryCounts)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => `<article class="metric-card"><span>${escapeHtml(categoryLabels[category as ExtensionCategory] ?? category)}</span><strong>${count}</strong></article>`)
    .join('');

  const auditItems = result.audit.items
    .slice()
    .sort((left, right) => left.category.localeCompare(right.category) || left.displayName.localeCompare(right.displayName))
    .map((item) => {
      const tags = [
        `<span class="tag">${escapeHtml(categoryLabels[item.category] ?? item.category)}</span>`,
        item.knowledgeBaseMatches.some((match) => match.kind === 'known-heavy') ? '<span class="tag">known guidance</span>' : '',
        item.alternative ? '<span class="tag">alternative</span>' : ''
      ]
        .filter(Boolean)
        .join('');

      const descriptions = [
        item.knowledgeBaseMatches.map((match) => match.safeWording).join(' '),
        item.alternative?.safeWording ?? ''
      ]
        .filter(Boolean)
        .join(' ');

      return `<article class="issue-card info">
  <h3>${escapeHtml(item.displayName || item.id)}</h3>
  <p>${escapeHtml(item.id)}${item.publisher ? ` by ${escapeHtml(item.publisher)}` : ''}</p>
  <p>${escapeHtml(descriptions || item.description || 'No V0.7 audit guidance for this extension.')}</p>
  <div class="tag-row">${tags}</div>
</article>`;
    })
    .join('');

  const redundancy = result.audit.redundancyHints.length
    ? result.audit.redundancyHints
        .map((hint) => `<article class="issue-card info"><h3>Overlap hint</h3><p>${escapeHtml(hint.safeWording)}</p></article>`)
        .join('')
    : '<p class="empty">No redundancy hints found by current audit rules.</p>';

  return `<section>
  <h2>Extension Audit</h2>
  <div class="section-grid">${categoryCounts || '<article class="metric-card"><span>Categories</span><strong>0</strong></article>'}</div>
  <h2>Extensions (${result.audit.items.length})</h2>
  <div class="issue-list">${auditItems}</div>
  <h2>Redundancy Hints (${result.audit.redundancyHints.length})</h2>
  <div class="issue-list">${redundancy}</div>
</section>`;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
