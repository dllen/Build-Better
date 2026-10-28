#!/usr/bin/env node
/**
 * Hallmark token conversion — presentation-only class-name rewrite.
 *
 * Rewrites Tailwind stock colour utilities into the project's semantic token
 * contract (bg-card, text-foreground, border-border, bg-primary, ...) and
 * removes the utilities the theme forbids (card shadows, floating uppercase
 * labels, vh-sized sections, transition-all).
 *
 * Never touches logic, state, handlers, ids, keys, names, types, hrefs, routes
 * or data-testids: only className strings are rewritten.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";

/* ------------------------------------------------------------------ *
 * The palette. Two tiers:
 *   greys  -> the theme's own surface ladder
 *   hues   -> semantic roles (primary / success / destructive / info)
 * ------------------------------------------------------------------ */

const GREY_BG = {
  50: "bg-muted",
  100: "bg-muted",
  200: "bg-border",
  300: "bg-border",
  400: "bg-muted-foreground",
  500: "bg-muted-foreground",
  600: "bg-muted-foreground",
  700: "bg-secondary",
  800: "bg-card",
  900: "bg-card",
  950: "bg-background",
};

const GREY_TEXT = {
  50: "text-muted-foreground",
  100: "text-muted-foreground",
  200: "text-muted-foreground",
  300: "text-muted-foreground",
  400: "text-muted-foreground",
  500: "text-muted-foreground",
  600: "text-muted-foreground",
  // The second ink step. `text-ink-2` is not a Tailwind colour in this
  // project, so the nearest semantic step is the muted foreground.
  700: "text-muted-foreground",
  800: "text-foreground",
  900: "text-foreground",
  950: "text-foreground",
};

const GREY_BORDER = {
  50: "border-border",
  100: "border-border",
  200: "border-border",
  300: "border-border",
  400: "border-border",
  500: "border-border",
  600: "border-border",
  700: "border-border",
  800: "border-border",
  900: "border-border",
};

/* Hues that carry a semantic role in the theme. */
const HUE_ROLE = {
  blue: "primary",
  indigo: "primary",
  sky: "primary",
  cyan: "info",
  teal: "info",
  emerald: "success",
  green: "success",
  lime: "success",
  red: "destructive",
  rose: "destructive",
  pink: "destructive",
  orange: "primary",
  amber: "primary",
  yellow: "primary",
  purple: "primary",
  violet: "primary",
  fuchsia: "primary",
};

const HUE_TEXT = {
  primary: "text-primary",
  success: "text-success",
  destructive: "text-destructive",
  info: "text-info",
};

/* Background roles per hue + step: solid vs. soft. */
function hueBg(hue, step) {
  const role = HUE_ROLE[hue];
  if (!role) return `bg-${hue}-${step}`;
  if (step >= 500) return `bg-${role}`;
  return `bg-${role}/10`;
}

function hueText(hue, step) {
  const role = HUE_ROLE[hue];
  if (!role) return `text-${hue}-${step}`;
  return HUE_TEXT[role];
}

/* ------------------------------------------------------------------ *
 * Class-token rewriting
 * ------------------------------------------------------------------ */

const HUES = [
  "white",
  "black",
  "gray",
  "grey",
  "zinc",
  "neutral",
  "stone",
  "slate",
  "blue",
  "red",
  "green",
  "amber",
  "yellow",
  "orange",
  "purple",
  "violet",
  "indigo",
  "pink",
  "cyan",
  "teal",
  "sky",
  "rose",
  "fuchsia",
  "lime",
  "emerald",
];

const NEUTRAL_HUES = new Set(["gray", "grey", "zinc", "neutral", "stone", "slate"]);

/** Match a single Tailwind colour-ish class token. */
const TOKEN_RE = new RegExp(
  `^(?<prefix>(?:[a-z0-9-]+:)*)` +
    `(?<neg>!)?` +
    `(?<prop>bg|text|border|from|to|via|ring|divide|placeholder|decoration|outline|accent|caret|fill|stroke)-` +
    `(?<hue>[a-z]+)(?:-(?<step>[0-9]{2,3}))?$`,
);

