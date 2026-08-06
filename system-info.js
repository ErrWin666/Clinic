const os = require("os");
const { app } = require("electron");

function getSystemInfo() {
  return {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    os: {
      platform: process.platform,
      arch: process.arch,
      release: os.release(),
      hostname: os.hostname(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    },
    appPath: app.getAppPath(),
    userDataPath: app.getPath("userData"),
  };
}

module.exports = { getSystemInfo };
