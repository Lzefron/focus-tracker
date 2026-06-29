const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCount:         () => ipcRenderer.invoke('get-count'),
  incrementCount:   () => ipcRenderer.invoke('increment-count'),
  decrementCount:   () => ipcRenderer.invoke('decrement-count'),
  resetCount:       () => ipcRenderer.invoke('reset-count'),
  saveStudySeconds: (s) => ipcRenderer.invoke('save-study-seconds', s),
  getStreak:        () => ipcRenderer.invoke('get-streak'),
  incrementStreak:  () => ipcRenderer.invoke('increment-streak'),
  resetStreak:      () => ipcRenderer.invoke('reset-streak'),
  collapse:         () => ipcRenderer.invoke('collapse-window'),
  expand:           () => ipcRenderer.invoke('expand-window'),
  setHeight:        (h) => ipcRenderer.invoke('set-height', h),
  minimize:         () => ipcRenderer.invoke('minimize-window'),
  closeApp:         () => ipcRenderer.invoke('close-app'),
});