function rewriteToken(token, { inDark = false } = {}) {
  const m = TOKEN_RE.exec(token);
  if (!m) return null;
  const { prefix, neg, prop, hue, step: stepStr } = m.groups;
  if (!HUES.includes(hue)) return null;

  // Inside a `dark:` variant the theme already flips; the dark side of the
  // ladder is what the token names resolve to. Keep the same token, but the
  // dark-specific stock steps (gray-800/900 -> card, gray-200/300 -> border)
  // must still collapse, so the dark prefix is preserved as-is.
  const prefixes = prefix ? prefix : "";
  const isDark = prefixes.split(":").includes("dark");
  const ctx = { inDark: isDark || inDark };

  const step = stepStr ? Number(stepStr) : null;
  const neutral = NEUTRAL_HUES.has(hue);

  let out = null;

  if (prop === "bg") {
    if (hue === "white") out = "bg-card";
    else if (hue === "black") out = "bg-foreground";
    else if (neutral) out = step === null ? "bg-muted" : GREY_BG[step];
    else if (step === null) out = null;
    else out = hueBg(hue, step);
  } else if (prop === "text") {
    if (hue === "white") out = "text-card-foreground";
    else if (hue === "black") out = "text-foreground";
    else if (neutral) out = step === null ? "text-foreground" : GREY_TEXT[step];
    else if (step === null) out = null;
    else out = hueText(hue, step);
  } else if (prop === "border") {
    if (hue === "white" || hue === "black") out = "border-border";
    else if (neutral) out = step === null ? "border-border" : GREY_BORDER[step];
    else if (step === null) out = null;
    else out = "border-border";
  } else if (prop === "ring") {
    if (hue === "white" || hue === "black") out = "ring-ring";
    else if (neutral) out = "ring-border";
    else if (step === null) out = null;
    else out = step >= 400 ? "ring-ring" : "ring-border";
  } else if (prop === "divide") {
    out = "divide-border";
  } else if (prop === "placeholder") {
    out = "placeholder-muted-foreground";
  } else if (prop === "decoration") {
    out = "decoration-border";
  } else if (prop === "outline") {
    out = "outline-border";
  } else if (prop === "accent") {
    out = "accent-primary";
  } else if (prop === "caret") {
    out = "caret-primary";
  } else if (prop === "fill") {
    out = "fill-current";
  } else if (prop === "stroke") {
    out = "stroke-current";
  } else if (prop === "from" || prop === "via" || prop === "to") {
    // Gradients: collapse onto the token ladder.
    if (hue === "white" || hue === "black" || neutral) {
      out = `${prop}-${prop === "from" ? "card" : "background"}`;
    } else if (step === null) {
      out = null;
    } else if (step >= 500) {
      out = `${prop}-primary`;
    } else {
      out = `${prop}-primary/20`;
    }
  }

  if (!out) return null;

  return `${prefix ?? ""}${neg ? "!" : ""}${out}`;
}

/* ------------------------------------------------------------------ *
 * Forbidden / theme-hostile utilities
 * ------------------------------------------------------------------ */

/** transition-all -> the properties it plausibly animates. */
function fixTransitionAll(cls) {
  if (!cls.includes("transition-all")) return cls;
  const has = (p) => new RegExp(`(?:^|\\s)(?:[a-z-]+:)*${p}[-/\\[]`).test(cls);
  const parts = [];
  if (has("bg") || has("text") || has("border") || has("ring") || has("fill") || has("stroke"))
    parts.push("transition-colors");
  if (has("opacity")) parts.push("transition-opacity");
  if (has("scale") || has("rotate") || has("translate")) parts.push("transition-transform");
  if (parts.length === 0) parts.push("transition-colors");
  return cls.replace(/\btransition-all\b/g, parts.join(" "));
}

/**
 * Card shadows are forbidden; the theme uses a hairline rule instead.
 * Shadows on small floating controls (dropdown, popover) are kept.
 */
const SHADOW_RE = /\s(?:[a-z-]+:)*shadow(?:-(?:sm|md|lg|xl|2xl))?(?=\s|$)/g;

