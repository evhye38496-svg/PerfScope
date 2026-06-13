export interface ReleaseGuardInput {
  packageJson: {
    version?: unknown;
    preview?: unknown;
    private?: unknown;
    icon?: unknown;
    repository?: { url?: unknown };
    bugs?: { url?: unknown };
    homepage?: unknown;
    scripts?: Record<string, unknown>;
  };
  vscodeignore: string;
  files: readonly string[];
}

export interface ReleaseGuardResult {
  ok: boolean;
  errors: string[];
}

const REQUIRED_FILES = ['README.md', 'CHANGELOG.md', 'LICENSE', 'SUPPORT.md', 'resources/turbo-128.png'];
const REQUIRED_IGNORES = ['src/**', 'test/**', 'out/test/**', '.vscode-test/**', 'one-click-turbo-prd.md', 'turbo-report-*.md', '**/*.map'];
const PLACEHOLDER = 'example.com/replace-with';

export function validateRelease(input: ReleaseGuardInput): ReleaseGuardResult {
  const errors: string[] = [];
  const packageJson = input.packageJson;

  if (packageJson.version !== '1.0.0') {
    errors.push('package.json version must be 1.0.0.');
  }

  if ('preview' in packageJson) {
    errors.push('package.json must not include preview for V1.0.');
  }

  if ('private' in packageJson) {
    errors.push('package.json must not include private for Marketplace release readiness.');
  }

  if (packageJson.icon !== 'resources/turbo-128.png') {
    errors.push('package.json icon must be resources/turbo-128.png.');
  }

  const urls = [
    ['repository.url', packageJson.repository?.url],
    ['bugs.url', packageJson.bugs?.url],
    ['homepage', packageJson.homepage]
  ] as const;

  for (const [name, value] of urls) {
    if (typeof value !== 'string' || value.includes(PLACEHOLDER)) {
      errors.push(`${name} must be replaced with a real project URL before Marketplace release.`);
    }
  }

  const packageScript = packageJson.scripts?.['package:vsix'];
  if (typeof packageScript !== 'string' || !packageScript.includes('dist/one-click-turbo-1.0.0.vsix')) {
    errors.push('package:vsix must output dist/one-click-turbo-1.0.0.vsix.');
  }

  for (const requiredFile of REQUIRED_FILES) {
    if (!input.files.includes(requiredFile)) {
      errors.push(`${requiredFile} must exist before release.`);
    }
  }

  for (const pattern of REQUIRED_IGNORES) {
    if (!input.vscodeignore.split(/\r?\n/).includes(pattern)) {
      errors.push(`.vscodeignore must include ${pattern}.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
