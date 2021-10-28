import os from "os"
import * as pty from "node-pty";
import { BrowserWindow, ipcMain } from "electron";
import isDev from 'electron-is-dev';
declare const TERMINAL_WEBPACK_ENTRY: string;

const shell = os.platform() === "win32" ? "cmd.exe" : "bash";

export interface Payload {
  ship: string;
  data: string;
}

interface TerminalProcessParams {
  ship: string;
  initialCommand?: string;
  exitCommand?: string;
}

class TerminalProcess {
  ship: string;
  initialCommand?: string;
  exitCommand?: string;
  pty: pty.IPty;
  initialized: boolean;
  msgCount: number;
  window: BrowserWindow;

  constructor({ ship, initialCommand, exitCommand }: TerminalProcessParams) {
    this.ship = ship;
    this.initialCommand = initialCommand;
    this.exitCommand = exitCommand;
    this.initialized = false;
    this.msgCount = 0;
    this.window = new BrowserWindow({
      title: `${ship} | Terminal`,
      height: 450,
      width: 800,
      backgroundColor: "#000000",
      webPreferences: {
        nodeIntegration: true
      }
    });

    if (isDev) {
      this.window.webContents.openDevTools();
    }

    this.window.on('close', (event) => {
      event.preventDefault();
      this.destroy();
    });
    this.window.webContents.on('did-finish-load', () => {
      isDev && console.log('loaded, sending ship')
      this.window.webContents.send('ship', ship)
    })
    this.window.loadURL(TERMINAL_WEBPACK_ENTRY);
  } 

  init(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    const cwd = process.env.HOME || process.env.USERPROFILE;
    const baseEnv = Object.assign(
      {},
      process.env,
      {
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      }
    );

    isDev && console.log('initializing pty', cwd)
    try {
      this.pty = pty.spawn(shell, [], {
        cols: 80,
        rows: 30,
        cwd,
        env: baseEnv
      });
    } catch (err) {
      console.error('pty errored', err);
    }
    

    console.log('listening for data');
    this.pty.onData(data => {
      //console.log('sending terminal data', data)
      try {
        if (this.window) {
          this.window.webContents.send('terminal-incoming', { ship: this.ship, data });
        }
      } catch(err) {
        console.log(err)
      }

      this.msgCount++;
    });

    this.pty.onExit(({ exitCode, signal}) => {
      if (this.window) {
        this.window.destroy();
        this.window = null;
      }
      
      console.log('exiting with', exitCode, signal);
    })

    this.runInitCommand();
  }

  runInitCommand() {
    setTimeout(() => {
      if (this.initialCommand && this.msgCount >= 1) {
        console.log('writing', this.initialCommand);
        this.pty.write(this.initialCommand + '\r');
      } else {
        this.runInitCommand();
      }
    }, 500);
  }

  write(key: string): void {
    if (this.pty) {
      this.pty.write(key);
    }
  }

  destroy(): void {
    if (this.exitCommand && this.pty) {
      this.pty.write(this.exitCommand)
    }

    try {
      this.window.destroy();
      this.window = null;

      setTimeout(() => {
        if (this.pty) {
          this.pty.kill();
          this.pty = null;
        }
      }, 2000);
    } catch (err) {
      console.log('errored on destroy', err)
    }
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
  ipcMain.on('terminal-create', (event, params: TerminalProcessParams) => {
    const term = new TerminalProcess(params);
    isDev && console.log('creating terminal')
    procs.set(params.ship, term);
  })

  ipcMain.on('terminal-loaded', (event, ship) => {
    isDev && console.log('terminal loaded')
    withTerm(ship, term => term.init());
  })

  ipcMain.on('terminal-keystroke', (event, { ship, data }: Payload) => {
    withTerm(ship, term => term.write(data))
  })

  ipcMain.on('terminal-kill', (event, ship) => {
    withTerm(ship, term => {
      term.destroy();
      procs.delete(ship);
    });
  })
}