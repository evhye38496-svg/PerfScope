import type { ChangeLogEntry, FixProposal } from '../types';

export function createChangeLogEntry(
  proposal: FixProposal,
  existedBefore: boolean,
  previousValue: unknown,
  workspaceId: string,
  timestamp: number
): ChangeLogEntry {
  return {
    key: proposal.key,
    target: proposal.target,
    existedBefore,
    previousValue,
    newValue: proposal.proposedValue,
    workspaceId,
    timestamp,
    workspaceFolderUri: proposal.workspaceFolderUri
  };
}
