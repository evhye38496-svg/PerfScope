import { extensionCategoryRules } from '../data/core-db';
import type { ExtensionCategory, ExtensionSnapshot } from '../types';

function includesAny(values: readonly string[], needles: readonly string[]): boolean {
  const normalized = values.map((value) => value.toLowerCase());
  return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

function textContainsAny(text: string, needles: readonly string[]): boolean {
  const normalized = text.toLowerCase();
  return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

export function classifyExtension(extension: ExtensionSnapshot): ExtensionCategory {
  const description = extension.description.toLowerCase();

  for (const rule of extensionCategoryRules) {
    if (
      includesAny(extension.categories, rule.manifestCategories) ||
      includesAny(extension.keywords, rule.keywords) ||
      textContainsAny(description, rule.descriptionTerms)
    ) {
      return rule.category;
    }
  }

  return 'unknown';
}
