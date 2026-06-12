import assert from 'node:assert/strict';
import test from 'node:test';
import { detectGitRiskForRoots, expandGitSearchRootIds, shouldApplyAfterGitWarning, shouldWarnForGitRisk } from '../../src/fix/git-risk';

test('git risk returns likelyTracked when any root has a git directory', async () => {
  const risk = await detectGitRiskForRoots(['a', 'b'], async (root) => root === 'b');

  assert.equal(risk, 'likelyTracked');
  assert.equal(shouldWarnForGitRisk(risk), true);
});

test('git search roots include parents with bounded de-duplication', () => {
  const roots = expandGitSearchRootIds(['repo/packages/app'], (root) => {
    if (root === 'repo/packages/app') {
      return 'repo/packages';
    }
    if (root === 'repo/packages') {
      return 'repo';
    }
    return undefined;
  });

  assert.deepEqual(roots, ['repo/packages/app', 'repo/packages', 'repo']);
});

test('git risk treats any successful .git stat candidate as likely tracked', async () => {
  const roots = expandGitSearchRootIds(['repo/packages/app'], (root) => (root === 'repo/packages/app' ? 'repo' : undefined));
  const risk = await detectGitRiskForRoots(roots, async (root) => root === 'repo');

  assert.equal(risk, 'likelyTracked');
});

test('git risk returns safe when no git directory exists', async () => {
  const risk = await detectGitRiskForRoots(['a'], async () => false);

  assert.equal(risk, 'safe');
  assert.equal(shouldWarnForGitRisk(risk), false);
});

test('git risk returns unknown for empty roots or filesystem errors', async () => {
  assert.equal(await detectGitRiskForRoots([], async () => false), 'unknown');
  assert.equal(
    await detectGitRiskForRoots(['a'], async () => {
      throw new Error('permission denied');
    }),
    'unknown'
  );
});

test('git warning continue/cancel gates writing decision', () => {
  assert.equal(shouldApplyAfterGitWarning('safe', 'cancel'), true);
  assert.equal(shouldApplyAfterGitWarning('likelyTracked', 'cancel'), false);
  assert.equal(shouldApplyAfterGitWarning('likelyTracked', 'continue'), true);
  assert.equal(shouldApplyAfterGitWarning('unknown', 'cancel'), false);
});
