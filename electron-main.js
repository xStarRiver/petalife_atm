const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

// Start the Express server internally
const server = require('./server');

const PORT = process.env.PORT || 3000;
let mainWindow = null;

// Kiosk mode only when explicitly enabled: set KIOSK_MODE=true in .env.local
const isKiosk = process.env.KIOSK_MODE === 'true';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 900,
        fullscreen: isKiosk,
        kiosk: isKiosk,
        autoHideMenuBar: true,
        frame: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Load the kiosk page from the internal Express server
    mainWindow.loadURL(`http://localhost:${PORT}/kiosk.html`);

    // In kiosk mode, prevent accidental closing (use Ctrl+Shift+Q)
    if (isKiosk) {
        mainWindow.on('close', (e) => {
            if (!app.isQuitting) {
                e.preventDefault();
            }
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Disable right-click context menu in kiosk mode
    mainWindow.webContents.on('context-menu', (e) => {
        e.preventDefault();
    });
}

app.whenReady().then(() => {
    createWindow();

    // Emergency exit shortcut: Ctrl+Shift+Q
    globalShortcut.register('CommandOrControl+Shift+Q', () => {
        app.isQuitting = true;
        app.quit();
    });

    // Dev tools shortcut: Ctrl+Shift+D (for debugging on kiosk)
    globalShortcut.register('CommandOrControl+Shift+D', () => {
        if (mainWindow) {
            mainWindow.webContents.toggleDevTools();
        }
    });

    // Reload shortcut: Ctrl+Shift+R
    globalShortcut.register('CommandOrControl+Shift+R', () => {
        if (mainWindow) {
            mainWindow.reload();
        }
    });
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}
