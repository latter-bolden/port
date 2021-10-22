import { BrowserWindow } from "electron";
import ipc from "node-ipc";
import { IPty, spawn } from "node-pty";
import os from "os"
import { HandlerEntry, send } from "../server/ipc";
import isDev from 'electron-is-dev';
declare const TERMINAL_WEBPACK_ENTRY: string;

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

class TerminalProcess {
  ship: string;
  pty: IPty;
  window: BrowserWindow;

  constructor(ship: string) {
    this.ship = ship;
    this.window = new BrowserWindow({
      height: 450,
      width: 800,
      webPreferences: {
        nodeIntegration: true
      }
    });
    this.window.on('close', () => {
      this.destroy();
    });
    this.window.webContents.on('did-finish-load', () => {
      isDev && console.log('background finished loading', 'socket', ipc.config.id)
      this.window.webContents.send('ship', ship)
      this.window.webContents.send('set-socket', { name: ipc.config.id }) // ipc socket should already be set
    })
    this.window.loadURL(TERMINAL_WEBPACK_ENTRY);
  }

  init(): void {
    this.pty = spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env
    });

    this.pty.onData((data) => send('terminal-incoming', data));
  }

  write(key: string): void {
    this.pty.write(key);
  }

  destroy(): void {
    this.pty.kill();
  }
}

export interface TerminalHandlers {
  'terminal-create': TerminalService['create'];
  'terminal-keystroke': TerminalService['keystroke'];
  'terminal-loaded': TerminalService['initialize'];
}

export class TerminalService {
  private readonly runningTerminals: Map<string, TerminalProcess>;

  constructor() {
    this.runningTerminals = new Map();
  }

  handlers(): HandlerEntry<TerminalHandlers>[] {
    return [
      { name: 'terminal-loaded', handler: this.initialize.bind(this) },
      { name: 'terminal-keystroke', handler: this.keystroke.bind(this) }
    ]
  }

  create(ship: string): void {
    this.runningTerminals.set(ship, new TerminalProcess(ship));
  }

  initialize(ship: string): void {
    const terminal = this.runningTerminals.get(ship)
    if (terminal) {
      terminal.init();
    }
  }

  keystroke({ ship, data }: Payload): void {
    const terminal = this.runningTerminals.get(ship)
    
    if (terminal) {
      terminal.write(data);
    }
  }
}

interface Payload {
  ship: string;
  data: string;
}