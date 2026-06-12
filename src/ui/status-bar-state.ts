export type TurboStatusKind = 'idle' | 'scanning' | 'auditing' | 'fixing' | 'undoing' | 'exporting' | 'score' | 'error';

export interface TurboStatusSnapshot {
  kind: TurboStatusKind;
  score?: number;
  grade?: string;
  lastScanAt?: string;
  message?: string;
}

export interface TurboStatusPresentation {
  text: string;
  tooltip: string;
}

export function createStatusPresentation(snapshot: TurboStatusSnapshot): TurboStatusPresentation {
  switch (snapshot.kind) {
    case 'scanning':
      return {
        text: '$(sync~spin) Turbo',
        tooltip: 'One-Click Turbo: full scan is running'
      };
    case 'auditing':
      return {
        text: '$(sync~spin) Audit',
        tooltip: 'One-Click Turbo: extension audit is running'
      };
    case 'fixing':
      return {
        text: '$(sync~spin) Fix',
        tooltip: 'One-Click Turbo: workspace safe fixes are being applied'
      };
    case 'undoing':
      return {
        text: '$(sync~spin) Undo',
        tooltip: 'One-Click Turbo: last workspace fix is being undone'
      };
    case 'exporting':
      return {
        text: '$(sync~spin) Export',
        tooltip: 'One-Click Turbo: Markdown report is being exported'
      };
    case 'score':
      return {
        text: `$(zap) ${snapshot.score ?? 'Turbo'}`,
        tooltip: `One-Click Turbo Score: ${snapshot.score ?? 'unknown'} (${snapshot.grade ?? 'unknown'})${snapshot.lastScanAt ? `; scanned ${snapshot.lastScanAt}` : ''}`
      };
    case 'error':
      return {
        text: '$(warning) Turbo',
        tooltip: `One-Click Turbo needs attention${snapshot.message ? `: ${snapshot.message}` : ''}`
      };
    case 'idle':
    default:
      return {
        text: '$(zap) Turbo',
        tooltip: 'One-Click Turbo: no scan has run yet'
      };
  }
}
