#!/usr/bin/env node
/**
 * Give every decorative drawing an accessibility answer.
 *
 * gate 33: a <canvas> or an inline <svg> with neither aria-hidden nor a label
 * is either decoration that should be hidden from assistive tech, or a picture
 * that should be named. A canvas that is the tool's own output is a picture
 * (role="img" plus a label); every other inline drawing is decoration.
 *
 * This adds exactly one of the two attributes, and nothing else.
 */
import { readFileSync, writeFileSync } from "node:fs";

const DECORATIVE = /aria-hidden|aria-label|role=|<title/;

function fix(src) {
  let changed = 0;

  // A <canvas> is the tool's output: name it.
  src = src.replace(/<canvas\b((?:[^<>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*?)(\/?)>/g, (whole, attrs, slash) => {
    if (DECORATIVE.test(attrs)) return whole;
    changed++;
    const label = /className=/.test(attrs) ? "role=\"img\" aria-label=\"Drawing output\"" : "role=\"img\" aria-label=\"Drawing output\"";
    return `<canvas${attrs.trimEnd()} ${label}${slash}>`;
  });

  // An inline <svg> that is not the tool's output is decoration.
  src = src.replace(/<svg\b((?:[^<>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*?)(\/?)>/g, (whole, attrs, slash) => {
    if (DECORATIVE.test(attrs)) return whole;
    changed++;
    return `<svg${attrs.trimEnd()} aria-hidden="true"${slash}>`;
  });

  return { src, changed };
}

let total = 0;
let touched = 0;
for (const path of process.argv.slice(2)) {
  const before = readFileSync(path, "utf8");
  const { src, changed } = fix(before);
  if (changed) {
    writeFileSync(path, src);
    total += changed;
    touched++;
  }
}
console.log(`labelled ${total} drawings across ${touched} files`);
