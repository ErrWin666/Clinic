const CONFIG_PATH = "../../../src/config";
const SERVER_CONFIG_PATH = "../../../src/config/server";

function loadConfig(env) {
  let config;
  jest.isolateModules(() => {
    const original = { ...process.env };
    Object.assign(process.env, env);
    try {
      config = require(CONFIG_PATH);
    } finally {
      process.env = original;
    }
  });
  return config;
}

function loadServerConfig(env) {
  let serverConfig;
  jest.isolateModules(() => {
    const original = { ...process.env };
    Object.assign(process.env, env);
    try {
      serverConfig = require(SERVER_CONFIG_PATH);
    } finally {
      process.env = original;
    }
  });
  return serverConfig;
}

describe("config", () => {
  describe("JWT secrets", () => {
    it("uses the provided secrets verbatim", () => {
      const config = loadConfig({ JWT_SECRET: "abc", JWT_REFRESH_SECRET: "def" });
      expect(config.auth.jwtSecret).toBe("abc");
      expect(config.auth.jwtRefreshSecret).toBe("def");
      expect(config.warnings).toHaveLength(0);
    });

    it("generates a random secret in development instead of a known fallback", () => {
      const config = loadConfig({
        NODE_ENV: "development",
        JWT_SECRET: "",
        JWT_REFRESH_SECRET: "",
      });
      expect(config.auth.jwtSecret).not.toBe("fallback-dev-secret");
      expect(config.auth.jwtSecret).toHaveLength(96);
      expect(config.auth.jwtRefreshSecret).not.toBe(config.auth.jwtSecret);
      expect(config.warnings.length).toBe(2);
    });

    it("throws in production when JWT_SECRET is missing", () => {
      expect(() =>
        loadConfig({ NODE_ENV: "production", JWT_SECRET: "", JWT_REFRESH_SECRET: "x" })
      ).toThrow(/JWT_SECRET/);
    });

    it("throws in production when JWT_REFRESH_SECRET is missing", () => {
      expect(() =>
        loadConfig({ NODE_ENV: "production", JWT_SECRET: "x", JWT_REFRESH_SECRET: "" })
      ).toThrow(/JWT_REFRESH_SECRET/);
    });
  });

  describe("trustProxy", () => {
    it("defaults to false", () => {
      expect(loadConfig({ TRUST_PROXY: "" }).server.trustProxy).toBe(false);
    });

    it("parses booleans", () => {
      expect(loadConfig({ TRUST_PROXY: "true" }).server.trustProxy).toBe(true);
      expect(loadConfig({ TRUST_PROXY: "false" }).server.trustProxy).toBe(false);
    });

    it("parses a hop count", () => {
      expect(loadConfig({ TRUST_PROXY: "2" }).server.trustProxy).toBe(2);
    });

    it("passes through a subnet string", () => {
      expect(loadConfig({ TRUST_PROXY: "10.0.0.0/8" }).server.trustProxy).toBe("10.0.0.0/8");
    });
  });

  describe("scheduler", () => {
    it("is enabled by default", () => {
      expect(loadConfig({ SCHEDULER_ENABLED: "" }).scheduler.enabled).toBe(true);
    });

    it("can be disabled", () => {
      expect(loadConfig({ SCHEDULER_ENABLED: "false" }).scheduler.enabled).toBe(false);
    });
  });

  describe("database.migrate", () => {
    it("defaults to auto", () => {
      expect(loadConfig({ DB_MIGRATE: "" }).database.migrate).toBe("auto");
    });

    it("honours an explicit strategy", () => {
      expect(loadConfig({ DB_MIGRATE: "sync" }).database.migrate).toBe("sync");
    });
  });
});

describe("config/server CORS", () => {
  it("reflects any origin in development when unset", () => {
    expect(loadServerConfig({ NODE_ENV: "development", CORS_ORIGIN: "" }).cors.origin).toBe(true);
  });

  it("falls back to the Vite dev server outside development when unset", () => {
    expect(loadServerConfig({ NODE_ENV: "production", JWT_SECRET: "a", JWT_REFRESH_SECRET: "b", CORS_ORIGIN: "" }).cors.origin)
      .toBe("http://localhost:5173");
  });

  it("uses a single configured origin", () => {
    expect(loadServerConfig({ CORS_ORIGIN: "https://clinic.example" }).cors.origin)
      .toBe("https://clinic.example");
  });

  it("uses a list of configured origins", () => {
    expect(loadServerConfig({ CORS_ORIGIN: "https://a.example, https://b.example" }).cors.origin)
      .toEqual(["https://a.example", "https://b.example"]);
  });

  it("treats * as reflect-any-origin", () => {
    expect(loadServerConfig({ CORS_ORIGIN: "*" }).cors.origin).toBe(true);
  });

  it("always keeps credentials enabled", () => {
    expect(loadServerConfig({ CORS_ORIGIN: "https://clinic.example" }).cors.credentials).toBe(true);
  });
});
