export type GitRisk = 'safe' | 'likelyTracked' | 'unknown';

export function expandGitSearchRootIds(
  rootIds: readonly string[],
  getParentId: (rootId: string) => string | undefined,
  maxDepth = 6
): string[] {
  const expanded: string[] = [];
  const seen = new Set<string>();

  for (const rootId of rootIds) {
    let current: string | undefined = rootId;
    for (let depth = 0; current && depth < maxDepth; depth += 1) {
      if (!seen.has(current)) {
        seen.add(current);
        expanded.push(current);
      }
      current = getParentId(current);
    }
  }

  return expanded;
}

export async function detectGitRiskForRoots(
  rootIds: readonly string[],
  hasGitDirectory: (rootId: string) => Promise<boolean>
): Promise<GitRisk> {
  if (rootIds.length === 0) {
    return 'unknown';
  }

  try {
    for (const rootId of rootIds) {
      if (await hasGitDirectory(rootId)) {
        return 'likelyTracked';
      }
    }
  } catch {
    return 'unknown';
  }

  return 'safe';
}

export function shouldWarnForGitRisk(risk: GitRisk): boolean {
  return risk === 'likelyTracked' || risk === 'unknown';
}

export function shouldApplyAfterGitWarning(risk: GitRisk, userChoice: 'continue' | 'cancel'): boolean {
  return !shouldWarnForGitRisk(risk) || userChoice === 'continue';
}
