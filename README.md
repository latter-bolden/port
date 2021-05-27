# Port (beta)

[![awesome urbit badge](https://img.shields.io/badge/~-awesome%20urbit-lightgrey)](https://github.com/urbit/awesome-urbit)

Formerly called Taisho, Port allows you to spin up, access, and manage your ships whether they are comets, planets or potentially stars. It gives people the ability to immediately download and run Urbit without any knowledge of the command line.

## Installing

Head over to [releases](https://github.com/arthyn/port/releases) and download the installer from the latest release. Currently only available for MacOS and Linux. 

## Screenshots
![](https://hmillerdev.nyc3.digitaloceanspaces.com/nocsyx-lassul/taisho-welcome.jpg)  
![](https://hmillerdev.nyc3.digitaloceanspaces.com/nocsyx-lassul/taisho-moon.jpg)
![](https://hmillerdev.nyc3.digitaloceanspaces.com/nocsyx-lassul/taisho-boot.jpg)
![](https://hmillerdev.nyc3.digitaloceanspaces.com/nocsyx-lassul/taisho-launch.jpg)
![](https://hmillerdev.nyc3.digitaloceanspaces.com/nocsyx-lassul/taisho-home.jpg)

## Architecture

The architecture is built based off of James Long's article, [The Secret of Good Electron Apps](https://archive.jlongster.com/secret-of-good-electron-apps). With one exception, in production we don't run a simple process, but a hidden background window.

### Main

The main process' primary responsbility should be creation of windows and anything that requires interaction with the OS. Anything else should be diverted to the background window to ensure high performance.

### Background

The background folder contains all the services as well as the database client and an IPC server. Here is where most of the data and process management operations should happen. We also act as a proxy for the traditional IPC in most electron apps (not sure this is good, but it's what I went with.).

### Renderer

The renderer is a React + Typescript + TailwindCSS application. We use IPC to communicate only with the background process. External state like the DB is queried and mutated using react-query so that it is cached. Any internal UI state should run through either zustand or Context.

### Urbit

The urbit binaries for each respective OS should live in the `resources` folder under the respective OS' folder. They aren't included because of size, but you can get them by running the `get-urbit.sh` script.

**Windows**

The current plan for Windows is to wait for the port currently being reviewed by the core Urbit team. Once official we'll add support ASAP.

![Mothership](https://hmillerdev.nyc3.digitaloceanspaces.com/nocsyx-lassul/BALEEN%20CLASS_PATREON_190519.jpg)
