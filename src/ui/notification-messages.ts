import type { ApplyFixResult, RollbackResult, ScanResult } from '../types';

export function scanCompleteMessage(result: ScanResult): string {
  return `Turbo scan complete - Score: ${result.score}. ${result.issues.length} issues found.`;
}

export function auditCompleteMessage(result: ScanResult): string {
  return `Turbo audit complete - ${result.audit.items.length} extensions, ${result.audit.knownHeavyCount} guidance matches.`;
}

export function fixCompleteMessage(result: ApplyFixResult): string {
  return `Turbo fix complete - applied ${result.applied}, skipped ${result.skipped}, failed ${result.failed}.`;
}

export function rollbackCompleteMessage(result: RollbackResult): string {
  return `Turbo undo complete - restored ${result.restored}, skipped ${result.skipped}, failed ${result.failed}.`;
}

export function exportCompleteMessage(filePath: string): string {
  return `Turbo report exported - ${filePath}`;
}

export function exportCanceledMessage(): string {
  return 'Turbo report export canceled.';
}

export function noReportMessage(): string {
  return 'Turbo: Run a scan before exporting a Markdown report.';
}

export function noFixesMessage(): string {
  return 'Turbo: No workspace safe fixes are available.';
}

export function noChangeLogMessage(): string {
  return 'Turbo: No workspace fix Change Log found.';
}

export function errorMessage(action: string, error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  return `Turbo ${action} failed${detail ? `: ${detail}` : '.'}`;
}
