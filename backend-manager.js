const { spawn } = require("child_process");
const net = require("net");
const path = require("path");
const log = require("electron-log");

let backendProcess = null;
let backendPort = null;
let appIsQuitting = false;

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.once("close", () => resolve(true)).close();
      })
      .listen(port, "127.0.0.1");
  });
}

async function findAvailablePort(startPort = 3000, maxAttempts = 20) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) return port;
  }
  return 0; // OS assigns a random port
}

async function startBackend(envOverrides, appDir) {
  appIsQuitting = false;
  const port = await findAvailablePort();
  backendPort = port;

  let backendPath = path.join(appDir, "backend", "src", "server.js");

  // In packaged app, backend/src is unpacked from asar — fix path for spawned node
  const { app: electronApp } = require("electron");
  if (electronApp.isPackaged && backendPath.includes("app.asar")) {
    backendPath = backendPath.replace("app.asar", "app.asar.unpacked");
  }

  // In packaged app, backend/node_modules are in extraResources
  const fs = require("fs");
  let nodePath = process.env.NODE_PATH || "";
  if (electronApp.isPackaged) {
    const extraNM = path.join(process.resourcesPath, "backend", "node_modules");
    if (fs.existsSync(extraNM)) {
      nodePath = nodePath
        ? `${nodePath}${path.delimiter}${extraNM}`
        : extraNM;
    }
  }

  const env = {
    ...process.env,
    ...envOverrides,
    PORT: String(port),
    NODE_PATH: nodePath || undefined,
  };

  backendProcess = spawn("node", [backendPath], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  backendProcess.stdout.on("data", (data) => {
    log.info(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on("data", (data) => {
    log.error(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.on("exit", (code, signal) => {
    log.info(`Backend process exited (code=${code}, signal=${signal})`);
    if (code !== 0 && !appIsQuitting) {
      log.error("Backend crashed, restarting in 2 seconds...");
      setTimeout(() => {
        if (!appIsQuitting) {
          startBackend(envOverrides, appDir);
        }
      }, 2000);
    }
  });

  return backendProcess;
}

function stopBackend() {
  appIsQuitting = true;
  if (backendProcess) {
    try {
      backendProcess.kill("SIGTERM");
      const forceKillTimer = setTimeout(() => {
        if (backendProcess) {
          try {
            backendProcess.kill("SIGKILL");
          } catch (e) {
            // Process already dead
          }
        }
      }, 5000);

      backendProcess.once("exit", () => {
        clearTimeout(forceKillTimer);
        backendProcess = null;
      });
    } catch (err) {
      log.error("Error stopping backend:", err.message);
      backendProcess = null;
    }
  }
}

function getBackendPort() {
  return backendPort;
}

module.exports = { startBackend, stopBackend, getBackendPort };
