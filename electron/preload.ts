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
