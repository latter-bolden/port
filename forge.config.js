const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const getPlatform = require('./src/get-platform');
const AppRootDir = require('app-root-dir');

module.exports = {
  packagerConfig: {
    //extraResource: "resources",
    icon: "icons/urbit-logo"
  },
  hooks: {
    packageAfterCopy: (forgeConfig, buildPath, electronVersion, platform) => {
      //console.log({ buildPath, electronVersion, arch, platform, })

      // const os = ['linux', 'mac', 'win'].filter(target => target !== getPlatform(platform))
      // const dirPath = (os) => path.resolve(buildPath, `../resources/${os}`)
      // os.forEach(osDir => {
      //   const dir = dirPath(osDir)
      //   console.log(dir)
      //   fs.rmSync(dir, { recursive: true })
      // })
      const os = getPlatform(platform)
      fse.copySync(path.join(AppRootDir.get(), 'resources', os), path.resolve(buildPath, '..', 'resources', os))
      console.log({ platform, os })
    }
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "taisho"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "darwin",
        "linux"
      ]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        icon: "icons/urbit-logo.png"
      }
    }
  ],
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
        mainConfig: "./src/main/webpack.main.config.js",
        renderer: {
          config: "./src/renderer/webpack.renderer.config.js",
          entryPoints: [
            {
              name: "main_window",
              html: "./src/renderer/index.html",
              js: "./src/renderer/renderer.tsx",
              preload: {
                js: "./src/renderer/client/preload.ts"
              }
            },
            {
              html: "./src/background/server/server.html",
              js: "./src/background/main.ts",
              name: "background_window"
            }
          ]
        }
      }
    ]
  ]
}