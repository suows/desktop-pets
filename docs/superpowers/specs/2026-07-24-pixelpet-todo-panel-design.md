# PixelPet TODO 面板 — 设计规范

> 2026-07-24 | 状态：已确认

## 概述

在宠物窗口旁显示独立 TODO 待办列表窗口，支持增删改查，可独立关闭。

## 架构

```
electron/main.ts              新增 createTodoWindow() + IPC handlers
electron/preload.ts            新增 todo CRUD API (contextBridge)
shared/ipc-channels.ts         新增 TODO_* channels
src/index.tsx                  新增 #/todo 路由
src/panels/TodoPanel.tsx       新增：待办列表组件
src/panels/SettingsPanel.tsx   修改：添加打开 TODO 按钮
```

## 数据模型

```typescript
interface Todo {
  id: string;          // crypto.randomUUID()
  text: string;
  done: boolean;
  createdAt: string;
}

// electron-store 默认值扩展
store.defaults = {
  pet: { x: 100, y: 100 },
  settings: { autoLaunch: false, soundEnabled: false, opacity: 1.0 },
  todos: [] as Todo[]     // 新增
}
```

## IPC 通道

```typescript
TODO_LIST:    'todo:list'     // invoke → Todo[]
TODO_ADD:     'todo:add'      // send { text }
TODO_TOGGLE:  'todo:toggle'   // send { id }
TODO_DELETE:  'todo:delete'   // send { id }
TODO_OPEN:    'todo:open'     // send → 打开/聚焦窗口
```

## TODO 窗口

```typescript
const todoWindow = new BrowserWindow({
  width: 280, height: 400,
  resizable: false,
  skipTaskbar: true,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
});
// 位置：计算在宠物窗口右侧 20px
```

## UI 布局

```
┌──────────────────────┐
│  📋 待办事项     ✕   │  标题栏 + 关闭按钮
├──────────────────────┤
│ ☐ 买猫粮       🗑   │  点击切换 done
│ ☑ 完成代码     🗑   │  done 项划线变灰
│ ☐ 记得喝水     🗑   │
├──────────────────────┤
│ [输入框]  [+ 添加]   │  底部输入区（回车也可添加）
└──────────────────────┘
```

## 入口

- 系统托盘菜单新增「待办事项」
- 设置面板新增按钮「打开待办」

## 验证标准

- [ ] 系统托盘 → 待办事项 → TODO 窗口打开在宠物旁边
- [ ] 添加待办 → 列表实时更新
- [ ] 点击复选框 → 切换完成状态（划线变灰）
- [ ] 点击删除 → 项消失
- [ ] 关闭按钮 → 窗口关闭
- [ ] 重新打开 → 数据保持
- [ ] `npx tsc --noEmit` 零错误
- [ ] `npm run build` 构建成功
