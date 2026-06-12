import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRelease } from '../../src/release/release-guard';

const vscodeignore = [
  '.vscode-test/**',
  'scripts/**',
  'src/**',
  'test/**',
  'out/test/**',
  'out/src/release/**',
  '**/*.map',
  'one-click-turbo-prd.md'
].join('\n');

const files = ['README.md', 'CHANGELOG.md', 'LICENSE', 'SUPPORT.md', 'resources/turbo-128.png'];

function packageJson(overrides = {}) {
  return {
    version: '1.0.0',
    icon: 'resources/turbo-128.png',
    repository: { url: 'https://github.com/example/one-click-turbo.git' },
    bugs: { url: 'https://github.com/example/one-click-turbo/issues' },
    homepage: 'https://github.com/example/one-click-turbo',
    scripts: {
      'package:vsix': 'vsce package --out dist/turbo-vscode-1.0.0.vsix'
    },
    ...overrides
  };
}

test('release guard fails on placeholder project URLs', () => {
  const result = validateRelease({
    packageJson: packageJson({
      repository: { url: 'https://example.com/replace-with-one-click-turbo-repository.git' }
    }),
    vscodeignore,
    files
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /repository\.url/);
});

test('release guard passes with V1.0 metadata and required files', () => {
  const result = validateRelease({
    packageJson: packageJson(),
    vscodeignore,
    files
  });

  assert.deepEqual(result, { ok: true, errors: [] });
});
