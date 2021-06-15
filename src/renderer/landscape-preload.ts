import { ipcRenderer } from 'electron'

window.prompt = function(title, val){
  return ipcRenderer.sendSync('prompt', {title, val})
}