# One-Click Turbo

One-Click Turbo is an offline VS Code performance health scanner and optimization guide.

## V1.0

V1.0 is the first Marketplace-ready release line. Publisher `Evhye` is configured, but the placeholder `repository`, `bugs`, and `homepage` URLs in `package.json` must be replaced before public Marketplace publishing. `npm run verify:release` intentionally fails while those placeholders remain.

## Features

- Manual Turbo full scan
- Quick extension audit
- Activity Bar entry with a compact Side Bar dashboard
- Launcher-style full Dashboard and Side Bar UI
- Status Bar states for scan, audit, fix, undo, export, score, and error
- Gentle completion and error notifications
- Markdown report export through an explicit Save Dialog
- Git repository warning before Workspace or Workspace Folder settings writes
- Workspace safe fixes for watcher/search exclusions and `search.followSymlinks`
- Multi-root safe fixes using Workspace Folder scope
- Workspace Change Log rollback for Turbo-written settings
- Safe purge for Turbo-owned saved state

## Safety Boundaries

One-Click Turbo is offline. It does not fetch remote databases, upload telemetry, read source file contents, disable extensions, uninstall extensions, or modify `.vscode/extensions.json`.

The only settings V1.0 can write are project-scoped settings, and only after explicit user confirmation:

- `files.watcherExclude`
- `search.exclude`
- `search.followSymlinks`

Single-root workspaces use Workspace scope. Multi-root workspaces use Workspace Folder scope for each selected folder. Turbo does not write User settings.

If a target folder appears to be inside a Git repository, Turbo warns before applying safe fixes because `.vscode/settings.json` may be committed.

## Purge Behavior

`Turbo: Purge & Prepare for Uninstall` clears only Turbo-owned saved state and recent UI report data. It does not modify settings, uninstall extensions, delete files, or change `.vscode/extensions.json`.

## Install the VSIX

After packaging, install the generated VSIX from VS Code:

1. Open the Command Palette.
2. Run `Extensions: Install from VSIX...`.
3. Select `dist/turbo-vscode-1.0.0.vsix`.

You can also install from a terminal:

```powershell
code --install-extension dist/turbo-vscode-1.0.0.vsix
```

## Development

Install dependencies once:

```powershell
npm install
```

Run checks:

```powershell
npm run compile
npm test
npm run test:vscode
```

Use the **Run Extension** launch configuration in VS Code to open an Extension Development Host. In that host window, the left Activity Bar shows the **One-Click Turbo** entry with a compact launcher-style Dashboard view.

## Package a VSIX

```powershell
npm run package:vsix
```

This writes:

```text
dist/turbo-vscode-1.0.0.vsix
```

## Release Checklist

- Replace `repository`, `bugs`, and `homepage` placeholder URLs in `package.json`.
- Run `npm run compile`.
- Run `npm test`.
- Run `npm run test:vscode`.
- Run `npm run package:vsix`.
- Run `npm run verify:release` after real URLs are in place.
- Install the VSIX into a clean VS Code profile.
- Confirm the Activity Bar entry appears.
- Run Full Scan and Quick Audit.
- Open the full Dashboard.
- Export a Markdown report.
- Verify Apply Safe Fixes shows a preview and Git warning where applicable.
- Verify Undo Last Fix is safe when no Change Log exists.
- Verify Purge clears only Turbo-owned state.

## Known Limits

- V1.0 does not include Extended DB or remote database updates.
- V1.0 does not provide User-level settings writes.
- V1.0 does not perform background automatic scans.
- V1.0 does not programmatically disable, uninstall, or deactivate extensions.
- Core DB guidance is an offline seed dataset and should be expanded after 1.0.
