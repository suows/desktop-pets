// shared/ipc-channels.ts
export const IPC = {
  PET_POSITION_SAVE:   'pet:position:save',
  PET_POSITION_LOAD:   'pet:position:load',
  PET_STATE_REQUEST:   'pet:state:request',
  WINDOW_SETTINGS:     'window:settings',
  TRAY_HIDE_PET:       'tray:hide-pet',
  TRAY_SHOW_PET:       'tray:show-pet',
} as const;
