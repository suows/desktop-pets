# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

桌面宠物（Desktop Pets）— 桌面伴侣应用，长期维护项目。

## Tech Stack

<!-- TODO: 确定技术栈后填写 -->

## Development Commands

<!-- TODO: 项目初始化后填写构建、测试、运行命令 -->

## 自动化工作流（核心行为准则）

**需求-设计-开发-测试-验收完整闭环，最小化人工参与。**

1. **需求阶段**：这是唯一需要频繁和你对齐的阶段。我会主动提问澄清模糊需求
2. **执行阶段**（设计→开发→测试→验收）：需求一旦确定，全自动推进，不再逐个人工确认
   - 所有工具操作默认选 yes / 第一个选项
   - 不询问"是否继续"、"是否执行"之类的确认性问题
   - 项目已配置 `defaultMode: "acceptEdits"` + 命令白名单，权限弹窗已最小化
3. **异常处理**：遇到编译/测试失败时，自动诊断并修复（最多 3 次），无需人工介入
4. **何时才问你**：需求歧义、多个等价方案需要偏好选择、安全风险警告

## Architecture

<!-- TODO: 填入架构决策和设计 -->

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
