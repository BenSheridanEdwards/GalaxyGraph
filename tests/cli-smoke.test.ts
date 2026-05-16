import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const fixture = new URL("./fixtures/encore-mini", import.meta.url).pathname;

describe("galaxy-graph CLI", () => {
  it("generates graph JSON from a sanitized Encore fixture", async () => {
    const dir = await mkdtemp(join(tmpdir(), "galaxy-graph-cli-"));
    try {
      const out = join(dir, "graph.json");
      await execFileAsync(process.execPath, ["packages/cli/dist/index.js", "generate", "--adapter", "encore", "--root", fixture, "--out", out], { cwd: new URL("..", import.meta.url).pathname });
      const data = JSON.parse(await readFile(out, "utf8"));
      expect(data.services).toHaveLength(3);
      expect(data.endpoints).toHaveLength(3);
      expect(data.contracts).toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
