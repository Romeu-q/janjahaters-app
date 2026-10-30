'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desk', {
  sources: () => ipcRenderer.invoke('sources'),
  pick: (id, audio) => ipcRenderer.invoke('pick', id, audio),
  ytSearch: (q) => ipcRenderer.invoke('yt-search', q),
  ytRelated: (id) => ipcRenderer.invoke('yt-related', id),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  win: (cmd) => ipcRenderer.send('win', cmd),
  flash: () => ipcRenderer.send('flash'),
  takeInvite: () => ipcRenderer.invoke('take-invite'),
  onInvite: (fn) => ipcRenderer.on('invite', (e, code) => fn(code)),
  appInfo: () => ipcRenderer.invoke('app-info'),
  onUpdateReady: (fn) => ipcRenderer.on('update-ready', (e, v) => fn(v)),
  installUpdate: () => ipcRenderer.send('install-update'),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  onUpdateProgress: (fn) => ipcRenderer.on('update-progress', (e, pct) => fn(pct)),
  setPrefs: (p) => ipcRenderer.invoke('set-prefs', p),
  onHotkey: (fn) => ipcRenderer.on('hotkey', (e, action) => fn(action)),
  googleLogin: (uid) => ipcRenderer.invoke('google-login', uid),
  googleCancel: () => ipcRenderer.send('google-cancel'),
  googleVerify: (token, uid) => ipcRenderer.invoke('google-verify', token, uid),
  onMaximized: (fn) => ipcRenderer.on('maximized', (e, v) => fn(v)),
});
