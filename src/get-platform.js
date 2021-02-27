const { platform } = require('os');

module.exports = {
  getPlatform: (plat) => {
    switch (plat || platform()) {
      case 'aix':
      case 'freebsd':
      case 'linux':
      case 'openbsd':
      case 'android':
        return 'linux';
      case 'darwin':
      case 'sunos':
        return 'mac';
      case 'win32':
        return 'win';
    }
  },
  getPlatformPathSegments: (platform) => {
    return platform === 'mac' ? ['..', '..', 'Frameworks'] : ['..']
  }
}