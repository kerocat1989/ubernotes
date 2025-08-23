const { app, BrowserWindow, Menu, ipcMain, globalShortcut, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'debug';

// Initialize persistent store
const store = new Store({
  name: 'ubernotes-config',
  defaults: {
    widgets: {},
    settings: {
      voiceDictationEnabled: true,
      aiMutatorEnabled: true,
      autostart: true
    }
  }
});

let widgets = new Map();
let isQuitting = false;

// Hide dock icon during normal use
if (process.platform === 'darwin') {
  app.dock.hide();
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus existing widgets
    for (let widget of widgets.values()) {
      if (widget && !widget.isDestroyed()) {
        widget.show();
        widget.focus();
      }
    }
  });
}

class WidgetManager {
  constructor() {
    this.nextId = 1;
  }

  createWidget(options = {}) {
    const widgetId = this.nextId++;
    const savedState = store.get(`widgets.${widgetId}`, {});
    
    // Get display bounds for positioning
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    const defaultOptions = {
      width: 300,
      height: 200,
      x: Math.floor(Math.random() * (width - 300)),
      y: Math.floor(Math.random() * (height - 200)),
      content: '',
      template: 'note'
    };
    
    const widgetOptions = {
      ...defaultOptions,
      ...savedState,
      ...options
    };

    const widget = new BrowserWindow({
      width: widgetOptions.width,
      height: widgetOptions.height,
      x: widgetOptions.x,
      y: widgetOptions.y,
      frame: false,
      transparent: true,
      resizable: true,
      movable: true,
      minimizable: false,
      maximizable: false,
      closable: true,
      skipTaskbar: true,
      alwaysOnTop: false,
      hasShadow: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load widget UI
    widget.loadFile(path.join(__dirname, 'widget.html'));
    
    // Set widget ID and initial content
    widget.webContents.once('dom-ready', () => {
      widget.webContents.send('widget-init', {
        id: widgetId,
        content: widgetOptions.content,
        template: widgetOptions.template
      });
    });

    // Handle widget events
    widget.on('close', (event) => {
      if (!isQuitting) {
        // Save state before closing
        this.saveWidgetState(widgetId, widget);
      }
      widgets.delete(widgetId);
    });

    widget.on('resize', () => {
      this.saveWidgetState(widgetId, widget);
    });

    widget.on('move', () => {
      this.saveWidgetState(widgetId, widget);
    });

    // Handle unsafe changes blocking
    widget.webContents.on('will-navigate', (event, navigationUrl) => {
      // Block navigation to external URLs
      if (navigationUrl !== widget.webContents.getURL()) {
        event.preventDefault();
        log.warn('Blocked unsafe navigation to:', navigationUrl);
      }
    });

    widgets.set(widgetId, widget);
    log.info(`Created widget ${widgetId} with options:`, widgetOptions);
    
    return widget;
  }

  saveWidgetState(widgetId, widget) {
    if (widget && !widget.isDestroyed()) {
      const bounds = widget.getBounds();
      const stateKey = `widgets.${widgetId}`;
      
      widget.webContents.send('get-content-for-save');
      
      // Listen for content response
      ipcMain.once(`content-response-${widgetId}`, (event, content) => {
        store.set(stateKey, {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          content: content
        });
        log.debug(`Saved state for widget ${widgetId}:`, bounds);
      });
    }
  }

  restoreAllWidgets() {
    const savedWidgets = store.get('widgets', {});
    
    for (const [widgetId, state] of Object.entries(savedWidgets)) {
      if (state && typeof state === 'object') {
        this.createWidget(state);
      }
    }
    
    // If no widgets exist, create a default one
    if (Object.keys(savedWidgets).length === 0) {
      this.createWidget();
    }
  }

  closeAllWidgets() {
    for (let widget of widgets.values()) {
      if (widget && !widget.isDestroyed()) {
        widget.close();
      }
    }
    widgets.clear();
  }
}

const widgetManager = new WidgetManager();

// App event handlers
app.whenReady().then(() => {
  // Create application menu (hidden but enables shortcuts)
  const template = [
    {
      label: 'UberNotes',
      submenu: [
        { label: 'New Widget', accelerator: 'CmdOrCtrl+N', click: () => widgetManager.createWidget() },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    widgetManager.createWidget();
  });

  // Restore saved widgets
  widgetManager.restoreAllWidgets();

  log.info('UberNotes started successfully');
});

app.on('before-quit', (event) => {
  isQuitting = true;
  log.info('Application is quitting...');
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, restore widgets when dock icon is clicked
  if (widgets.size === 0) {
    widgetManager.restoreAllWidgets();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle('create-widget', () => {
  return widgetManager.createWidget();
});

ipcMain.handle('close-widget', (event) => {
  const widget = BrowserWindow.fromWebContents(event.sender);
  if (widget) {
    widget.close();
  }
});

ipcMain.handle('save-content', (event, content) => {
  const widget = BrowserWindow.fromWebContents(event.sender);
  if (widget) {
    // Find widget ID
    for (let [id, w] of widgets.entries()) {
      if (w === widget) {
        const currentState = store.get(`widgets.${id}`, {});
        store.set(`widgets.${id}`, { ...currentState, content });
        break;
      }
    }
  }
});

// Enable autostart on macOS
if (process.platform === 'darwin' && store.get('settings.autostart', true)) {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true
  });
}

module.exports = { widgetManager, store };
