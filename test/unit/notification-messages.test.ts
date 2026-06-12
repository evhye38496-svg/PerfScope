import assert from 'node:assert/strict';
import test from 'node:test';
import {
  errorMessage,
  exportCanceledMessage,
  exportCompleteMessage,
  fixCompleteMessage,
  noChangeLogMessage,
  noFixesMessage,
  noReportMessage,
  rollbackCompleteMessage
} from '../../src/ui/notification-messages';

test('notification summaries are concise and stable', () => {
  assert.equal(fixCompleteMessage({ applied: 2, skipped: 1, failed: 0 }), 'Turbo fix complete - applied 2, skipped 1, failed 0.');
  assert.equal(
    fixCompleteMessage({ applied: 0, skipped: 2, failed: 0, retainedPreviousChangeLog: true }),
    'Turbo fix complete - applied 0, skipped 2, failed 0. No new Change Log was created; the previous undo record is still retained.'
  );
  assert.equal(
    rollbackCompleteMessage({
      restored: 1,
      skipped: 1,
      failed: 0,
      remainingChangeLog: {
        workspaceId: 'workspace',
        timestamp: 1,
        entries: [
          {
            key: 'search.exclude',
            target: 'workspace',
            existedBefore: false,
            newValue: {},
            workspaceId: 'workspace',
            timestamp: 1
          }
        ]
      }
    }),
    'Turbo undo complete - restored 1, skipped 1, failed 0. 1 Change Log entries remain for a future undo attempt.'
  );
  assert.equal(exportCompleteMessage('C:\\report.md'), 'Turbo report exported - C:\\report.md');
  assert.equal(exportCanceledMessage(), 'Turbo report export canceled.');
  assert.equal(noReportMessage(), 'Turbo: Run a scan before exporting a Markdown report.');
  assert.equal(noFixesMessage(), 'Turbo: No workspace safe fixes are available.');
  assert.equal(noChangeLogMessage(), 'Turbo: No workspace fix Change Log found.');
});

test('notification error message includes action and error detail', () => {
  assert.equal(errorMessage('scan', new Error('boom')), 'Turbo scan failed: boom');
});
