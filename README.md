# One-Click Turbo

One-Click Turbo is a VS Code performance health scanner and optimization guide.

V0.3 provides a safe, offline VS Code performance workflow:

- Manual Turbo scan command
- Quick extension audit
- Dashboard webview shell with score and audit sections
- Status bar score display
- Extension/configuration checks
- Workspace safe fixes for watcher/search exclusions and `search.followSymlinks`
- Workspace Change Log rollback for Turbo-written settings

V0.3 only writes Workspace settings after an explicit QuickPick confirmation. It does not write User settings, disable extensions, modify `.vscode/extensions.json`, read source files, upload data, or fetch remote databases.

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
