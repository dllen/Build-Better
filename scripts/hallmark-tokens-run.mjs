#!/usr/bin/env node
/**
 * Run the Hallmark token conversion over a set of source files.
 *
 * Usage: node scripts/hallmark-tokens-run.mjs <dir-or-file> [...]
 */
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { convertPath } from "./hallmark-tokens.mjs";

function walk(target, out = []) {
  const st = statSync(target);
  if (st.isFile()) {
    if ([".tsx", ".jsx", ".ts"].includes(extname(target))) out.push(target);
    return out;
  }
  for (const entry of readdirSync(target)) {
    const p = join(target, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if ([".tsx", ".jsx", ".ts"].includes(extname(p))) out.push(p);
  }
  return out;
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("usage: node scripts/hallmark-tokens-run.mjs <dir-or-file> [...]");
  process.exit(1);
}

const files = [];
for (const t of targets) walk(t, files);

let changed = 0;
for (const f of files) {
  const res = convertPath(f);
  if (res.changed) changed++;
}

console.log(`scanned ${files.length} files, rewrote ${changed}`);
