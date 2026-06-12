import { knownHeavyExtensions, lightweightAlternatives } from '../data/core-db';
import type {
  ExtensionAudit,
  ExtensionAuditItem,
  ExtensionCategory,
  ExtensionSnapshot,
  KnowledgeBaseMatch
} from '../types';
import { classifyExtension } from './extension-classifier';
import { findRedundancyHints } from './redundancy-checker';

const allCategories: ExtensionCategory[] = [
  'theme-icon',
  'lint-format',
  'language-support',
  'ai-completion',
  'git-version-control',
  'snippets',
  'utility-productivity',
  'build-task-debug',
  'unknown'
];

function createCategoryCounts(): Record<ExtensionCategory, number> {
  return Object.fromEntries(allCategories.map((category) => [category, 0])) as Record<ExtensionCategory, number>;
}

function buildKnowledgeBaseMatches(id: string): KnowledgeBaseMatch[] {
  const normalizedId = id.toLowerCase();
  const matches: KnowledgeBaseMatch[] = [];
  const knownHeavy = knownHeavyExtensions.find((record) => record.id.toLowerCase() === normalizedId);
  const alternative = lightweightAlternatives.find((record) => record.extensionId.toLowerCase() === normalizedId);

  if (knownHeavy) {
    matches.push({
      kind: 'known-heavy',
      safeWording: knownHeavy.safeWording,
      confidence: knownHeavy.confidence,
      lastVerified: knownHeavy.lastVerified
    });
  }

  if (alternative) {
    matches.push({
      kind: 'lightweight-alternative',
      safeWording: alternative.safeWording,
      confidence: alternative.confidence,
      lastVerified: alternative.lastVerified
    });
  }

  return matches;
}

export function auditExtensions(extensions: readonly ExtensionSnapshot[]): ExtensionAudit {
  const categoryCounts = createCategoryCounts();
  const items: ExtensionAuditItem[] = extensions.map((extension) => {
    const category = classifyExtension(extension);
    categoryCounts[category] += 1;

    return {
      id: extension.id,
      displayName: extension.displayName,
      publisher: extension.publisher,
      description: extension.description,
      category,
      isActive: extension.isActive,
      activationEvents: extension.activationEvents,
      knowledgeBaseMatches: buildKnowledgeBaseMatches(extension.id),
      alternative: lightweightAlternatives.find(
        (record) => record.extensionId.toLowerCase() === extension.id.toLowerCase()
      )
    };
  });

  const redundancyHints = findRedundancyHints(items);

  return {
    items,
    categoryCounts,
    knownHeavyCount: items.filter((item) =>
      item.knowledgeBaseMatches.some((match) => match.kind === 'known-heavy')
    ).length,
    alternativeCount: items.filter((item) => item.alternative).length,
    redundancyHints
  };
}
