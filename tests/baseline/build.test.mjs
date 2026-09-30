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
  // Baseline captured on 2026-09-30: 84 .tsx tool components in src/pages/tools/
  // (91 entries total — the 7 extras are subdirectories, not tools).
  // Threshold uses slack (80) so this test stays green when new tools are added
  // during normal feature work. Lower the threshold only if tools are intentionally removed.
  assert.ok(toolsFiles.length >= 80, `should have at least 80 tools, got ${toolsFiles.length}`);
});
