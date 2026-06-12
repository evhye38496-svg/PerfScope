import type { ExtensionCategory, ScanResult } from '../types';
import { escapeHtml } from '../utils/html-escape';

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
  viewMode: DashboardViewMode;
}): string {
  const content = params.result ? renderResult(params.result, params.viewMode) : renderEmptyState();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${params.cspSource}; script-src 'nonce-${params.nonce}' ${params.cspSource}; img-src ${params.cspSource} data:; font-src ${params.cspSource}; connect-src 'none';">
  <title>One-Click Turbo</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; }
    main { padding: 20px; max-width: 960px; }
    h1 { font-size: 22px; margin: 0 0 16px; }
    h2 { font-size: 16px; margin: 20px 0 10px; }
    h3 { font-size: 14px; margin: 14px 0 8px; }
    button { display: inline-flex; align-items: center; min-height: 28px; border: 1px solid var(--vscode-button-border, transparent); border-radius: 4px; padding: 4px 10px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); cursor: pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
    .panel, .stat, .issue { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 10px; }
    .panel p, .issue p { margin: 4px 0 0; color: var(--vscode-descriptionForeground); }
    .score { display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; }
    .score strong { font-size: 56px; line-height: 1; }
    .grade { color: var(--vscode-descriptionForeground); font-size: 18px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin: 12px 0; }
    .stat span { display: block; color: var(--vscode-descriptionForeground); font-size: 12px; }
    .issues { display: grid; gap: 8px; }
    .issue h3 { margin: 0 0 4px; font-size: 14px; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px !important; }
    .tags span { border: 1px solid var(--vscode-panel-border); border-radius: 999px; padding: 2px 6px; font-size: 11px; }
    .critical { border-left: 4px solid var(--vscode-errorForeground); }
    .warning { border-left: 4px solid var(--vscode-editorWarning-foreground); }
    .info { border-left: 4px solid var(--vscode-editorInfo-foreground); }
    .empty { color: var(--vscode-descriptionForeground); }
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
  return `<nav class="toolbar" aria-label="Turbo commands">
  <button type="button" data-command="runFullScan">Run Full Scan</button>
  <button type="button" data-command="quickAudit">Quick Audit</button>
  <button type="button" data-command="applySafeFixes">Apply Safe Fixes</button>
  <button type="button" data-command="undoLastFix">Undo Last Fix</button>
  <button type="button" data-command="exportReport">Export Report</button>
</nav>`;
}

function renderEmptyState(): string {
  return `<h1>One-Click Turbo</h1>
${renderToolbar()}
<section class="grid">
  <article class="panel"><h2>Scan</h2><p>Run a performance health scan and open the score report.</p></article>
  <article class="panel"><h2>Audit</h2><p>Review installed extensions, categories, guidance, and overlap hints.</p></article>
  <article class="panel"><h2>Fix</h2><p>Preview workspace safe fixes, then apply or undo Turbo-written settings.</p></article>
</section>`;
}

function renderResult(result: ScanResult, viewMode: DashboardViewMode): string {
  const issues = result.issues.length
    ? result.issues
        .map(
          (issue) => `<article class="issue ${issue.severity}">
  <h3>${escapeHtml(issue.title)}</h3>
  <p>${escapeHtml(issue.description)}</p>
  <p class="tags"><span>${escapeHtml(issue.fixKind)}</span><span>${escapeHtml(issue.source)}</span></p>
</article>`
        )
        .join('')
    : '<p class="empty">No issues found in the latest scan.</p>';

  const audit = renderAudit(result);

  return `<h1>One-Click Turbo</h1>
${renderToolbar()}
<section class="grid">
  <article class="panel"><h2>Scan</h2><p>${result.issues.length} issues found. Last scan: ${escapeHtml(result.generatedAt)}.</p></article>
  <article class="panel"><h2>Audit</h2><p>${result.audit.items.length} extensions, ${result.audit.knownHeavyCount} guidance matches.</p></article>
  <article class="panel"><h2>Fix</h2><p>Workspace safe fixes are previewed before any setting is written.</p></article>
</section>
<section class="score">
  <strong>${result.score}</strong>
  <span class="grade">${escapeHtml(result.grade)}</span>
</section>
<section class="stats">
  <div class="stat"><span>Extensions</span>${result.stats.totalExtensions}</div>
  <div class="stat"><span>Active</span>${result.stats.activeExtensions}</div>
  <div class="stat"><span>Always-on</span>${result.stats.alwaysOnExtensions}</div>
  <div class="stat"><span>Known guidance</span>${result.stats.knownHeavyExtensions}</div>
  <div class="stat"><span>Alternatives</span>${result.stats.alternativeSuggestions}</div>
  <div class="stat"><span>Overlap hints</span>${result.stats.redundancyHints}</div>
  <div class="stat"><span>Heap</span>${result.stats.extensionHostHeapMB} MB</div>
</section>
${viewMode === 'audit' ? audit : ''}
<h2>Issues (${result.issues.length})</h2>
<section class="issues">${issues}</section>
${viewMode === 'scan' ? audit : ''}`;
}

function renderAudit(result: ScanResult): string {
  const categoryCounts = Object.entries(result.audit.categoryCounts)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => `<div class="stat"><span>${escapeHtml(categoryLabels[category as ExtensionCategory] ?? category)}</span>${count}</div>`)
    .join('');

  const auditItems = result.audit.items
    .slice()
    .sort((left, right) => left.category.localeCompare(right.category) || left.displayName.localeCompare(right.displayName))
    .map((item) => {
      const tags = [
        `<span>${escapeHtml(categoryLabels[item.category] ?? item.category)}</span>`,
        item.knowledgeBaseMatches.some((match) => match.kind === 'known-heavy') ? '<span>known guidance</span>' : '',
        item.alternative ? '<span>alternative</span>' : ''
      ]
        .filter(Boolean)
        .join('');

      const descriptions = [
        item.knowledgeBaseMatches.map((match) => match.safeWording).join(' '),
        item.alternative?.safeWording ?? ''
      ]
        .filter(Boolean)
        .join(' ');

      return `<article class="issue info">
  <h3>${escapeHtml(item.displayName || item.id)}</h3>
  <p>${escapeHtml(item.id)}${item.publisher ? ` by ${escapeHtml(item.publisher)}` : ''}</p>
  <p>${escapeHtml(descriptions || item.description || 'No V0.4 audit guidance for this extension.')}</p>
  <p class="tags">${tags}</p>
</article>`;
    })
    .join('');

  const redundancy = result.audit.redundancyHints.length
    ? result.audit.redundancyHints
        .map((hint) => `<article class="issue info"><h3>Overlap hint</h3><p>${escapeHtml(hint.safeWording)}</p></article>`)
        .join('')
    : '<p class="empty">No redundancy hints found by current audit rules.</p>';

  return `<h2>Extension Audit</h2>
<section class="stats">${categoryCounts || '<div class="stat"><span>Categories</span>0</div>'}</section>
<h3>Extensions (${result.audit.items.length})</h3>
<section class="issues">${auditItems}</section>
<h3>Redundancy Hints (${result.audit.redundancyHints.length})</h3>
<section class="issues">${redundancy}</section>`;
}
