# One-Click Turbo — VS Code 性能一键优化器

## 产品功能文档（PRD）v1.8

> 本文档是 One-Click Turbo 开发的唯一标准。所有功能实现、UI 交互、技术架构均以此文档为准。
> 版本迭代以本文档的版本号为准，任何功能变更需要更新本文档。
>
> **v1.8 修订摘要**：统一前文规格与 §11 风险决策，移除不可通过 VS Code 标准 API 实现的能力承诺（扩展激活耗时自动读取、编程化禁用/卸载其他扩展、activationEvents 运行时拦截），收敛 V1.0 MVP 范围，明确 Safe Auto Fix / Manual Guided Fix / Suggestion Only 的边界，补充隐私、遥测、Remote、多根工作区、回滚与配置写入的开发约束。

---

## 目录

1. [产品概述](#1-产品概述)
2. [核心价值主张](#2-核心价值主张)
3. [V1.0 MVP 功能规格](#3-v10-mvp-功能规格)
4. [V1.x 迭代功能](#4-v1x-迭代功能)
5. [技术架构](#5-技术架构)
6. [交互与 UI 设计](#6-交互与-ui-设计)
7. [性能诊断评分体系](#7-性能诊断评分体系)
8. [关键边界条件与限制](#8-关键边界条件与限制)
9. [发布与迭代计划](#9-发布与迭代计划)
10. [开发规范](#10-开发规范)
11. [工程风险与应对方案](#11-工程风险与应对方案)

---

## 1. 产品概述

### 1.1 产品定位

**One-Click Turbo** 是一款面向所有 VS Code 用户的**性能诊断与一键优化工具**。它不直接替代任何功能型扩展，而是站在"元工具"层面，帮助用户识别、量化、解决 VS Code 和扩展带来的性能问题。

### 1.2 解决的核心问题

当前 VS Code 生态中，用户遇到性能问题后：
- **不知道**是哪个扩展拖慢了编辑器（只能"全部禁用→逐个启用"）
- **不知道**哪些配置项可以显著改善性能
- **不知道**自己的编辑器性能处于什么水平
- **无法量化**优化前后的变化

### 1.3 目标用户画像

| 用户类型 | 特征 | 核心诉求 |
|----------|------|----------|
| **扩展重度用户** | 安装 30-80+ 扩展，工作区配置复杂 | 找出拖慢速度的元凶 |
| **大型项目开发者** | Monorepo、数十万文件、多语言 | 优化大项目下的编辑器响应 |
| **低配设备用户** | 8GB 内存、集显、笔记本 | 让 VS Code 跑得更流畅 |
| **性能敏感用户** | 对延迟零容忍 | 量化监控编辑器健康度 |

### 1.4 竞品分析

| 竞品 | 存在形式 | 差距 |
|------|----------|------|
| `Developer: Show Running Extensions` | VS Code 内置命令 | 数据展示但不提供优化建议 |
| `Developer: Startup Performance` | VS Code 内置命令 | 仅启动阶段，无持续监控 |
| `Extension Bisect` | VS Code 内置功能 | 手动二分排查，耗时长 |
| 社区博客/教程 | 文章 | 零散、非个性化、需手动操作 |

**结论：目前市场上不存在一款面向普通用户的、自动化的、提供可操作建议的 VS Code 性能优化工具。这是完全空白的赛道。**

---

## 2. 核心价值主张

> **10 秒内完成一次轻量健康检查，生成可解释、可预览、可回滚的 VS Code 性能优化建议。**

### 2.1 用户价值

- **省时间**：不需要花数小时手动排查性能问题
- **可量化**：性能分数让优化效果肉眼可见
- **零门槛**：不需要了解 VS Code 底层架构
- **持续保护**：V1.0 在用户主动扫描时重新评估；V1.2+ 可在扩展变更后提示或自动重新评估

### 2.2 产品口号（备选）

- "Your VS Code's personal trainer."
- "One click. Measurable speed."
- "Stop guessing. Start measuring."

---

## 3. V1.0 MVP 功能规格

### 3.1 功能总览

V1.0 聚焦三个核心模块：
1. **性能健康扫描** — 一键生成性能诊断报告
2. **扩展清单审计** — 识别"坏习惯"扩展并给出建议
3. **一键优化应用** — 生成可预览、可回滚的安全建议配置

**V1.0 明确非目标（不得实现）：**
- 不自动禁用、启用、卸载其他扩展，不调用其他扩展的 `deactivate`
- 不读取用户源码内容，不扫描文件正文，不上传任何数据
- 不解析 VS Code 内部日志、隐藏 telemetry、私有 IPC 或非公开状态文件
- 不承诺精确启动耗时、per-extension CPU/内存、百分比收益或绝对节省内存
- 不自动修改高风险偏好项（如 `extensions.autoUpdate`、`files.maxMemoryForLargeFilesMB`）
- 不在用户未预览确认前修改 User / Workspace / WorkspaceFolder 配置

---

### 3.2 模块一：性能健康扫描（Turbo Scan）

#### 3.2.1 功能描述

用户执行 `Turbo: Run Full Scan` 命令后，插件在后台运行综合诊断，**5-10 秒内**生成一份可读的性能健康报告。

#### 3.2.2 扫描项目清单

| 扫描项 | 数据来源 | 诊断逻辑 |
|--------|----------|----------|
| **启动扩展数量** | `vscode.extensions.all` + 激活状态 | > 20 个激活扩展 → ⚠️ 警告 |
| **"全时激活"扩展** | 轻量读取扩展 manifest（仅 `activationEvents` 字段） | 包含 `*` 或 `onStartupFinished` → 🔴 高危标记 |
| **重复功能扩展** | 预置的扩展功能分类表 + 语言作用域过滤（见 §11.6） | 同时启用语义上可能冗余的扩展 → ⚠️ 共存提示（不扣分） |
| **Watcher 配置** | 读取 `files.watcherExclude` | 未排除 `node_modules/.git/dist` → ⚠️ 建议优化 |
| **Search 排除配置** | 读取 `search.exclude` | 未配置 → ⚠️ 建议优化 |
| **编辑器渲染配置** | 读取 editor 相关配置项 | CodeLens/minimap 等可选功能 → 建议性优化 |
| **环境约束检测** | `process.memoryUsage().heapUsed` / `process.memoryUsage().rss` | Extension Host 自身内存 > 200MB → 提示扩展环境负载较高；可用 OS 内存 < 2GB → 自动启用"低配优化模式" |
| **启动性能自查入口** | VS Code 内置命令入口 | 不自动读取其他扩展激活耗时；提供 `Developer: Startup Performance` 快捷入口与解读指引（§11.25） |

**关键设计决策（参见 §11 详细论证）：**
- `package.json` **不**全量解析。首轮扫描仅从 `vscode.extensions.all` 的轻量元数据出结果，仅对匹配到"已知重扩展"规则的目标扩展才按需深入读取完整 manifest。读取 I/O 并发数不超过 4；JSONC 解析串行执行且每个文件后主动 `setImmediate()` 让出 Event Loop（§11.1、§11.36）。
- 系统资源基线使用 **进程级指标**（`process.memoryUsage()`）替代 OS 全局指标（`os.totalmem()`/`os.freemem()`），后者仅用于"低配模式"的自动触发判断（§11.2）。

#### 3.2.3 输出：Turbo Score

扫描完成后生成一个 **0-100 的 Turbo Score** 综合评分：

```
Turbo Score =
  (启动健康分 × 0.35) +
  (配置健康分 × 0.35) +
  (扩展清单健康分 × 0.25) +
  (环境约束分 × 0.05)
```
> 环境约束分权重仅为 5%，仅作信息参考，对总分影响极小。低配设备触发"低配优化模式"而非粗暴扣分（§11.2）。

| 分数区间 | 等级 | 颜色 |
|----------|------|------|
| 90-100 | 🟢 Excellent | 绿色 |
| 70-89 | 🟡 Good | 黄色 |
| 50-69 | 🟠 Needs Attention | 橙色 |
| 0-49 | 🔴 Critical | 红色 |

#### 3.2.4 诊断报告 UI

诊断报告在侧边面板中展示，包含：
1. **总评分** — 大号数字 + 等级标签
2. **问题列表** — 按严重程度排序（Critical → Warning → Info）
3. **每个问题的描述 + 影响说明 + 一键修复按钮**
4. **优化影响说明** — 用"可能降低文件监听压力 / 可能减少搜索范围 / 需要用户验证"等可解释措辞描述影响；V1.0 不承诺精确百分比收益

---

### 3.3 模块二：扩展清单审计（Extension Audit）

#### 3.3.1 功能描述

分析用户已安装的所有扩展，生成分类清单，标记潜在问题扩展。

#### 3.3.2 扩展分类

每个扩展按用户意图自动分类（基于 `categories`、`keywords`、功能描述）：

| 分类 | 示例 |
|------|------|
| 🎨 Theme / Icon | Material Theme, vscode-icons |
| 📝 Lint / Format | ESLint, Prettier, Biome |
| 🔤 Language Support | Python, Go, Rust Analyzer |
| 🤖 AI / Completion | Copilot, Continue, Twinny |
| 📦 Git / Version Control | GitLens, Git Graph |
| 🧩 Snippets | Vue Snippets, React Snippets |
| 🛠 Utility / Productivity | Bookmarks, Todo Tree, Project Manager |
| ⚡ Build / Task / Debug | Live Server, Code Runner |

#### 3.3.3 问题扩展标记规则

| 标记 | 触发条件 | 严重程度 |
|------|----------|----------|
| 🔴 全时激活 | `activationEvents` 含 `*` | High |
| 🟠 已知性能大户 | 扩展 ID 在预置的"known-heavy"列表中 | High |
| 🟡 可能冗余共存 | 同类扩展同时启用（如多个 linter），**且满足语言作用域重叠条件**（§11.6）| Low（仅提示，不扣分） |
| 🟡 长时间未用 | 基于扩展激活事件频率推测 | Medium |
| 🔵 存在轻量替代 | 扩展 ID 在预置的"lightweight-alternative"映射表中 | Info |
| ⚪ 功能可能已内置 | 功能已被新版 VS Code 内置 | Info |

**关键设计决策**：扩展列表的"冲突/冗余"判定不仅依赖分类匹配，还必须验证 `activationEvents` 是否在相同语言文件类型上触发（详见 §11.6）。不存在语言重叠的同类扩展（如 ESLint + 某个 C++ linter）**不判定为冗余**。同时内置一份"已知合理共存"白名单（如 ESLint + Prettier），白名单内的组合完全不标记。

#### 3.3.4 预置知识库

插件内置两个关键数据集（定期更新）：

**知识库数据质量要求：**
- 每条规则必须包含 `confidence`（low / medium / high）、`lastVerified`（ISO 日期）、`evidence`（公开来源或可复现实验说明）和 `safeWording`（面向用户的中性表述）。
- 不得使用"垃圾扩展"、"必须卸载"等攻击性或确定性措辞；统一使用"可能影响性能"、"建议检查配置"、"可考虑替代"。
- `typicalMemoryMB`、`savingsEstimate` 等字段仅作经验范围展示，必须标注为估计值，不进入 V1.0 评分公式。

**`known-heavy-extensions.json`**（已知高消耗扩展）：
```json
{
  "eamodio.gitlens": {
    "reason": "GitLens performs heavy git operations including full-history traversal",
    "typicalMemoryMB": "100-380",
    "confidence": "medium",
    "lastVerified": "2026-06-12",
    "evidence": ["public docs", "community reports"],
    "safeWording": "GitLens 的部分功能可能增加 Git 查询与 CodeLens 渲染开销",
    "severity": "high",
    "suggestion": "Disable CodeLens and current line blame features, or use built-in Git blame"
  },
  "dbaeumer.vscode-eslint": {
    "reason": "Type-aware ESLint rules can cause 5-10s save delays in large projects",
    "typicalMemoryMB": "150-500",
    "confidence": "medium",
    "lastVerified": "2026-06-12",
    "evidence": ["public docs", "large-project configuration patterns"],
    "safeWording": "ESLint 在启用类型感知规则或大型项目中可能增加保存与诊断耗时",
    "severity": "high",
    "suggestion": "Disable type-aware rules in IDE, use Biome for real-time linting"
  }
}
```

**`lightweight-alternatives.json`**（轻量替代映射）：
```json
{
  "eamodio.gitlens": {
    "alternative": "Built-in Git blame + Git Graph (for visualization)",
    "savingsEstimate": "60-80% memory reduction"
  },
  "dbaeumer.vscode-eslint": {
    "alternative": "Biome (biomejs.biome) for JS/TS linting and formatting",
    "savingsEstimate": "50-100x speed improvement, 80% memory reduction"
  }
}
```

---

### 3.4 模块三：一键优化应用（Turbo Fix）

#### 3.4.1 功能描述

将诊断报告中的每一条可自动修复的问题，转化为一键执行的优化动作。

#### 3.4.2 支持的操作类型

| 操作类型 | 说明 | 是否需要确认 |
|----------|------|-------------|
| **Safe Auto Fix** | 写入/更新低风险 settings.json 配置项（Deep Merge + User Wins，见下） | ✅ 预览后确认 |
| **Manual Guided Fix** | 建议用户手动禁用、替换或调整某扩展；仅提供扩展面板/设置页跳转与步骤说明 | ❌ 不自动执行 |
| **Extension self-settings** | 对已知重扩展，仅在知识库明确给出安全配置项时，建议关闭其高消耗特性（如 CodeLens）；默认仍需用户逐项确认 | ✅ 预览后确认 |
| **Add workspace recommendation** | 修改 `.vscode/extensions.json` 的推荐/不推荐项 | ✅ 确认 |
| **Suggestion Only** | 高风险或强个人偏好的调整，仅展示建议，不进入 Apply All Safe Fixes | ❌ 仅提示 |
| **Create performance preset** | 保存当前优化配置为预设 | ✅ 确认 |

> **V1.0 决策**：不通过编程方式自动禁用、启用、卸载或调用其他扩展的 `deactivate`。VS Code Extension API 不暴露跨扩展生命周期控制能力（§11.29）。V1.0 仅提供"一键跳转到扩展面板/设置页"的手动引导；后续版本也不得引入编程化禁用，除非 VS Code 官方 API 明确开放并重新修订本文档。

> 修改 `.vscode/extensions.json` 时必须使用 JSONC-aware 文本编辑（如 `jsonc-parser` 的 `modify/applyEdits`），不得 `JSON.stringify` 整文件覆盖，以免破坏用户注释和格式。

#### 3.4.3 Apply Settings 的具体配置项与作用域

每条配置均指定写入目标（User / Workspace），遵循分级策略（§11.3）：

| 配置项 | 推荐作用域 | 理由 |
|--------|-----------|------|
| `files.watcherExclude` | **Workspace** | 与项目结构强相关，适合项目级 |
| `search.exclude` | **Workspace** | 同上 |
| `search.followSymlinks` | **Workspace** | 同上 |
| `editor.minimap.enabled` | **User** | 纯个人偏好，不应进项目仓库 |
| `editor.renderLineHighlight` | **User** | 纯个人偏好 |
| `workbench.editor.limit.*` | **User** | 纯个人偏好 |
| `files.maxMemoryForLargeFilesMB` | **Suggestion Only** | 机器相关且可能提高内存压力，V1.0 不自动写入 |
| `extensions.autoUpdate` | **Suggestion Only** | 影响安全更新与兼容性，V1.0 不自动写入 |

当用户点击"Apply All Safe Fixes"时，按以下 JSON 结构写入。**合并策略：Deep Merge + User Wins（§11.4）**——仅在用户尚未设置该键时才填充默认值，用户已配置的键**绝不覆盖**。

**默认勾选策略：**
- Workspace 级 `files.watcherExclude`、`search.exclude`、`search.followSymlinks`：默认勾选，但若 `.vscode/settings.json` 可能被 Git 追踪，必须先提醒。
- User 级纯个人偏好（如 minimap、line highlight、editor limit）：预览中展示，默认不勾选；只有用户主动勾选后才写入。
- Suggestion Only 项：永不进入默认勾选列表。

```jsonc
// === Workspace 级别 (.vscode/settings.json) ===
{
  // Watcher 优化 — 减少大型目录带来的后台文件监听压力
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/coverage/**": true,
    "**/.next/**": true,
    "**/.nuxt/**": true,
    "**/target/**": true,
    "**/__pycache__/**": true,
    "**/*.log": true
  },
  // Search 优化 — 减少默认搜索范围，实际收益需由用户项目验证
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.git": true,
    "**/coverage": true
  },
  "search.followSymlinks": false
}

// === User 级别 (用户 settings.json) ===
{
  // Editor 渲染优化
  "editor.minimap.enabled": false,
  "editor.renderLineHighlight": "none",
  "workbench.editor.limit.enabled": true,
  "workbench.editor.limit.perEditorGroup": 8,
  // 注：files.maxMemoryForLargeFilesMB 与 extensions.autoUpdate 不属于 Safe Auto Fix，
  // 仅在报告中作为 Suggestion Only 展示，不由 Apply All Safe Fixes 写入。
}
```

**Git 提醒机制**：当目标为 Workspace 级别且检测到 `.vscode/settings.json` 被 Git 追踪时，弹出提示：
> ⚠️ 此操作将修改 `.vscode/settings.json`，该文件被 Git 追踪。建议与团队沟通后应用。你也可以选择写入 User 级别。

**合并示例**：若用户已配置 `"**/build/**": false`（明确不禁用 build 目录的 watcher），则此键**保留 false**，仅在预览中标记为"⏭️ 跳过（你已自定义此项）"。

#### 3.4.4 修复前预览

在执行任何修改之前，显示一个 **Changes Preview** 对话框。每行修改标注作用域和合并方式：

```
┌───────────────────────────────────────────────┐
│  Turbo Fix — Changes Preview                   │
│                                                │
│  Workspace (.vscode/settings.json)             │
│  ✅ 新增 files.watcherExclude (9 条)           │
│     → Deep Merge, 你已配置的键不会被覆盖        │
│  ✅ 新增 search.exclude (4 条)                 │
│  ✅ 更新 search.followSymlinks                 │
│                                                │
│  User (用户 settings.json)                     │
│  ✅ 更新 editor.minimap.enabled                │
│  ✅ 更新 workbench.editor.limit.*              │
│  ℹ️ files.maxMemoryForLargeFilesMB：仅建议，不自动写入 │
│  ℹ️ extensions.autoUpdate：仅建议，不自动写入          │
│                                                │
│  手动建议                                      │
│  ℹ️ GitLens: 建议禁用 CodeLens → [打开设置]    │
│  ℹ️ ESLint: 建议替换 → Biome → [安装]          │
│                                                │
│  ⚠️ .vscode/settings.json 被 Git 追踪          │
│     已写入的内容会被提交到仓库。                 │
│     [切换到 User 级别]                         │
│                                                │
│  预估效果：                                     │
│  • 可能降低文件监听与搜索索引压力                 │
│  • 可能减少大型目录带来的后台 I/O                 │
│  • 实际效果取决于项目规模、磁盘类型和扩展组合       │
│                                                │
│  [Apply Selected]  [Skip All]  [Cancel]         │
└───────────────────────────────────────────────┘
```

---

### 3.5 命令清单（V1.0）

| 命令 ID | 标题 | 快捷键 |
|---------|------|--------|
| `turbo.runFullScan` | Turbo: Run Full Scan | `Ctrl+Shift+T Ctrl+Shift+S` |
| `turbo.showDashboard` | Turbo: Show Dashboard | `Ctrl+Shift+T D` |
| `turbo.applySafeFixes` | Turbo: Apply All Safe Fixes | — |
| `turbo.quickAudit` | Turbo: Quick Extension Audit | — |
| `turbo.undoLastFix` | Turbo: Undo Last Fix | — |
| `turbo.reviewDefaults` | Turbo: Review VS Code Default Suggestions | — |
| `turbo.exportReport` | Turbo: Export Report (Markdown) | — |
| `turbo.purge` | Turbo: Purge & Prepare for Uninstall | — |

> V1.0 不提供"一键恢复 VS Code 全部默认配置"。任何回滚仅针对 Turbo 本次实际写入的键，并通过 Change Log 精确恢复（§11.12、§11.21、§11.32）。

---

## 4. V1.x 迭代功能

### 4.1 V1.1 — 性能历史追踪（Turbo Timeline）

- 每次扫描摘要保存到 `history.json`（`globalStorageUri` 路径下独立文件），**不存入 globalState**（§11.5）
- 提供性能分数趋势图（折线图），展示最近 20 次扫描
- 扩展安装/卸载/更新事件自动触发增量扫描
- "你的 Turbo Score 在过去 30 天变化"视图
- 存储容量保护：最多 20 条历史记录，超出 FIFO 淘汰；单条上限 5KB

### 4.2 V1.2 — 实时监控与增强手动引导（Live Monitor + Enhanced Guide）

- Status Bar 显示当前 Turbo Score 简写（如 `⚡85`）
- 当检测到扩展变更时自动提示重新扫描
- 监听扩展安装/卸载/启用状态变化；不拦截、不记录运行时 `activationEvents` 触发频率
- 内存使用趋势小窗
- 可选 Extended DB 手动更新命令 `Turbo: Update Extended Database`，默认离线降级为 Core DB-only
- **增强的手动禁用引导**（V1.2 替代原"安全禁用流程"——该设计经 §11.29 核验为 API 不可行）：
  1. Dashboard 对"建议禁用"的扩展提供 **[打开扩展面板]** 按钮
  2. 自动在扩展面板中预搜索目标扩展 ID
  3. 附带分步指引（禁用 → 重载窗口）
  4. **全程不涉及编程化禁用**——仅提供导航和指导

### 4.3 V1.3 — 团队模式（Team Sync）

- 导出团队推荐配置 → 提交到项目仓库的 `.vscode/turbo.json`
- 团队成员安装 Turbo 后提示发现团队预设，必须预览并确认后才可应用
- "你的配置与团队基准对比"视图

### 4.4 V1.4 — 智能推荐引擎

- 默认离线运行；仅在用户明确 opt-in 且 VS Code 遥测开关允许时，使用最小化匿名指标建立扩展性能画像（§8.2）
- "和你类似项目的用户，平均 Turbo Score 是 78"
- 扩展安装前性能影响预评估

---

## 5. 技术架构

### 5.1 系统架构图

```
┌──────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                 │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Turbo Extension Core                 │   │
│  │                                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │   │
│  │  │ Scan Engine │  │ Audit Engine│  │Fix Engine│ │   │
│  │  │             │  │             │  │          │ │   │
│  │  │• Config     │  │• Quick      │  │• Scope   │ │   │
│  │  │  Reader     │  │  Extension  │  │  Resolver│ │   │
│  │  │• Async      │  │  Audit      │  │• Deep    │ │   │
│  │  │  Chunked    │  │• Language   │  │  Merge   │ │   │
│  │  │  Reader     │  │  Scope      │  │  Engine  │ │   │
│  │  │• Process    │  │  Filter     │  │• Git     │ │   │
│  │  │  Monitor    │  │• Redundancy │  │  Tracker │ │   │
│  │  │• Score      │  │  Checker    │  │• Backup  │ │   │
│  │  │  Calculator │  │  (info-only)│  │  Manager │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  │• Rollback│ │   │
│  │         │                │         └────┬─────┘ │   │
│  │         │                │              │       │   │
│  │  ┌──────┴────────────────┴──────────────┴─────┐ │   │
│  │  │          Data Knowledge Base                │ │   │
│  │  │  ┌──────────────┐  ┌──────────────────┐    │ │   │
│  │  │  │ Core DB      │  │ Extended DB      │    │ │   │
│  │  │  │ (gzip, <5KB) │  │ (V1.2+, optional│    │ │   │
│  │  │  │ 包内静态      │  │  CDN cache)      │    │ │   │
│  │  │  └──────────────┘  └──────────────────┘    │ │   │
│  │  │  • known-heavy-extensions.json.gz           │ │   │
│  │  │  • lightweight-alternatives.json.gz         │ │   │
│  │  │  • optimal-defaults.json.gz                 │ │   │
│  │  │  • redundancy-whitelist.json                │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │            Storage Layer                  │   │   │
│  │  │  globalState (K-V)  │  globalStorageUri   │   │   │
│  │  │  • prefs (< 2KB)    │  • history.json     │   │   │
│  │  │  • changeLog        │    (20 entries, FIFO)│   │   │
│  │  │    (< 10KB)         │  • ext-db (V1.2+)   │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│  ┌───────────────────────┴──────────────────────────┐   │
│  │                  VS Code APIs                      │   │
│  │  vscode.extensions • vscode.workspace              │   │
│  │  vscode.env • process (Node.js)                    │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 5.2 技术选型

| 层面 | 选型 | 理由 |
|------|------|------|
| 扩展主体 | TypeScript + VS Code Extension API | 原生支持，依赖最小化 |
| 轻量 K-V 存储 | VS Code `Memento` API (`globalState` + `workspaceState`) | 存储用户偏好、最近一次扫描摘要、按作用域隔离的 Change Log（< 10KB） |
| 历史数据存储 | 独立 JSON 文件 (`context.globalStorageUri` 路径下) | 绕过 Memento 的容量限制，手动管理 FIFO 淘汰（§11.5） |
| Core 知识库 | 静态 JSON 文件，gzip 预压缩，构建时打包进扩展 | V1.0 离线可用，Top 30 核心扩展画像，< 5KB |
| Extended 知识库 | V1.2+ 可选 CDN 按需拉取 + 本地缓存 | 完整扩展画像，懒加载，内存使用后释放（§11.7）；V1.0 不启用 |
| 配置读写 | `vscode.workspace.getConfiguration()` API + 分级 Target | 标准方式，User/Workspace 分级写入 |
| UI 面板 | TreeView + Webview | TreeView 做列表，Webview 做仪表盘 |
| 评分算法 | 纯 TypeScript 函数 | 简单可维护 |
| 测试 | `@vscode/test-electron` + Jest | 官方推荐 |

**生产依赖白名单（V1.0）：**
- `jsonc-parser`：仅用于安全解析扩展 manifest / 数据库 JSONC，不用于直接写 settings.json
- Node.js 内置模块：`fs/promises`、`path`、`os`、`zlib`、`crypto` 等

V1.0 不引入 UI 框架、状态管理库、原生模块或大型遥测 SDK。若 V1.4 启用 Extended DB 签名校验，可新增一个纯 JS Ed25519 验签库，但必须重新评估包体积（§11.41、§11.42）。

### 5.3 关键数据流

#### 扫描流程（含 I/O 优化策略）

```
用户触发 "Turbo: Run Full Scan"
  │
  ├─→ ① Config Reader: 读取 settings.json 关键配置（同步，轻量）
  ├─→ ② Quick Extension Audit: 基于 vscode.extensions.all 轻量元数据
  │       ├─ 检查激活状态、activationEvents（仅 manifest 中该字段）
  │       ├─ 分类匹配、已知重扩展交叉比对
  │       └─ 标记需要深入读取的目标扩展（匹配到 known-heavy 规则者）
  ├─→ ③ Deep Manifest Read (异步分批): 
  │       └─ 仅对步骤②标记的目标扩展读取 package.json；
  │          I/O 并发 ≤ 4，JSONC 解析串行且每个文件后让出 Event Loop（§11.1、§11.36）
  ├─→ ④ System Monitor: process.memoryUsage() + os.freemem()（§11.2）
  ├─→ ⑤ Conflict/Redundancy Check: 
  │       └─ 同类扩展 + 语言作用域重叠 + 白名单排除（§11.6）
  │
  └─→ ⑥ Score Calculator: 综合计算 Turbo Score
        │
        └─→ ⑦ Report Renderer: 生成诊断报告 UI
```

#### 修复流程（含作用域分级与合并策略）

```
用户点击 "Apply Fix"
  │
  ├─→ ① Scope Resolution: 确定每条配置的写入目标（User / Workspace / Workspace Folder）
  ├─→ ② Deep Merge Check: 对 Object 类型配置，读取现有值 → 仅填充未设置键；用户已设置的键保留（§11.4）
  ├─→ ③ Git Tracking Check: 若目标为 Workspace 且 .vscode/settings.json 被 Git 追踪 → 弹出提醒
  ├─→ ④ Change Log: 保存本次实际修改条目（User 级写入 globalState，Workspace/Folder 级写入 workspaceState，§11.5、§11.32）
  ├─→ ⑤ Write: 使用 Configuration.update(key, value, target) 分级写入
  └─→ ⑥ Verify: 读取验证写入成功，更新报告
```

### 5.4 知识库架构与更新策略

**分层架构（§11.7）：**

| 层级 | 内容 | 大小目标 | 打包方式 | 更新频率 |
|------|------|----------|----------|----------|
| **Core DB** | Top 30 高消耗扩展 + 轻量替代映射 + 扩展分类索引 | < 5KB | 包内静态 JSON（gzip 预压缩，运行时 zlib 解压） | 跟随扩展版本发布 |
| **Extended DB（V1.2+）** | 完整扩展画像（300+ 扩展的详细性能特征、版本映射） | 50-200KB | CDN 按需拉取 + 本地缓存（`globalStorageUri` 路径） | 用户手动更新；后台检查必须单独 opt-in |

- **Core DB**：仅包含一个轻量索引（扩展 ID → 分类 + 风险等级），用于首轮快速扫描。
- **Extended DB（V1.2+）**：仅在需要展示详情（如"为什么这个扩展被标记为高消耗"）时才从缓存或 CDN 加载，使用后立即置 `null` 释放内存。V1.0 不包含 CDN 拉取逻辑。
- V1.4：仅在用户明确 opt-in、VS Code 遥测开关允许、并完成数据最小化审查后，才可使用匿名聚合指标辅助更新 Extended DB 画像；默认仍为离线 Core DB + 可选手动更新 Extended DB。

---

## 6. 交互与 UI 设计

### 6.1 Turbo Dashboard（主面板）

```
┌─────────────────────────────────────────────────┐
│  ⚡ Turbo                          Score: 72 🟡  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  ████████████████░░░░░░░░░░░░░░░░ 72/100         │
│  Good — 还有改进空间                              │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ 📊 Quick Stats                           │    │
│  │ Active Extensions: 32  |  Always-On: 5 🔴│    │
│  │ Conflicts Detected: 2  |  Optimizable: 8 │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Issues (8)                         [Fix All]    │
│  ─────────────────────────────────────────────── │
│  🔴 5 extensions use "always-on" activation      │
│     → 拖慢启动速度约 1.2s                     [>]│
│  ⚠️ ESLint + TSLint both enabled                 │
│     → 可能导致保存时双重检查                 [>]│
│  ⚠️ watcherExclude not configured                │
│     → 后台持续扫描 node_modules              [Fix]│
│  ℹ️ GitLens CodeLens may impact performance      │
│     → 建议禁用行内注释 [Details]              [>]│
│  ℹ️ Prettier + Beautify — potential conflict     │
│     → 建议仅保留 Prettier                    [>]│
│  ...                                             │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ ⚡ Quick Actions                         │    │
│  │ [Run Full Scan] [Apply Safe Fixes]       │    │
│  │ [Export Report] [Undo Last Fix]          │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### 6.2 Status Bar 集成

```
┌──────────────────────────────────────────────┐
│  ...  ⚡72  Ln 12, Col 5  UTF-8  CRLF  ...   │
└──────────────────────────────────────────────┘
```

- V1.0 常态：显示最近一次手动扫描的 Turbo Score；未扫描时显示 `Turbo`
- V1.2+：在扩展变更或配置变更后提示重新扫描，可在用户允许时自动刷新摘要
- 异常时（分数低于 50）：闪烁警告 + tooltip 显示最严重问题
- 点击：打开 Dashboard

### 6.3 通知设计

- **扫描完成**：Info 通知 "Turbo Scan Complete — Score: 72. 8 issues found."
- **严重问题**：Warning 通知 "Turbo: 5 extensions activate on startup — this may slow down VS Code."
- **分数下降**：Warning 通知 "Turbo Score dropped from 78 to 65 after installing X. [Review]"
- **无问题**：静默（不打扰用户）

---

## 7. 性能诊断评分体系

### 7.1 启动健康分（权重 35%）

| 检查项 | 扣分规则 |
|--------|----------|
| 激活扩展总数 > 30 | 每多 1 个 -1 分 |
| `activationEvents: ["*"]` 扩展数 | 每个 -5 分 |
| `activationEvents: ["onStartupFinished"]` 扩展数 | 每个 -3 分 |

> **已移除**："扩展平均激活时间"指标——VS Code Extension API **不提供**以编程方式获取其他扩展启动耗时的公开接口（§11.25）。若未来 VS Code 开放相关 API，可在 V1.4+ 重新引入。替代方案：引导用户自行使用 `Developer: Startup Performance` 命令。

### 7.2 配置健康分（权重 35%）

| 检查项 | 扣分规则 |
|--------|----------|
| `files.watcherExclude` 缺少 node_modules | -10 分 |
| `files.watcherExclude` 缺少 .git | -5 分 |
| `files.watcherExclude` 缺少 dist/build | -3 分 |
| `search.exclude` 未配置 | -5 分 |
| `search.followSymlinks` = true | -3 分 |
| `editor.minimap.enabled` = true (低配设备) | -3 分 |
| `extensions.autoUpdate` = true | 不扣分，仅提示自动更新策略会影响稳定性与安全性的取舍 |

### 7.3 扩展清单健康分（权重 25%）

| 检查项 | 扣分规则 |
|--------|----------|
| 已知高消耗扩展已启用 | 每个 -8 分 |
| 功能已内置的扩展仍安装 | 每个 -3 分 |
| 存在轻量替代的扩展 | 不扣分，仅提示可选替代 |
| 检测到语言作用域重叠的同类扩展共存 | **不扣分**，标记为 ℹ️ 提示项 |

> "冗余共存"判定不依赖粗粒度分类，必须通过语言作用域过滤（§11.6）。预置"已知合理共存"白名单（如 ESLint + Prettier），白名单内组合不触发任何标记。

### 7.4 环境约束分（权重 5%）

| 检查项 | 触发动作 |
|--------|----------|
| Extension Host 进程 heapUsed > 200MB | -3 分，提示"扩展环境负载较高" |
| 可用 OS 内存 < 2GB | **不扣分**，自动启用"低配优化模式"（更激进的优化建议） |
| 可用 OS 内存 < 4GB | **不扣分**，提示"建议关注内存使用" |
| CPU 核心数 < 4 | **不扣分**，调整并发批处理大小 |

> 进程级指标（`process.memoryUsage()`）替代 OS 全局指标（`os.totalmem()`/`os.freemem()`）作为评分输入。OS 全局指标仅用于环境能力判断，不纳入评分。详细论证见 §11.2。

---

## 8. 关键边界条件与限制

### 8.1 技术限制

| 限制 | 影响 | 应对策略 |
|------|------|----------|
| **无法获取其他扩展的实时 CPU/内存** | 不能做到 per-extension 的实时资源监控 | 依赖 manifest 静态分析 + 已知扩展数据库 + 用户自查指引 |
| **无法直接测量扩展激活时间** | 不能精确量化每个扩展的启动影响 | 引导用户使用 `Developer: Startup Performance`；V1.0 不解析隐藏日志、不读取内部 IPC、不承诺自动导入 |
| **Extension Host 隔离** | 我们的扩展也消耗资源 | 轻量化设计，激活后即返回 idle |
| **settings.json 可能被手动修改** | 用户的配置修改可能与我们的优化冲突 | 差异回滚逐键比较，脏数据检测（§11.12） |
| **settings.json 是 JSONC 格式** | `JSON.parse()`/`JSON.stringify()` 会破坏注释和格式 | 100% 通过 VS Code Configuration API 读写，永不直接操作文件（§11.9） |
| **Remote / DevContainer 环境** | `process.memoryUsage()` 可能反映远程服务器而非本地 | `extensionKind: ["ui", "workspace"]` + 运行时 `vscode.env.remoteName` 检测（§11.11） |
| **Multi-root Workspace** | 存在 Workspace 和 WorkspaceFolder 两级配置作用域 | 自动检测多根工作区，默认写入 WorkspaceFolder（§11.10） |
| **扩展生命周期中间态** | 启动/热安装时扩展列表不完整 | V1.0 仅用户手动触发扫描，V1.2 增加稳定检测（§11.14） |
| **无法禁用/卸载其他扩展** | VS Code API 沙盒不暴露跨扩展生命周期控制 | 仅提供手动引导（打开扩展面板），永不编程化操作其他扩展（§11.29） |
| **VS Code Configuration API 无并发控制** | 无法实现乐观并发锁，极端场景下存在 TOCTOU 覆盖风险 | 写入后回读校验 + 缩小写入窗口 + 文档化限制（§11.31） |

### 8.2 安全约束

- 不读取用户代码内容；扫描仅使用扩展元数据、配置项、文件夹结构级别的排除规则和进程级指标
- 默认不上传任何数据到外部服务器；V1.0 完全离线运行
- V1.4 若引入遥测，必须满足：默认关闭、用户明确 opt-in、遵守 `vscode.env.isTelemetryEnabled`、提供 `telemetry.json` 字段清单、只上传匿名聚合指标、不得上传扩展列表原文/工作区路径/用户名/仓库名/文件名
- 配置修改前必须生成 Change Log，记录目标作用域、键是否原本存在、原值、新值和工作区标识
- Turbo 自动写入的修改必须可逆；外部并发修改导致的脏数据必须跳过自动回滚并提示用户手动处理
- 仅使用 VS Code 官方 API

### 8.3 我们的扩展自身性能要求

| 指标 | 目标 |
|------|------|
| 激活时间 | < 50ms |
| 空闲内存 | < 5MB |
| 扫描时峰值 CPU | < 5% |
| 包体积 | < 1MB |

---

## 9. 发布与迭代计划

### 9.1 里程碑

| 版本 | 内容 | 预计时间 |
|------|------|----------|
| **V0.1** | 核心扫描引擎 + 基础 Dashboard | Week 1-2 |
| **V0.2** | 扩展清单审计 + Core DB 离线知识库集成 | Week 3 |
| **V0.3** | Fix Engine + Apply Settings + Change Log 回滚 | Week 4 |
| **V0.4** | UI 完善 + Status Bar + 通知系统 | Week 5 |
| **V1.0 Release** | 全面的端到端测试 + Marketplace 发布 | Week 6 |
| V1.1 | 性能历史追踪 | Month 2 |
| V1.2 | 实时监控 + 可选 Extended DB 手动更新 | Month 3 |
| V1.3 | 团队模式 | Month 4 |

### 9.2 发布策略

- **Marketplace 发布**：`turbo-vscode`，publisher: `Evhye`
- **开源**：GitHub Public Repo，MIT License
- **定价**：免费（V1.0-V1.2），V1.3 起可选 Pro 功能

---

## 10. 开发规范

### 10.1 命名约定

| 层级 | 约定 | 示例 |
|------|------|------|
| 扩展 ID | `turbo-vscode` | — |
| 命令前缀 | `turbo.` | `turbo.runFullScan` |
| 配置前缀 | `turbo.` | `turbo.autoScanOnStartup` |
| 视图 ID | `turbo.` | `turbo.dashboard` |
| 命令类别 | `Turbo:` | `Turbo: Run Full Scan` |

### 10.2 项目结构

```
one-click-turbo/
├── package.json                   # 扩展 manifest (含 extensionKind: ["ui","workspace"])
├── src/
│   ├── extension.ts               # 入口：activate/deactivate
│   ├── commands/
│   │   ├── scan.ts                # 扫描命令（含防抖 + 锁）
│   │   ├── fix.ts                 # 修复命令（含 Change Log）
│   │   ├── audit.ts               # 审计命令
│   │   └── export.ts              # 导出命令
│   ├── engine/
│   │   ├── scan-engine.ts         # 扫描引擎核心（含稳定性校验）
│   │   ├── score-calculator.ts    # 评分计算器（含 Remote 环境自适应）
│   │   ├── redundancy-checker.ts  # 冗余检测（含语言作用域过滤 + 白名单）
│   │   └── config-reader.ts       # 配置读取（100% VS Code API，永不直接读文件）
│   ├── fix/
│   │   ├── settings-writer.ts     # 配置写入（Deep Merge + Scope 分辨）
│   │   ├── change-log-manager.ts  # Change Log 管理（替代全量快照）
│   │   ├── rollback.ts            # 配置回滚（逐键比较 + 脏数据检测）
│   │   └── git-tracker.ts         # Git 状态检测
│   ├── data/
│   │   ├── known-heavy-extensions.json.gz   # Core DB（gzip 压缩）
│   │   ├── lightweight-alternatives.json.gz
│   │   ├── optimal-defaults.json.gz
│   │   ├── redundancy-whitelist.json
│   │   └── extension-categories.json.gz
│   ├── ui/
│   │   ├── dashboard.ts           # Dashboard Webview
│   │   ├── tree-provider.ts       # Issues TreeView
│   │   └── status-bar.ts          # Status Bar
│   └── utils/
│       ├── async-lock.ts          # 异步互斥锁
│       ├── debounce.ts            # 防抖工具
│       ├── deep-merge.ts          # Deep Merge + User Wins
│       ├── context-detector.ts    # Remote/Multi-root/Profile 环境检测
│       ├── extension-parser.ts    # 用 jsonc-parser 解析扩展 manifest
│       ├── jsonc-reader.ts        # JSONC 安全读取（容错模式）
│       ├── html-escape.ts         # HTML 实体转义（XSS 防御）
│       ├── network-fetcher.ts     # 带代理支持 + 超时 + 降级的网络请求
│       └── profile-manager.ts     # Profile 检测与跨 Profile 数据过滤
├── test/
│   ├── unit/
│   └── integration/
└── docs/
    └── PRD.md
```

### 10.3 关键技术细节

#### extension.ts 入口设计

```typescript
export function activate(context: vscode.ExtensionContext) {
  // 1. 极轻量激活：<50ms
  // 2. 注册命令（惰性加载）
  // 3. 仅在用户主动触发时执行重型分析
  // 4. 注册 Status Bar
  // 5. 注册配置变更监听（V1.0 仅用于标记报告过期与回滚脏数据检测，不自动后台扫描）
  // 6. 初始化存储：确认 globalStorageUri 路径可用
}
```

#### 存储分层设计（§11.5）

```
context.globalState (Memento API — 轻量 K-V)
  ├── turbo.lastScanResult      // 最近一次扫描摘要（< 2KB）
  ├── turbo.lastUserChangeLog   // 最近一次 User 级配置修改记录（< 10KB）
  ├── turbo.userPreferences     // 用户偏好（通知开关、自动扫描等）
  └── turbo.coreDbVersion       // Core DB 版本号

context.workspaceState (Memento API — 工作区隔离 K-V)
  └── turbo.lastWorkspaceChangeLog // 最近一次 Workspace/WorkspaceFolder 级配置修改记录（< 10KB）

context.globalStorageUri (独立文件 — 手动管理)
  ├── history.json              // 扫描历史（最近 20 条，FIFO 淘汰，每条 < 5KB）
  └── extended-db-cache.json    // V1.2+ Extended DB 缓存（CDN 拉取后本地存储）
```

**容量保护规则：**
- 历史记录上限：20 条，超过则 FIFO 淘汰最旧记录
- 单条历史记录大小限制：5KB
- Change Log：User 与 Workspace 分别仅保留最近 1 份；每条记录必须包含 target、existedBefore、previousValue、newValue、workspaceId/folderUri
- 写入前检查：`JSON.stringify(data).length > 50000` → 拒绝写入 + warn 日志
- V1.1 的 Timeline 数据存入 `history.json`，不存入 globalState

#### 扫描引擎核心逻辑

```typescript
interface ScanResult {
  score: number;                    // 0-100
  grade: 'excellent' | 'good' | 'needs-attention' | 'critical';
  issues: PerformanceIssue[];       // 按严重程度排序
  stats: {
    totalExtensions: number;
    activeExtensions: number;
    alwaysOnExtensions: number;
    conflicts: number;
    optimizable: number;
  };
  timestamp: number;
}
```

#### 知识库匹配

```typescript
function matchKnownHeavy(extensionId: string): KnownHeavyExtension | null {
  // 精确匹配 vs 前缀匹配 vs 通配符匹配
  // 返回：该扩展的已知性能信息
}
```

---

## 11. 工程风险与应对方案

> 本章记录了对 V1.0 初始设计中 8 项关键技术与架构风险的详细分析及最终决策。每一项决策均已反映在前述章节的规格中。

---

### 11.1 I/O 阻塞与内存峰值风险

**风险**：在 Extension Host 单线程 Node.js 环境中，同步/密集地 `fs.readFileSync()` + `JSON.parse()` 50-100 个 `package.json` 会直接阻塞 Event Loop，导致扫描期间 VS Code UI 冻结。

**决策**：
1. **首轮扫描不读 package.json**。基于 `vscode.extensions.all` 的轻量元数据（id、isActive、extensionPath、`packageJSON.activationEvents` 等已加载字段）运行快速分析，快速出第一版结果。
2. **仅对命中"已知重扩展"规则的目标扩展按需深入读取**完整 `package.json`。
3. **受控异步读取 + 串行解析**：使用 `fs.promises.readFile()`，I/O 并发数不超过 4；若检测到慢 I/O（单文件 > 1s）自动降到 2。JSONC 解析按文件串行执行，每个文件完成后通过 `setImmediate()` 包装的 `yieldToEventLoop()` 主动让出执行权。
4. **缓存已解析结果**：首次读取后的 manifest 结果缓存在模块级 `Map<string, PackageJson>` 中，增量扫描只读新增/变更的扩展。

```typescript
// 核心实现模式
async function yieldToEventLoop(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

async function readInChunks<T>(
  items: T[], 
  chunkSize: number, 
  reader: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(reader));
    if (i + chunkSize < items.length) {
      await yieldToEventLoop();
    }
  }
}
```

---

### 11.2 系统资源监控 API 的局限性

**风险**：`os.totalmem()`/`os.freemem()`/`os.cpus()` 返回宿主机全局物理硬件状态，无法归因到 VS Code 进程。将其作为 Turbo Score 的 15% 权重缺乏因果关联——全局内存吃紧不一定是 VS Code 造成的。

**决策**：
1. **进程级指标替代全局指标**：使用 `process.memoryUsage().heapUsed` 和 `process.memoryUsage().rss` 作为 Extension Host 进程的实际内存指标。这些指标直接反映本扩展所处环境的资源压力。
2. **重新定义 OS 全局指标的角色**：`os.freemem()` 仅用于判断是否自动启用"低配优化模式"（更激进的默认建议），**不作为扣分输入**。
3. **降权**：该维度权重从 15% 降至 **5%**，名称从"系统资源分"改为"环境约束分"，仅作信息参考。
4. **增加自测量**：使用 `performance.now()` 打点测量扫描自身耗时。若扫描耗时 > 5s，说明扩展环境已是重度负载——这是比 OS 全局指标更直接的归因信号。

```typescript
// 替换后的 System Monitor 核心采集
interface HostEnvironmentMetrics {
  extensionHostHeapMB: number;      // process.memoryUsage().heapUsed
  extensionHostRssMB: number;       // process.memoryUsage().rss
  osFreeMemoryMB: number;           // 仅用于低配模式触发
  scanDurationMs: number;           // 扫描自身耗时（自测量）
}
```

---

### 11.3 配置更新的作用域缺失

**风险**：VS Code 配置系统分为 Default → User → Workspace → Workspace Folder 四层。原设计笼统地"写入 settings.json"，没有指定 Configuration Target，会导致：User 级污染用户全局习惯；Workspace 级污染 `.vscode/settings.json` 并引发 Git 变更，对团队未安装此插件的成员造成强侵入。

**决策**：
1. **每项配置明确定义推荐作用域**，遵循原则：
   | 配置特征 | → 推荐作用域 |
   |----------|-------------|
   | 与项目结构相关（watcher、search exclude） | `Workspace` |
   | 纯个人偏好（editor 渲染选项） | `User` |
   | 机器相关（文件内存上限） | `User` |
2. **用户在预览界面可逐项切换作用域**（User ↔ Workspace）。
3. **Git 提醒机制**：当目标为 Workspace 且检测到 `.vscode/settings.json` 被 Git 追踪时，弹出提醒并给出"切换到 User 级别"的选项。
4. **V1.2+**：引入 `.vscode/turbo.json` 作为团队共享优化配置的独立文件，避免污染 `settings.json`。

---

### 11.4 复杂对象的合并策略缺失

**风险**：`files.watcherExclude` 和 `search.exclude` 是 Object 类型配置，用户可能已配置了复杂的自定义正则或键值对。全量覆盖（Overwrite）会摧毁用户定制配置；深拷贝合并的方式如果不定义清楚，会产生歧义。

**决策**：**Deep Merge + User Wins**（用户的显式配置永远优先）。

```
Deep Merge 规则：
1. 遍历 Turbo 推荐默认值中的每个键
2. 若该键在用户当前配置中已存在 → 保留用户值（绝不覆盖）
3. 若该键在用户当前配置中不存在 → 填充推荐默认值
4. 若用户显式禁用了某键（如 "**/build/**": false）→ 保留 false
```

**变更预览差异化显示**：每行修改标注合并方式：
- `✅ 新增: **/node_modules/** → true（你尚未配置此项）`
- `⏭️ 跳过: **/build/** → 你已设置为 false，保留你的设置`
- `⚠️ 冲突: 需要手动决定（你的配置与推荐值不一致）`

---

### 11.5 globalState 存储上限与性能退化

**风险**：Memento API（globalState）底层是 JSON 文件存储（设计用于轻量 K-V 标记）。原设计计划将配置快照、历史扫描结果全部塞入 globalState，频繁写入大体量数据会导致读写变慢、触发配额错误。

**决策**：**存储分层**。

| 数据类型 | 存储位置 | 容量控制 |
|----------|----------|----------|
| 用户偏好（通知、自动扫描等） | `globalState` | 设计用途，允许 |
| 最近一次扫描摘要 | `globalState` | < 2KB |
| 最近一次 User 级 Change Log | `globalState` | < 10KB，仅保留 1 份 |
| 最近一次 Workspace / WorkspaceFolder 级 Change Log | `workspaceState` | < 10KB，仅保留 1 份，按工作区隔离 |
| 扫描历史 Timeline | `context.globalStorageUri` 下独立 `history.json` 文件 | 最多 20 条，FIFO 淘汰，每条 < 5KB |
| Extended DB 缓存（V1.2+） | `context.globalStorageUri` 下独立文件 | 用户手动更新；失败时降级 Core DB-only |

**写入保护**：任意时刻写入前检查 `JSON.stringify(data).length > 50000` → 拒绝写入 + `console.warn`。

---

### 11.6 冲突检测的伪逻辑

**风险**：仅靠分类（category）匹配判定"同类扩展冲突"。在真实多语言全栈项目中，同时启用不同语言的 Linter（如 ESLint 查 JS + 特定 Linter 查 C++）是合理场景。粗粒度分类匹配会产生大量误报，且原设计权重高达 25%。

**决策**：
1. **语言作用域过滤**：不仅检查分类是否相同，还必须验证 `activationEvents` 是否在相同语言文件类型上触发。不存在语言重叠的同类扩展不判定为冗余。
2. **从"冲突扣分"改为"共存提示"**：不扣分，仅标记为 ℹ️ 级别提示。
3. **白名单机制**：预置"已知合理共存"列表（如 ESLint + Prettier、Python + Pylance），白名单内的组合不触发任何标记。
4. **权重降低**：冲突检测贡献从 25% 中移除扣分，仅作为信息提示存在。

```typescript
interface RedundancyRule {
  extA: string;
  extB: string;
  categoryOverlap: boolean;      // 分类是否重叠
  languageOverlap: boolean;      // 语言作用域是否重叠（关键过滤条件）
  severity: 'info' | 'none';     // 仅 info，不扣分
}

// 预置白名单（永不标记的组合）
const WHITELISTED_PAIRS = [
  ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'],
  ['ms-python.python', 'ms-python.vscode-pylance'],
];
```

---

### 11.7 数据知识库的序列化与包体积膨胀

**风险**：静态 JSON 随 V1.x 迭代呈指数增长。庞大的关系型数据以静态文件打包会导致：(a) 插件安装体积突破 < 1MB 目标；(b) 激活时一次性加载进内存违背自身"空闲 < 5MB"要求。

**决策**：**V1.0 仅启用 Core DB；V1.2+ 才启用 Core/Extended 双层架构 + gzip 压缩 + 懒加载**。

```
Core DB (包内静态，gzip 预压缩)
├── 大小目标: < 5KB (压缩后)
├── 内容: Top 30 高消耗扩展画像 + 轻量替代映射 + 扩展分类索引
├── 格式: 轻量索引 (扩展ID → {category, riskLevel})
├── 构建时: gzip 预压缩为 .json.gz
└── 运行时: zlib.gunzipSync() 解压，仅加载索引

Extended DB (V1.2+，CDN 按需拉取)
├── 大小: 50-200KB
├── 内容: 300+ 扩展的完整性能画像、版本映射、社区注记
├── 拉取策略: 用户执行 `Turbo: Update Extended Database` 时下载，本地缓存至 globalStorageUri
├── 更新策略: 用户手动触发；若未来启用后台检查，必须遵守遥测/网络开关与企业代理策略
└── 内存管理: 使用完毕后将变量置 null，GC 回收
```

**使用流程**：V1.0 扫描时只加载 Core DB 索引（< 5KB）。V1.2+ 若存在有效 Extended DB 缓存，命中后需要展示详情时再查询单条记录；无缓存或校验失败时降级为 Core DB-only。

---

### 11.8 扩展并发状态的竞态条件

**风险**：用户点击"禁用扩展"时，被操作的扩展可能正处于后台大量计算、文件扫描或语言服务索引中。更关键的是，VS Code Extension API 不允许一个扩展编程化禁用、卸载或调用另一个扩展的 `deactivate` 生命周期。任何试图绕过标准 API 的方案都会变成不稳定的内部实现依赖。

**决策**：
1. **所有版本默认规则：不自动禁用扩展**。仅提供"一键跳转扩展面板"的快捷方式 + 详细操作指引，让用户在安全时机手动操作。
2. **V1.0 修复策略调整为"建议修改重扩展自身配置"**：对 GitLens 等重扩展，不改动其启用/禁用状态，而是通过其公开配置项降低性能影响（如 `"gitlens.codeLens.enabled": false`、`"gitlens.currentLine.enabled": false`）。这类操作必须出现在 Changes Preview 中，默认由用户逐项确认。
3. **禁止事项**：不得调用内部命令、修改 VS Code 扩展安装目录、编辑 `extensions.json` 私有状态文件、模拟 UI 点击、或通过 shell 命令禁用/卸载其他扩展。
4. **V1.2 仅增强手动引导**：打开扩展面板、预填搜索目标扩展 ID、展示禁用/重载步骤；全程不涉及编程化禁用。

---

### 11.9 JSONC 解析崩溃与注释/格式破坏

**风险**：
- VS Code 的 `settings.json` 原生支持 JSONC（允许 `//` 和 `/* */` 注释、尾随逗号）。若底层使用 Node.js 的 `JSON.parse()` 直接读取文件，遇到注释会抛出 `SyntaxError` 导致扩展崩溃。
- 更致命的是：若通过 `JSON.parse()` 读取 → 修改对象 → `JSON.stringify()` 写回，会**彻底抹除用户的所有手工注释**，并打乱键值对排序。对开发者工具而言这是不可原谅的体验灾难。

**决策：永远不直接 fs.readFile + JSON.parse settings.json，也永远不 JSON.stringify 写回。**

1. **读取全走 VS Code Configuration API**：`vscode.workspace.getConfiguration()` 内部已处理 JSONC 解析，返回纯净的配置值。我们的 Config Reader 模块**只调 API，不读文件**。

2. **写入全走 `Configuration.update()`**：VS Code 内部以保留注释的方式更新 JSONC 文件——它只修改目标键的值，不触碰注释、格式、或其他无关键。我们绝不手动序列化写回。

3. **Change Log 也走 API 语义**：写入前只记录"我们即将修改哪些键、目标作用域、该键是否原本存在、原值、新值"，存储为独立的结构化 JSON（User 级写入 `globalState`，Workspace/Folder 级写入 `workspaceState`，与 settings.json 物理隔离）。回滚时再次调用 `Configuration.update(key, originalValueOrUndefined, target)` 逐键恢复。

```typescript
// 正确做法：备份是逻辑快照，不是文件拷贝
interface ConfigBackupEntry {
  key: string;
  target: vscode.ConfigurationTarget;
  originalValue: unknown;
}

// 错误做法（禁止）：
// const raw = fs.readFileSync(settingsPath, 'utf-8');
// const obj = JSON.parse(raw);  // ← 注释会炸
// fs.writeFileSync(settingsPath, JSON.stringify(obj, null, 2));  // ← 注释全毁
```

4. **唯一需要直接读取文件的场景**——解析其他扩展的 `package.json`（读取 `activationEvents` 等字段）——使用 `jsonc-parser`（VS Code 自身使用的 JSONC 解析库），以容错模式解析，异常时静默跳过（`try/catch` + 继续下一个）。

```bash
npm install jsonc-parser  # VS Code 官方使用的 JSONC 解析器
```

---

### 11.10 Multi-root Workspace 的作用域坍塌

**风险**：原设计隐式假设一个工作区只有一个 `.vscode/settings.json`。在 Multi-root Workspace（通过 `.code-workspace` 文件组织多个独立仓库）中：
- `ConfigurationTarget.Global` → User Settings
- `ConfigurationTarget.Workspace` → `.code-workspace` 文件（全局工作区配置）
- `ConfigurationTarget.WorkspaceFolder` → 特定根文件夹的 `.vscode/settings.json`

若把本应写入 WorkspaceFolder 的 watcherExclude 错写入 Workspace（`.code-workspace`），会导致所有不相关的子项目文件监听被意外破坏。

**决策**：

1. **启动时检测工作区类型**：
```typescript
const isMultiRoot = vscode.workspace.workspaceFolders && 
                    vscode.workspace.workspaceFolders.length > 1;
```

2. **分级默认策略**：
   | 工作区类型 | watcherExclude/searchExclude 写入目标 |
   |-----------|-------------------------------------|
   | 单根工作区 (1 folder) | `Workspace`（即唯一的 `.vscode/settings.json`） |
   | Multi-root (2+ folders) | **`WorkspaceFolder`**（每个文件夹独立） |

3. **用户界面明确展示目标**：在 Changes Preview 中，对 Multi-root 场景展示：
   ```
   Workspace Folder: packages/frontend/
   ✅ 新增 files.watcherExclude (9 条)
   
   Workspace Folder: packages/backend/
   ✅ 新增 files.watcherExclude (9 条)
   ```

4. **对 `.code-workspace` 文件的修改需要额外确认**：当目标为 Workspace 级别且存在 `.code-workspace` 文件时，加粗提示："此操作将修改 .code-workspace 文件，影响所有子项目。"

5. **`vscode.workspace.onDidChangeWorkspaceFolders`** 事件监听：工作区文件夹增删时触发重新扫描，更新配置建议。

---

### 11.11 Remote / DevContainer 架构下的上下文割裂

**风险**：VS Code 的 Remote SSH、WSL、Dev Containers 采用 C/S 分离架构。若不显式声明 `extensionKind`，插件可能在远程 Extension Host 上运行。此时 `process.memoryUsage()` 抓取的是远程服务器（可能是 64 核 / 128GB）的状态，完全无法反映用户本地轻薄本渲染 UI 时的卡顿情况。对 Remote 和 Local 环境混为一谈会导致评分极度失真。

**决策**：

1. **声明 `extensionKind`** 在 `package.json` 中显式设置为 `["ui", "workspace"]`，优先在 UI 侧（本地）运行。V1.0 的进程级资源指标只代表 Turbo 所在 Extension Host，不代表远程 Workspace Extension Host。

```json
// package.json
{
  "extensionKind": ["ui", "workspace"]
}
```
> 此设置使扩展**优先在本地 UI 进程运行**。当 VS Code 连接到 Remote/DevContainer 时，`process.memoryUsage()` 通常反映本地 UI 端 Extension Host；远程端语言服务、远程文件监听和远程扩展的资源占用不纳入 V1.0 自动评分。

2. **运行时环境检测**：通过 `vscode.env.remoteName` 判断当前环境：
```typescript
interface RuntimeContext {
  isRemote: boolean;        // vscode.env.remoteName !== undefined
  remoteType: string | null; // 'ssh', 'wsl', 'dev-container', 'codespaces', null
  isLocal: boolean;          // remoteName === undefined
}
```

3. **评分策略调整**：当检测到 Remote 环境时，报告拆分为两个区域：
   - **Local UI Health**：展示 Turbo 所在 Extension Host 的进程级指标、UI 端扩展数量和本地渲染相关建议。
   - **Workspace Health**：展示工作区配置建议（如 `files.watcherExclude`、`search.exclude`），但明确标注远程 Extension Host 的 CPU/内存不可通过 V1.0 标准 API 测量。
   - Turbo Score 总分中环境约束分标记为"Remote Partial"，不因远程资源未知而扣分。

4. **磁盘 I/O 建议的环境自适应**：Remote 环境下，`files.watcherExclude` 与 `search.exclude` 仍按远程工作区配置给出建议；所有"本地磁盘速度/网络挂载"推断必须降级为提示，不进入评分。

---

### 11.12 状态回滚的"脏写/脏读"（Dirty Write in Rollback）

**风险**：原设计的 "Undo Last Fix" 基于线性假设——从快照回滚时，认为配置自上次 Turbo Fix 以来没有其他变更。但实际上用户可能手动修改了 settings.json，或其他扩展（如 Prettier 自动写入 `defaultFormatter`）也做了修改。直接用旧快照覆盖当前值会无声无息地抹杀这些"无关修改"。

**决策**：

1. **快照不存全量，存"我们改了什么"**。每次 Apply Fix 时，不是保存整个配置的快照（full snapshot），而是保存一个 **变更操作日志（Change Log）**：
```typescript
interface TurboChangeLog {
  timestamp: number;
  workspaceId: string;
  changes: Array<{
    key: string;                    // 如 "files.watcherExclude"
    target: ConfigurationTarget;    // User / Workspace / WorkspaceFolder
    existedBefore: boolean;         // 修改前该键是否存在于目标作用域
    previousValue?: unknown;        // 仅 existedBefore=true 时有意义
    newValue: unknown;              // 修改后的值
    workspaceFolderUri?: string;    // WorkspaceFolder 写入时必填
  }>;
}
```

2. **回滚时逐键比较**。执行 Undo 时，对每个 change：
   - 读取目标作用域的当前值（通过 `inspect(key)` 区分 Global / Workspace / WorkspaceFolder，而不是只用继承后的 `get(key)`）
   - 如果 `deepEqual(currentValue, change.newValue)` → 安全回滚（自我们修改后未发生变化）
   - 如果 `!deepEqual(currentValue, change.newValue)` → **拒绝回滚此键**，提示用户：
   ```
   ⚠️ files.watcherExclude 自上次 Turbo Fix 后被其他工具或手动修改过。
   当前值与你上次应用的值不一致。是否仍要回滚？[查看差异] [强制回滚] [跳过]
   ```

3. **Change Log 存储**：
   - User 级修改：存入 `globalState`，仅保留最近 1 次 User Change Log。
   - Workspace / WorkspaceFolder 级修改：存入 `workspaceState`，仅保留最近 1 次 Workspace Change Log。
   - 每次写入前检查大小（< 10KB），超限则拒绝写入并取消本次 Apply Fix。

4. **部分回滚支持**：用户可以选择仅回滚部分修改（如只回滚 watcher 配置，保留 editor 优化）。

---

### 11.13 并发状态下的竞态条件与锁缺失

**风险**：Extension Host 是单线程异步环境，但 `await` 暂停点仍然允许其他事件进入。如果用户连续快速点击多次 "Run Full Scan"，或扫描进行中时触发修复，没有互斥机制会导致：
- 多个扫描实例同时堆积对象 → 内存泄漏
- 多个实例竞争写入 settings.json → 配置损坏

**决策**：

1. **实现简单的异步锁（Async Mutex）**：
```typescript
class AsyncLock {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise(resolve => this.queue.push(resolve));
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }
}

// 所有扫描和修复操作必须获取锁
const scanLock = new AsyncLock();
const fixLock = new AsyncLock();
```

2. **操作互斥矩阵**：

   | 操作 A | 操作 B | 行为 |
   |--------|--------|------|
   | Scan 进行中 | 再次触发 Scan | 忽略第二次（防抖 5s），或排队等待 |
   | Scan 进行中 | 触发 Fix | 等待 Scan 完成后执行 |
   | Fix 进行中 | 触发 Scan | 等待 Fix 完成后执行 |
   | Fix 进行中 | 再次触发 Fix | 忽略（防抖） |

3. **命令级防抖**：
```typescript
const DEBOUNCE_MS = 3000;  // 3 秒内重复触发忽略
let lastScanTime = 0;

async function runScan() {
  const now = Date.now();
  if (now - lastScanTime < DEBOUNCE_MS) {
    vscode.window.showInformationMessage('Turbo: 扫描刚刚完成，请稍后再试。');
    return;
  }
  lastScanTime = now;
  await scanLock.acquire();
  try {
    // ... 执行扫描
  } finally {
    scanLock.release();
  }
}
```

4. **进度状态指示**：Status Bar 在扫描/修复进行中显示 `⚡↻ Scanning...`，完成后恢复分数。UI 上禁用重复触发按钮（Webview 中 button disabled）。

---

### 11.14 第三方扩展生命周期的时序陷阱

**风险**：`vscode.extensions.all` 在 VS Code 刚启动、或热安装/卸载扩展的瞬间，数据处于"中间态"——部分扩展尚未完成激活注册，部分扩展正在 `deactivate()` 过程中。若 Turbo 扫描触发时间恰好撞上这些生命周期节点，获取到的扩展列表和激活状态将是不完整的脏数据，导致诊断报告出现"漏报"（未检测到本该标记的问题扩展）或"误报"（标记了已卸载的扩展）。

**决策**：

1. **启动时延迟首扫**：扩展激活后不立即自动扫描。等待所有扩展完成激活：
```typescript
// 监听扩展变更完毕事件（VS Code 内置）
// 在 activate() 中注册，但首次扫描延迟到所有扩展稳定后

// 方案 A：监听 onDidChangeExtensions，连续 3 秒无变化后认为稳定
let stabilityTimer: NodeJS.Timeout | undefined;
vscode.extensions.onDidChange(() => {
  clearTimeout(stabilityTimer);
  stabilityTimer = setTimeout(() => {
    // 扩展列表已稳定，可以安全扫描
  }, 3000);
});

// 方案 B（V1.0 推荐）：首次扫描仅由用户手动触发，不自动执行。
// 用户触发时 VS Code 通常已完全初始化。
```

2. **扫描前做完整性校验**：
```typescript
function isExtensionDataStable(): boolean {
  const all = vscode.extensions.all;
  
  // 检查 1：是否有扩展处于 'activating' 中间态？
  // （VS Code API 不直接暴露此状态，但可以通过 isActive + 是否存在判断）
  
  // 检查 2：数量是否合理？
  // 如果扩展数量为 0 或 1，极可能是刚启动
  if (all.length <= 1) {
    return false;
  }
  
  // 检查 3：是否有已知的异常状态？
  // 任一扩展的 extensionPath 为空 → 处于卸载中间态
  const hasUnresolved = all.some(ext => !ext.extensionPath);
  return !hasUnresolved;
}
```

3. **增量更新而非全量重建**：`vscode.extensions.onDidChange` 事件触发时，仅对变更的扩展（新增/移除/激活状态变化）做增量分析，而非重新全量扫描。30 秒内多次触发的事件合并处理。

4. **V1.0 策略——用户触发而非自动**：V1.0 不实现自动后台扫描。所有扫描仅由用户主动执行命令触发。此时 VS Code 通常已完成初始化，扩展数据已稳定。自动扫描（含防抖和稳定性检查）推迟到 V1.2。

---

### 11.15 Webview 视图的 XSS 注入风险

**风险**：Dashboard 基于 Webview 渲染，数据来源包含第三方扩展的 `package.json`（名称、描述、发布者）。若恶意扩展在其 manifest 中写入 `<script>alert(1)</script>` 或恶意 DOM 属性（如 `onerror="..."`），而我们直接字符串拼接 HTML 且没有严格的 HTML 转义和 CSP，将导致 Webview 沦为 XSS 攻击载体。VS Code 官方对扩展上架审核中 Webview 的 CSP 检查极其严格——违规直接拒绝上架。

**决策**：

1. **强制 CSP**：Webview HTML 的 `<head>` 中硬编码最严格 CSP 策略，禁止所有外部资源和不安全的内联执行：

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               style-src 'unsafe-inline' ${webview.cspSource};
               script-src 'nonce-{NONCE}' ${webview.cspSource};
               img-src ${webview.cspSource} data:;
               font-src ${webview.cspSource};
               connect-src 'none';" />
```

2. **HTML 转义所有外部数据**：任何来自第三方扩展 `package.json` 的字符串（名称、描述、发布者）在注入 DOM 之前必须经过 HTML 实体转义：

```typescript
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

> 此函数覆盖了 OWASP XSS Prevention Cheat Sheet 要求的全部 5 个关键字符。

3. **模板渲染走安全路径**：Dashboard 不使用 `innerHTML` 字符串拼接，改用 Webview 的 `postMessage` 传递结构化数据（JSON），由前端以 `textContent` 或安全 DOM API 渲染：

```typescript
// 正确：数据用 postMessage 传递，前端安全渲染
webview.postMessage({
  type: 'renderIssues',
  issues: scanResult.issues  // 每项的 title/description 在 JS 侧已经过 escapeHtml
});

// 错误（禁止）：
// webview.html = `<div>${userControlledString}</div>`;  // ← XSS 直接注入
```

4. **只允许 Webview 本地资源**：所有本地资源必须通过 `webview.asWebviewUri()` 转换，CSP 使用 `${webview.cspSource}` 放行扩展内资源；`default-src 'none'` 阻止所有默认资源。不用任何 CDN 外链（如 Google Fonts、外部图标库）。

5. **Marketplace 上架前自检清单**：
   - [ ] Webview 中没有 `innerHTML` 直接拼接外部数据
   - [ ] CSP `<meta>` 标签是 `<head>` 的第一个子元素
   - [ ] 所有 `<script>` 标签带 `nonce` 属性
   - [ ] 无外部 CSS / JS / 字体引用
   - [ ] 第三方扩展名称中含 `<` `>` `&` 时不会破坏布局或执行代码

---

### 11.16 弱网、内网穿透与企业代理（Air-gapped）崩溃

**风险**：V1.2+ Extended DB 的可选 CDN 拉取在企业内网环境（Air-gapped）或需要 HTTP Proxy 的环境下，原生 `https.get()` 不走 VS Code 代理设置，请求会长时间 Pending 或抛出 `ECONNREFUSED` / `ETIMEDOUT`。若没有降级策略，手动更新流程可能卡死并影响用户对主扫描能力的信任。V1.0 不包含 CDN 拉取逻辑。

**决策**：

1. **代理自动适配**：读取 VS Code 的 `http.proxy` 配置，使用 `vscode.workspace.getConfiguration('http').get('proxy')` 获取代理地址。若设置了代理则通过 `https-proxy-agent` 发送请求。

```typescript
import { HttpsProxyAgent } from 'https-proxy-agent';

async function fetchExtendedDb(): Promise<Buffer | null> {
  const proxyUrl = vscode.workspace.getConfiguration('http').get<string>('proxy');
  const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
  
  // 使用 agent 发起请求...
}
```

2. **三阶降级策略**：

   | 阶段 | 行为 | 超时 |
   |------|------|------|
   | ① 尝试 CDN 拉取 | 用代理（如有）请求 Extended DB | 5s |
   | ② 尝试本地缓存 | 若 CDN 不可达，回退到上次缓存的 Extended DB | 即时 |
   | ③ 降级为 Core DB-only | 若无缓存，仅使用包内 Core DB（< 5KB），诊断报告中标注"Extended DB 离线——部分扩展详情不可用" | 即时 |

3. **超时与重试控制**：
```typescript
const FETCH_TIMEOUT_MS = 5000;  // 5 秒超时
const MAX_RETRIES = 1;          // 仅重试 1 次
// 失败后不反复重试——48h 内不再尝试（防止每次激活都卡 5s）
```

4. **离线环境静默降级**：CDN 拉取失败不弹窗、不打断用户操作。仅在 Dashboard 底部显示一条低优先级的 Info 提示：
   > ℹ️ Extended 扩展数据库离线（当前使用内置 Core DB）。[检查网络] [手动更新]

5. **手动更新入口**：提供 `Turbo: Update Extended Database` 命令，让用户在连通外网时手动触发更新。

---

### 11.17 Settings Profiles 切换导致的状态机错乱

**风险**：VS Code 的 Settings Profiles 功能允许用户在多个完整环境间一键切换。若 Change Log 存储在 globalState（VS Code 1.75+ 中已按 Profile 隔离），Profile A 下做的 Turbo Fix 和 Change Log 在切换到 Profile B 后不应可见。但 `globalStorageUri` 下的独立文件（`history.json`、`extended-db-cache.json`）**在某些 VS Code 版本中可能跨 Profile 共享**，导致 Profile A 的扫描历史出现在 Profile B 的 Dashboard 中。更深层的风险：若 Change Log 存储的是 workspaceState（workspaceState 不随 Profile 变化），回滚操作可能将错误的旧值应用到当前 Profile。

**决策**：

1. **Change Log 存储分级校验**：
   - `globalState` 中的数据天然按 Profile 隔离（VS Code 1.75+），无需额外处理。
   - 对存储在 `globalStorageUri` 下的数据，写入时附加 `profileId` 标记，读取时校验。

```typescript
interface StoredHistoryEntry {
  profileId: string;       // 写入时记录的 Profile ID
  workspaceFolders: string[]; // 写入时的工作区路径
  // ... 扫描数据
}

function getCurrentProfileId(): string {
  // VS Code 不直接暴露 Profile ID，使用工作区+扩展状态的组合哈希
  return `${vscode.env.appName}-${vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath).join(',') || 'empty'}`;
}
```

2. **跨 Profile 数据过滤**：读取 `history.json` 时，过滤掉 `profileId` 与当前不匹配的条目——它们属于其他 Profile，不应出现在当前 Dashboard 中。

3. **Undo 操作增加 Profile 一致性质询**：
   ```
   此 Change Log 产生于另一配置环境（Profile: "Work"）。
   当前环境可能不同的 settings.json。是否仍要回滚？
   [仅回滚当前 Profile 的变更] [取消]
   ```

4. **WorkspaceState 仅存 Workspace 绑定数据**：`workspaceState` 可存储 Workspace / WorkspaceFolder 级 Change Log，但每条记录必须同时包含 `workspaceId`、`profileKey` 和 `workspaceFolderUri`。Undo 时三者任一不匹配，则只允许查看差异，不自动回滚。

---

### 11.18 扩展卸载后的"配置残留"孤儿现象

**风险**：VS Code 没有扩展卸载钩子——用户点击"卸载"时，我们没有任何代码可以执行清理。结果：
- 写入 settings.json 的优化配置永久保留（即使用户不再需要）
- `globalState` 中的偏好和备份残留
- `globalStorageUri` 下的历史文件和缓存沦为磁盘垃圾
- 用户可能完全不知道这些残留存在，发现后产生强烈负面情绪

**决策**：

1. **提供 `Turbo: Purge & Prepare for Uninstall` 命令**（V1.0 即包含）：
   - 列出 Turbo 对 settings.json 做过的所有修改（从 Change Log 中读取）
   - 逐项询问用户是否恢复默认值：`是否将 files.watcherExclude 恢复为修改前的值？`
   - 清除 `globalState` 下所有以 `turbo.` 为前缀的键
   - 删除 `globalStorageUri` 下的所有 Turbo 文件（`history.json`、`extended-db-cache.json`）
   - 显示摘要："已清理 Turbo 的所有数据。你现在可以安全卸载扩展。"

2. **文档化残留行为**：在 Marketplace 页面、README 和 Dashboard 中明确告知：
   > ℹ️ VS Code 扩展卸载时不会自动清理配置。请在使用卸载前运行 `Turbo: Purge & Prepare for Uninstall` 命令。

3. **Dashboard 底部常驻"清理入口"**：一个低视觉优先级的链接：
   > [准备卸载 Turbo？先运行清理向导 →]

4. **永不修改的配置不标记残留**：如果一个配置项（如 `editor.minimap.enabled`）在 Turbo 介入前用户已设置为 `false`，Turbo 的"优化"没有改变它，则不标记为 Turbo 的修改——Purge 时不会动它。

5. **检测扩展即将被卸载的信号**：虽然 VS Code 没有 Uninstall Hook，但可以通过监听 `vscode.extensions.onDidChange` 检测 Turbo 自身是否被标记为禁用——当检测到自身被禁用时（`turbo-vscode` 从 `extensions.all` 中消失或 `isActive === false`），这通常是卸载的前兆。此时触发最后一次提醒（但这是尽力而为，可能不被触发）。

---

### 11.19 语言特定配置（Language-Specific Settings）的盲区

**风险**：VS Code 支持 `"[javascript]": { "editor.formatOnSave": true }` 等语言级别重写。我们的配置读取/写入逻辑若仅调用 `getConfiguration().get(key)` 而不调用 `inspect(key)`，会完全忽略这些语言特定嵌套配置。例如用户将 `editor.minimap.enabled` 写在了 `"[python]"` 作用域下——我们的工具可能误判为"未优化"并写入全局默认，产生意料之外的覆盖。

**决策**：

1. **读取时统一用 `inspect()` 替代 `get()`**：`Configuration.inspect(key)` 返回该键在所有层级的值（default / user / workspace / workspaceFolder / language-specific），完整揭示配置来源。

```typescript
const inspected = vscode.workspace.getConfiguration().inspect('editor.minimap.enabled');
// Returns:
// {
//   key: 'editor.minimap.enabled',
//   defaultValue: true,
//   globalValue: false,             // User settings
//   workspaceValue: undefined,      // Workspace settings
//   workspaceFolderValue: undefined,// Workspace Folder settings
//   globalLanguageValue: false,     // e.g. "[python]": { "editor.minimap.enabled": false }
//   workspaceLanguageValue: undefined,
//   workspaceFolderLanguageValue: undefined,
// }
```

2. **诊断报告中标注语言特定配置**：当检测到配置来自语言特定作用域时，在报告中展示来源：
   > ℹ️ `editor.minimap.enabled` 已在 `[python]` 语言作用域中设置为 `false`，不会修改此项。

3. **写入策略——永不触碰语言特定配置**：我们写入时只使用明确的 `ConfigurationTarget.Global` 或 `ConfigurationTarget.Workspace`，绝不通过 `update()` 写入语言特定作用域。若用户确实通过语言作用域覆盖了某些设置，我们**保留原样、不做改动、仅在报告中告知**。

4. **检查项中对语言作用域配置做特别标记**：例如若全局 `editor.minimap.enabled` 为 `true`，但 `[python]` 下为 `false`，我们的建议变为：
   > ℹ️ `editor.minimap.enabled` 在全局为 `true`（建议关闭），但在 `[python]` 中已关闭。

---

### 11.20 Array 类型配置的合并策略

**风险**：PRD 定义的 Deep Merge + User Wins 策略仅适用于 Object 类型。若未来涉及 Array 类型配置项（如 `editor.codeActionsOnSave`、`files.associations` 等），没有定义行为：追加？前置？去重覆盖？

**决策**：

1. **V1.0 不自动修改任何 Array 类型配置**。阵列型配置通常高度个人化（如 `editor.codeActionsOnSave` 的顺序），盲目修改极易破坏用户工作流。

2. **仅做存在性检查 + 建议**：
   - 若推荐配置清单中包含某 Array 类型项，仅检查用户是否已配置类似功能
   - 不做自动写入，仅生成建议提示

3. **未来若必须修改 Array，采用"追加 + 去重"策略**：
```typescript
function mergeArray(userArr: unknown[], recommended: unknown[]): unknown[] {
  const merged = [...userArr];
  for (const item of recommended) {
    if (!merged.some(existing => deepEqual(existing, item))) {
      merged.push(item);
    }
  }
  return merged;
}
```

4. **Change Log 中对 Array 修改做特殊标记**——回滚时恢复为修改前的完整 Array 引用。

---

### 11.21 回滚时的"作用域穿透阴影"（Scope Shadowing）

**风险**：Change Log 记录了 `previousValue`。若修改前 Workspace 级别**没有设置**某键（值来自 User 级别的继承），回滚的预期行为是**删除该键**（让 User 级别的值重新穿透生效）。但若工具在回滚时粗暴地将从 `inspect()` 看到的继承值硬编码写回 Workspace 级别——配置穿透被永久阻断，造成"回滚后配置看起来一样但语义已经不同"的隐蔽 bug。

**决策**：

1. **Change Log 记录"键是否在修改前存在于目标作用域"**（而非仅记录值）：

```typescript
interface ChangeLogEntry {
  key: string;
  target: vscode.ConfigurationTarget;
  existedBefore: boolean;     // ← 关键字段
  previousValue: unknown;     // 仅当 existedBefore === true 时有意义
  newValue: unknown;
}
```

2. **回滚逻辑分路径**：
```typescript
async function rollback(entry: ChangeLogEntry): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  if (entry.existedBefore) {
    // 修改前该键就存在 → 恢复原值
    await config.update(entry.key, entry.previousValue, entry.target);
  } else {
    // 修改前该键不存在 → 删除该键，让下层值恢复穿透
    await config.update(entry.key, undefined, entry.target);
  }
}
```

3. **回滚前二次确认**：展示"此操作将从 Workspace 级别删除该键，User 级别的值（xxx）将重新生效。"

---

### 11.22 应用锁无法防御的外部文件系统突变

**风险**：AsyncLock 保护的是我们内部 Scan/Fix 操作不互相竞争。但 `Configuration.update()` 是异步操作且底层涉及文件系统写入。在获取锁并等待写入完成的间隙，用户可能手动修改了 `settings.json` 或执行了 `git pull`——此时我们内存中的 Change Log 快照与实际物理文件已产生致命偏差。

**决策**：

1. **写入前做 Pre-Write 校验**：在调用 `update()` 前重新读取该键的当前值，与 Change Log 中记录的 `previousValue` 比对。若不一致，说明外部已修改：
   ```
   ⚠️ 检测到配置已被外部修改（可能是手动编辑或 Git 操作）。
   Turbo 将跳过此项修改以避免冲突。请手动检查后重试。
   ```

2. **注册 `vscode.workspace.onDidChangeConfiguration` 监听器**：任何外部配置变更（无论来源）触发事件。在 Apply Fix 流程进行中收到此事件 → 标记 `externalChangeDetected = true` → 全部写入完成后弹出警告提示。

3. **Change Log 失效标记**：当检测到外部变更时，受影响的 Change Log 条目标记为 `stale = true`。Undo 时对这些条目跳过自动回滚，提示用户手动处理。

---

### 11.23 多根工作区动态变更导致回滚指针悬空

**风险**：用户可以在 VS Code 中随时动态移除某个 WorkspaceFolder。若 Change Log 记录了对该 Folder 的写入（`target = ConfigurationTarget.WorkspaceFolder`），用户移除该 Folder 后执行 Undo——引用变为悬空指针，`Configuration.update()` 抛出异常。

**决策**：

1. **Change Log 中为 WorkspaceFolder 条目记录其 URI**：
```typescript
interface ChangeLogEntry {
  // ...
  workspaceFolderUri?: string;  // 仅 target === WorkspaceFolder 时记录
}
```

2. **回滚前校验 Folder 是否仍存在**：
```typescript
function isFolderStillPresent(uri: string): boolean {
  return vscode.workspace.workspaceFolders?.some(f => f.uri.toString() === uri) ?? false;
}
```

3. **Folder 消失时的回滚策略**：
   - 若 Folder 已移除且该 Folder 是当时修改的**唯一目标** → 提示用户："该工作区文件夹已不存在，无需回滚。"
   - 若 Folder 已移除但该配置也写入了 Workspace 或 User → 回退到较高层级的写入目标进行回滚
   - 不崩溃，不阻塞其他 Change Log 条目的回滚操作

4. **增量删除建议**：检测到 Change Log 中包含悬空 Folder 条目时，在 Dashboard 中提示"检测到已移除的工作区文件夹的残留配置记录。是否清理？"

---

### 11.24 V8 GC 非确定性导致的内存测量污染

**风险**：`process.memoryUsage().heapUsed` 在共享的 Extension Host 进程中受 V8 GC 非确定性影响。若另一个重型扩展（如 C++ IntelliSense）释放了大量对象但 GC 尚未触发，此时 Turbo 扫描到的 heapUsed 会错误地偏高。反之，若 GC 恰好在 Turbo 扫描前触发，heapUsed 偏低——导致评分系统出现随机抖动。

**决策**：

1. **多次采样取中位数**（而非单次读取）：
```typescript
function measureHeapStable(samples = 3, intervalMs = 500): number {
  const readings: number[] = [];
  for (let i = 0; i < samples; i++) {
    // 强制触发一次 GC（如果可用）
    if (global.gc) { global.gc(); }
    readings.push(process.memoryUsage().heapUsed);
    if (i < samples - 1) await sleep(intervalMs);
  }
  readings.sort((a, b) => a - b);
  return readings[Math.floor(readings.length / 2)]; // 中位数
}
```

2. **评分中使用滑动窗口**：V1.1 Timeline 中记录最近 3 次扫描的中位数 heapUsed，取平均值作为评分输入。

3. **文档化不确定性**：诊断报告中标注：
   > ℹ️ 内存数据基于 Extension Host 进程的 V8 堆快照，受 GC 时机影响存在 ±15% 波动。Turbo 使用多次采样中位数以降低噪声。

4. **降低内存指标在评分中的直接影响**：环境约束分权重已仅 5%，heapUsed > 200MB 仅触发提示（-3 分），不做过重惩罚。

---

### 11.25 无法通过标准 API 获取的扩展激活时间

**风险**：PRD 早期草案曾计划使用"扩展平均激活时间（来自 Startup Performance）"作为扣分项。但 VS Code Extension API **不提供**以编程方式读取其他扩展启动耗时的公开接口。若依赖解析本地隐藏的 telemetry 日志或 IPC hack 手段，将在 VS Code 小版本更新中随时失效。

**决策**：

1. **从评分体系中移除"扩展激活时间"的扣分权重**。这是无法可靠获取的数据。

2. **替换为可编程获取的代理指标**：
   - **`activationEvents: ["*"]` 的扩展数**（每个 -5 分）——可直接从 manifest 读取
   - **`activationEvents: ["onStartupFinished"]` 的扩展数**（每个 -3 分）——可直接从 manifest 读取
   - **已知高消耗扩展已启用**——通过 Core DB 交叉比对

3. **若未来 VS Code 开放了相关 API（如 `vscode.extensions.getActivationTimes()`），可在 V1.4+ 重新引入**。

4. **引导用户自行查看**（非强制）：Dashboard 中显示快捷方式：
   > 使用 `Developer: Startup Performance` 查看精确激活时间 [执行命令]

---

### 11.26 网络挂载磁盘带来的 I/O 级联阻塞

**风险**：即使用了分批异步读取，若用户的 `~/.vscode/extensions` 或项目挂载在高延迟网络驱动器（SMB/NFS/SSHFS）上，底层 `fs.promises.readFile` 会耗尽 Node.js Libuv 默认 4 线程的线程池，导致整个 Extension Host 的所有 I/O 瘫痪——包括其他扩展的文件监听和语言服务。

**决策**：

1. **单个文件读取超时控制**：
```typescript
async function readFileWithTimeout(path: string, timeoutMs = 2000): Promise<Buffer | null> {
  try {
    return await Promise.race([
      fs.promises.readFile(path),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('READ_TIMEOUT')), timeoutMs)
      ),
    ]);
  } catch (e: any) {
    if (e.message === 'READ_TIMEOUT') {
      console.warn(`[Turbo] I/O timeout: ${path} (skipped)`);
      return null;
    }
    throw e;
  }
}
```

2. **线程池保护**：将手动触发的批量读取并发数从 8 降到 **4**，避免占满线程池。若检测到慢 I/O（单个文件 > 1s），自动进一步降到 **2**。

3. **网络驱动器检测与警告**：
```typescript
// 粗略检测：读取文件速度低于 5MB/s（对本地 NVMe 这是极慢的）
// 若检测到慢速路径，弹出一次性提示：
"I/O 性能偏低（检测到网络驱动器？）。Turbo 扫描可能比预期慢。"
```

4. **降级模式**：若累积 I/O 超时超过 3 个文件，自动切换为"轻量扫描"——跳过所有 `package.json` 深读，仅基于 Core DB 索引出结果，标注"Light Scan (I/O constrained)"。

---

### 11.27 CDN 缓存投毒 / 脏数据崩溃链

**风险**：Extended DB 从 CDN 拉取后存入本地缓存。若 CDN 节点返回截断的 JSON、恶意内容、或格式不兼容的新版本 Schema，`JSON.parse` 报错 → 若没有校验和机制，错误数据会被持久化到 `globalStorageUri` → 后续每次启动都重复读取脏数据 → 崩溃循环。

**决策**：

1. **结构校验 + 版本字段**：
```typescript
interface ExtendedDbEnvelope {
  version: number;              // Schema 版本（向后兼容检查）
  checksum: string;             // SHA-256 of JSON payload
  payload: ExtendedDatabase;    // 实际数据
  generatedAt: string;          // ISO 8601
}

async function validateExtendedDb(data: Buffer): Promise<ExtendedDatabase | null> {
  let envelope: ExtendedDbEnvelope;
  try {
    envelope = JSON.parse(data.toString('utf-8'));
  } catch {
    return null; // JSON 解析失败 → 拒绝
  }

  // 结构校验
  if (!envelope.version || !envelope.checksum || !envelope.payload) {
    return null; // 缺少必需字段 → 拒绝
  }

  // 版本兼容性检查
  if (envelope.version < MIN_SUPPORTED_VERSION || envelope.version > MAX_SUPPORTED_VERSION) {
    return null; // 版本不兼容 → 拒绝
  }

  // 校验和验证
  const computed = crypto.createHash('sha256')
    .update(JSON.stringify(envelope.payload)).digest('hex');
  if (computed !== envelope.checksum) {
    return null; // 校验和不匹配 → 拒绝
  }

  return envelope.payload;
}
```

2. **缓存失败自愈流程**：
   ```
   ① 尝试读取本地缓存
   ② 校验失败？→ 删除缓存文件
   ③ 尝试 CDN 拉取
   ④ 拉取成功 + 校验通过？→ 写入新缓存
   ⑤ 拉取失败/校验失败？→ 降级为 Core DB-only（不写入缓存）
   ```

3. **永不覆盖缓存直至新数据通过全量校验**：先写入临时文件（`.tmp`），校验通过后 `rename`（原子操作）替换旧缓存。

---

### 11.28 卸载残留机制的"死角"——被动清理

**风险**：`Turbo: Purge` 命令需要用户在卸载前主动执行。若用户直接从 Marketplace 点击"卸载"，没有机制能拦截——Purge 没有机会执行，settings.json 修改和存储文件全部残留。

**决策**：

1. **README 和 Marketplace 页面的首行警告**：
   > ⚠️ **卸载前请先运行 `Turbo: Purge & Prepare for Uninstall` 命令以清理配置。** VS Code 不支持扩展卸载钩子，直接卸载将导致配置残留。

2. **自愈式启动检测**：每次激活时，检测是否可能存在"前一次安装的孤儿数据"：
   - 若 `globalState` 中存在 Turbo 数据，但 `vscode.extensions.all` 中没有 Turbo → 不可能发生（我们正在运行）
   - **实际可行的检测**：若 `globalStorageUri` 下存在 `history.json` 但 `globalState` 中没有 Turbo 偏好 → 说明这是一次"全清后的重新安装"或"数据异常"，弹出：
   ```
   🔍 Turbo 检测到上次安装的残留数据。
   [清理并重新开始] [保留历史数据]
   ```

3. **周期性提醒清理**：每 30 个自然日使用一次扫描后，在 Dashboard 底部提示：
   > 💡 如果不再需要 Turbo，请运行 `Turbo: Purge & Prepare for Uninstall` 以清理所有配置。

4. **提供 offline 清理脚本**：在扩展的 `extensionPath` 下放置一个 `cleanup.sh` / `cleanup.ps1` 脚本，用户可以手动运行以清理 globalStorageUri 下的文件——即使扩展已被卸载（因为 globalStorageUri 路径固定）。

---

### 11.29 "安全禁用流程"的 API 可行性质疑——已修正为不可能

**风险发现**：PRD 早期草案曾设想 V1.2 实现一个"安全禁用流程"，包括"触发目标扩展的 deactivate"。经核实，**VS Code Extension API 的沙盒模型根本不暴露让一个扩展以编程方式调用另一个扩展 `deactivate` 生命周期或强制卸载/禁用另一个扩展的公共接口**。这一设想在当前底层架构下无法实现。

**决策**：

1. **从 PRD 中删除 V1.2 "安全扩展禁用流程"**。§4.2 中相关内容已修改为仅描述手动引导方式。

2. **V1.2 替代方案——增强的手动引导**：
   - Dashboard 中对每个"建议禁用"的扩展提供 **[打开扩展面板]** 按钮（调用 `vscode.commands.executeCommand('workbench.extensions.action.showExtensions')`）
   - 预搜索目标扩展 ID，用户点击后直接定位到该扩展
   - 附带分步指引："① 点击扩展旁的齿轮图标 → ② 选择'禁用(工作区)' → ③ 重载窗口"
   - **全程不涉及编程化禁用**，仅提供导航和指导

3. **重扩展自身配置调整才是可行方案**（§11.8 中已定义）：对 GitLens 等重扩展不改变启用/禁用状态，而是通过其自身配置降低性能影响（如 `"gitlens.codeLens.enabled": false`），这通过 `Configuration.update()` 完全可行。

4. **文档化 API 限制**：§8.1 技术限制表补充此项。

---

### 11.30 Git 追踪状态检测——从黑盒到三阶实现

**风险**：PRD §3.4.3 提及"检测 .vscode/settings.json 被 Git 追踪"，但未说明实现方式。几种方案各有致命问题：
- `child_process.exec('git ls-files')` → 性能开销 + 跨平台路径转义 + Git 环境未安装时崩溃
- VS Code 内置 Git 扩展 API (`vscode.git`) → 高耦合度 + 初始化时序问题（Git 扩展可能尚未激活）

**决策**：采用**三阶降级检测**，按可靠性从高到低尝试：

**Tier 1 — 文件系统启发式（零依赖，最快）**：
```typescript
function isLikelyGitTracked(workspaceUri: vscode.Uri): boolean {
  // 检测工作区根目录或其祖先目录中是否存在 .git 目录
  let dir = workspaceUri.fsPath;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return true; // 找到 .git → 该文件可能被追踪
    }
    dir = path.dirname(dir);
  }
  return false;
}
```
> 这是启发式方法——存在 `.git` 不保证 `settings.json` 被追踪，但它是"保守预警"策略：宁可误提示，不可漏过。

**Tier 2 — VS Code 内置 Git API（可靠但依赖时序）**：
```typescript
async function isGitTrackedByVSCode(uri: vscode.Uri): Promise<boolean | null> {
  try {
    const gitExt = vscode.extensions.getExtension('vscode.git');
    if (!gitExt || !gitExt.isActive) return null; // Git 扩展未激活 → 不可用
    const gitApi = gitExt.exports.getAPI(1);
    const repo = gitApi.getRepository(uri);
    if (!repo) return null;
    // 检查文件是否在 Git index 中
    const status = repo.state.workingTreeChanges.find(
      (c: any) => c.uri.fsPath === uri.fsPath
    );
    // 注意：此 API 只显示"已变更"的文件。对于未修改的已追踪文件，需要其他手段。
    // 此处仅作为补充检测。
    return null; // API 能力有限，不做最终判断
  } catch {
    return null; // 任何异常 → 回退
  }
}
```

**Tier 3 — 默认保守策略**：
若 Tier 1 和 Tier 2 都无法确定 → **默认假设 .vscode/settings.json 可能被 Git 追踪**（保守），弹出提示：
> ℹ️ 检测到工作区包含 `.git` 目录。写入 `.vscode/settings.json` 的更改可能被提交到仓库。[切换到 User 级别] [仍然写入]

**实际操作流程**：
1. 读 `files.watcherExclude` 的写入目标
2. 若目标为 Workspace → 调用 `isLikelyGitTracked()`（Tier 1，同步，零开销）
3. 若返回 `true` → 弹出 Git 追踪提醒
4. 若返回 `false` → 不提醒（无 `.git` 目录的生产环境罕见）

---

### 11.31 配置更新的 TOCTOU 竞态

**风险**：Pre-Write 校验通过（检查值未被外部修改）到 `Configuration.update()` 真正落盘的几毫秒 I/O 间隙内，其他高频写入扩展（Prettier、GitLens）可能修改同一节点，导致 Turbo 的旧合并结果覆盖其他扩展刚刚写入的数据。

**决策**：此问题是 VS Code Configuration API 的根本限制——它不支持乐观并发控制（无 ETag、无版本号、无 CAS 操作）。**无法完美解决**，只能通过多层防御降低风险：

1. **写入后回读校验**：
```typescript
async function safeUpdate(key: string, value: unknown, target: ConfigurationTarget) {
  await config.update(key, value, target);
  // 回读校验
  await new Promise(r => setTimeout(r, 100)); // 等待 I/O 落盘
  const actual = config.inspect(key);
  const writtenValue = target === ConfigurationTarget.Global
    ? actual?.globalValue
    : actual?.workspaceValue;
  
  if (!deepEqual(writtenValue, value)) {
    console.warn(`[Turbo] Post-write verification failed for ${key}. ` +
      `Expected ${JSON.stringify(value)}, got ${JSON.stringify(writtenValue)}. ` +
      `Another extension may have modified this key concurrently.`);
    // 不重试——重试可能引发更严重的竞争
    // 仅记录警告，下次扫描时会在报告中标注差异
  }
}
```

2. **缩小写入窗口**：对每个配置键执行独立的 `update()` 调用（而非批量），降低单次冲突影响面。每个键的写入窗口约 10-50ms，相比数十个键在一次事务中写入，并发冲突概率降低一个数量级。

3. **明确文档化此限制**：§8.1 技术限制表新增：
   > VS Code Configuration API 不支持乐观并发控制。在高频写入场景下（多个扩展同时修改同一配置），Turbo 的写入可能被覆盖。建议在无其他扩展活跃修改配置时使用 Apply Fix。

---

### 11.32 全局 Change Log 与局部 Workspace 的作用域错位

**风险**：如果 Change Log 不按作用域隔离存储，用户在工作区 A 应用修复（修改了工作区 A 的 `watcherExclude`），随后切换到工作区 B 并点击 "Undo Last Fix"，全局共享的 Change Log 会尝试将工作区 A 的修改回滚到无关的工作区 B——造成灾难性配置污染。

**决策**：

1. **Change Log 按 workspace 隔离存储**：
   - 修改了 Workspace / WorkspaceFolder 级配置 → Change Log 存入 **`workspaceState`**（天然按工作区隔离）
   - 修改了 User 级配置 → Change Log 存入 **`globalState`**（User 级配置本身是全局的，所以 Change Log 全局共享合理）

2. **每条 Change Log 记录 `workspaceId`**：
```typescript
interface ChangeLogEntry {
  // ...
  workspaceId: string;  // vscode.workspace.workspaceFile?.fsPath ?? 'untitled'
}
```

3. **Undo 时校验工作区一致性**：
```typescript
async function undoLastFix() {
  const currentWorkspaceId = getCurrentWorkspaceId();
  const log = context.workspaceState.get<ChangeLog>('turbo.lastChangeLog')
           ?? context.globalState.get<ChangeLog>('turbo.lastChangeLog');
  
  if (!log) { /* 无可回滚操作 */ return; }
  
  if (log.workspaceId !== currentWorkspaceId) {
    vscode.window.showWarningMessage(
      `此 Change Log 产生于工作区 "${log.workspaceId}"，与当前工作区不同。` +
      `[仅回滚 User 级别的变更] [取消]`,
    );
    // 仅处理 log.entries 中 target === Global 的条目
  }
  // ...
}
```

4. **存储策略**：
   | 变更类型 | 存储位置 | 隔离性 |
   |----------|----------|--------|
   | User 级修改 | `globalState` | 全局（合理——User 配置本身跨工作区） |
   | Workspace 级修改 | `workspaceState` | 按工作区隔离 |
   | WorkspaceFolder 级修改 | `workspaceState`（附 folderUri） | 按工作区隔离 |

---

### 11.33 性能诊断的"测不准"——自我污染

**风险**：§11.24 试图用多次采样消除 GC 波动，但忽略了最大污染源——Turbo 自身。分批异步读取数十个 `package.json` 并将其载入模块级 `Map<string, PackageJson>` 缓存的行为，本身就会推高 heapUsed——此时读取到的内存已是自我污染的峰值，导致健康环境被误判为"负载过高"。

**决策**：

1. **空闲基线优先**：在 Turbo 激活时（`activate()` 结束，此时尚未执行任何扫描）立即采集一次**空闲基线**，缓存为 `baselineHeapUsed`。所有后续评分以增量（delta）为参考，而非绝对值。

```typescript
// extension.ts activate() 末尾
const BASELINE_HEAP = measureHeapStable(3, 500);  // activate 刚完成，Turbo 自身已就绪但未扫描
await context.globalState.update('turbo.baselineHeap', BASELINE_HEAP);
```

2. **扫描后释放 + 重新测量**：扫描完成后立即执行：
   - 清理模块级缓存（`manifestCache.clear()`）
   - 触发 `global.gc()`（若可用）
   - 等待 1s → 重新测量 heapUsed
   - 评分使用 min(baseline, postScan) 作为参考

3. **从内存评分中减去自身开销**：
```
adjustedHeap = currentHeap - BASELINE_HEAP
// BASELINE_HEAP 包含了 Turbo 自身空闲时的内存占用（~2-5MB）
// adjustedHeap 近似反映其他扩展的额外内存压力
```

4. **Dashboard 中标注**："内存数据已扣除 Turbo 自身开销（基线 ~X MB）。"

---

### 11.34 CDN 数据库的重放攻击（Replay Attack）防御

**风险**：§11.27 的 `ExtendedDbEnvelope` 有 `version` 和 `checksum`，但缺少单调递增时间戳和强制更新机制。MITM 可无限期下发旧版合法 JSON（其中某恶意扩展尚未被标记为高危），绕过安全防御。

**决策**：

1. **新增 `issuedAt`（签发时间戳）和 `expiresAt`（过期时间）**：
```typescript
interface ExtendedDbEnvelope {
  version: number;
  issuedAt: number;        // Unix ms，签发时间
  expiresAt: number;       // Unix ms，过期时间（建议 issuedAt + 7 天）
  checksum: string;
  payload: ExtendedDatabase;
}
```

2. **单调递增强制更新**：
   - 本地缓存记录最后一次接受更新的 `issuedAt`
   - CDN 下发的新版本 `issuedAt` 必须 **>** 本地缓存的 `issuedAt`，否则拒绝（防重放）
   - 若本地缓存中 `expiresAt` 已过 → 强制拒绝旧缓存，必须拉取新版本（若拉取失败 → 降级 Core DB）

```typescript
function isUpdateNeeded(localIssuedAt: number): boolean {
  const now = Date.now();
  // 缓存超过 7 天 → 强制更新
  if (now > localIssuedAt + 7 * 24 * 3600 * 1000) return true;
  return false;
}
```

3. **校验时的重放检测**：
```typescript
function validateExtendedDb(data: Buffer, lastAcceptedIssuedAt: number): ExtendedDatabase | null {
  const envelope = parseAndValidateStructure(data);
  if (!envelope) return null;
  
  // 重放检测
  if (envelope.issuedAt <= lastAcceptedIssuedAt) {
    console.warn(`[Turbo] Replay attack detected: received issuedAt=${envelope.issuedAt} <= lastAccepted=${lastAcceptedIssuedAt}`);
    return null;
  }
  
  // 过期检测
  if (Date.now() > envelope.expiresAt) {
    console.warn(`[Turbo] Expired DB version (expired ${new Date(envelope.expiresAt).toISOString()})`);
    return null;
  }
  
  // checksum validation...
  return envelope.payload;
}
```

4. **Core DB 的硬编码最小版本**——包内 Core DB 自带一个 `minimumVersion` 字段，若 CDN 下发版本低于此值 → 坚决拒绝。

---

### 11.35 Multi-root 文件夹重命名的指针悬空

**风险**：§11.23 仅处理 WorkspaceFolder 被"移除"。若用户在文件系统中重命名了某个文件夹，其 `uri` 改变。VS Code 将此视为 remove + add 组合动作，但物理 `.vscode/settings.json` 仍存在且包含 Turbo 写入的配置。此时 URI 匹配失效，用户永远无法通过 Undo 回滚该文件夹的配置。

**决策**：

1. **Change Log 同时记录 URI 和物理路径**：
```typescript
interface ChangeLogEntry {
  workspaceFolderUri?: string;      // VS Code URI（用于当前匹配）
  workspaceFolderFsPath?: string;   // 物理文件系统路径（用于回退检测）
}
```

2. **回滚时双重校验**：
```typescript
function findMatchingFolder(entry: ChangeLogEntry): vscode.WorkspaceFolder | null {
  // ① URI 精确匹配
  const byUri = vscode.workspace.workspaceFolders?.find(
    f => f.uri.toString() === entry.workspaceFolderUri
  );
  if (byUri) return byUri;
  
  // ② 物理路径回退检测
  if (entry.workspaceFolderFsPath) {
    const physicalPath = entry.workspaceFolderFsPath;
    if (fs.existsSync(path.join(physicalPath, '.vscode', 'settings.json'))) {
      // 物理文件仍存在 — 文件夹可能被重命名
      // 遍历当前 workspace folders 找匹配的物理路径
      const byFsPath = vscode.workspace.workspaceFolders?.find(
        f => f.uri.fsPath === physicalPath
      );
      if (byFsPath) return byFsPath;
      
      // 物理文件存在但 workspace 中无匹配 → 提示用户
      vscode.window.showWarningMessage(
        `检测到配置存在于 ${physicalPath}/.vscode/settings.json，` +
        `但该文件夹不在当前工作区中（可能已被重命名）。[打开文件夹] [忽略]`
      );
    }
  }
  return null;
}
```

3. **对"物理文件仍存在但 workspace 中无 URI 匹配"的条目**：不自动回滚，提示用户手动处理——提供"查看配置详情"和"手动回滚指引"。

4. **定期孤儿配置检测**：扫描时检测当前 workspace 下所有 `.vscode/settings.json` 文件，交叉比对 Change Log，对"文件存在但未关联任何活跃记录"的配置提示用户是否需要清理。

---

### 11.36 异步批处理的 CPU 阻塞陷阱（Event Loop Starvation）

**风险**：PRD 使用 `fs.promises.readFile` + `setImmediate()` 间隔让出事件循环。但 `jsonc-parser` 的解析过程是**同步且 CPU 密集型**的。并发 `Promise.all` 处理一批 8 个文件时，8 个同步 `parse()` 调用连续霸占主线程——`setImmediate()` 只在批次之间生效，批内毫秒级无响应仍会导致 Extension Host UI 卡顿。

**决策**：

1. **批内也插入让出点**：批次中每个文件解析完成后调用 `await yieldToEventLoop()`，将并发批处理的并行度降低为**顺序串行 + 每个文件间让出**：

```typescript
async function parseBatch(files: string[]): Promise<ParsedManifest[]> {
  const results: ParsedManifest[] = [];
  for (const file of files) {
    const parsed = await readAndParseOne(file);  // 同步解析在此
    results.push(parsed);
    await yieldToEventLoop();  // 每个文件后让出，而非每个批次后
  }
  return results;
}
```

2. **并发解析降级为单文件串行**：对于 `package.json` 的 JSONC 解析（< 50KB），单文件解析约 1-5ms。串行处理 20 个文件总计 ~100ms，分散在 20 个 Event Loop 周期上（每次 5ms），用户完全无感知——远好于并发 8 个文件造成的 40ms 连续卡顿。

3. **超大 manifest 保护**：若单文件 `package.json` 超过 100KB（极少见）→ 跳过不解析，核心字段（`activationEvents`）从 `vscode.extensions.all` 的轻量元数据中读取。

4. **总扫描时长上限**：设定整体扫描的硬超时 15s。若接近超时 → 丢弃未完成的深度解析，基于 Core DB 索引出报告，标注 Partial Scan。

---

### 11.37 内存基线测量的并发污染（Baseline Heap Corruption）

**风险**：VS Code 扩展激活高度并发。若 Turbo 完成 `activate()` 时恰逢另一个重度扩展（Java、C++）正在执行大规模启动内存分配，Turbo 记录的 `BASELINE_HEAP` 将被极度拉高。后续扫描时其他扩展的启动开销已被 GC 回收，`currentHeap - BASELINE_HEAP` 出现负数，彻底摧毁评分逻辑。

**决策**：

1. **延迟多次基线采样**（而非单点采样）：在 `activate()` 结束后，延迟 3s、6s、10s 各采集一次，取**最小值**作为基线：

```typescript
async function establishBaseline(): Promise<number> {
  const samples: number[] = [];
  for (const delayMs of [3000, 6000, 10000]) {
    await new Promise(r => setTimeout(r, delayMs));
    if (global.gc) global.gc();
    await new Promise(r => setTimeout(r, 500));  // 等 GC 完成
    samples.push(process.memoryUsage().heapUsed);
  }
  return Math.min(...samples);  // 取最小值——最接近真实空闲状态
}
```

2. **负数保护**：
```typescript
function computeDelta(currentHeap: number): number {
  const delta = currentHeap - BASELINE_HEAP;
  return Math.max(0, delta);  // 负数 → 0（采样误差）
}
```

3. **基线刷新机制**：每次全量扫描完成后，若当前 `heapUsed < BASELINE_HEAP`（说明之前基线偏高），用新值**渐变更新**基线（EMA，指数移动平均）：
```typescript
BASELINE_HEAP = BASELINE_HEAP * 0.8 + currentHeap * 0.2;
```

4. **基线不可用时降级**：若基线尚未建立（前三秒即触发扫描），标注"基线尚未就绪，内存数据仅供参考"。

---

### 11.38 CDN 完整性校验的密码学漏洞——缺乏真实性（Authenticity）

**风险**：SHA-256 checksum 仅提供数据完整性（防损坏），不提供数据真实性（防伪造）。MITM 或 CDN 劫持者可以构造恶意 payload、自行计算匹配的 SHA-256、伪造未来的 `issuedAt`——客户端将全盘接受。§11.34 的重放防御在主动攻击者面前形同虚设。

**决策**：

1. **从 HMAC → 升级为 Ed25519 数字签名**。包内嵌入**公钥**（硬编码在 TypeScript 源码常量中），CDN 构建流水线持有**私钥**并对每个 Extended DB 发布进行签名。客户端验证签名后才接受数据：

```typescript
import { verify } from '@noble/ed25519';  // 纯 JS，零原生依赖，~4KB

const PUBLIC_KEY = Uint8Array.from([
  // 32-byte Ed25519 public key，构建时硬编码
  0x1a, 0x2b, /* ... */
]);

async function verifySignature(envelope: ExtendedDbEnvelope, signature: Uint8Array): Promise<boolean> {
  const message = new TextEncoder().encode(JSON.stringify({
    version: envelope.version,
    issuedAt: envelope.issuedAt,
    expiresAt: envelope.expiresAt,
    checksum: envelope.checksum,
  }));
  return await verify(signature, message, PUBLIC_KEY);
}
```

2. **签名嵌入 Envelope**：
```typescript
interface ExtendedDbEnvelope {
  version: number;
  issuedAt: number;
  expiresAt: number;
  checksum: string;     // SHA-256 of payload（数据完整性）
  signature: string;    // Ed25519 signature of the envelope metadata（数据真实性）
  payload: ExtendedDatabase;
}
```

3. **验证顺序**：
   ① 验证 `signature`（Ed25519 公钥验证 metadata）→ 失败则拒绝（防伪造）
   ② 验证 `issuedAt > lastAcceptedIssuedAt` → 失败则拒绝（防重放）
   ③ 验证 `Date.now() < expiresAt` → 失败则拒绝（防过期）
   ④ 验证 `checksum === SHA256(payload)` → 失败则拒绝（防损坏）

4. **密钥轮转支持**：包内嵌入当前公钥 + 上一个公钥（用于过渡期）。新私钥签名发布的新版本自动覆盖旧缓存。若验证失败的缓存曾用旧公钥签名，在过渡期内仍可接受。

---

### 11.39 扩展列表热更新的引用失效（Stale Array Reference）

**风险**：`vscode.extensions.all` 每次调用返回全新数组引用。`onDidChange` 事件在扩展安装/卸载时高频触发。若扫描引擎正在异步遍历扩展列表时事件触发——旧的数组引用中的元素（已被卸载的扩展）在内存中的引用变为"悬空"状态。访问其 `extensionPath` 或 `packageJSON` 等属性可能抛出运行时异常导致扫描崩溃。

**决策**：

1. **所有扩展访问包裹 try/catch + 惰性最新化**：
```typescript
function safeGetExtension(id: string): vscode.Extension<any> | null {
  try {
    return vscode.extensions.getExtension(id) ?? null;
  } catch {
    return null;  // 扩展已被卸载
  }
}
```

2. **不持有旧数组引用**。任何跨越 `await` 的代码点之后，如需再次访问扩展信息，必须重新调用 `vscode.extensions.all` 获取最新数组。绝不缓存跨越异步边界的旧引用：

```typescript
// 错误（禁止）
const extensions = vscode.extensions.all;
await someAsyncOp();
for (const ext of extensions) { /* ext 可能已失效 */ }

// 正确
await someAsyncOp();
const extensions = vscode.extensions.all;  // 重新获取
for (const ext of extensions) { /* 安全 */ }
```

3. **增量分析使用 stable ID 而非 stable reference**：记录"已分析的扩展 ID 集合"，而非"已分析的扩展引用数组"。重新扫描时通过 ID 在最新 `vscode.extensions.all` 中查找。

4. **异常隔离**：单扩展解析失败不中断全局扫描。每个扩展的分析包裹在独立 try/catch 中，失败时跳过并记录。

---

### 11.40 卸载清理机制的文件锁竞态（File Lock Race Condition）

**风险**：Windows 系统中，若 `extended-db-cache.json` 正被后台杀毒软件扫描、被另一个意外启动的 VS Code 实例挂起、或被系统索引服务（Windows Search Indexer）占用，文件会被系统级物理锁定。执行 `fs.unlink()` 会抛出 `EBUSY`/`EPERM` 异常，导致 Purge 流程非预期中断。

**决策**：

1. **所有文件删除操作包裹 try/catch**：
```typescript
async function safeUnlink(filePath: string): Promise<boolean> {
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (e: any) {
    if (e.code === 'ENOENT') return true;  // 文件不存在 = 已清理
    if (e.code === 'EBUSY' || e.code === 'EPERM') {
      console.warn(`[Turbo] Cannot delete locked file: ${filePath}`);
      return false;  // 被锁定
    }
    throw e;
  }
}
```

2. **Windows 兼容的 rename-then-delete 策略**：当 `unlink` 失败时，先将文件重命名为 `.turbo-trash-{timestamp}.bak`，然后在下次 VS Code 启动时尝试删除垃圾文件：
```typescript
async function deleteWithRetry(filePath: string): Promise<void> {
  if (await safeUnlink(filePath)) return;
  
  // 重命名（Windows 上 rename 通常成功，即使 unlink 失败）
  const trashPath = filePath + '.turbo-trash-' + Date.now() + '.bak';
  try {
    await fs.promises.rename(filePath, trashPath);
    // 标记为待删除
    const pendingDeletes = context.globalState.get<string[]>('turbo.pendingDeletes') ?? [];
    pendingDeletes.push(trashPath);
    context.globalState.update('turbo.pendingDeletes', pendingDeletes);
  } catch {
    // rename 也失败 → 放弃，通知用户
  }
}
```

3. **下次激活时清理残留**：在 `activate()` 中处理 `pendingDeletes`——尝试删除上次未能清理的文件（此时文件锁可能已释放）。

4. **Purge 流程容错**——单个文件操作失败不中断整体流程。最终向用户展示清理结果摘要：
   ```
   ✅ 已清理：settings 配置 (3 项)、history.json
   ⚠️ 未能清理：extended-db-cache.json（文件被占用，将在下次 VS Code 启动时重试）
   ✅ Turbo 数据已清理完毕——可安全卸载。
   ```

---

### 11.41 依赖控制与打包体积

**风险**：V1.6 引入了 `jsonc-parser`、`https-proxy-agent` 和 `@noble/ed25519`。`https-proxy-agent` 可能引入 `agent-base`、`debug` 等传递依赖。若不严格控制，打包产物体积可能突破 PRD §8.3 规定的 < 1MB 目标。

**决策**：

1. **构建工具选 esbuild**（而非 webpack）。esbuild 原生支持 tree-shaking、无运行时依赖。配置：
```javascript
await esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['vscode'],
  outfile: 'dist/extension.js',
  minify: true,
  treeShaking: true,
  metafile: true,
});
```

2. **构建后体积检查**（CI 强制）：
```bash
SIZE=$(stat -c%s dist/extension.js)
MAX_SIZE=1048576  # 1MB
if [ "$SIZE" -gt "$MAX_SIZE" ]; then
  echo "FAIL: ${SIZE} > ${MAX_SIZE}"; exit 1
fi
```

3. **`https-proxy-agent` 替代方案**：若体积超标，改用 Node.js 20+ 内置 `undici.ProxyAgent`——零额外依赖，完全功能等价。

4. **依赖审计**：每次 PR 用 `esbuild --metafile` 生成体积报告。若单依赖超过 200KB → 评估替代方案。打包体积趋势超过 10%/月 → 触发告警。

---

### 11.42 签名密钥的安全生命周期

**风险**：§11.38 的 Ed25519 签名方案要求 CDN 流水线持有私钥。若私钥泄露（被打印到 CI 日志、被低权限 PR 触发构建读取），攻击者可签发恶意 Extended DB 绕过客户端真实性验证。

**决策**：

1. **私钥存储**：仅存于 CI/CD Secrets Manager（如 GitHub Actions Secrets），标记 `TURBO_ED25519_PRIVATE_KEY`，CI 平台自动在日志中脱敏。**仅 `main` 分支 protected workflow 可读取**，PR 构建无权访问。

2. **签名脚本安全**：
```javascript
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) { console.error('Missing PRIVATE_KEY'); process.exit(1); }
// ... 签名操作 ...
delete process.env.PRIVATE_KEY;  // 使用后立即清除，防止下游步骤意外泄露
```

3. **密钥轮转**：例行轮转 12 个月，紧急轮转 ≤ 2 小时。客户端嵌入**双公钥**（当前 + 上一代），过渡期 30 天后移除旧公钥。

4. **泄露应急预案**：
   ① 立即吊销 CI Secrets 中的旧私钥
   ② 生成新密钥对，更新 CI Secrets
   ③ 发布包含新公钥的扩展 hotfix
   ④ 用新私钥重新签名所有 Extended DB 版本
   ⑤ 发布 GitHub Security Advisory

---

> **V1.8 修订记录**：2026-06-12 — 统一前文规格与 §11 风险决策，收敛 V1.0 为离线 Core DB MVP，明确 Safe Auto Fix / Manual Guided Fix / Suggestion Only 边界，移除不可实现 API 承诺，补充隐私、遥测、Remote、Change Log、Webview 与知识库数据质量约束。

> **V1.7 修订记录**：2026-06-12 — 新增 §11.41–§11.42，涵盖依赖打包体积控制（esbuild + CI 强制上限 + undici 替代）与 Ed25519 密钥生命周期管理（CI Secrets 隔离 + PR 权限控制 + 双公钥轮转 + 泄露应急）。

> **V1.4 修订记录**：2026-06-12 — 新增 §11.19–§11.28，涵盖语言作用域盲区、Array 合并、作用域穿透、外部文件系统突变、多根动态变更、V8 GC 抖动、激活时间不可编程获取、网络磁盘 I/O、CDN 缓存投毒、卸载死角 10 项深层工程缺陷的最终决策。

---

## 附录 A：V1.0 知识库内容（初始种子数据）

### 已知高消耗扩展（部分）

| 扩展 ID | 估计内存范围 | 置信度 | 最后验证 | 中性描述 |
|---------|--------------|--------|----------|----------|
| `eamodio.gitlens` | 100-380MB | medium | 2026-06-12 | 在大仓库中部分 Git 历史、CodeLens、blame 功能可能增加开销 |
| `dbaeumer.vscode-eslint` | 150-500MB | medium | 2026-06-12 | 启用类型感知规则或大型 JS/TS 项目中可能增加保存与诊断耗时 |
| `github.copilot` | 100-300MB | low | 2026-06-12 | AI 补全服务会增加后台进程与网络请求开销，实际取决于会话状态 |
| `github.copilot-chat` | 100-300MB | low | 2026-06-12 | Chat 会话和上下文索引可能增加内存占用 |
| `ms-vscode.cpptools` | 200-5000MB | medium | 2026-06-12 | C/C++ IntelliSense 在大型代码库中可能产生较高索引开销 |
| `ms-dotnettools.csdevkit` | 200-500MB | low | 2026-06-12 | .NET Language Server 在大型解决方案中可能持续占用资源 |
| `ms-python.vscode-pylance` | 150-400MB | medium | 2026-06-12 | 类型分析在大型 Python 工作区中可能增加内存占用 |
| `Vue.volar` | 150-350MB | medium | 2026-06-12 | 大型 Vue 项目下模板类型分析可能增加内存和 CPU 开销 |
| `ms-vscode-remote.remote-ssh` | 100-200MB | low | 2026-06-12 | 远程连接管理会增加额外进程与连接状态开销 |

### 轻量替代映射（部分）

| 重扩展 | 可选替代/配置方向 |
|--------|------------------|
| `dbaeumer.vscode-eslint` | 对 JS/TS 项目可评估 `biomejs.biome`；若仍使用 ESLint，建议检查类型感知规则范围 |
| `esbenp.prettier-vscode` | 对 JS/TS 项目可评估 `biomejs.biome` 的格式化能力；是否替代取决于团队规范 |
| `eamodio.gitlens` | 可优先关闭 GitLens CodeLens/current line blame，或结合内置 Git 功能与 `mhutchie.git-graph` |

---

> **文档版本**：v1.8
> **最后更新**：2026-06-12
> **维护者**：Evhye
> **本文档是 One-Click Turbo 开发的唯一权威来源。**
>
> **v1.1**：§11.1–§11.8（I/O、监控、作用域、合并、存储、冲突、知识库、并发）
> **v1.2**：§11.9–§11.14（JSONC、Multi-root、Remote、脏写、竞态锁、生命周期）
> **v1.3**：§11.15–§11.18（XSS、Air-gapped、Profiles、卸载清理）
> **v1.4**：§11.19–§11.28（语言作用域、Array 合并、作用域穿透、外部突变、多根悬空、V8 GC、激活时间移除、网络 I/O、CDN 投毒、卸载死角）
> **v1.5**：§11.29–§11.35（API 伪命题修正、Git 检测、TOCTOU、Change Log 隔离、自我污染、CDN 防重放、多重重命名）
> **v1.6**：§11.36–§11.40（批内 CPU 阻塞、基线并发污染、Ed25519 签名、扩展引用失效、Windows 文件锁）
> **v1.7**：§11.41–§11.42（esbuild 打包体积控制 + CI 强制上限、Ed25519 密钥 CI Secrets 隔离 + 双公钥轮转 + 泄露应急）
> **v1.8**：全局一致性修订（V1.0 离线 MVP、不可实现 API 移除、自动/手动/建议边界、隐私遥测、Remote、Change Log、Webview 与知识库质量约束）
