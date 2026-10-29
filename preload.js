'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desk', {
  sources: () => ipcRenderer.invoke('sources'),
  pick: (id, audio) => ipcRenderer.invoke('pick', id, audio),
  ytSearch: (q) => ipcRenderer.invoke('yt-search', q),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  win: (cmd) => ipcRenderer.send('win', cmd),
  flash: () => ipcRenderer.send('flash'),
  takeInvite: () => ipcRenderer.invoke('take-invite'),
  onInvite: (fn) => ipcRenderer.on('invite', (e, code) => fn(code)),
  appInfo: () => ipcRenderer.invoke('app-info'),
  onUpdateReady: (fn) => ipcRenderer.on('update-ready', (e, v) => fn(v)),
  installUpdate: () => ipcRenderer.send('install-update'),
  onMaximized: (fn) => ipcRenderer.on('maximized', (e, v) => fn(v)),
});
