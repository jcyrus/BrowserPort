import { contextBridge, ipcRenderer } from 'electron'

export interface Browser {
  id: string
  name: string
  path: string
  icon?: string
}

export interface ElectronAPI {
  getBrowsers: () => Promise<Browser[]>
  launchBrowser: (browserId: string, url: string) => Promise<{ success: boolean; error?: string }>
  hideWindow: () => Promise<void>
  onUrlReceived: (callback: (url: string) => void) => void
}

// Expose protected methods that allow the renderer process to interact with electron
contextBridge.exposeInMainWorld('electronAPI', {
  getBrowsers: () => ipcRenderer.invoke('get-browsers'),
  launchBrowser: (browserId: string, url: string) =>
    ipcRenderer.invoke('launch-browser', browserId, url),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  onUrlReceived: (callback: (url: string) => void) => {
    ipcRenderer.on('url-received', (_event, url: string) => callback(url))
  },
} satisfies ElectronAPI)
