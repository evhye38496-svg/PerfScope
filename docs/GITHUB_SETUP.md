# GitHub Setup Checklist

These steps must be done manually in the GitHub web UI.

## About Section

Open the repository page and edit the About panel.

Description:

```text
A 30-second VS Code performance health scanner: audit extensions, score your setup, and apply preview-first safe workspace fixes.
```

Website:

```text
https://marketplace.visualstudio.com/items?itemName=Evhye.one-click-turbo
```

Topics:

```text
vscode-extension
vscode
performance
optimization
developer-tools
extensions
audit
productivity
workspace
typescript
markdown-report
offline
safe-fixes
extension-manager
```

## Social Preview

Open:

```text
Settings -> General -> Social preview
```

Upload a custom 1280x640 PNG that clearly shows:

- One-Click Turbo
- VS Code performance health check
- Scan / Score / Safe Fixes
- Offline / no telemetry / preview-before-write

## Features

Enable:

- Issues
- Discussions
- Projects, only if you plan to manage public roadmap tasks

Recommended discussion categories:

- Ideas
- Show your Turbo Score
- Help

## Labels

Create or keep these labels:

- `bug`
- `enhancement`
- `feedback`
- `good first issue`
- `documentation`
- `marketplace`
- `safe-fix`
- `extension-audit`

## Good First Issues to Create

Create these as normal GitHub issues and label them `good first issue`.

```text
Title: Add Marketplace screenshots to README
Body:
Add screenshots for Sidebar, Full Dashboard, Safe Fix preview, and Markdown export.
Acceptance:
- Screenshots do not reveal private paths or source code.
- README includes the screenshots near the first screen.
- Marketplace rendering remains readable.
```

```text
Title: Improve Markdown report examples
Body:
Add an example report section to docs showing a safe, privacy-preserving Turbo report.
Acceptance:
- Example contains no private data.
- Example explains Full Scan vs Quick Audit.
```

```text
Title: Add more offline Core DB guidance wording
Body:
Improve safe wording for known extension guidance without adding network access or telemetry.
Acceptance:
- Each record keeps confidence, lastVerified, and safeWording.
- Existing tests pass.
```

```text
Title: Document multi-root workspace safe fixes
Body:
Explain how Workspace Folder scoped fixes work in multi-root workspaces.
Acceptance:
- README or docs mention single-root vs multi-root behavior.
- No new code behavior is required.
```

```text
Title: Improve Dashboard screenshot workflow
Body:
Document how maintainers should capture clean screenshots for Marketplace updates.
Acceptance:
- docs/GROWTH_PLAYBOOK.md includes capture steps.
- No private workspace data is shown.
```
