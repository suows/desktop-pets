# PixelPet MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 一天内完成可运行的桌面像素猫——Canvas 渲染、点击互动、拖动、系统托盘、设置面板。

**Architecture:** Electron 主进程管理透明宠物窗口和系统托盘，React 渲染进程驱动 Canvas 逐帧动画。状态机控制宠物行为，IPC 桥接渲染与主进程通信，electron-store 持久化位置和设置。

**Tech Stack:** Electron 34 + Vite 6 + React 19 + TypeScript 5.8 + electron-store + electron-builder

**Source files:** 10 个源文件，3 层架构。

---

## File Map

```
PixelPet/
├── package.json                   # 创建：项目元信息 + 脚本
├── tsconfig.json                  # 创建：TypeScript 配置
├── vite.config.ts                 # 创建：Vite + Electron 插件
├── electron-builder.yml           # 创建：打包配置
├── index.html                     # 创建：HTML 入口
├── electron/
│   ├── main.ts                    # 创建：主进程入口
│   ├── preload.ts                 # 创建：contextBridge
│   └── tray.ts                    # 创建：系统托盘
├── shared/
│   └── ipc-channels.ts            # 创建：IPC 常量
└── src/
    ├── index.tsx                  # 创建：React 入口
    ├── pet-window/
    │   ├── App.tsx                # 创建：根组件
    │   ├── PixelCat.tsx           # 创建：Canvas 渲染
    │   ├── usePetState.ts         # 创建：状态机
    │   ├── useAnimation.ts        # 创建：帧循环
    │   └── cat-pixels.ts          # 创建：像素帧数据
    └── panels/
        └── SettingsPanel.tsx      # 创建：设置面板
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Modify: `.gitignore` (add electron dist)

- [ ] **Step 1: Create package.json**

```json
{
  "name": "pixelpet",
  "version": "0.1.0",
  "description": "AI 像素桌面宠物助手",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "electron-store": "^10.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "electron": "^34.0.0",
    "electron-builder": "^25.1.0",
    "typescript": "^5.8.0",
    "vite": "^6.0.0",
    "vite-plugin-electron": "^0.28.0",
    "vite-plugin-electron-renderer": "^0.14.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": { "@shared/*": ["shared/*"] }
  },
  "include": ["src", "electron", "shared"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    react(),
    electron([
      { entry: 'electron/main.ts' },
      { entry: 'electron/preload.ts', onstart(args) { args.reload(); } },
    ]),
    renderer(),
  ],
});
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head><meta charset="UTF-8" /><title>PixelPet</title></head>
  <body><div id="root"></div><script type="module" src="/src/index.tsx"></script></body>
</html>
```

- [ ] **Step 5: Update .gitignore**

Append to existing `.gitignore`:
```
# Electron build
dist/
dist-electron/
release/
```

- [ ] **Step 6: Install & verify**

Run: `npm install`
Expected: no errors

Run: `npx tsc --noEmit`
Expected: no files to check yet (empty src)

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html .gitignore
git commit -m "chore: project scaffold — Vite + Electron + React + TypeScript"
```

---

### Task 2: IPC Channels

**Files:**
- Create: `shared/ipc-channels.ts`

- [ ] **Step 1: Create IPC constants**

```typescript
// shared/ipc-channels.ts
export const IPC = {
  PET_POSITION_SAVE:   'pet:position:save',
  PET_POSITION_LOAD:   'pet:position:load',
  PET_STATE_REQUEST:   'pet:state:request',
  WINDOW_SETTINGS:     'window:settings',
  TRAY_HIDE_PET:       'tray:hide-pet',
  TRAY_SHOW_PET:       'tray:show-pet',
} as const;
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit shared/ipc-channels.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add shared/ipc-channels.ts
git commit -m "feat: add IPC channel constants"
```

---

### Task 3: Electron Main Process

**Files:**
- Create: `electron/main.ts`

- [ ] **Step 1: Create main.ts**

