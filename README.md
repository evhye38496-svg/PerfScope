# ⚡ One-Click Turbo

**One-click health check for your VS Code performance.** Scan → Score → Fix, all in under 30 seconds.

[![Marketplace](https://img.shields.io/badge/Marketplace-v1.0-blue)](https://marketplace.visualstudio.com/items?itemName=Evhye.turbo-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/Evhye.turbo-vscode?label=installs&color=green)](https://marketplace.visualstudio.com/items?itemName=Evhye.turbo-vscode)

## Why Do You Need It?

After installing too many VS Code extensions, startup can slow down, saving can stutter, and search can feel sluggish.
Most of the time, you do not even know which extension or setting is dragging things down.

Turbo helps you:

- 🧪 **Scan in one click** across extension inventory, activation events, workspace settings, and memory hints
- 📊 **Turbo Score** from 0 to 100 at a glance
- 🔧 **Fix safely in one click** with preview-first workspace settings changes
- ↩️ **Undo every fix** written by Turbo
- 📄 **Export Markdown reports** for team sharing
- 🔒 **Stay fully offline** with no data uploads

## V1.0

V1.0 is the first Marketplace release line, published under `Evhye`.

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

- Run `npm run compile`.
- Run `npm test`.
- Run `npm run test:vscode`.
- Run `npm run verify:release`.
- Run `npm run package:vsix`.
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
