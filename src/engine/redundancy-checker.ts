import { redundancyWhitelist } from '../data/core-db';
import type { ExtensionAuditItem, ExtensionCategory, RedundancyHint } from '../types';

const redundantCategories = new Set<ExtensionCategory>(['lint-format']);

function pairKey(left: string, right: string): string {
  return [left.toLowerCase(), right.toLowerCase()].sort().join('|');
}

const whitelistedPairs = new Set(
  redundancyWhitelist.map((entry) => pairKey(entry.extensionIds[0], entry.extensionIds[1]))
);

function activationLanguageScopes(events: readonly string[]): Set<string> {
  const scopes = new Set<string>();

  for (const event of events) {
    if (event.startsWith('onLanguage:')) {
      scopes.add(event.slice('onLanguage:'.length).toLowerCase());
    }
  }

  return scopes;
}

function intersectScopes(left: Set<string>, right: Set<string>): string | undefined {
  for (const scope of left) {
    if (right.has(scope)) {
      return scope;
    }
  }

  return undefined;
}

export function findRedundancyHints(items: readonly ExtensionAuditItem[]): RedundancyHint[] {
  const hints: RedundancyHint[] = [];
  const activeItems = items.filter((item) => item.isActive && redundantCategories.has(item.category));

  for (let leftIndex = 0; leftIndex < activeItems.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < activeItems.length; rightIndex += 1) {
      const left = activeItems[leftIndex];
      const right = activeItems[rightIndex];
      if (!left || !right || left.category !== right.category) {
        continue;
      }

      if (whitelistedPairs.has(pairKey(left.id, right.id))) {
        continue;
      }

      const scope = intersectScopes(
        activationLanguageScopes(left.activationEvents),
        activationLanguageScopes(right.activationEvents)
      );

      if (!scope) {
        continue;
      }

      hints.push({
        id: `redundancy.${left.id}.${right.id}.${scope}`,
        extensionIds: [left.id, right.id],
        category: left.category,
        languageScope: scope,
        safeWording: `${left.displayName} and ${right.displayName} both appear to activate for ${scope}. This is an informational overlap hint only.`
      });
    }
  }

  return hints;
}
