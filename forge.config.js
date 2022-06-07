const path = require('path');
const fse = require('fs-extra');
const gp = require('./src/get-platform');
const AppRootDir = require('app-root-dir');
require('dotenv').config()

module.exports = {
  packagerConfig: {
    appBundleId: 'dev.hmiller.port',
    // asar: {
    //   unpack: '**/node_modules/node-pty/build/Release/*'
    // },
    name: 'port',
    executableName: 'port',
    darwinDarkModeSupport: 'true',
    icon: "icons/urbit-logo",
    protocols: [
      {
        name: "Urbit Links",
        protocol: "web+urbitgraph",
        schemes: ["web+urbitgraph"]
      }
    ],
    extendInfo: {
      NSMicrophoneUsageDescription: "We need access to your microphone for Urbit apps",
      NSCameraUsageDescription: "We need access to your camera for Urbit apps"
    },
    osxSign: {
      identity: 'Developer ID Application: Hunter Miller (8YA38DLJ3T)',
      "entitlements": "entitlements.plist",
      "entitlements-inherit": "entitlements.plist",
      'hardened-runtime': true,
      'gatekeeper-assess': false,
      'signature-flags': 'library',
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      ascProvider: '8YA38DLJ3T'
    },
    win32metadata: {
      CompanyName: 'Urbit Foundation'
    }
  },
  hooks: {
    packageAfterCopy: (forgeConfig, buildPath, electronVersion, platform) => {
      const os = gp.getPlatform(platform)
      fse.copySync(path.join(AppRootDir.get(), 'resources', os), path.resolve(buildPath, ...gp.getPlatformPathSegments(os), 'resources', os), {
        filter: (src) => !src.includes('.gitignore')
      })
      console.log({ platform, os })
    },
    postMake: (forgeConfig, makeResults) => {
      if (process.env.GITHUB_WORKFLOW === 'Publish MacOS — arm64') {
          let updatedResults = []
          for (let makeResult of makeResults) {
            let artifacts = makeResult.artifacts
            let oldPath = artifacts.find(path => path.includes('.dmg'))
            if (oldPath) {
              let newPath = path.join(path.dirname(oldPath), 'Port-arm64.dmg')
              fse.renameSync(oldPath, newPath)
              makeResult.artifacts = artifacts.filter(path => !path.includes('.dmg'))
              makeResult.artifacts.push(newPath)
            }

            updatedResults.push(makeResult)
          }

          return updatedResults
      }
    }
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        setupExe: "PortSetup.exe",
        setupIcon: "icons/urbit-logo.ico"
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: "Port",
        icon: "icons/urbit-logo.icns"
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
      name: '@electron-forge/maker-flatpak',
      config: {
        options: {
          id: 'org.urbit.port',
          productName: 'Port',
          description: 'Host an Urbit from your computer in just a few clicks. Use your own planet, moon, or comet to join the network, no technical knowhow required.',
          cagegories: ['Network']
        },
        modules: [
          {
            "name": "zypak",
            "sources": [
              {
                "type": "git",
                "url": "https://github.com/refi64/zypak",
                "tag": "v2022.04"
              }
            ]
          }
        ]
      }
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        mimeType: ["x-scheme-handler/web+urbitgraph"],
        options: {
          icon: "icons/urbit-logo.png",
          depends: [
            "libx11-xcb1"
          ]
        }        
      }
    },
    {
      name: "@davidwinter/electron-forge-maker-snap",
      config: {
        grade: process.env.DEV ? 'devel' : 'stable',
        execFlags: '%u',
        mimeTypes: 'x-scheme-handler/web+urbitgraph',
        stagePackages: ['default', 'libx11-xcb1', 'fonts-noto', 'fonts-noto-color-emoji'],
        categories: 'Utility',
        description: "This app allows you to spin up, access, and manage your Urbit ships whether they are comets, planets or potentially stars. It gives people the ability to immediately download and run Urbit without any knowledge of the command line.",
      }
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'urbit',
          name: 'port'
        },
        draft: true
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
          nodeIntegration: true,
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
              name: "terminal",
              html: "./src/renderer/terminal/index.html",
              js: "./src/renderer/terminal/index.tsx",
              preload: {
                js: "./src/renderer/client/preload.ts"
              }
            },
            {
              html: "./src/background/server/server.html",
              js: "./src/background/main.ts",
              name: "background_window"
            },
            {
              html: "./src/renderer/prompt/index.html",
              js: "./src/renderer/prompt/index.ts",
              name: "prompt"
            },
            {
              html: "./src/background/server/server.html", //just using for blank
              js: "./src/renderer/landscape-preload.ts",
              name: "landscape",
              preload: {
                js: "./src/renderer/landscape-preload.ts"
              }
            }
          ]
        }
      }
    ]
  ]
}