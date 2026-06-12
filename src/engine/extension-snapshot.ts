import type { ExtensionSnapshot, Issue } from '../types';
import { normalizeActivationEvents } from './activation-events';

export interface ExtensionLike {
  id: string;
  isActive: boolean;
  packageJSON: unknown;
}

function getExtensionDisplayName(extension: ExtensionLike): string {
  const packageJson = extension.packageJSON as { displayName?: unknown; name?: unknown };
  if (typeof packageJson.displayName === 'string') {
    return packageJson.displayName;
  }

  if (typeof packageJson.name === 'string') {
    return packageJson.name;
  }

  return extension.id;
}

function normalizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((value): value is string => typeof value === 'string');
}

function normalizeExtensionKind(raw: unknown): string[] {
  if (typeof raw === 'string') {
    return [raw];
  }

  return normalizeStringArray(raw);
}

export function snapshotExtension(extension: ExtensionLike): ExtensionSnapshot {
  const packageJson = extension.packageJSON as {
    activationEvents?: unknown;
    categories?: unknown;
    keywords?: unknown;
    description?: unknown;
    publisher?: unknown;
    extensionKind?: unknown;
  };
  return {
    id: extension.id,
    displayName: getExtensionDisplayName(extension),
    description: typeof packageJson.description === 'string' ? packageJson.description : '',
    publisher: typeof packageJson.publisher === 'string' ? packageJson.publisher : '',
    categories: normalizeStringArray(packageJson.categories),
    keywords: normalizeStringArray(packageJson.keywords),
    extensionKind: normalizeExtensionKind(packageJson.extensionKind),
    isActive: extension.isActive,
    activationEvents: normalizeActivationEvents(packageJson.activationEvents)
  };
}

export function createExtensionReadIssue(extensionId: string, error: unknown): Issue {
  const detail = error instanceof Error ? error.message : String(error);
  return {
    id: `extension.manifestRead.${extensionId}`,
    title: 'Extension manifest could not be inspected',
    description: `${extensionId} was skipped during this scan because its manifest metadata could not be read${detail ? `: ${detail}` : '.'}`,
    severity: 'info',
    fixKind: 'suggestion-only',
    source: 'extension'
  };
}
