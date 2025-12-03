import { ElectronAPI } from '../preload/index'

declare global {
  // eslint-disable-next-line no-var
  var electronAPI: ElectronAPI
}
