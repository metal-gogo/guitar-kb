import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

interface DevcontainerConfig {
  image: string;
  postCreateCommand: string;
  postStartCommand: string;
  forwardPorts?: number[];
  customizations?: {
    vscode?: {
      extensions?: string[];
    };
  };
}

async function loadDevcontainerConfig(): Promise<DevcontainerConfig> {
  const raw = await readFile(".devcontainer/devcontainer.json", "utf8");
  return JSON.parse(raw) as DevcontainerConfig;
}

describe("devcontainer config", () => {
  it("pins the expected Node 20 base image and startup commands", async () => {
    const config = await loadDevcontainerConfig();

    expect(config.image).toBe("mcr.microsoft.com/devcontainers/javascript-node:20");
    expect(config.postCreateCommand).toBe("npm install");
    expect(config.postStartCommand).toBe("npm test");
  });

  it("does not forward ports for the MVP workflow", async () => {
    const config = await loadDevcontainerConfig();

    expect(config.forwardPorts ?? []).toEqual([]);
  });

  it("includes the recommended VS Code extensions", async () => {
    const config = await loadDevcontainerConfig();
    const extensions = config.customizations?.vscode?.extensions ?? [];

    expect(extensions).toEqual(
      expect.arrayContaining([
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "GitHub.copilot",
      ]),
    );
  });
});
