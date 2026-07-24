# PixelPet TODO 面板 — 实施计划

> 2026-07-24 | 基于 [design spec](../specs/2026-07-24-pixelpet-todo-panel-design.md)

## 任务分解

### Task 1: IPC 通道 + 数据存储

**Files:**
- Modify: `shared/ipc-channels.ts` — 添加 TODO_* 常量
- Modify: `electron/main.ts` — 添加 TODO IPC handlers + createTodoWindow + store defaults

### Task 2: Preload API + 路由 + 类型

**Files:**
- Modify: `electron/preload.ts` — 暴露 todo CRUD API
- Modify: `src/index.tsx` — 添加 #/todo 路由
- Create: `src/types/electron-api.d.ts` — 统一 API 类型声明（从 App.tsx 移出）

### Task 3: TodoPanel 组件

**Files:**
- Create: `src/panels/TodoPanel.tsx` — 完整 TODO UI（列表 + 添加 + 切换 + 删除 + 关闭）
- Modify: `src/pet-window/App.tsx` — 替换 inline 类型为 import

### Task 4: 入口集成 + 构建验证

**Files:**
- Modify: `electron/main.ts` — 托盘菜单 + 设置面板打开 TODO 入口
- Modify: `src/panels/SettingsPanel.tsx` — 添加打开 TODO 按钮
- 验证: `npx tsc --noEmit` + `npm run build`
