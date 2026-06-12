import type { ChangeLog, ExtensionCategory, Issue, ScanResult } from '../types';

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

export function createMarkdownReport(result: ScanResult, changeLog?: ChangeLog): string {
  return [
    '# One-Click Turbo Report',
    '',
    `Generated: ${text(result.generatedAt)}`,
    '',
    '## Summary',
    '',
    `- Turbo Score: ${result.score}`,
    `- Grade: ${text(result.grade)}`,
    `- Issues: ${result.issues.length}`,
    `- Extensions: ${result.stats.totalExtensions}`,
    `- Active Extensions: ${result.stats.activeExtensions}`,
    '',
    '## Score Breakdown',
    '',
    '| Area | Score |',
    '| --- | ---: |',
    `| Startup | ${result.breakdown.startup} |`,
    `| Configuration | ${result.breakdown.configuration} |`,
    `| Extension Inventory | ${result.breakdown.extensionInventory} |`,
    `| Environment | ${result.breakdown.environment} |`,
    '',
    '## Environment Stats',
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Always-on Extensions | ${result.stats.alwaysOnExtensions} |`,
    `| Startup Finished Extensions | ${result.stats.startupFinishedExtensions} |`,
    `| Known Guidance Matches | ${result.stats.knownHeavyExtensions} |`,
    `| Alternative Suggestions | ${result.stats.alternativeSuggestions} |`,
    `| Redundancy Hints | ${result.stats.redundancyHints} |`,
    `| Extension Host Heap | ${result.stats.extensionHostHeapMB} MB |`,
    `| Extension Host RSS | ${result.stats.extensionHostRssMB} MB |`,
    `| OS Free Memory | ${result.stats.osFreeMemoryMB} MB |`,
    '',
    '## Issues',
    '',
    renderIssues(result.issues),
    '',
    '## Extension Audit',
    '',
    renderCategoryCounts(result),
    '',
    '### Known Guidance and Alternatives',
    '',
    renderAuditItems(result),
    '',
    '### Redundancy Hints',
    '',
    renderRedundancyHints(result),
    '',
    '## Safe Fix and Undo Status',
    '',
    renderChangeLog(changeLog),
    ''
  ].join('\n');
}

export function createDefaultReportFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-');
  return `turbo-report-${stamp}-${pad(date.getHours())}${pad(date.getMinutes())}.md`;
}

export function markdownCell(value: unknown): string {
  return text(value)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function renderIssues(issues: readonly Issue[]): string {
  if (issues.length === 0) {
    return 'No issues found.';
  }

  return [
    '| Severity | Source | Fix Kind | Title | Description |',
    '| --- | --- | --- | --- | --- |',
    ...issues.map(
      (issue) =>
        `| ${markdownCell(issue.severity)} | ${markdownCell(issue.source)} | ${markdownCell(issue.fixKind)} | ${markdownCell(issue.title)} | ${markdownCell(issue.description)} |`
    )
  ].join('\n');
}

function renderCategoryCounts(result: ScanResult): string {
  const rows = Object.entries(result.audit.categoryCounts)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => `| ${markdownCell(categoryLabels[category as ExtensionCategory] ?? category)} | ${count} |`);

  if (rows.length === 0) {
    return 'No categorized extensions found.';
  }

  return ['| Category | Count |', '| --- | ---: |', ...rows].join('\n');
}

function renderAuditItems(result: ScanResult): string {
  const rows = result.audit.items
    .filter((item) => item.knowledgeBaseMatches.length > 0 || item.alternative)
    .map((item) => {
      const guidance = [
        ...item.knowledgeBaseMatches.map((match) => `${match.safeWording} Confidence: ${match.confidence}; verified: ${match.lastVerified}.`),
        item.alternative ? `${item.alternative.safeWording} Alternative: ${item.alternative.alternative}.` : ''
      ]
        .filter(Boolean)
        .join(' ');

      return `| ${markdownCell(item.displayName || item.id)} | ${markdownCell(item.publisher)} | ${markdownCell(categoryLabels[item.category] ?? item.category)} | ${markdownCell(guidance)} |`;
    });

  if (rows.length === 0) {
    return 'No known guidance or alternatives found.';
  }

  return ['| Extension | Publisher | Category | Guidance |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

function renderRedundancyHints(result: ScanResult): string {
  if (result.audit.redundancyHints.length === 0) {
    return 'No redundancy hints found.';
  }

  return [
    '| Category | Language Scope | Extensions | Hint |',
    '| --- | --- | --- | --- |',
    ...result.audit.redundancyHints.map(
      (hint) =>
        `| ${markdownCell(categoryLabels[hint.category] ?? hint.category)} | ${markdownCell(hint.languageScope)} | ${markdownCell(hint.extensionIds.join(', '))} | ${markdownCell(hint.safeWording)} |`
    )
  ].join('\n');
}

function renderChangeLog(changeLog: ChangeLog | undefined): string {
  if (!changeLog || changeLog.entries.length === 0) {
    return 'No Turbo workspace fixes are currently recorded for undo. If the latest Apply Safe Fixes run wrote nothing, no new Change Log was created.';
  }

  return [
    `Last successful workspace write Change Log: ${text(new Date(changeLog.timestamp).toISOString())}`,
    '',
    'This undo record belongs to the latest Turbo run that actually wrote Workspace settings. A later skipped or canceled fix run does not replace it.',
    '',
    '| Key | Target | Existed Before |',
    '| --- | --- | --- |',
    ...changeLog.entries.map((entry) => `| ${markdownCell(entry.key)} | ${markdownCell(entry.target)} | ${entry.existedBefore ? 'Yes' : 'No'} |`)
  ].join('\n');
}

function text(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