function stripCardShadow(cls) {
  const hasFloating = /\b(?:dropdown|popover|menu|tooltip|toast|modal|dialog)/.test(cls);
  if (hasFloating) return cls;
  return cls
    .replace(SHADOW_RE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** vh-sized sections are a Floor failure: use dvh. */
function fixVh(cls) {
  return cls.replace(/(min-h|max-h|h)-\[([0-9]+)vh\]/g, "$1-[$2dvh]");
}

/** Uppercase + tracked labels are forbidden (the wordmark may keep capitals). */
function stripCaps(cls) {
  return cls
    .replace(/(^|\s)(?:[a-z-]+:)?uppercase(?=\s|$)/g, "$1")
    .replace(/(^|\s)(?:[a-z-]+:)?tracking-(wider|widest)(?=\s|$)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ *
 * Class-name extraction: only rewrite inside className="..." / className={...}
 * ------------------------------------------------------------------ */

/** Rewrite a single token, preserving any /opacity suffix. */
function convertToken(tok) {
  if (!tok) return tok;
  const slash = tok.indexOf("/");
  const head = slash === -1 ? tok : tok.slice(0, slash);
  const tail = slash === -1 ? "" : tok.slice(slash);
  const rewrote = rewriteToken(head);
  if (!rewrote) return tok;
  return rewrote + tail;
}

/**
 * Rewrite a whitespace-separated class list (literal text), preserving the
 * original whitespace so template-literal chunks keep their spacing.
 *
 * `text-white` / `text-black` next to a solid semantic fill take that fill's
 * foreground, because the theme pairs them: `bg-primary text-primary-foreground`.
 */
const SOLID_FILL_ROLES = ["primary", "destructive", "success", "info", "accent", "card"];

function convertClassList(text) {
  const parts = text.split(/(\s+)/);
  const tokens = parts.map((seg) => (/^\s*$/.test(seg) || seg === "" ? seg : convertToken(seg)));

  // Find a solid semantic fill in this list.
  let fillRole = null;
  for (const tok of tokens) {
    if (typeof tok !== "string") continue;
    const m = /^(?:[a-z0-9-]+:)?bg-(primary|destructive|success|info|accent|card)$/.exec(tok);
    if (m) {
      fillRole = m[1];
      break;
    }
  }

  if (fillRole) {
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (typeof tok !== "string") continue;
      const m = /^(?<prefix>(?:[a-z0-9-]+:)*)text-(white|black)$/.exec(tok);
      if (!m) continue;
      tokens[i] = `${m.groups.prefix}text-${fillRole}-foreground`;
    }
  }

  return tokens.join("");
}

/**
 * Rewrite a JSX expression body: it may contain string literals that hold
 * class names (`cond ? 'bg-blue-600' : 'bg-gray-100'`), template literals,
 * and arbitrary JS we must not touch.
 */
function convertExpressionBody(body) {
  let out = "";
  let i = 0;
  while (i < body.length) {
    const ch = body[i];

    if (ch === '"' || ch === "'") {
      // A plain string literal: rewrite its class tokens.
      let j = i + 1;
      while (j < body.length && body[j] !== ch) {
        if (body[j] === "\\") j++;
        j++;
      }
      out += ch + convertClassList(body.slice(i + 1, j)) + ch;
      i = j + 1;
      continue;
    }

    if (ch === "`") {
      // A template literal: rewrite literal chunks, recurse into ${} parts.
      out += "`";
      i++;
      let chunk = "";
      const flush = () => {
        out += convertClassList(chunk);
        chunk = "";
      };
      while (i < body.length && body[i] !== "`") {
        if (body[i] === "\\") {
          chunk += body.slice(i, i + 2);
          i += 2;
          continue;
        }
        if (body[i] === "$" && body[i + 1] === "{") {
          // Find the matching close brace.
          let depth = 1;
          let j = i + 2;
          while (j < body.length && depth > 0) {
            if (body[j] === "{") depth++;
            else if (body[j] === "}") depth--;
            if (depth > 0) j++;
          }
          flush();
          out += "${" + convertExpressionBody(body.slice(i + 2, j)) + "}";
          i = j + 1;
          continue;
        }
        chunk += body[i];
        i++;
      }
      flush();
      out += "`";
      i++;
      continue;
    }

    out += ch;
    i++;
  }
  return out;
}

/**
 * A class attribute value: a plain string, or a template literal / JSX
 * expression whose literal parts hold class names.
 */
function convertAttributeValue(raw) {
  const next = convertExpressionBody(raw);
  return convertClassListCleanup(next);
}

/** The theme-hostile utility fixes, applied to the whole attribute value. */
function convertClassListCleanup(next) {
  let out = next;
  out = fixTransitionAll(out);
  out = fixVh(out);
  out = stripCaps(out);
  out = stripCardShadow(out);
  return out;
}

/**
 * Match `className="..."`, `className={'...'}`, `className={`...`}` and
 * `className={ ...js... }` (a balanced-brace scan).
 */
function findClassNameAttributes(source) {
  const results = [];
  const re = /className\s*=\s*/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const start = m.index;
    let i = re.lastIndex;

    // Skip whitespace.
    while (i < source.length && /\s/.test(source[i])) i++;

    if (source[i] === '"' || source[i] === "'") {
      const q = source[i];
      let j = i + 1;
      while (j < source.length && source[j] !== q) j++;
      results.push({
        start,
        end: j + 1,
        value: source.slice(i + 1, j),
        quote: q,
        brace: false,
        valueStart: i,
        valueEnd: j + 1,
      });
      re.lastIndex = j + 1;
      continue;
    }

    if (source[i] === "{") {
      // Scan to the matching close brace, tracking nesting and strings.
      let depth = 0;
      let j = i;
      while (j < source.length) {
        const c = source[j];
        if (c === '"' || c === "'" || c === "`") {
          const q = c;
          j++;
          while (j < source.length && source[j] !== q) {
            if (source[j] === "\\") j++;
            else if (q === "`" && source[j] === "$" && source[j + 1] === "{") {
              // nested template expression
              let d = 1;
              j += 2;
              while (j < source.length && d > 0) {
                if (source[j] === "{") d++;
                else if (source[j] === "}") d--;
                if (d > 0) j++;
              }
            }
            j++;
          }
          j++;
          continue;
        }
        if (c === "{") depth++;
        else if (c === "}") {
          depth--;
          if (depth === 0) break;
        }
        j++;
      }
      const inner = source.slice(i + 1, j);
      results.push({
        start,
        end: j + 1,
        value: inner,
        quote: "",
        brace: true,
        valueStart: i,
        valueEnd: j + 1,
      });
      re.lastIndex = j + 1;
      continue;
    }
  }
  return results;
}

export function convertFile(source) {
  let changed = false;

  const attrs = findClassNameAttributes(source);
  if (attrs.length === 0) return { out: source, changed };

  let out = "";
  let cursor = 0;

  for (const attr of attrs) {
    const body = attr.value;
    if (!/[a-z]/.test(body)) continue;

    // Where the value begins in the source (after `className=` and quotes).
    const valueStart = attr.valueStart;
    const valueEnd = attr.valueEnd;

    let replacement;
    if (attr.brace) {
      const inner = convertExpressionBody(body);
      replacement = `{${convertClassListCleanup(inner)}}`;
    } else {
      const inner = convertClassList(body);
      replacement = attr.quote + convertClassListCleanup(inner) + attr.quote;
    }

    if (replacement === source.slice(valueStart, valueEnd)) continue;
    changed = true;

    out += source.slice(cursor, valueStart);
    out += replacement;
    cursor = valueEnd;
  }

  out += source.slice(cursor);
  return { out: changed ? convertClassConstants(out) : out, changed };
}

/**
 * Class strings that live in plain constants (a config map, a lookup table)
 * rather than in a `className=` attribute. We rewrite only the string
 * literals whose content is recognisably a class list.
 */
const CLASS_LITERAL_RE = /(["'`])((?:[a-z0-9-]+:)*[a-z][a-z0-9-]*(?:[ /][a-z0-9[\]#%/.:()-]+)*)\1/g;

function looksLikeClassList(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  // A class list has more than one token, or one token that is unambiguously
  // a Tailwind utility we rewrite.
  const hits = tokens.filter((t) => rewriteToken(t.split("/")[0]) !== null);
  if (hits.length === 0) return false;
  if (tokens.length === 1) {
    // A lone token: only rewrite when it is a colour utility (never a
    // path, a URL, a code sample or a plain word).
    return /^(?:[a-z0-9-]+:)*(?:bg|text|border|from|to|via|ring|divide|placeholder|decoration|outline|accent|caret|fill|stroke)-/.test(
      tokens[0],
    );
  }
  // Multi-token: every token must look like a Tailwind utility.
  return tokens.every((t) =>
    /^(?:[a-z0-9-]+:)*(?:[a-z]+-)?[a-z0-9[\]#%/.:()_-]+$/.test(t),
  );
}

export function convertClassConstants(source) {
  return source.replace(CLASS_LITERAL_RE, (whole, q, body) => {
    if (!looksLikeClassList(body)) return whole;
    const next = convertClassListCleanup(convertClassList(body));
    if (next === body) return whole;
    return q + next + q;
  });
}

export function convertPath(path) {
  const src = readFileSync(path, "utf8");
  const { out, changed } = convertFile(src);
  if (changed) writeFileSync(path, out);
  return { changed, path: relative(process.cwd(), path) };
}
