# Support

One-Click Turbo V0.8 is a VSIX beta. Please replace the placeholder support links in `package.json` before public distribution.

## Before Reporting an Issue

Please include:

- VS Code version
- Operating system
- One-Click Turbo version
- Whether the extension was installed from VSIX or Extension Development Host
- The command you ran
- Any visible error message

Do not include private source code, secrets, tokens, or proprietary workspace files.

## Safety Notes

V0.8 is offline by default. It does not upload telemetry, fetch remote databases, disable extensions, uninstall extensions, or read source file contents.

The only settings V0.8 can write are Workspace settings, after explicit user confirmation:

- `files.watcherExclude`
- `search.exclude`
- `search.followSymlinks`

If a workspace appears to be inside a Git repository, Turbo warns before writing Workspace settings because `.vscode/settings.json` may be committed.

## Beta Limits

- Marketplace public publishing is not part of V0.8.
- Purge behavior is not implemented.
- User-level settings writes are not implemented.
- Background automatic scans are not implemented.

## Recovery

If a safe fix was applied, run `Turbo: Undo Last Fix` from the Command Palette or the One-Click Turbo Dashboard. Undo only rolls back the latest Turbo Change Log for Workspace settings that have not been externally changed.