```typescript
// electron/main.ts
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron';
import path from 'path';
import { IPC } from '../shared/ipc-channels';
import Store from 'electron-store';

const store = new Store({
  defaults: {
    pet: { x: 100, y: 100 },
    settings: { autoLaunch: false, soundEnabled: false, opacity: 1.0 }
  }
});

let petWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createPetWindow(): void {
  const { x, y } = store.get('pet') as { x: number; y: number };
  petWindow = new BrowserWindow({
    width: 160, height: 200,
    x, y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  petWindow.setVisibleOnAllWorkspaces(true);
  petWindow.setAlwaysOnTop(true, 'floating');

  if (process.env.VITE_DEV_SERVER_URL) {
    petWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/pet`);
  } else {
    petWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/pet' });
  }
}

function createSettingsWindow(): void {
  const settingsWin = new BrowserWindow({
    width: 360, height: 480,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    settingsWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/settings`);
  } else {
    settingsWin.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/settings' });
  }
}

function createTray(): void {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示 PixelPet', click: () => petWindow?.show() },
    { label: '隐藏 PixelPet', click: () => petWindow?.hide() },
    { type: 'separator' },
    { label: '设置', click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setToolTip('PixelPet');
  tray.setContextMenu(contextMenu);
}

// IPC handlers
ipcMain.on(IPC.PET_POSITION_SAVE, (_event, pos: { x: number; y: number }) => {
  store.set('pet', pos);
});

ipcMain.handle(IPC.PET_POSITION_LOAD, () => {
  return store.get('pet');
});

ipcMain.on(IPC.WINDOW_SETTINGS, () => {
  createSettingsWindow();
});

app.whenReady().then(() => {
  createPetWindow();
  createTray();
});

app.on('window-all-closed', () => {}); // don't quit
app.on('activate', () => { if (!petWindow) createPetWindow(); });
app.isQuitting = false;
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit electron/main.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add electron/main.ts
git commit -m "feat: Electron main process — pet window, tray, IPC handlers"
```

---

### Task 4: Preload Script

**Files:**
- Create: `electron/preload.ts`

- [ ] **Step 1: Create preload.ts**

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';

contextBridge.exposeInMainWorld('electronAPI', {
  pet: {
    savePosition: (x: number, y: number) => ipcRenderer.send(IPC.PET_POSITION_SAVE, { x, y }),
    loadPosition: (): Promise<{ x: number; y: number }> => ipcRenderer.invoke(IPC.PET_POSITION_LOAD),
  },
  window: {
    openSettings: () => ipcRenderer.send(IPC.WINDOW_SETTINGS),
  },
});
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit electron/preload.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add electron/preload.ts
git commit -m "feat: preload script with contextBridge API"
```

---

### Task 5: Pixel Cat Frame Data

**Files:**
- Create: `src/pet-window/cat-pixels.ts`

This file is THE single source of all art. All pixel cat data lives here.

- [ ] **Step 1: Create cat-pixels.ts with complete pixel data**

```typescript
// src/pet-window/cat-pixels.ts

// Color palette (index → RGBA):
// 0 = transparent
// 1 = #333 (dark outline)
// 2 = #FF8C42 (orange body)
// 3 = #FFF (white)
// 4 = #FF6B8A (pink — nose/inner ear)
// 5 = #222 (pupil)

export type Frame = number[][];
export interface Animation { frames: Frame[]; interval: number; }
export type PetState = 'idle' | 'clicked' | 'happy' | 'sleep';

// IDLE — gentle sway, 2 frames
const idle1: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,2,2,0,0,0,0,2,2,0,0,0,0],
  [0,0,0,2,4,2,2,0,0,2,2,4,2,0,0,0],
  [0,0,0,2,2,1,3,3,3,3,1,2,2,0,0,0],
  [0,0,0,2,1,5,3,3,3,3,5,1,2,0,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,1,2,2,1,2,2,2,2,0,0],
  [0,0,2,2,2,2,2,1,1,4,2,2,2,2,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,2,2,1,1,1,1,2,2,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0],
  [0,0,0,0,2,0,2,0,0,2,0,2,0,0,0,0],
];

const idle2: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,2,2,0,0,0,0,0,0,2,2,0,0,0],
  [0,0,0,4,2,2,0,0,0,0,2,2,4,0,0,0],
  [0,0,0,2,1,3,3,3,3,3,3,1,2,0,0,0],
  [0,0,0,2,1,5,3,3,3,3,5,1,2,0,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,1,2,2,1,2,2,2,2,0,0],
  [0,0,2,2,2,2,2,1,1,4,2,2,2,2,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,2,2,1,1,1,1,2,2,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0],
  [0,0,0,0,2,0,2,0,0,2,0,2,0,0,0,0],
];

