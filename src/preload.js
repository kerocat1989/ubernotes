const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Widget management
  createWidget: () => ipcRenderer.invoke('create-widget'),
  closeWidget: () => ipcRenderer.invoke('close-widget'),
  saveContent: (content) => ipcRenderer.invoke('save-content', content),
  
  // Event listeners
  onWidgetInit: (callback) => {
    ipcRenderer.on('widget-init', (event, data) => callback(data));
  },
  
  onGetContentForSave: (callback) => {
    ipcRenderer.on('get-content-for-save', () => callback());
  },
  
  // Send responses
  sendContentResponse: (widgetId, content) => {
    ipcRenderer.send(`content-response-${widgetId}`, content);
  }
});