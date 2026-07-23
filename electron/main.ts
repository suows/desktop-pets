// electron/main.ts
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron';
import path from 'path';
import { IPC } from '../shared/ipc-channels';
import Store from 'electron-store';

const store = new Store({
  projectName: 'PixelPet',
  defaults: {
    pet: { x: 100, y: 100 },
    settings: { autoLaunch: false, soundEnabled: false, opacity: 1.0 }
  }
} as any);

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
    { label: '退出', click: () => { (app as any).isQuitting = true; app.quit(); } },
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
(app as any).isQuitting = false;
