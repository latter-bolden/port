const path = require('path');
const fse = require('fs-extra');
const gp = require('./src/get-platform');
const AppRootDir = require('app-root-dir');
require('dotenv').config()

module.exports = {
  packagerConfig: {
    appBundleId: 'dev.hmiller.port',
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
    }
  },
  hooks: {
    packageAfterCopy: (forgeConfig, buildPath, electronVersion, platform) => {
      const os = gp.getPlatform(platform)
      fse.copySync(path.join(AppRootDir.get(), 'resources', os), path.resolve(buildPath, ...gp.getPlatformPathSegments(os), 'resources', os), {
        filter: (src) => !src.includes('.gitignore')
      })
      console.log({ platform, os })
    }
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {}
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
      name: "@electron-forge/maker-deb",
      config: {
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
          owner: 'arthyn',
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