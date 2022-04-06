import { ipcRenderer } from 'electron'
import ipc from 'node-ipc'
import { init } from './ipc'

const isDev = ipcRenderer.sendSync('is-dev');
window.IS_DEV = isDev

let resolveSocketPromise: (value?: string) => void
const socketPromise = new Promise((resolve: (value?: string) => void) => {
  resolveSocketPromise = resolve
})

window.getServerSocket = () => socketPromise

ipcRenderer.on('set-socket', (event, { name }: { name: string}) => {
  resolveSocketPromise(name)
})

window.ipcConnect = id => {
  ipc.config.silent = true

  return new Promise(resolve => {
    ipc.connectTo(id, () => resolve(ipc.of[id]))
  })
}

init()