# PixelPet MVP — 设计规范

> 2026-07-24 | 状态：已确认

## 产品定义

**一句话**：一个运行在 Windows 桌面的 2D 像素猫助手，用 Canvas 程序化绘制，通过陪伴和互动帮助用户提升效率。

**产品理念**：让一只有生命感的像素猫住进用户电脑。

**第一阶段目标**：一天完成可运行版本——看到像素猫、点击有反馈、可拖动、有系统托盘。

---

## 技术决策

| 决策项 | 选择 |
|--------|------|
| 开发框架 | Electron + Vite + React + TypeScript |
| 像素渲染 | Canvas 程序化绘制 16×16 像素猫 |
| 动画方案 | Canvas 逐帧渲染 (requestAnimationFrame) |
| 窗口策略 | 宠物窗口（透明无边框）+ 面板窗口（按需创建） |
| 状态管理 | React Context + 自定义 hooks |
| 数据存储 | electron-store (JSON 文件, %APPDATA%/PixelPet/) |
| 打包工具 | electron-builder |
| 架构风格 | 方案 A：轻量分层 |

---

## 项目结构

```
PixelPet/
├── electron/
│   ├── main.ts              # 入口：窗口、托盘、IPC
│   ├── preload.ts           # contextBridge API
│   └── tray.ts              # 系统托盘
├── src/
│   ├── pet-window/
│   │   ├── App.tsx          # 根组件
│   │   ├── PixelCat.tsx     # Canvas 宠物渲染
│   │   ├── usePetState.ts   # 状态机 hook
│   │   └── cat-pixels.ts    # 像素帧数据（16×16 数组）
│   └── panels/
│       └── SettingsPanel.tsx # 设置面板
├── shared/
│   └── ipc-channels.ts      # IPC 通道常量
├── package.json
├── vite.config.ts
├── electron-builder.yml
└── tsconfig.json
```

---

## 宠物状态机

```
IDLE ──单击──→ CLICKED ──300ms──→ IDLE
IDLE ──30s无操作──→ SLEEP ──任意交互──→ IDLE
任意 ──双击──→ HAPPY ──800ms──→ IDLE
```

## 动画帧数据

所有帧定义在 `cat-pixels.ts`，每个状态对应一组帧：

```typescript
type Frame = number[][];  // 16×16 色板
type Animation = { frames: Frame[]; interval: number };

const animations: Record<PetState, Animation> = {
  IDLE:    { frames: [帧1, 帧2], interval: 800 },   // 左右微晃
  CLICKED: { frames: [帧1],       interval: 300 },   // 眨眼
  HAPPY:   { frames: [帧1, 帧2], interval: 400 },   // 跳跃
  SLEEP:   { frames: [帧1, 帧2], interval: 1200 },  // 缓动呼吸
};
```

## 渲染管道

```
cat-pixels.ts → usePetState(state) → PixelCat(Canvas)
                                       ├─ 取 animations[state]
                                       ├─ useAnimation(frames, interval)
                                       └─ 当前帧 → putImageData(16×16) → scale(8x) → 128×128
```

---

## 交互系统

| 操作 | 行为 |
|------|------|
| 单击 | IDLE→CLICKED 或 SLEEP→IDLE |
| 双击 | 任意→HAPPY |
| 拖动 | mousedown+mousemove→setPosition, mouseup→IPC存坐标 |
| 右键 | 通过系统托盘菜单 |

---

## Electron 窗口

### 宠物窗口

```typescript
{
  width: 160, height: 200,
  transparent: true, frame: false,
  alwaysOnTop: true, hasShadow: false,
  resizable: false, skipTaskbar: true,
}
```

### 设置面板窗口

按需创建，独立渲染进程，有标题栏无背景。

---

## IPC 通道

```typescript
export const IPC = {
  PET_POSITION:   'pet:position',   // 保存/加载位置
  PET_SAVE_STATE: 'pet:save-state', // 保存宠物状态
  WINDOW_SETTINGS:'window:settings',
  WINDOW_TODO:    'window:todo',    // 第二阶段
} as const;
```

## 存储 Schema

```typescript
interface StoreSchema {
  pet: {
    x: number; y: number;
  };
  settings: {
    autoLaunch: boolean;
    soundEnabled: boolean;
    opacity: number;
  };
}
```

存于 `%APPDATA%/PixelPet/config.json`，通过 electron-store 读写。

---

## 系统托盘

菜单项：
- 显示/隐藏宠物
- 设置 → 打开设置面板
- 退出

---

## 第二阶段扩展点

| MVP | Phase 2 |
|-----|---------|
| electron-store (JSON) | better-sqlite3 |
| 宠物窗口 | + TODO悬浮窗 + 提醒弹窗 |
| 基础动画 | + TODO完成庆祝动画 |
| 设置面板 | + 提醒配置 UI |

存储层接口抽象为 `IStorage`，换库只改实现文件。

---

## 不做的

- 3D 模型
- AI 对话/宠物人格
- 云端账号系统
- 自动更新（MVP 先用 electron-builder 打包即可）
- 音效（MVP 不包含）

---

## 验证标准

MVP 验收清单：
- [ ] `npm run dev` 启动，桌面出现透明像素猫
- [ ] 单击 → 播放反馈动画
- [ ] 双击 → 播放特殊动画
- [ ] 拖动改变位置，重启保持
- [ ] 系统托盘菜单：隐藏/显示/设置/退出
- [ ] 设置面板可弹可关
