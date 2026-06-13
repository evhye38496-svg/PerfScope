# One-Click Turbo Growth Playbook

This playbook is a practical launch and growth checklist for One-Click Turbo. It is written for a first-time open-source maintainer and focuses on sustainable Marketplace installs and GitHub stars.

## Positioning

Use one consistent sentence everywhere:

> One-Click Turbo is a 30-second VS Code performance health check.

Core promise:

- Scan installed extensions, activation signals, workspace settings, and memory hints.
- Give a clear 0-100 Turbo Score.
- Apply only preview-first safe workspace fixes.
- Stay fully offline with no telemetry.

Avoid claims that cannot be proven:

- Do not promise exact speed gains.
- Do not claim to measure per-extension CPU or memory.
- Do not imply automatic extension disabling.

## Pre-Launch Checklist

- GitHub About description is filled.
- GitHub website points to the Marketplace page.
- GitHub topics are configured.
- Social Preview image is uploaded.
- README first screen has install, GitHub, and issue links.
- Marketplace icon is visible at small size.
- At least one screenshot or GIF is ready.
- `npm run compile` passes.
- `npm test` passes.
- `npm run test:vscode` passes.
- `npm run package:vsix` creates `dist/one-click-turbo-1.0.0.vsix`.
- A clean VS Code profile can install and run the VSIX.

## GitHub Repository Setup

Repository description:

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

Discussions categories to enable:

- Ideas
- Show your Turbo Score
- Help

Suggested labels:

- `bug`
- `enhancement`
- `feedback`
- `good first issue`
- `documentation`
- `marketplace`
- `safe-fix`
- `extension-audit`

## Visual Assets

Minimum asset set:

- Custom 1280x640 PNG: upload to GitHub Social Preview.
- `marketplace-hero.png`: Activity Bar and Sidebar overview.
- `dashboard-score.png`: full Dashboard with Turbo Score.
- `safe-fix-preview.png`: Apply Safe Fixes preview.
- `markdown-report.png`: exported Markdown report.
- `quick-audit.png`: extension audit view.

Screenshot rules:

- Do not expose private source code, private paths, tokens, or usernames.
- Use a clean sample workspace.
- Use a standard VS Code light or dark theme.
- Capture at a readable desktop width.
- Crop out irrelevant desktop clutter.

GIF script:

```text
1. Open VS Code.
2. Click the One-Click Turbo Activity Bar icon.
3. Click Run Full Scan.
4. Show the Turbo Score.
5. Click Quick Audit.
6. Open the full Dashboard.
7. Show Export Report.
```

## Launch Day Checklist

- Publish the Marketplace extension.
- Open the Marketplace page in an incognito browser.
- Confirm install button works.
- Confirm README renders correctly.
- Confirm badges do not show broken state.
- Confirm the icon looks good at small size.
- Create GitHub release `v1.0.0`.
- Attach `dist/one-click-turbo-1.0.0.vsix`.
- Post the launch announcement.
- Save baseline metrics.

Baseline metrics:

```text
Date:
Marketplace installs:
Marketplace rating:
Marketplace reviews:
GitHub stars:
GitHub watchers:
GitHub forks:
GitHub visitors:
GitHub clones:
Open issues:
```

## First 48 Hours

Publish in this order:

1. GitHub Release.
2. Marketplace page.
3. Personal X / Bluesky / Mastodon post.
4. V2EX or another Chinese developer community post.
5. DEV.to / Hashnode article.
6. Reddit `r/vscode`, only if the rules allow self-promotion.
7. Hacker News Show HN.

Reply policy:

- Reply to every real comment.
- Thank people for bug reports.
- Ask for reproduction steps when unclear.
- Do not argue about star counts or comparisons.
- Do not over-promise roadmap items.

## First Week Routine

Daily:

- Check Marketplace installs and ratings.
- Check GitHub stars, traffic, issues, and discussions.
- Reply to all feedback.
- Write down the top 3 repeated questions.
- Ship small documentation fixes quickly.

Weekly:

- Summarize what worked.
- Update README if users misunderstand the same point.
- Create 3 new `good first issue` tasks.
- Decide whether to ship a patch release.

## Month-One Goals

Reasonable first-project targets:

- 50-200 Marketplace installs.
- 20-80 GitHub stars.
- 5-15 useful feedback items.
- 1-3 real Marketplace reviews.
- 1-2 patch releases based on feedback.

These are learning targets, not guarantees.

## Long-Term Growth

Invest in trust:

- Keep security boundaries clear.
- Publish changelogs.
- Keep issues active.
- Thank contributors.
- Avoid exaggerated performance claims.

Invest in shareability:

- Make exported reports clear.
- Add a future user-triggered `Copy Summary` command.
- Encourage users to share Turbo Score screenshots.

Invest in discoverability:

- Keep Marketplace keywords relevant.
- Add screenshots after every major UI improvement.
- Write practical articles about diagnosing VS Code performance.
