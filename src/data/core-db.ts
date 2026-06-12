import type { AlternativeSuggestion, ExtensionCategory, KnownExtensionRecord } from '../types';

export const knownHeavyExtensions: KnownExtensionRecord[] = [
  {
    id: 'eamodio.gitlens',
    safeWording: 'GitLens CodeLens, blame, and history features may add Git query and rendering overhead in large repositories.',
    confidence: 'medium',
    lastVerified: '2026-06-12',
    severity: 'warning',
    typicalMemoryMB: '100-380'
  },
  {
    id: 'dbaeumer.vscode-eslint',
    safeWording: 'ESLint can add save and diagnostics latency when type-aware rules are enabled in large JavaScript or TypeScript projects.',
    confidence: 'medium',
    lastVerified: '2026-06-12',
    severity: 'warning',
    typicalMemoryMB: '150-500'
  },
  {
    id: 'ms-vscode.cpptools',
    safeWording: 'C/C++ IntelliSense can use significant memory while indexing large codebases.',
    confidence: 'medium',
    lastVerified: '2026-06-12',
    severity: 'warning',
    typicalMemoryMB: '200-5000'
  },
  {
    id: 'ms-python.vscode-pylance',
    safeWording: 'Pylance type analysis may increase memory use in large Python workspaces.',
    confidence: 'medium',
    lastVerified: '2026-06-12',
    severity: 'info',
    typicalMemoryMB: '150-400'
  },
  {
    id: 'github.copilot',
    safeWording: 'AI completion services add background processes and network-related work; actual impact depends on session state.',
    confidence: 'low',
    lastVerified: '2026-06-12',
    severity: 'info',
    typicalMemoryMB: '100-300'
  },
  {
    id: 'github.copilot-chat',
    safeWording: 'Chat context and session state may increase memory use during active AI workflows.',
    confidence: 'low',
    lastVerified: '2026-06-12',
    severity: 'info',
    typicalMemoryMB: '100-300'
  },
  {
    id: 'vue.volar',
    safeWording: 'Vue template type analysis can add memory and CPU overhead in large Vue projects.',
    confidence: 'medium',
    lastVerified: '2026-06-12',
    severity: 'info',
    typicalMemoryMB: '150-350'
  }
];

export const lightweightAlternatives: AlternativeSuggestion[] = [
  {
    extensionId: 'dbaeumer.vscode-eslint',
    alternative: 'biomejs.biome',
    safeWording: 'For JavaScript and TypeScript projects, Biome may be worth evaluating for faster formatting and linting workflows.',
    confidence: 'medium',
    lastVerified: '2026-06-12'
  },
  {
    extensionId: 'esbenp.prettier-vscode',
    alternative: 'biomejs.biome',
    safeWording: 'Biome can cover formatting for some JavaScript and TypeScript teams, depending on project conventions.',
    confidence: 'medium',
    lastVerified: '2026-06-12'
  },
  {
    extensionId: 'eamodio.gitlens',
    alternative: 'Built-in Git features + mhutchie.git-graph',
    safeWording: 'Consider disabling GitLens CodeLens/current-line blame first, or using built-in Git features for lighter workflows.',
    confidence: 'medium',
    lastVerified: '2026-06-12'
  }
];

export interface CategoryRule {
  category: ExtensionCategory;
  manifestCategories: string[];
  keywords: string[];
  descriptionTerms: string[];
}

export const extensionCategoryRules: CategoryRule[] = [
  {
    category: 'theme-icon',
    manifestCategories: ['themes'],
    keywords: ['theme', 'icon', 'color'],
    descriptionTerms: ['theme', 'icon theme', 'file icon']
  },
  {
    category: 'lint-format',
    manifestCategories: ['linters', 'formatters'],
    keywords: ['lint', 'linter', 'format', 'formatter', 'eslint', 'prettier', 'biome'],
    descriptionTerms: ['lint', 'format', 'formatter', 'eslint', 'prettier']
  },
  {
    category: 'language-support',
    manifestCategories: ['programming languages'],
    keywords: ['language', 'intellisense', 'typescript', 'python', 'rust', 'go', 'vue'],
    descriptionTerms: ['language support', 'intellisense', 'type checking']
  },
  {
    category: 'ai-completion',
    manifestCategories: ['machine learning'],
    keywords: ['ai', 'completion', 'copilot', 'chat', 'llm'],
    descriptionTerms: ['ai', 'completion', 'chat assistant', 'copilot']
  },
  {
    category: 'git-version-control',
    manifestCategories: ['scm providers'],
    keywords: ['git', 'scm', 'blame', 'history'],
    descriptionTerms: ['git', 'version control', 'blame', 'repository']
  },
  {
    category: 'snippets',
    manifestCategories: ['snippets'],
    keywords: ['snippet', 'snippets'],
    descriptionTerms: ['snippet', 'snippets']
  },
  {
    category: 'build-task-debug',
    manifestCategories: ['debuggers', 'testing'],
    keywords: ['debug', 'task', 'runner', 'test', 'server'],
    descriptionTerms: ['debug', 'task runner', 'live server', 'test runner']
  },
  {
    category: 'utility-productivity',
    manifestCategories: ['other', 'extension packs', 'notebooks', 'visualization'],
    keywords: ['utility', 'productivity', 'bookmark', 'todo', 'project'],
    descriptionTerms: ['utility', 'productivity', 'bookmark', 'todo']
  }
];

export interface RedundancyWhitelistPair {
  extensionIds: [string, string];
}

export const redundancyWhitelist: RedundancyWhitelistPair[] = [
  { extensionIds: ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'] },
  { extensionIds: ['ms-python.python', 'ms-python.vscode-pylance'] }
];
