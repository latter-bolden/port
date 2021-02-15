import { ipcRenderer, remote } from 'electron'
import * as ipc from './ipc'

export function init<T extends ipc.HandlerMap<T>>(handlers: T): void {
  let isDev, version

  if (process.argv[2] === '--subprocess') {
    isDev = false
    version = process.argv[3]

    const socketName = process.argv[4]
    ipc.init(socketName, handlers)
  } else {
    isDev = true
    version = remote.app.getVersion()

    ipcRenderer.on('set-socket', (event, { name }) => {
      ipc.init(name, handlers)
    })
  }

  console.log(version, isDev)
}
