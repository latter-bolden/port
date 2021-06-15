import { ipcRenderer } from "electron"
import '../styles/fonts.css';
import '../styles/index.css';

const label = document.getElementById('title') as HTMLLabelElement;
const input = document.getElementById('val') as HTMLInputElement;
const cancel = document.getElementById('cancel')
const ok = document.getElementById('ok')

const data = ipcRenderer.sendSync('prompt-initialize')
label.textContent = data?.title || '';
input.value = data?.val || '';

cancel.addEventListener('click', () => window.close())

ok.addEventListener('click', () => {
    ipcRenderer.send('prompt-response', input.value)
    window.close()
})