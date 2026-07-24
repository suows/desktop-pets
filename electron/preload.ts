// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    openSettings: () => ipcRenderer.send(IPC.WINDOW_SETTINGS),
  },
});
