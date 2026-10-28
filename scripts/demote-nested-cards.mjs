#!/usr/bin/env node
/**
 * Demote a card that sits inside another card to a well.
 *
 * The Console theme has one containment layer: a hairline panel cut from one
 * surface. A surface inside a surface is a well — tinted, no border — never a
 * second card. This walks each file's JSX, finds every element whose class
 * carries a card token (bg-card, rounded-card, border + card) and whose
 * ancestor also carries one, and rewrites the inner one to a well.
 *
 * It is presentation only: class strings change, markup does not.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";

const CARD = /(^|-)card(--[\w-]+)?$/i;
const CONTAINERISH = /(grid|list|rail|row|wrap|deck|group|stack|container|section|scroller|track)/i;

// A class is a card token when it is literally "card" / "bg-card" / "rounded-card"
// etc. and it is not a container-ish name.
function cardTokens(cls) {
  return cls
    .split(/\s+/)
    .filter(Boolean)
    .filter((c) => {
      const base = c.split("--")[0];
      return base && CARD.test(base) && !CONTAINERISH.test(base);
    });
}

/** Parse the JSX into a flat list of open/close tags with positions.
 *  Attributes are scanned with brace depth so an arrow `=>` or a JSX child
 *  inside `{ }` does not end the tag early. */
function scan(src) {
  const tags = [];
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf("<", i);
    if (lt === -1) break;
    // A closing tag is short and simple.
    if (src[lt + 1] === "/") {
      const gt = src.indexOf(">", lt);
      if (gt === -1) break;
      const name = src.slice(lt + 2, gt).trim();
      tags.push({ name, close: true, selfClosing: false, cls: "", start: lt, end: gt + 1, raw: src.slice(lt, gt + 1) });
      i = gt + 1;
      continue;
    }
    // Only an element start counts (a letter after `<`).
    if (!/[A-Za-z]/.test(src[lt + 1] || "")) {
      i = lt + 1;
      continue;
    }
    const m = /^<([A-Za-z][\w.]*)/.exec(src.slice(lt));
    if (!m) {
      i = lt + 1;
      continue;
    }
    const name = m[1];
    // Walk forward to the matching `>`, tracking braces and quotes.
    let j = lt + m[0].length;
    let depth = 0;
    let quote = null;
    let end = -1;
    for (; j < src.length; j++) {
      const ch = src[j];
      if (quote) {
        if (ch === quote && src[j - 1] !== "\\") quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        end = j + 1;
        break;
      }
    }
    if (end === -1) break;
    const whole = src.slice(lt, end);
    const attrsRaw = whole.slice(m[0].length, -1);
    const selfClosing = /\/\s*$/.test(attrsRaw) || /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(name);
    let cls = "";
    const cm = attrsRaw.match(/\bclassName\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/);
    if (cm) cls = cm[1] ?? cm[2] ?? cm[3] ?? "";
    tags.push({ name, close: false, selfClosing, cls, start: lt, end, raw: whole });
    i = end;
  }
  return tags;
}

/**
 * Find the class-string span inside a tag so we can rewrite just that part.
 */
function classSpan(src, tag) {
  const rel = src.slice(tag.start, tag.end);
  const cm = rel.match(/\bclassName\s*=\s*(?:"([^"]*)"|'([^']*)')/);
  if (!cm) return null;
  const value = cm[1] ?? cm[2] ?? "";
  const valueOffset = rel.indexOf(cm[0]) + cm[0].indexOf(value);
  return { start: tag.start + valueOffset, end: tag.start + valueOffset + value.length, value };
}

function toWell(cls) {
  const parts = cls.split(/\s+/).filter(Boolean);
  const out = [];
  let sawCardSurface = false;
  let droppedBorderColour = false;
  for (const c of parts) {
    if (c === "bg-card") {
      if (!sawCardSurface) {
        out.push("bg-muted");
        sawCardSurface = true;
      }
      continue;
    }
    if (c === "bg-card/50" || c === "bg-card/10" || c === "bg-card/20") {
      // An alpha card inside a card is still a second surface: make it a well too.
      out.push(c.replace("bg-card", "bg-muted"));
      continue;
    }
    if (/^border-(border|primary|success|destructive|muted|accent|cool)$/.test(c)) {
      // The inner surface loses its own edge: the outer panel already has one.
      droppedBorderColour = true;
      continue;
    }
    out.push(c);
  }
  // A well never carries its own border. If the only edge was the one we just
  // dropped, the bare `border` width utility goes with it.
  if (droppedBorderColour && !out.some((c) => /^border-[a-z]/.test(c))) {
    const idx = out.indexOf("border");
    if (idx !== -1) out.splice(idx, 1);
  }
  return out.join(" ");
}

function processFile(path) {
  const src = readFileSync(path, "utf8");
  if (!src.includes("card")) return { changed: 0 };

  const tags = scan(src);
  const stack = [];
  const edits = [];

  for (const t of tags) {
    if (t.close) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === t.name) {
          stack.splice(i);
          break;
        }
      }
      continue;
    }
    if (t.selfClosing) continue;

    const tokens = cardTokens(t.cls);
    const isCard = tokens.length > 0;
    const insideCard = stack.some((s) => s.isCard);

    if (isCard && insideCard) {
      const span = classSpan(src, t);
      if (span) {
        const next = toWell(span.value);
        if (next !== span.value && next.trim()) {
          edits.push({ start: span.start, end: span.end, next });
        }
      }
    }
    stack.push({ name: t.name, isCard });
  }

  if (!edits.length) return { changed: 0 };

  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.next + out.slice(e.end);
  }
  writeFileSync(path, out);
  return { changed: edits.length };
}

const files = process.argv.slice(2);
let total = 0;
let touched = 0;
for (const f of files) {
  const r = processFile(f);
  if (r.changed) {
    touched++;
    total += r.changed;
  }
}
console.log(`demoted ${total} nested cards across ${touched} files`);
