// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    openSettings: () => ipcRenderer.send(IPC.WINDOW_SETTINGS),
    openTodo: () => ipcRenderer.send(IPC.TODO_OPEN),
  },
  todo: {
    list: (): Promise<Array<{ id: string; text: string; done: boolean; createdAt: string }>> =>
      ipcRenderer.invoke(IPC.TODO_LIST),
    add: (text: string) => ipcRenderer.invoke(IPC.TODO_ADD, { text }),
    toggle: (id: string) => ipcRenderer.invoke(IPC.TODO_TOGGLE, { id }),
    delete: (id: string) => ipcRenderer.invoke(IPC.TODO_DELETE, { id }),
  },
});
