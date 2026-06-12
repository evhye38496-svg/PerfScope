# Changelog

## 0.8.0

- Prepared V0.8 as a VSIX beta release.
- Added Marketplace preview metadata, keywords, gallery banner, and placeholder project links.
- Added VSIX packaging scripts and release verification workflow.
- Added MIT `LICENSE` and `SUPPORT.md`.
- Added a PNG Marketplace icon while keeping the SVG Activity Bar icon.
- Expanded README with VSIX install steps, safety boundaries, known beta limits, and a release checklist.

## 0.7.0

- Polished the Side Bar and full Dashboard with a lightweight launcher-style UI.
- Added shared Webview style tokens, score meters, and primary action styling.
- Added low-cost CSS motion with reduced-motion support.
- Added renderer tests for launcher sections, score meters, and motion boundaries.

## 0.6.0

- Added a dedicated One-Click Turbo Activity Bar container.
- Added a compact Side Bar Dashboard Webview.
- Shared the latest scan result between commands, the Side Bar, and the full Dashboard.
- Added unit coverage for Activity Bar contributions and Side Bar rendering.

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
