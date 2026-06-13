# Content Templates

Use these templates as starting points. Replace links before publishing.

Marketplace:

```text
https://marketplace.visualstudio.com/items?itemName=Evhye.one-click-turbo
```

GitHub:

```text
https://github.com/evhye38496-svg/one-click-turbo
```

## English Launch Post

```text
I built my first VS Code extension: One-Click Turbo.

It runs a local performance health check for VS Code:
- audits installed extensions and activation signals
- gives a 0-100 Turbo Score
- suggests preview-first safe workspace fixes
- exports a Markdown report
- works fully offline, with no telemetry

Marketplace: https://marketplace.visualstudio.com/items?itemName=Evhye.one-click-turbo
GitHub: https://github.com/evhye38496-svg/one-click-turbo

Feedback is welcome. This is my first open-source project.
```

## Chinese Launch Post

```text
我做了自己的第一个 GitHub 开源项目：One-Click Turbo，一个 VS Code 性能体检插件。

它可以：
- 一键扫描扩展清单、激活事件、工作区配置
- 给出 0-100 的 Turbo Score
- 预览后再写入安全的 Workspace 设置
- 支持撤销和导出 Markdown 报告
- 完全离线，不上传数据，不遥测

Marketplace：https://marketplace.visualstudio.com/items?itemName=Evhye.one-click-turbo
GitHub：https://github.com/evhye38496-svg/one-click-turbo

欢迎试用、提 issue、给 star。
```

## Reddit / Hacker News Version

```text
Show HN: One-Click Turbo - a VS Code performance health check

I built One-Click Turbo to answer a simple question: "Why does my VS Code feel slow?"

The extension scans installed extensions, activation events, workspace settings, and memory hints locally. It then gives a Turbo Score, shows audit guidance, and can apply a small set of preview-first workspace safe fixes.

It does not upload telemetry, read source file contents, disable extensions, or write User settings.

Marketplace: https://marketplace.visualstudio.com/items?itemName=Evhye.one-click-turbo
GitHub: https://github.com/evhye38496-svg/one-click-turbo

I am a first-time open-source maintainer, so clear feedback is very welcome.
```

## Safety-Focused Post

```text
One design rule behind One-Click Turbo: performance tools should not create more risk than they remove.

So V1.0 is:
- fully offline
- no telemetry
- no source-code upload
- no automatic extension disabling
- no User settings writes
- preview-before-write for workspace safe fixes
- undoable for Turbo-written settings

Marketplace: https://marketplace.visualstudio.com/items?itemName=Evhye.one-click-turbo
GitHub: https://github.com/evhye38496-svg/one-click-turbo
```

## Short Video Script

```text
Title: VS Code feels slow? Run a 30-second health check.

Scene 1: Open VS Code with many extensions.
Voice/text: "VS Code slow, but you do not know why?"

Scene 2: Open One-Click Turbo from the Activity Bar.
Voice/text: "Run a local scan."

Scene 3: Show Turbo Score and issue list.
Voice/text: "Get a 0-100 score and clear hints."

Scene 4: Show Apply Safe Fixes preview.
Voice/text: "Preview safe workspace fixes before writing anything."

Scene 5: Show Markdown export.
Voice/text: "Export a report for your team."

Ending: Marketplace and GitHub links.
```

## Article Ideas

- Why VS Code gets slow after installing many extensions
- How to audit VS Code performance without telemetry
- Building my first VS Code extension: lessons from One-Click Turbo
- What VS Code activation events can tell you about extension startup behavior
- Why performance tools should be preview-first and undoable

## Comment Reply Template

```text
Thanks for trying it. The extension is intentionally conservative: it does not measure per-extension CPU/memory yet, and it does not disable extensions automatically. If you can share the Turbo Score and the relevant issue text without private workspace details, I can check whether the guidance looks reasonable.
```
