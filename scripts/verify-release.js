const fs = require('node:fs');
const path = require('node:path');
const { validateRelease } = require('../out/src/release/release-guard.js');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const vscodeignore = fs.readFileSync(path.join(root, '.vscodeignore'), 'utf8');
const files = collectFiles(root).map((file) => file.replaceAll(path.sep, '/'));
const result = validateRelease({ packageJson, vscodeignore, files });

if (!result.ok) {
  console.error('Release guard failed:');
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Release guard passed.');

function collectFiles(rootDir) {
  const ignored = new Set(['.git', 'node_modules', 'out', 'dist', '.vscode-test']);
  const result = [];
  walk(rootDir, '');
  return result;

  function walk(base, relative) {
    for (const entry of fs.readdirSync(path.join(base, relative), { withFileTypes: true })) {
      if (ignored.has(entry.name)) {
        continue;
      }

      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) {
        walk(base, child);
      } else {
        result.push(child);
      }
    }
  }
}
