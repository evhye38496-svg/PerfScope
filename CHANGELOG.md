# Changelog

## 0.5.0

- Added Git repository warning before applying Workspace safe fixes.
- Implemented `Turbo: Export Report (Markdown)` with Save Dialog export.
- Added Dashboard export action and Webview allowlist support.
- Added Markdown report, Git risk, and export notification tests.

## 0.4.0

- Added Dashboard command buttons for scan, audit, safe fixes, and undo.
- Added allowlisted Webview message dispatch for Turbo commands.
- Enhanced Status Bar states for scan, audit, fix, undo, score, and error.
- Added gentle notification summaries for scan, audit, fix, rollback, and errors.

## 0.3.0

- Added Workspace safe fixes for `files.watcherExclude`, `search.exclude`, and `search.followSymlinks`.
- Added QuickPick preview before applying fixes.
- Added workspace Change Log storage and `Turbo: Undo Last Fix` rollback.
- Added unit and VS Code integration coverage for V0.3 fix behavior.

## 0.2.0

- Added extension audit data model and offline Core DB matching.
- Added extension categorization, known-heavy hints, alternatives, and redundancy hints.
- Added Dashboard audit view and `Turbo: Quick Extension Audit`.

## 0.1.0

- Initial VS Code extension skeleton.
- Added read-only Turbo scan, dashboard shell, status bar, score calculator, and unit tests.
