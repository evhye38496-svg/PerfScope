# Support

One-Click Turbo V1.0 is an offline VS Code performance health scanner and optimization guide. Replace the placeholder support links in `package.json` before public Marketplace publishing.

## Before Reporting an Issue

Please include:

- VS Code version
- Operating system
- One-Click Turbo version
- Whether the extension was installed from VSIX, Marketplace, or Extension Development Host
- The command you ran
- Any visible error message

Do not include private source code, secrets, tokens, or proprietary workspace files.

## Safety Notes

V1.0 is offline. It does not upload telemetry, fetch remote databases, disable extensions, uninstall extensions, or read source file contents.

The only settings V1.0 can write are project-scoped settings, after explicit user confirmation:

- `files.watcherExclude`
- `search.exclude`
- `search.followSymlinks`

Single-root workspaces use Workspace scope. Multi-root workspaces use Workspace Folder scope. Turbo does not write User settings.

If a target workspace or folder appears to be inside a Git repository, Turbo warns before writing settings because `.vscode/settings.json` may be committed.

## Purge and Recovery

Run `Turbo: Purge & Prepare for Uninstall` to clear only Turbo-owned saved state and recent UI report data. Purge does not modify settings, uninstall extensions, delete files, or change `.vscode/extensions.json`.

If a safe fix was applied, run `Turbo: Undo Last Fix` from the Command Palette or the One-Click Turbo Dashboard. Undo only rolls back the latest Turbo Change Log for Workspace or Workspace Folder settings that have not been externally changed.

## Known Limits

- Extended DB and remote updates are not included in V1.0.
- User-level settings writes are not implemented.
- Background automatic scans are not implemented.
- Programmatic extension disable/uninstall is not implemented.
