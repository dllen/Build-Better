#!/usr/bin/env node
/**
 * Pair each surface with its own ink.
 *
 * A button that fills with the primary surface takes the primary's ink, not
 * the card's. The theme has one ink per surface: --color-primary-ink beside
 * --color-accent, --color-accent-ink beside --color-paper-2.
 *
 * This rewrites `text-card-foreground` to the ink that belongs to the surface
 * the element actually paints, so a filled control never carries a mismatched
 * label colour.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAIRS = [
  // surface utility -> the ink utility that belongs on it
  [/bg-primary(?![-\w])/, "text-primary-foreground"],
  [/bg-accent(?![-\w])/, "text-accent-foreground"],
  [/bg-secondary(?![-\w])/, "text-secondary-foreground"],
  [/bg-destructive(?![-\w])/, "text-destructive-foreground"],
  [/bg-success(?![-\w])/, "text-foreground"],
  [/bg-muted(?![-\w])/, "text-foreground"],
  [/bg-popover(?![-\w])/, "text-popover-foreground"],
  [/bg-card(?![-\w])/, "text-card-foreground"],
];

function inkFor(cls) {
  // The most specific surface wins: primary/accent are rarer than card.
  const order = [
    [/bg-primary(?![-\w])/, "text-primary-foreground"],
    [/bg-destructive(?![-\w])/, "text-destructive-foreground"],
    [/bg-accent(?![-\w])/, "text-accent-foreground"],
    [/bg-secondary(?![-\w])/, "text-secondary-foreground"],
    [/bg-popover(?![-\w])/, "text-popover-foreground"],
    [/bg-success(?![-\w])/, "text-foreground"],
    [/bg-muted(?![-\w])/, "text-foreground"],
    [/bg-card(?![-\w])/, "text-card-foreground"],
  ];
  for (const [re, ink] of order) {
    if (re.test(cls)) return ink;
  }
  return null;
}

let total = 0;
let touched = 0;
for (const path of process.argv.slice(2)) {
  const src = readFileSync(path, "utf8");
  if (!src.includes("text-card-foreground")) continue;

  // Work on every quoted class string. A template literal is matched by its
  // braces so the `{` ... `}` wrapper is kept intact.
  let changed = 0;
  const out = src.replace(
    /className=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g,
    (whole, dq, sq, tq) => {
      const raw = dq ?? sq ?? tq;
      if (!raw || !raw.includes("text-card-foreground")) return whole;
      const ink = inkFor(raw);
      if (!ink || ink === "text-card-foreground") return whole;
      const next = raw.split("text-card-foreground").join(ink);
      if (next === raw) return whole;
      changed++;
      if (dq !== undefined) return `className="${next}"`;
      if (sq !== undefined) return `className='${next}'`;
      return `className={\`${next}\`}`;
    }
  );

  if (changed) {
    writeFileSync(path, out);
    total += changed;
    touched++;
  }
}
console.log(`repaired ${total} ink mismatches across ${touched} files`);