// CLICKED — blink/wink, single frame
const clicked1: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,2,2,0,0,0,0,2,2,0,0,0,0],
  [0,0,0,2,4,2,2,0,0,2,2,4,2,0,0,0],
  [0,0,0,2,2,1,3,3,3,3,1,2,2,0,0,0],
  [0,0,0,2,1,5,3,3,3,3,5,1,2,0,0,0],  // eyes open
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,1,2,2,1,2,2,2,2,0,0],
  [0,0,2,2,2,2,4,1,1,4,2,2,2,2,0,0],  // mouth: >w< shape
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,2,2,1,1,1,1,2,2,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0],
  [0,0,0,0,2,0,2,0,0,2,0,2,0,0,0,0],
];

// HAPPY — jump, 2 frames (up then down)
const happy1: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,2,2,0,0,0,0,2,2,0,0,0,0],
  [0,0,0,2,4,2,2,0,0,2,2,4,2,0,0,0],
  [0,0,0,2,2,1,3,3,3,3,1,2,2,0,0,0],
  [0,0,0,2,1,5,3,3,3,3,5,1,2,0,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,1,2,2,1,2,2,2,2,0,0],
  [0,0,2,2,2,2,4,4,4,4,2,2,2,2,0,0],  // big happy mouth
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,2,2,1,1,1,1,2,2,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0],  // paws up
  [0,0,0,2,0,2,0,0,0,0,2,0,2,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const happy2: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,2,2,0,0,0,0,0,0,2,2,0,0,0],
  [0,0,2,4,2,2,0,0,0,0,2,2,4,2,0,0],
  [0,0,2,2,1,3,3,3,3,3,3,1,2,2,0,0],
  [0,0,2,1,5,3,3,3,3,3,3,5,1,2,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,1,2,2,1,2,2,2,2,0,0],
  [0,0,2,2,2,2,4,4,4,4,2,2,2,2,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,2,2,1,1,1,1,2,2,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0],
  [0,0,0,0,2,0,2,0,0,2,0,2,0,0,0,0],
];

// SLEEP — breathing, 2 frames
const sleep1: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,2,2,0,0,0,0,2,2,0,0,0,0],
  [0,0,0,2,4,2,2,0,0,2,2,4,2,0,0,0],
  [0,0,0,2,2,1,1,0,0,1,1,2,2,0,0,0],  // closed eyes: --
  [0,0,0,2,1,1,1,0,0,1,1,1,2,0,0,0],
  [0,0,0,2,1,1,1,0,0,1,1,1,2,0,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,2,1,1,2,2,2,2,2,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,2,2,1,1,1,1,2,2,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0],
  [0,0,0,0,2,0,2,0,0,2,0,2,0,0,0,0],
];

const sleep2: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,2,2,0,0,0,0,2,2,0,0,0,0],
  [0,0,0,2,4,2,2,0,0,2,2,4,2,0,0,0],
  [0,0,0,2,2,1,1,0,0,1,1,2,2,0,0,0],
  [0,0,0,2,1,1,1,0,0,1,1,1,2,0,0,0],
  [0,0,0,2,1,1,1,0,0,1,1,1,2,0,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [0,0,2,2,2,2,2,1,1,2,2,2,2,2,0,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,2,2,1,1,1,1,2,2,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,2,0,0,2,0,0,2,0,0,0,0,0],  // slightly different paws
  [0,0,0,2,0,2,0,0,0,0,2,0,0,0,0,0],
];

