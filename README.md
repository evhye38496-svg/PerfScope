# One-Click Turbo

One-Click Turbo is a VS Code performance health scanner and optimization guide.

V0.5 provides a safe, offline VS Code performance workflow:

- Manual Turbo scan command
- Quick extension audit
- Dashboard actions for scan, audit, safe fixes, and undo
- Status bar states for scan, audit, fix, undo, score, and error
- Gentle completion and error notifications
- Markdown report export through an explicit Save Dialog
- Git repository warning before Workspace settings writes
- Extension/configuration checks
- Workspace safe fixes for watcher/search exclusions and `search.followSymlinks`
- Workspace Change Log rollback for Turbo-written settings

V0.5 only writes Workspace settings after an explicit QuickPick confirmation and a Git risk warning when applicable. It does not write User settings, disable extensions, modify `.vscode/extensions.json`, read source files, upload data, or fetch remote databases.

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

Use the **Run Extension** launch configuration in VS Code to open an Extension Development Host.
