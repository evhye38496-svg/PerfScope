export type IssueSeverity = 'critical' | 'warning' | 'info';

export type FixKind = 'safe-auto-fix' | 'manual-guided-fix' | 'suggestion-only';

export type ExtensionCategory =
  | 'theme-icon'
  | 'lint-format'
  | 'language-support'
  | 'ai-completion'
  | 'git-version-control'
  | 'snippets'
  | 'utility-productivity'
  | 'build-task-debug'
  | 'unknown';

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  fixKind: FixKind;
  source: 'extension' | 'configuration' | 'environment' | 'knowledge-base';
}

export interface ScoreBreakdown {
  startup: number;
  configuration: number;
  extensionInventory: number;
  environment: number;
}

export interface ScanStats {
  totalExtensions: number;
  activeExtensions: number;
  alwaysOnExtensions: number;
  startupFinishedExtensions: number;
  knownHeavyExtensions: number;
  alternativeSuggestions: number;
  redundancyHints: number;
  extensionHostHeapMB: number;
  extensionHostRssMB: number;
  osFreeMemoryMB: number;
}

export interface ScanResult {
  score: number;
  grade: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  generatedAt: string;
  stats: ScanStats;
  breakdown: ScoreBreakdown;
  issues: Issue[];
  audit: ExtensionAudit;
}

export interface ExtensionSnapshot {
  id: string;
  displayName: string;
  description: string;
  publisher: string;
  categories: string[];
  keywords: string[];
  extensionKind: string[];
  isActive: boolean;
  activationEvents: string[];
}

export interface ConfigSnapshot {
  watcherExclude: Record<string, unknown> | undefined;
  searchExclude: Record<string, unknown> | undefined;
  searchFollowSymlinks: boolean | undefined;
  editorMinimapEnabled: boolean | undefined;
}

export interface KnownExtensionRecord {
  id: string;
  safeWording: string;
  confidence: 'low' | 'medium' | 'high';
  lastVerified: string;
  severity: IssueSeverity;
  typicalMemoryMB?: string;
}

export interface AlternativeSuggestion {
  extensionId: string;
  alternative: string;
  safeWording: string;
  confidence: 'low' | 'medium' | 'high';
  lastVerified: string;
}

export interface KnowledgeBaseMatch {
  kind: 'known-heavy' | 'lightweight-alternative';
  safeWording: string;
  confidence: 'low' | 'medium' | 'high';
  lastVerified: string;
}

export interface ExtensionAuditItem {
  id: string;
  displayName: string;
  publisher: string;
  description: string;
  category: ExtensionCategory;
  isActive: boolean;
  activationEvents: string[];
  knowledgeBaseMatches: KnowledgeBaseMatch[];
  alternative?: AlternativeSuggestion;
}

export interface RedundancyHint {
  id: string;
  extensionIds: string[];
  category: ExtensionCategory;
  languageScope: string;
  safeWording: string;
}

export interface ExtensionAudit {
  items: ExtensionAuditItem[];
  categoryCounts: Record<ExtensionCategory, number>;
  knownHeavyCount: number;
  alternativeCount: number;
  redundancyHints: RedundancyHint[];
}

export type FixTarget = 'workspace';

export interface FixProposal {
  id: string;
  key: 'files.watcherExclude' | 'search.exclude' | 'search.followSymlinks';
  target: FixTarget;
  title: string;
  description: string;
  currentValue: unknown;
  proposedValue: unknown;
  addedKeys: string[];
}

export interface FixPreviewItem {
  label: string;
  description: string;
  detail: string;
  proposal: FixProposal;
}

export interface ChangeLogEntry {
  key: FixProposal['key'];
  target: FixTarget;
  existedBefore: boolean;
  previousValue?: unknown;
  newValue: unknown;
  workspaceId: string;
  timestamp: number;
}

export interface ChangeLog {
  workspaceId: string;
  timestamp: number;
  entries: ChangeLogEntry[];
}

export interface ApplyFixResult {
  applied: number;
  skipped: number;
  failed: number;
  changeLog?: ChangeLog;
  retainedPreviousChangeLog?: boolean;
}

export interface RollbackResult {
  restored: number;
  skipped: number;
  failed: number;
  remainingChangeLog?: ChangeLog;
}
