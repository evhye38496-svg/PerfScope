export type TurboCommandSource = 'dashboard' | 'sidebar' | 'command';

export interface TurboCommandOptions {
  source: TurboCommandSource;
}

export function createTurboCommandOptions(source: TurboCommandSource): TurboCommandOptions {
  return { source };
}

export function shouldRevealDashboard(options?: TurboCommandOptions): boolean {
  return options?.source !== 'sidebar';
}
