/**
 * .htaccess → nginx config converter (common directives only — documented as such).
 * Pure string transformation, unit-testable without a DOM.
 */

export interface ConvertWarning {
  line: number;
  text: string;
  reason: string;
}

export interface ConvertResult {
  nginx: string;
  warnings: ConvertWarning[];
  convertedCount: number;
}

interface Context {
  indent: number;
  /** When inside RewriteCond, the pending condition lines before a RewriteRule. */
  pendingConds: string[];
  /** Current If/Files/Directory block stack for block emission. */
  blockDepth: number;
}

/**
 * Convert an .htaccess document to an nginx config snippet.
 * Unrecognized directives are preserved as comments with a warning.
 */
export function convertHtaccess(input: string): ConvertResult {
  const lines = input.split(/\r?\n/);
  const out: string[] = [];
  const warnings: ConvertWarning[] = [];
  let converted = 0;

  const ctx: Context = { indent: 0, pendingConds: [], blockDepth: 0 };

  const push = (code: string) => out.push("    ".repeat(ctx.indent) + code);
  const warn = (line: number, text: string, reason: string) => warnings.push({ line, text, reason });

  const flushConds = (): string[] => {
    const conds = ctx.pendingConds;
    ctx.pendingConds = [];
    return conds;
  };

  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    const line = raw.trim();
    if (!line || line.startsWith("#")) {
      if (line.startsWith("#")) push(`# ${line.slice(1).trim()}`);
      return;
    }

    // ---- Blocks ----
    if (/^<IfModule\b/i.test(line)) {
      push(`# ${line} (IfModule has no nginx equivalent — directives apply unconditionally)`);
      ctx.blockDepth++;
      return;
    }
    if (/^<\/IfModule>/i.test(line)) {
      ctx.blockDepth = Math.max(0, ctx.blockDepth - 1);
      return;
    }
    if (/^<If\b/i.test(line)) {
      const expr = line.replace(/^<If\s+/i, "").replace(/>$/, "").trim();
      push(`# if (${expr})  # Apache <If> → nginx if (use with caution)`);
      push(`if (${translateExpr(expr)}) {`);
      ctx.indent++;
      ctx.blockDepth++;
      return;
    }
    if (/^<\/If>/i.test(line)) {
      ctx.indent = Math.max(0, ctx.indent - 1);
      push("}");
      ctx.blockDepth = Math.max(0, ctx.blockDepth - 1);
      return;
    }
    if (/^<Files(Match)?\b/i.test(line)) {
      const m = line.match(/^<Files(Match)?\s+["']?([^"'>]+)["']?\s*>/i);
      const pattern = m ? m[2] : ".*";
      const isMatch = /^<FilesMatch/i.test(line);
      push(`location ~ ${isMatch ? pattern : escapeRegex(pattern)} {`);
      ctx.indent++;
      ctx.blockDepth++;
      return;
    }
    if (/^<\/Files(Match)?>/i.test(line)) {
      ctx.indent = Math.max(0, ctx.indent - 1);
      push("}");
      ctx.blockDepth = Math.max(0, ctx.blockDepth - 1);
      return;
    }
    if (/^<Directory\b/i.test(line)) {
      const m = line.match(/^<Directory\s+["']?([^"'>]+)["']?\s*>/i);
      push(`# <Directory ${m ? m[1] : ""}> maps to a separate nginx server/location block`);
      push(`location ${m ? m[1] : "/"} {`);
      ctx.indent++;
      ctx.blockDepth++;
      return;
    }
    if (/^<\/Directory>/i.test(line)) {
      ctx.indent = Math.max(0, ctx.indent - 1);
      push("}");
      ctx.blockDepth = Math.max(0, ctx.blockDepth - 1);
      return;
    }

    // ---- Directives ----
    const lower = line.toLowerCase();

    if (lower.startsWith("rewriteengine")) {
      push("# RewriteEngine On → nginx rewrites are always active");
      converted++;
      return;
    }
    if (lower.startsWith("rewriterule") || lower.startsWith("rewritecond")) {
      handleRewrite(line, lineNo, ctx, push, warn, flushConds);
      converted++;
      return;
    }
    if (
      lower.startsWith("redirect ") ||
      lower.startsWith("redirectpermanent") ||
      lower.startsWith("redirecttemp")
    ) {
      // Forms: Redirect [status|permanent|temp] old-path new-url
      //        RedirectPermanent /old /new   RedirectTemp /old /new
      let status = "302";
      let rest: string;
      if (/^redirectpermanent/i.test(line)) {
        status = "301";
        rest = line.replace(/^redirectpermanent\s*/i, "");
      } else if (/^redirecttemp/i.test(line)) {
        status = "302";
        rest = line.replace(/^redirecttemp\s*/i, "");
      } else {
        rest = line.replace(/^redirect\s*/i, "");
        const tokens = rest.split(/\s+/);
        if (/^(permanent|temp|seeother|gone)$/i.test(tokens[0])) {
          status = /permanent/i.test(tokens[0])
            ? "301"
            : /gone/i.test(tokens[0])
              ? "410"
              : "302";
          rest = tokens.slice(1).join(" ");
        } else if (/^\d{3}$/.test(tokens[0])) {
          status = tokens[0];
          rest = tokens.slice(1).join(" ");
        }
      }
      const [from, to] = rest.trim().split(/\s+/);
      if (!from || !to) {
        warn(lineNo, line, "Malformed Redirect — expected old-path and target");
        return;
      }
      push(`rewrite ^${escapeRegex(stripLeadingSlash(from))}(.*)$ ${to} ${status === "301" ? "permanent" : "redirect"};`);
      converted++;
      return;
    }
    if (lower.startsWith("errordocument")) {
      const m = line.match(/^ErrorDocument\s+(\d{3})\s+(.+)$/i);
      if (m) {
        push(`error_page ${m[1]} ${m[2]};`);
        converted++;
      } else {
        warn(lineNo, line, "Malformed ErrorDocument");
      }
      return;
    }
    if (lower.startsWith("header set") || lower.startsWith("header always set")) {
      const m = line.match(/^Header\s+(?:always\s+)?set\s+(\S+)\s+(.+)$/i);
      if (m) {
        push(`add_header ${m[1]} ${quoteIfNeeded(m[2])} always;`);
        converted++;
      } else {
        warn(lineNo, line, "Unsupported Header syntax");
      }
      return;
    }
    if (lower.startsWith("header unset")) {
      const m = line.match(/^Header\s+unset\s+(\S+)/i);
      if (m) {
        push(`# ${line} — nginx: use "proxy_hide_header ${m[1]};" or map to empty`);
        warn(lineNo, line, "Header unset has no direct nginx directive");
        converted++;
      }
      return;
    }
    if (lower.startsWith("browsermatch") || lower.startsWith("setenvif")) {
      push(`# ${line} → nginx map $http_user_agent { ... }`);
      warn(lineNo, line, "Rewrite as a nginx map block");
      converted++;
      return;
    }
    if (lower.startsWith("options ")) {
      push(`# ${line} → autoindex ${/indexes/i.test(line) ? "on" : "off"};`);
      converted++;
      return;
    }
    if (lower.startsWith("allow ") || lower.startsWith("deny ")) {
      const m = line.match(/^(allow|deny)\s+(.+)$/i);
      if (m) {
        // Apache: "Allow from 10.0.0.0/8" → nginx: "allow 10.0.0.0/8;" / "deny all;"
        const value = m[2].replace(/^from\s+/i, "").trim();
        push(`${m[1].toLowerCase()} ${value};`);
        converted++;
      }
      return;
    }
    if (lower.startsWith("require ")) {
      const rest = line.slice("require ".length).trim();
      if (/^ip\s+/i.test(rest)) {
        push(`allow ${rest.replace(/^ip\s+/i, "").trim()};`);
      } else if (/^all$/i.test(rest)) {
        push("allow all;");
      } else {
        push(`# ${line} → auth_basic / auth_basic_user_file / satisfy`);
        warn(lineNo, line, "Require needs manual nginx auth mapping");
      }
      converted++;
      return;
    }
    if (lower.startsWith("authuserfile") || lower.startsWith("authname") || lower.startsWith("authtype")) {
      const map: Record<string, string> = {
        authuserfile: "auth_basic_user_file",
        authname: "auth_basic",
        authtype: "# AuthType (nginx always uses Basic here)",
      };
      const key = lower.split(/\s+/)[0];
      const value = line.split(/\s+/).slice(1).join(" ");
      if (key === "authtype") {
        push(`${map[key]}`);
      } else {
        push(`${map[key]} ${quoteIfNeeded(value)};`);
      }
      converted++;
      return;
    }
    if (lower.startsWith("php_value") || lower.startsWith("php_flag")) {
      push(`# ${line} → set in php.ini / fastcgi_param PHP_VALUE`);
      warn(lineNo, line, "PHP settings move to the PHP/FastCGI layer");
      converted++;
      return;
    }
    if (lower.startsWith("expires") || lower.startsWith("addoutputfilter") || lower.startsWith("mod_deflate") || lower.startsWith("deflate")) {
      push(`# ${line} → gzip on; gzip_types ...; expires ${line.split(/\s+/)[1] || ""};`);
      converted++;
      return;
    }
    if (lower.startsWith("order ") || lower.startsWith("satisfy")) {
      push(`# ${line} → merge into allow/deny or "satisfy any;"`);
      warn(lineNo, line, "Order/Satisfy map to nginx access logic");
      converted++;
      return;
    }
    if (lower.startsWith("directoryindex")) {
      const files = line.split(/\s+/).slice(1).join(" ");
      push(`index ${files};`);
      converted++;
      return;
    }
    if (lower.startsWith("adddefaultcharset")) {
      const v = line.split(/\s+/).slice(1).join(" ");
      push(`charset ${v};`);
      converted++;
      return;
    }
    if (lower.startsWith("serveradmin") || lower.startsWith("servername") || lower.startsWith("serveralias")) {
      const key = lower.split(/\s+/)[0];
      const value = line.split(/\s+/).slice(1).join(" ");
      push(`${key} ${value};`);
      converted++;
      return;
    }

    // Fallback
    push(`# UNCONVERTED: ${line}`);
    warn(lineNo, line, "No nginx mapping in this converter — review manually");
  });

  const header = [
    "# Generated by Build-Better htaccess→nginx converter",
    "# Review before deploying: complex RewriteCond chains and .htaccess modules",
    "# (mod_rewrite expressions, mod_authz nuances) need manual verification.",
    "",
  ].join("\n");

  return {
    nginx: header + out.join("\n") + (out.length ? "\n" : ""),
    warnings,
    convertedCount: converted,
  };
}

