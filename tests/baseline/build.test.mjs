import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

test("build artifacts exist", () => {
  const distDir = join(process.cwd(), "dist");
  assert.ok(existsSync(distDir), "dist/ directory should exist after build");
  const files = readdirSync(distDir);
  assert.ok(files.includes("index.html"), "dist/index.html should exist");
});

test("tools count matches expected", () => {
  const toolsDir = join(process.cwd(), "src/pages/tools");
  const toolsFiles = readdirSync(toolsDir).filter((f) => f.endsWith(".tsx"));
  // Baseline captured on 2026-09-30: 91 tools in src/pages/tools/.
  // Update this number if the tool count changes intentionally.
  assert.ok(toolsFiles.length >= 80, `should have at least 80 tools, got ${toolsFiles.length}`);
});