const animations: Record<PetState, Animation> = {
  idle:    { frames: [idle1, idle2],     interval: 800 },
  clicked: { frames: [clicked1],          interval: 300 },
  happy:   { frames: [happy1, happy2],    interval: 400 },
  sleep:   { frames: [sleep1, sleep2],    interval: 1200 },
};

// RGBA color palette
export const palette: Record<number, [number,number,number,number]> = {
  0: [0,0,0,0],           // transparent
  1: [51,51,51,255],       // dark outline
  2: [255,140,66,255],     // orange body
  3: [255,255,255,255],    // white
  4: [255,107,138,255],    // pink
  5: [34,34,34,255],       // pupil black
};

export const getAnimation = (state: PetState): Animation => animations[state];
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit src/pet-window/cat-pixels.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pet-window/cat-pixels.ts
git commit -m "feat: pixel cat frame data — idle/clicked/happy/sleep animations"
```

---

### Task 6: Animation Hook

**Files:**
- Create: `src/pet-window/useAnimation.ts`

- [ ] **Step 1: Create useAnimation.ts**

```typescript
// src/pet-window/useAnimation.ts
import { useRef, useState, useEffect, useCallback } from 'react';
import { Frame } from './cat-pixels';

export function useAnimation() {
  const [frameIndex, setFrameIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const framesRef = useRef<Frame[]>([]);
  const intervalRef = useRef(800);

  const start = useCallback((frames: Frame[], interval: number) => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    framesRef.current = frames;
    intervalRef.current = interval;
    setFrameIndex(0);
    let lastTime = performance.now();
    let idx = 0;
    function tick(now: number) {
      if (now - lastTime >= intervalRef.current) {
        idx = (idx + 1) % framesRef.current.length;
        setFrameIndex(idx);
        lastTime = now;
      }
      timerRef.current = requestAnimationFrame(tick);
    }
    timerRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { frameIndex, start, stop };
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit src/pet-window/useAnimation.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pet-window/useAnimation.ts
git commit -m "feat: animation hook — requestAnimationFrame frame cycling"
```

---

### Task 7: Pet State Hook

**Files:**
- Create: `src/pet-window/usePetState.ts`

- [ ] **Step 1: Create usePetState.ts**

```typescript
// src/pet-window/usePetState.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { PetState } from './cat-pixels';

const SLEEP_TIMEOUT = 30_000; // 30s idle → sleep

export function usePetState() {
  const [state, setState] = useState<PetState>('idle');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSleepTimer = useCallback(() => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    sleepTimer.current = setTimeout(() => {
      setState('sleep');
    }, SLEEP_TIMEOUT);
  }, []);

  const handleClick = useCallback(() => {
    if (state === 'sleep') {
      setState('idle');
    } else {
      setState('clicked');
      setTimeout(() => setState('idle'), 300);
    }
    resetSleepTimer();
  }, [state, resetSleepTimer]);

  const handleDoubleClick = useCallback(() => {
    setState('happy');
    setTimeout(() => setState('idle'), 800);
    resetSleepTimer();
  }, [resetSleepTimer]);

  const handleDrag = useCallback((x: number, y: number) => {
    setPosition({ x, y });
  }, []);

  // start sleep timer on idle
  useEffect(() => {
    if (state === 'idle') resetSleepTimer();
    return () => { if (sleepTimer.current) clearTimeout(sleepTimer.current); };
  }, [state, resetSleepTimer]);

  return { state, position, handleClick, handleDoubleClick, handleDrag, setPosition };
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit src/pet-window/usePetState.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pet-window/usePetState.ts
git commit -m "feat: pet state hook — state machine with idle/clicked/happy/sleep"
```

---

### Task 8: Canvas Pixel Cat Component

**Files:**
- Create: `src/pet-window/PixelCat.tsx`

- [ ] **Step 1: Create PixelCat.tsx**

```typescript
// src/pet-window/PixelCat.tsx
import { useRef, useEffect } from 'react';
import { PetState, Frame, getAnimation, palette } from './cat-pixels';
import { useAnimation } from './useAnimation';

const PIXEL_SIZE = 16;   // source pixels
const SCALE = 8;         // display scale → 128×128

interface Props {
  state: PetState;
  onClick: () => void;
  onDoubleClick: () => void;
}

function renderFrame(ctx: CanvasRenderingContext2D, frame: Frame) {
  const imageData = ctx.createImageData(PIXEL_SIZE, PIXEL_SIZE);
  for (let y = 0; y < PIXEL_SIZE; y++) {
    for (let x = 0; x < PIXEL_SIZE; x++) {
      const colorIdx = frame[y][x];
      const [r, g, b, a] = palette[colorIdx];
      const idx = (y * PIXEL_SIZE + x) * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = a;
    }
  }
  // draw unscaled raw pixels to offscreen
  const offscreen = new OffscreenCanvas(PIXEL_SIZE, PIXEL_SIZE);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.putImageData(imageData, 0, 0);
  // scale and draw to main canvas with pixel-art rendering (no smoothing)
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, PIXEL_SIZE * SCALE, PIXEL_SIZE * SCALE);
  ctx.drawImage(offscreen, 0, 0, PIXEL_SIZE * SCALE, PIXEL_SIZE * SCALE);
}

export function PixelCat({ state, onClick, onDoubleClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { frameIndex, start } = useAnimation();

  useEffect(() => {
    const anim = getAnimation(state);
    start(anim.frames, anim.interval);
  }, [state, start]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const anim = getAnimation(state);
    renderFrame(ctx, anim.frames[frameIndex]);
  }, [state, frameIndex]);

  // double-click detection via manual counter
  const clickCount = useRef(0);
  const handleClick = () => {
    clickCount.current++;
    if (clickCount.current === 2) {
      onDoubleClick();
      clickCount.current = 0;
    } else {
      setTimeout(() => {
        if (clickCount.current === 1) onClick();
        clickCount.current = 0;
      }, 250);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={PIXEL_SIZE * SCALE}
      height={PIXEL_SIZE * SCALE}
      style={{ cursor: 'pointer', display: 'block' }}
      onClick={handleClick}
    />
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit src/pet-window/PixelCat.tsx`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pet-window/PixelCat.tsx
git commit -m "feat: Canvas pixel cat component — frame rendering with scaling"
```

---

### Task 9: App Root + React Entry

**Files:**
- Create: `src/index.tsx`
- Create: `src/pet-window/App.tsx`
- Create: `src/panels/SettingsPanel.tsx`

- [ ] **Step 1: Create index.tsx**

```typescript
// src/index.tsx
import { createRoot } from 'react-dom/client';
import { App } from './pet-window/App';
import { SettingsPanel } from './panels/SettingsPanel';

const root = document.getElementById('root')!;
const hash = window.location.hash;

if (hash === '#/settings') {
  createRoot(root).render(<SettingsPanel />);
} else {
  createRoot(root).render(<App />);
}
```

- [ ] **Step 2: Create App.tsx**

```typescript
// src/pet-window/App.tsx
import { useEffect, useRef, useCallback } from 'react';
import { PixelCat } from './PixelCat';
import { usePetState } from './usePetState';

declare global {
  interface Window {
    electronAPI?: {
      pet: {
        savePosition: (x: number, y: number) => void;
        loadPosition: () => Promise<{ x: number; y: number }>;
      };
      window: {
        openSettings: () => void;
      };
    };
  }
}

export function App() {
  const { state, position, handleClick, handleDoubleClick, handleDrag, setPosition } = usePetState();
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // load saved position on mount
  useEffect(() => {
    window.electronAPI?.pet.loadPosition().then(pos => {
      setPosition(pos);
    });
  }, [setPosition]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    offset.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - offset.current.x;
    const dy = e.clientY - offset.current.y;
    handleDrag(position.x + dx, position.y + dy);
    offset.current = { x: e.clientX, y: e.clientY };
  }, [position, handleDrag]);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    window.electronAPI?.pet.savePosition(position.x, position.y);
  }, [position]);

  return (
    <div
      style={{ width: '100vw', height: '100vh', background: 'transparent', userSelect: 'none' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <PixelCat state={state} onClick={handleClick} onDoubleClick={handleDoubleClick} />
    </div>
  );
}
```

- [ ] **Step 3: Create SettingsPanel.tsx**

```typescript
// src/panels/SettingsPanel.tsx
export function SettingsPanel() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h2>PixelPet 设置</h2>
      <p style={{ color: '#888' }}>开机自启、音效等设置将在后续版本中添加。</p>
      <p>当前版本: 0.1.0</p>
      <button onClick={() => window.close()}>关闭</button>
    </div>
  );
}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit src/index.tsx src/pet-window/App.tsx src/panels/SettingsPanel.tsx`
Expected: no errors

- [ ] **Step 5: Test run**

Run: `npm run dev`
Expected: Electron window opens with pixel cat visible

- [ ] **Step 6: Commit**

```bash
git add src/index.tsx src/pet-window/App.tsx src/panels/SettingsPanel.tsx
git commit -m "feat: App root with drag, Settings panel placeholder"
```

---

### Task 10: Wire Tray + Final Integration

**Files:**
- Modify: `electron/main.ts` (add missing imports, fix type errors if any)

- [ ] **Step 1: Fix TypeScript declaration for electron-store**

Run: `npm install --save-dev @types/electron-store` 2>/dev/null; or add `src/types.d.ts`:

```typescript
// src/types.d.ts
declare module 'electron-store' {
  interface Options<T> { defaults?: T; }
  class Store<T extends Record<string, any>> {
    constructor(opts?: Options<T>);
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
  }
  export = Store;
}
```

- [ ] **Step 2: Run full compile check**

Run: `npx tsc --noEmit`
Expected: no errors across all files

- [ ] **Step 3: Run dev and verify**

Run: `npm run dev`

Manual verification:
- [ ] Pixel cat appears on desktop (transparent background)
- [ ] Click → cat blinks
- [ ] Double-click → cat jumps happily
- [ ] Drag cat → position moves
- [ ] Close window → restart → cat at saved position
- [ ] System tray icon → right-click → menu appears
- [ ] Tray menu → hide/show/settings/quit work

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: PixelPet MVP complete — pixel cat with interactions, tray, settings"
```

---

### Task 11: Electron Builder Packaging

**Files:**
- Create: `electron-builder.yml`

- [ ] **Step 1: Create electron-builder.yml**

```yaml
appId: com.pixelpet.app
productName: PixelPet
directories:
  output: release
files:
  - dist/**/*
  - dist-electron/**/*
win:
  target: nsis
  icon: null
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

- [ ] **Step 2: Build exe**

Run: `npm run build`
Expected: `release/PixelPet Setup 0.1.0.exe` created

- [ ] **Step 3: Commit**

```bash
git add electron-builder.yml
git commit -m "chore: electron-builder packaging config"
```

---

## Verification Checklist

- [ ] `npm run dev` → pixel cat visible on desktop
- [ ] Click → feedback animation (blink)
- [ ] Double-click → happy jump animation
- [ ] Drag → position changes, persists across restart
- [ ] 30s idle → cat sleeps (closed eyes animation)
- [ ] Click sleeping cat → wakes to idle
- [ ] Tray menu → show/hide/settings/quit
- [ ] Settings window opens and closes
- [ ] `npm run build` → produces installable exe