function handleRewrite(
  line: string,
  lineNo: number,
  ctx: Context,
  push: (c: string) => void,
  warn: (l: number, t: string, r: string) => void,
  flushConds: () => string[]
): void {
  const lower = line.toLowerCase();
  if (lower.startsWith("rewritecond")) {
    const m = line.match(/^RewriteCond\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?/i);
    if (!m) {
      warn(lineNo, line, "Malformed RewriteCond");
      return;
    }
    ctx.pendingConds.push(m[0]);
    return;
  }
  // RewriteRule
  const m = line.match(/^RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?/i);
  if (!m) {
    warn(lineNo, line, "Malformed RewriteRule");
    return;
  }
  const [, pattern, substitution, flags = ""] = m;
  const condLines = flushConds();
  condLines.forEach((c) => push(`# ${c}`));
  const isRedirect = /\b(R=30[1278]|redirect)/i.test(flags);
  const isLast = /\bL\b|last/i.test(flags);
  const target = substitution.startsWith("-") ? "" : substitution;
  if (condLines.length) {
    warn(lineNo, line, "RewriteCond translated as comment — express conditions with nginx if/map");
  }
  if (!target) {
    push(`# RewriteRule ${pattern} - [${flags}]  (no-op / forbidden target)`);
    return;
  }
  const directive = isRedirect ? "return" : "rewrite";
  if (directive === "return") {
    const code = (flags.match(/R=(\d{3})/) || [])[1] || "302";
    push(`if ($request_uri ~* "^${pattern.replace(/^\^/, "")}") { return ${code} ${target}; }`);
  } else {
    push(`rewrite ^${pattern.replace(/^\^/, "")}$ ${target} ${isLast ? "last" : "break"};`);
  }
}

function translateExpr(expr: string): string {
  return expr
    .replace(/%{HTTP_HOST}/g, "$host")
    .replace(/%{REQUEST_URI}/g, "$request_uri")
    .replace(/%{QUERY_STRING}/g, "$query_string")
    .replace(/%{HTTPS}/g, "$https")
    .replace(/%{HTTP_USER_AGENT}/g, "$http_user_agent")
    .replace(/%{REMOTE_ADDR}/g, "$remote_addr")
    .replace(/\bne\b/g, "!=")
    .replace(/\beq\b/g, "=")
    .replace(/\b-and\b/g, "&&")
    .replace(/\b-or\b/g, "||");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripLeadingSlash(s: string): string {
  return s.replace(/^\//, "");
}

function quoteIfNeeded(s: string): string {
  const trimmed = s.trim();
  return /\s/.test(trimmed) ? `"${trimmed.replace(/"/g, '\\"')}"` : trimmed;
}
