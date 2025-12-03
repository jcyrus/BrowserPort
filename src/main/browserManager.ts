import fs from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface Browser {
  id: string
  name: string
  path: string
  icon?: string
}

export class BrowserManager {
  private browsers: Browser[] = []

  async detectBrowsers(): Promise<Browser[]> {
    this.browsers = []

    switch (process.platform) {
      case 'darwin':
        await this.detectMacBrowsers()
        break
      case 'win32':
        await this.detectWindowsBrowsers()
        break
      case 'linux':
        await this.detectLinuxBrowsers()
        break
    }

    return this.browsers
  }

  getBrowsers(): Browser[] {
    return this.browsers
  }

  getBrowserById(id: string): Browser | undefined {
    return this.browsers.find((b) => b.id === id)
  }

  async launchBrowserWithUrl(browserId: string, url: string): Promise<void> {
    const browser = this.getBrowserById(browserId)
    if (!browser) {
      throw new Error(`Browser not found: ${browserId}`)
    }

    switch (process.platform) {
      case 'darwin':
        // macOS: use 'open' command with -a flag to specify app
        await execFileAsync('open', ['-a', browser.path, url])
        break
      case 'win32':
        // Windows: launch the executable with the URL as argument
        await execFileAsync(browser.path, [url])
        break
      case 'linux':
        // Linux: launch the browser binary with the URL
        await execFileAsync(browser.path, [url])
        break
      default:
        throw new Error(`Unsupported platform: ${process.platform}`)
    }
  }

  private async detectMacBrowsers() {
    const appPaths = [
      { id: 'chrome', name: 'Google Chrome', path: '/Applications/Google Chrome.app' },
      { id: 'firefox', name: 'Firefox', path: '/Applications/Firefox.app' },
      { id: 'safari', name: 'Safari', path: '/Applications/Safari.app' },
      { id: 'edge', name: 'Microsoft Edge', path: '/Applications/Microsoft Edge.app' },
      { id: 'brave', name: 'Brave', path: '/Applications/Brave Browser.app' },
      { id: 'arc', name: 'Arc', path: '/Applications/Arc.app' },
      { id: 'opera', name: 'Opera', path: '/Applications/Opera.app' },
      { id: 'vivaldi', name: 'Vivaldi', path: '/Applications/Vivaldi.app' },
    ]

    for (const app of appPaths) {
      if (fs.existsSync(app.path)) {
        this.browsers.push(app)
      }
    }
  }

  private async detectWindowsBrowsers() {
    const possiblePaths = [
      {
        id: 'chrome',
        name: 'Google Chrome',
        paths: [
          String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
          String.raw`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
        ],
      },
      {
        id: 'firefox',
        name: 'Firefox',
        paths: [
          String.raw`C:\Program Files\Mozilla Firefox\firefox.exe`,
          String.raw`C:\Program Files (x86)\Mozilla Firefox\firefox.exe`,
        ],
      },
      {
        id: 'edge',
        name: 'Microsoft Edge',
        paths: [
          String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
          String.raw`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
        ],
      },
      {
        id: 'brave',
        name: 'Brave',
        paths: [
          String.raw`C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`,
          String.raw`C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe`,
        ],
      },
      {
        id: 'opera',
        name: 'Opera',
        paths: [
          String.raw`C:\Program Files\Opera\launcher.exe`,
          String.raw`C:\Program Files (x86)\Opera\launcher.exe`,
        ],
      },
    ]

    for (const browser of possiblePaths) {
      const foundPath = browser.paths.find((p) => fs.existsSync(p))
      if (foundPath) {
        this.browsers.push({
          id: browser.id,
          name: browser.name,
          path: foundPath,
        })
      }
    }
  }

  private async detectLinuxBrowsers() {
    const browsers = [
      { id: 'chrome', name: 'Google Chrome', command: 'google-chrome' },
      { id: 'chromium', name: 'Chromium', command: 'chromium' },
      { id: 'firefox', name: 'Firefox', command: 'firefox' },
      { id: 'brave', name: 'Brave', command: 'brave-browser' },
      { id: 'opera', name: 'Opera', command: 'opera' },
      { id: 'vivaldi', name: 'Vivaldi', command: 'vivaldi' },
    ]

    for (const browser of browsers) {
      try {
        const { stdout } = await execFileAsync('which', [browser.command])
        if (stdout.trim()) {
          this.browsers.push({
            id: browser.id,
            name: browser.name,
            path: stdout.trim(),
          })
        }
      } catch {
        // Browser not found, skip
      }
    }
  }
}
