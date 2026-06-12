import * as vscode from 'vscode';
import type { ScanResult } from '../types';

export type TurboOperationKind = 'scan' | 'audit' | 'fix' | 'undo' | 'export';
export type TurboOperationStatus = 'success' | 'skipped' | 'failed' | 'canceled';

export interface TurboOperationSummary {
  kind: TurboOperationKind;
  status: TurboOperationStatus;
  message: string;
  timestamp: string;
}

export interface TurboUiState {
  lastResult?: ScanResult;
  lastOperation?: TurboOperationSummary;
}

export class TurboState implements vscode.Disposable {
  private readonly changeEmitter = new vscode.EventEmitter<TurboUiState>();
  private snapshot: TurboUiState = {};

  readonly onDidChange = this.changeEmitter.event;

  getLastResult(): ScanResult | undefined {
    return this.snapshot.lastResult;
  }

  getSnapshot(): TurboUiState {
    return this.snapshot;
  }

  setLastResult(result: ScanResult, kind: 'scan' | 'audit' = 'scan'): void {
    this.snapshot = {
      ...this.snapshot,
      lastResult: result,
      lastOperation: {
        kind,
        status: 'success',
        message:
          kind === 'audit'
            ? `${result.audit.items.length} extensions audited; ${result.audit.knownHeavyCount} guidance matches.`
            : `Score ${result.score}; ${result.issues.length} issues found.`,
        timestamp: result.generatedAt
      }
    };
    this.changeEmitter.fire(this.snapshot);
  }

  setLastOperation(operation: Omit<TurboOperationSummary, 'timestamp'>): void {
    this.snapshot = {
      ...this.snapshot,
      lastOperation: {
        ...operation,
        timestamp: new Date().toISOString()
      }
    };
    this.changeEmitter.fire(this.snapshot);
  }

  dispose(): void {
    this.changeEmitter.dispose();
  }
}
