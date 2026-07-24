// shared/ipc-channels.ts
export const IPC = {
  PET_STATE_REQUEST:   'pet:state:request',
  WINDOW_SETTINGS:     'window:settings',
  TRAY_HIDE_PET:       'tray:hide-pet',
  TRAY_SHOW_PET:       'tray:show-pet',
  TODO_LIST:           'todo:list',
  TODO_ADD:            'todo:add',
  TODO_TOGGLE:         'todo:toggle',
  TODO_DELETE:         'todo:delete',
  TODO_OPEN:           'todo:open',
} as const;
