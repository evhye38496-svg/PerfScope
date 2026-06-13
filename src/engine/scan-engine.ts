import * as os from 'os';
import * as vscode from 'vscode';
import { knownHeavyExtensions } from '../data/core-db';
import { auditExtensions } from './audit-engine';
import { hasAlwaysOnActivation, hasStartupFinishedActivation } from './activation-events';
import { analyzeConfiguration } from './config-checks';
import { createExtensionReadIssue, snapshotExtension } from './extension-snapshot';
import { sortIssues } from './issue-sort';
import { calculateBreakdown, calculateTurboScore, gradeScore } from './score-calculator';
import type { ConfigSnapshot, ExtensionAudit, ExtensionSnapshot, Issue, ScanResult, ScanStats } from '../types';

function toMB(bytes: number): number {
  return Math.round(bytes / 1024 / 1024);
}

interface ExtensionSnapshotResult {
  extensions: ExtensionSnapshot[];
  issues: Issue[];
}

function snapshotExtensions(): ExtensionSnapshotResult {
  const extensions: ExtensionSnapshot[] = [];
  const issues: Issue[] = [];

  for (const extension of vscode.extensions.all) {
    try {
      extensions.push(snapshotExtension(extension));
    } catch (error) {
      issues.push(createExtensionReadIssue(extension.id, error));
    }
  }

  return { extensions, issues };
}

function snapshotConfiguration(): ConfigSnapshot {
  const files = vscode.workspace.getConfiguration('files');
  const search = vscode.workspace.getConfiguration('search');
  const editor = vscode.workspace.getConfiguration('editor');

  return {
    watcherExclude: files.get<Record<string, unknown>>('watcherExclude'),
    searchExclude: search.get<Record<string, unknown>>('exclude'),
    searchFollowSymlinks: search.get<boolean>('followSymlinks'),
    editorMinimapEnabled: editor.get<boolean>('minimap.enabled')
  };
}

function createActivationIssues(extensions: readonly ExtensionSnapshot[]): Issue[] {
  const issues: Issue[] = [];

  for (const extension of extensions) {
    if (hasAlwaysOnActivation(extension.activationEvents)) {
      issues.push({
        id: `extension.alwaysOn.${extension.id}`,
        title: `${extension.displayName} activates for every startup`,
        description: `${extension.id} declares "*" activation. This is a static manifest signal, not a measured startup duration.`,
        severity: 'warning',
        fixKind: 'manual-guided-fix',
        source: 'extension'
      });
      continue;
    }

    if (hasStartupFinishedActivation(extension.activationEvents)) {
      issues.push({
        id: `extension.startupFinished.${extension.id}`,
        title: `${extension.displayName} activates after startup`,
        description: `${extension.id} declares "onStartupFinished". Review whether this behavior is expected for your workflow.`,
        severity: 'info',
        fixKind: 'manual-guided-fix',
        source: 'extension'
      });
    }
  }

  return issues;
}

function createKnowledgeBaseIssues(audit: ExtensionAudit): Issue[] {
  const installedIds = new Set(audit.items.map((extension) => extension.id.toLowerCase()));
  return knownHeavyExtensions
    .filter((record) => installedIds.has(record.id.toLowerCase()))
    .map<Issue>((record) => ({
      id: `kb.knownHeavy.${record.id}`,
      title: `${record.id} has performance guidance`,
      description: `${record.safeWording} Confidence: ${record.confidence}; verified: ${record.lastVerified}.`,
      severity: record.severity,
      fixKind: 'suggestion-only',
      source: 'knowledge-base'
    }));
}

function createAlternativeIssues(audit: ExtensionAudit): Issue[] {
  return audit.items
    .filter((item) => item.alternative)
    .map<Issue>((item) => ({
      id: `kb.alternative.${item.id}`,
      title: `${item.displayName} has an optional lightweight alternative`,
      description: `${item.alternative?.safeWording} Alternative: ${item.alternative?.alternative}.`,
      severity: 'info',
      fixKind: 'suggestion-only',
      source: 'knowledge-base'
    }));
}

function createRedundancyIssues(audit: ExtensionAudit): Issue[] {
  return audit.redundancyHints.map<Issue>((hint) => ({
    id: hint.id,
    title: 'Possible overlapping extension behavior',
    description: hint.safeWording,
    severity: 'info',
    fixKind: 'suggestion-only',
    source: 'extension'
  }));
}

function createExtensionAuditIssues(extensions: readonly ExtensionSnapshot[], audit: ExtensionAudit): Issue[] {
  return [
    ...createActivationIssues(extensions),
    ...createKnowledgeBaseIssues(audit),
    ...createAlternativeIssues(audit),
    ...createRedundancyIssues(audit)
  ];
}

function createExtensionStats(extensions: readonly ExtensionSnapshot[], audit: ExtensionAudit): Omit<ScanStats, 'extensionHostHeapMB' | 'extensionHostRssMB' | 'osFreeMemoryMB'> {
  return {
    totalExtensions: extensions.length,
    activeExtensions: extensions.filter((extension) => extension.isActive).length,
    alwaysOnExtensions: extensions.filter((extension) => hasAlwaysOnActivation(extension.activationEvents)).length,
    startupFinishedExtensions: extensions.filter((extension) => hasStartupFinishedActivation(extension.activationEvents)).length,
    knownHeavyExtensions: audit.knownHeavyCount,
    alternativeSuggestions: audit.alternativeCount,
    redundancyHints: audit.redundancyHints.length
  };
}

export async function runScan(): Promise<ScanResult> {
  const extensionSnapshot = snapshotExtensions();
  const extensions = extensionSnapshot.extensions;
  const audit = auditExtensions(extensions);
  const config = snapshotConfiguration();
  const memory = process.memoryUsage();
  const issues = sortIssues([
    ...createExtensionAuditIssues(extensions, audit),
    ...analyzeConfiguration(config),
    ...extensionSnapshot.issues
  ]);

  const stats: ScanStats = {
    ...createExtensionStats(extensions, audit),
    extensionHostHeapMB: toMB(memory.heapUsed),
    extensionHostRssMB: toMB(memory.rss),
    osFreeMemoryMB: toMB(os.freemem())
  };

  const breakdown = calculateBreakdown(stats, issues);
  const score = calculateTurboScore(breakdown);

  return {
    kind: 'full-scan',
    score,
    grade: gradeScore(score),
    generatedAt: new Date().toISOString(),
    stats,
    breakdown,
    issues,
    audit
  };
}

export async function runQuickAudit(): Promise<ScanResult> {
  const extensionSnapshot = snapshotExtensions();
  const extensions = extensionSnapshot.extensions;
  const audit = auditExtensions(extensions);
  const issues = sortIssues([
    ...createExtensionAuditIssues(extensions, audit),
    ...extensionSnapshot.issues
  ]);

  const stats: ScanStats = {
    ...createExtensionStats(extensions, audit),
    extensionHostHeapMB: 0,
    extensionHostRssMB: 0,
    osFreeMemoryMB: 0
  };

  const breakdown = calculateBreakdown(stats, issues);
  const score = calculateTurboScore(breakdown);

  return {
    kind: 'quick-audit',
    score,
    grade: gradeScore(score),
    generatedAt: new Date().toISOString(),
    stats,
    breakdown,
    issues,
    audit
  };
}
