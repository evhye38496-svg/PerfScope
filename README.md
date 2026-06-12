# One-Click Turbo

One-Click Turbo is a VS Code performance health scanner and optimization guide.

## V0.8 Beta

V0.8 is a VSIX beta release for local testing and small-group validation. It is not intended as a final Marketplace release until the placeholder repository links in `package.json` are replaced and the release checklist below is complete.

## Features

- Manual Turbo full scan
- Quick extension audit
- Activity Bar entry with a compact Side Bar dashboard
- Launcher-style full Dashboard and Side Bar UI
- Status Bar states for scan, audit, fix, undo, export, score, and error
- Gentle completion and error notifications
- Markdown report export through an explicit Save Dialog
- Git repository warning before Workspace settings writes
- Workspace safe fixes for watcher/search exclusions and `search.followSymlinks`
- Workspace Change Log rollback for Turbo-written settings

## Safety Boundaries

One-Click Turbo is offline by default. It does not fetch remote databases, upload telemetry, read source file contents, disable extensions, uninstall extensions, or modify `.vscode/extensions.json`.

The only settings V0.8 can write are Workspace settings, and only after explicit user confirmation:

- `files.watcherExclude`
- `search.exclude`
- `search.followSymlinks`

It does not write User settings. If the workspace appears to be inside a Git repository, Turbo warns before applying Workspace safe fixes because `.vscode/settings.json` may be committed.

## Install the VSIX Beta

After packaging, install the generated VSIX from VS Code:

1. Open the Command Palette.
2. Run `Extensions: Install from VSIX...`.
3. Select `dist/turbo-vscode-0.8.0.vsix`.

You can also install from a terminal:

```powershell
code --install-extension dist/turbo-vscode-0.8.0.vsix
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
dist/turbo-vscode-0.8.0.vsix
```

## Release Checklist

- Replace `repository`, `bugs`, and `homepage` placeholder URLs in `package.json`.
- Run `npm run compile`.
- Run `npm test`.
- Run `npm run test:vscode`.
- Run `npm run package:vsix`.
- Install the VSIX into a clean VS Code profile.
- Confirm the Activity Bar entry appears.
- Run Full Scan and Quick Audit.
- Open the full Dashboard.
- Export a Markdown report.
- Verify Apply Safe Fixes shows a preview and Git warning where applicable.
- Verify Undo Last Fix is safe when no Change Log exists.

## Known Beta Limits

- V0.8 does not publish directly to Marketplace.
- V0.8 does not implement purge behavior.
- V0.8 does not provide User-level settings writes.
- V0.8 does not perform background automatic scans.
- Core DB guidance is an offline seed dataset and should be expanded before a full 1.0 release.
