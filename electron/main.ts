// electron/main.ts
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { IPC } from '../shared/ipc-channels';
import Store from 'electron-store';
import crypto from 'crypto';

const store = new Store({
  projectName: 'PixelPet',
  defaults: {
    pet: { x: 100, y: 100 },
    settings: { autoLaunch: false, soundEnabled: false, opacity: 1.0 },
    todos: [] as Array<{ id: string; text: string; done: boolean; createdAt: string }>,
  }
} as any);

let petWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let todoWindow: BrowserWindow | null = null;
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
    maximizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  petWindow.setVisibleOnAllWorkspaces(true);
  petWindow.setAlwaysOnTop(true, 'floating');

  // Auto-save position when window is moved (by CSS -webkit-app-region drag)
  const POSITION_SAVE_DEBOUNCE_MS = 200;
  let moveTimer: ReturnType<typeof setTimeout> | null = null;
  petWindow.on('moved', () => {
    if (moveTimer) clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      moveTimer = null;
      const [x, y] = petWindow!.getPosition();
      store.set('pet', { x, y });
    }, POSITION_SAVE_DEBOUNCE_MS);
  });

  petWindow.on('close', () => {
    if (moveTimer) {
      clearTimeout(moveTimer);
      moveTimer = null;
    }
    // Save final position eagerly (don't rely on debounce timer)
    const [x, y] = petWindow!.getPosition();
    store.set('pet', { x, y });
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    petWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/pet`);
  } else {
    petWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/pet' });
  }
}

function createSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 360, height: 480,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWindow.on('closed', () => { settingsWindow = null; });
  if (process.env.VITE_DEV_SERVER_URL) {
    settingsWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/settings`);
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/settings' });
  }
}

function createTodoWindow(): void {
  if (todoWindow && !todoWindow.isDestroyed()) {
    todoWindow.focus();
    return;
  }
  const petPos = store.get('pet') as { x: number; y: number };
  todoWindow = new BrowserWindow({
    width: 280, height: 400,
    x: petPos.x + 180,  // 20px to the right of pet window (pet width 160 + 20)
    y: petPos.y,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  todoWindow.on('closed', () => { todoWindow = null; });
  if (process.env.VITE_DEV_SERVER_URL) {
    todoWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/todo`);
  } else {
    todoWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/todo' });
  }
}

function createTray(): void {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示 PixelPet', click: () => petWindow?.show() },
    { label: '隐藏 PixelPet', click: () => petWindow?.hide() },
    { type: 'separator' },
    { label: '待办事项', click: () => createTodoWindow() },
    { label: '设置', click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: '退出', click: () => { (app as any).isQuitting = true; app.quit(); } },
  ]);
  tray.setToolTip('PixelPet');
  tray.setContextMenu(contextMenu);
}

// IPC handlers
ipcMain.on(IPC.WINDOW_SETTINGS, () => {
  createSettingsWindow();
});

ipcMain.handle(IPC.TODO_LIST, () => {
  return store.get('todos');
});

ipcMain.handle(IPC.TODO_ADD, (_event, todo: { text: string }) => {
  const todos = store.get('todos') as any[];
  todos.push({
    id: crypto.randomUUID(),
    text: todo.text,
    done: false,
    createdAt: new Date().toISOString(),
  });
  store.set('todos', todos);
  return todos;
});

ipcMain.handle(IPC.TODO_TOGGLE, (_event, { id }: { id: string }) => {
  const todos = store.get('todos') as any[];
  const todo = todos.find((t: any) => t.id === id);
  if (todo) { todo.done = !todo.done; store.set('todos', todos); }
  return todos;
});

ipcMain.handle(IPC.TODO_DELETE, (_event, { id }: { id: string }) => {
  const todos = (store.get('todos') as any[]).filter((t: any) => t.id !== id);
  store.set('todos', todos);
  return todos;
});

ipcMain.on(IPC.TODO_OPEN, () => {
  createTodoWindow();
});

app.whenReady().then(() => {
  createPetWindow();
  createTray();
});

app.on('window-all-closed', () => {}); // don't quit
app.on('activate', () => { if (!petWindow) createPetWindow(); });
(app as any).isQuitting = false;
