import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BrowserManager } from './browserManager'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// The built directory structure:
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main
// │ │ └── preload
process.env.DIST = path.join(__dirname, '../../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

let mainWindow: BrowserWindow | null = null
let pendingUrl: string | null = null
const browserManager = new BrowserManager()

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock()

if (gotTheLock) {
  app.on('second-instance', (_event, commandLine) => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    // Extract URL from command line (Windows/Linux)
    const url = commandLine.find((arg) => arg.startsWith('http'))
    if (url) {
      handleIncomingUrl(url)
    }
  })

  // Use async IIFE for initialization
  void (async () => {
    await app.whenReady()

    // Detect browsers on startup
    await browserManager.detectBrowsers()

    // Register as default protocol handler
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('http', process.execPath, [
          path.resolve(process.argv[1] ?? ''),
        ])
        app.setAsDefaultProtocolClient('https', process.execPath, [
          path.resolve(process.argv[1] ?? ''),
        ])
      }
    } else {
      app.setAsDefaultProtocolClient('http')
      app.setAsDefaultProtocolClient('https')
    }

    createWindow()

    // macOS: Handle URL open events
    app.on('open-url', (event, url) => {
      event.preventDefault()
      handleIncomingUrl(url)
    })

    // Check for URL in process.argv (Windows/Linux)
    const url = process.argv.find((arg) => arg.startsWith('http'))
    if (url) {
      handleIncomingUrl(url)
    }
  })()

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
} else {
  app.quit()
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    ...(process.platform === 'darwin' && {
      vibrancy: 'under-window',
    }),
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(process.env.DIST ?? '', 'index.html'))
  }

  // Ready to show
  mainWindow.once('ready-to-show', () => {
    if (pendingUrl) {
      showWindowWithUrl(pendingUrl)
      pendingUrl = null
    } else if (process.env.VITE_DEV_SERVER_URL) {
      // In dev mode, show window with a test URL
      showWindowWithUrl('https://github.com/electron/electron')
    }
  })

  // Only auto-hide on blur in production mode
  // In dev mode, DevTools steals focus and would hide the window
  if (!process.env.VITE_DEV_SERVER_URL) {
    mainWindow.on('blur', () => {
      mainWindow?.hide()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function handleIncomingUrl(url: string) {
  if (!mainWindow) {
    // Store for later when window is ready
    pendingUrl = url
    return
  }

  if (mainWindow.webContents.isLoading()) {
    pendingUrl = url
  } else {
    showWindowWithUrl(url)
  }
}

function showWindowWithUrl(url: string) {
  if (!mainWindow) return

  // Send URL to renderer
  mainWindow.webContents.send('url-received', url)

  // Show and focus the window
  mainWindow.show()
  mainWindow.focus()

  // Ensure keyboard focus
  if (process.platform === 'darwin') {
    app.dock.show()
  }
}

// IPC Handlers
ipcMain.handle('get-browsers', async () => {
  return browserManager.getBrowsers()
})

ipcMain.handle('launch-browser', async (_event, browserId: string, url: string) => {
  try {
    await browserManager.launchBrowserWithUrl(browserId, url)

    // Hide the window after launching
    mainWindow?.hide()

    return { success: true }
  } catch (error) {
    console.error('Failed to launch browser:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

ipcMain.handle('hide-window', async () => {
  mainWindow?.hide()
})
