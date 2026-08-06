const config = require("./index");

const isTest = config.server.nodeEnv === "test";
const isDevOrTest = config.server.isDev || isTest;
const isElectron = process.env.ELECTRON_APP === "true";

module.exports = {
  jwtSecret: config.auth.jwtSecret,
  jwtRefreshSecret: config.auth.jwtRefreshSecret,
  accessTokenExpiry: config.auth.accessTokenExpiry,
  refreshTokenExpiry: config.auth.refreshTokenExpiry,
  bcryptRounds: config.auth.bcryptRounds,
  cookieOptions: {
    httpOnly: true,
    secure: !isDevOrTest && !isElectron,
    sameSite: isElectron ? "none" : (isDevOrTest ? "lax" : "strict"),
    path: "/",
  },
};
