import os from "os"
import { IPty, spawn } from "node-pty";
import { BrowserWindow, ipcMain } from "electron";
import isDev from 'electron-is-dev';
declare const TERMINAL_WEBPACK_ENTRY: string;

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

interface Payload {
  ship: string;
  data: string;
}

class TerminalProcess {
  ship: string;
  pty: IPty;
  window: BrowserWindow;

  constructor(ship: string) {
    this.ship = ship;
    this.window = new BrowserWindow({
      height: 450,
      width: 800,
      backgroundColor: "#000000",
      webPreferences: {
        nodeIntegration: true
      }
    });
    this.window.on('close', () => {
      this.destroy();
    });
    this.window.webContents.on('did-finish-load', () => {
      isDev && console.log('loaded, sending ship')
      this.window.webContents.send('ship', ship)
    })
    this.window.loadURL(TERMINAL_WEBPACK_ENTRY);
  }

  init(): void {
    isDev && console.log('initializing pty')
    this.pty = spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env
    });

    this.pty.onData(data => {
      console.log('sending terminal data', data)
      this.window.webContents.send('terminal-incoming', data)
    });
  }

  write(key: string): void {
    this.pty.write(key);
  }

  destroy(): void {
    this.window.destroy();
    this.pty.kill();
  }
}

const procs = new Map<string, TerminalProcess>();

function withTerm(ship: string, cb: (term: TerminalProcess) => void) {
  const term = procs.get(ship);

  if (term) {
    cb(term);
  }
}

export function start(): void {
  ipcMain.on('terminal-create', (event, ship) => {
    const term = new TerminalProcess(ship);
    isDev && console.log('creating terminal')
    procs.set(ship, term);
  })

  ipcMain.on('terminal-loaded', (event, ship) => {
    isDev && console.log('terminal loaded')
    withTerm(ship, term => term.init());
  })

  ipcMain.on('terminal-keystroke', (event, { ship, data }: Payload) => {
    withTerm(ship, term => term.write(data))
  })

  ipcMain.on('terminal-kill', (event, ship) => {
    withTerm(ship, term => term.destroy());
  })
}