# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PixelPet** — AI 像素桌面宠物助手。一只用 Canvas 程序化绘制的 16×16 像素猫，运行在 Windows 桌面（透明悬浮窗口），提供陪伴和互动反馈。

**第一阶段目标**：一天完成可运行 MVP——看到像素猫、点击有反馈、可拖动、有系统托盘。

## Tech Stack

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 34 |
| 构建工具 | Vite 6 + vite-plugin-electron |
| 前端 | React 19 + TypeScript 5.8 |
| 像素渲染 | Canvas 2D（putImageData + scale） |
| 动画 | requestAnimationFrame 逐帧 |
| 存储 | electron-store (JSON) |
| 打包 | electron-builder (NSIS) |

## Development Commands

```bash
npm install          # 安装依赖
npm run dev          # 启动开发模式（Electron + Vite HMR）
npm run build        # 编译 TypeScript + 打包 exe
npx tsc --noEmit    # 编译检查（不生成文件）
```

## Architecture

```
electron/main.ts          # 主进程：透明宠物窗口 + 系统托盘 + IPC
electron/preload.ts       # contextBridge 安全暴露 API
src/pet-window/
  ├─ App.tsx              # 宠物窗口根组件（拖动 + 全局类型声明）
  ├─ PixelCat.tsx         # Canvas 渲染 16×16 像素猫
  ├─ usePetState.ts       # 状态机：idle → clicked/happy/sleep
  ├─ useAnimation.ts      # requestAnimationFrame 帧循环
  └─ cat-pixels.ts        # 所有像素帧数据（唯一美术源文件）
src/panels/
  └─ SettingsPanel.tsx    # 设置面板（独立窗口）
shared/
  └─ ipc-channels.ts      # IPC 通道常量
```

**设计文档**：`docs/superpowers/specs/2026-07-24-pixelpet-mvp-design.md`
**实施计划**：`docs/superpowers/plans/2026-07-24-pixelpet-mvp.md`

## 自动化工作流（核心行为准则）

---

## 上下文管理（最高优先级）

本项目是长期维护项目，上下文连续性至关重要。**每次对话必须遵循以下流程。**

### 对话开始时

1. 阅读 `.claude/memory/MEMORY.md` 了解记忆索引
2. 至少阅读 `development-progress.md`（了解当前进度）和 `development-conventions.md`（了解固定规则）

### 对话进行中

当用户手动或口头描述了以下内容时，**立即写入记忆文件**：
- 新规则、编码偏好、命名约定 → 写入 `development-conventions.md`
- 技术决策、架构约束 → 写入 `development-conventions.md`
- 用户偏好、工作习惯 → 写入 `user-profile.md`
- 新增记忆文件 → 在 `MEMORY.md` 中注册

写入时遵循记忆文件格式（frontmatter + 正文），不要只追加不整理。

### 对话结束前（必须执行）

在自然结束对话、用户要求退出、或上下文将满之前，**必须完成以下步骤**：

1. **更新 `development-progress.md`**：
   - 在「最新改动」区域添加本次会话的改动摘要
   - 更新任务完成状态（`[x]` / `[ ]`）
   - 添加日期（YYYY-MM-DD 格式）

2. **更新 `MEMORY.md`**：如果新增了记忆文件，确保索引已更新

3. **确认并告知用户**：列出更新了哪些记忆文件、更新了什么内容

4. **Git 提交并推送**：确保所有核心代码和记忆文件已提交到 git，版本可追溯

5. **Stop hook**（`.claude/settings.json` 中配置）会在对话结束时自动运行，作为备份检查文件变更

### 记忆文件格式

每个 `.claude/memory/*.md` 文件必须包含 frontmatter：

```yaml
---
name: kebab-case-slug
description: 一句话描述
metadata:
  type: user | feedback | project | reference
---
```

正文中关联相关记忆用 `[[file-name]]` 语法。

---

## 版本管理（Git）

**每次任务完成、对话结束时必须提交，确保代码和记忆文件版本可追溯。**

### 提交时机

1. **功能完成时**：每个独立功能开发完成 → 提交代码 + 提交记忆文件
2. **对话结束时**：提交所有改动（代码 + `.claude/memory/*.md` + `CLAUDE.md`）
3. **规则变更时**：`development-conventions.md` 有改动 → 立即提交

### 提交规范

- 格式：`<type>: <简短描述>`
- Type：`feat` / `fix` / `chore` / `docs` / `refactor`
- 示例：`feat: 项目框架初始化` / `chore: 更新记忆文件`

### Git 操作

```bash
git add -A
git commit -m "<type>: <描述>"
git push
```
