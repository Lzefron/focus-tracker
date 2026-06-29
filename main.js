const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let win;
let tray;

function getTodayKey() {
  return 'problems-' + new Date().toISOString().slice(0, 10);
}
function getTodayStudyKey() {
  return 'study-seconds-' + new Date().toISOString().slice(0, 10);
}
function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return 'study-seconds-' + d.toISOString().slice(0, 10);
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const winW = 220;
  const winH = 260;
  const margin = 16;

  const savedX = store.get('win-x', width - winW - margin);
  const savedY = store.get('win-y', height - winH - margin);

  win = new BrowserWindow({
    width: winW,
    height: winH,
    x: savedX,
    y: savedY,
    alwaysOnTop: true,
    level: 'screen-saver',
    frame: false,
    transparent: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  win.on('moved', () => {
    const [x, y] = win.getPosition();
    store.set('win-x', x);
    store.set('win-y', y);
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show / Hide',
      click: () => {
        if (win.isVisible()) {
          win.hide();
        } else {
          win.show();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit FocusTracker',
      click: () => {
        app.exit(0);
      },
    },
  ]);

  tray.setToolTip('FocusTracker');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  });
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true, name: 'FocusTracker' });
  }

  createWindow();
  createTray();
});

app.on('window-all-closed', (e) => e.preventDefault());

// IPC handlers
ipcMain.handle('get-count', () => store.get(getTodayKey(), 0));

ipcMain.handle('increment-count', () => {
  const val = store.get(getTodayKey(), 0) + 1;
  store.set(getTodayKey(), val);
  return val;
});

ipcMain.handle('decrement-count', () => {
  const val = Math.max(0, store.get(getTodayKey(), 0) - 1);
  store.set(getTodayKey(), val);
  return val;
});

ipcMain.handle('reset-count', () => {
  store.set(getTodayKey(), 0);
  return 0;
});

ipcMain.handle('save-study-seconds', (_event, seconds) => {
  store.set(getTodayStudyKey(), seconds);
});

ipcMain.handle('get-streak', () => {
  const streak = store.get('streak', 0);
  const lastDate = store.get('streak-last-date', '');
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  if (!lastDate) return streak;

  // If last date is more than 1 day ago (not today or yesterday), reset streak
  if (lastDate !== today && lastDate !== yesterday) {
    store.set('streak', 0);
    store.set('streak-last-date', '');
    return 0;
  }

  return streak;
});

ipcMain.handle('increment-streak', () => {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = store.get('streak-last-date', '');

  if (lastDate === today) {
    return store.get('streak', 0);
  }

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  let streak = store.get('streak', 0);

  if (lastDate === yesterday) {
    streak += 1;
  } else if (lastDate === '') {
    streak = 1;
  } else {
    streak = 1;
  }

  store.set('streak', streak);
  store.set('streak-last-date', today);
  return streak;
});

ipcMain.handle('reset-streak', () => {
  store.set('streak', 0);
  store.set('streak-last-date', '');
  return 0;
});

ipcMain.handle('collapse-window', () => {
  win.setSize(220, 28);
});

ipcMain.handle('expand-window', () => {
  win.setSize(220, 260);
});

ipcMain.handle('set-height', (_event, h) => {
  win.setSize(220, h);
});

ipcMain.handle('minimize-window', () => {
  win.minimize();
});

ipcMain.handle('close-app', () => {
  win.hide();
});
