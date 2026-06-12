export type GitRisk = 'safe' | 'likelyTracked' | 'unknown';

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
