import { describe, expect, it, beforeEach, vi } from "vitest";

async function loadConfig(value) {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", value);
  return import("./config.js");
}

describe("api config", () => {
  beforeEach(() => vi.unstubAllEnvs());

  it("derives the api base and websocket base from one origin", async () => {
    const { API_ORIGIN, API_BASE, WS_BASE } = await loadConfig("http://api.example.com");
    expect(API_ORIGIN).toBe("http://api.example.com");
    expect(API_BASE).toBe("http://api.example.com/api");
    expect(WS_BASE).toBe("ws://api.example.com");
  });

  it("upgrades the websocket scheme for https origins", async () => {
    const { WS_BASE } = await loadConfig("https://api.example.com");
    expect(WS_BASE).toBe("wss://api.example.com");
  });

  it("tolerates a trailing slash", async () => {
    const { API_BASE } = await loadConfig("http://api.example.com/");
    expect(API_BASE).toBe("http://api.example.com/api");
  });

  it("leaves absolute urls alone and resolves relative ones", async () => {
    const { absoluteUrl } = await loadConfig("http://api.example.com");
    expect(absoluteUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
    expect(absoluteUrl("/media/a.png")).toBe("http://api.example.com/media/a.png");
    expect(absoluteUrl("media/a.png")).toBe("http://api.example.com/media/a.png");
    expect(absoluteUrl(null)).toBeNull();
  });
});
