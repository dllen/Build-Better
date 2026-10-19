#!/usr/bin/env node

/**
 * Tool Inventory Scanner
 *
 * Scans all tool pages in src/pages/tools/ and auto-classifies each by:
 * - Runtime type: pure-frontend | external-api | backend-dependent | unknown
 * - External dependencies (fetch, XMLHttpRequest, axios, domain references)
 * - API key / secret exposure risk
 * - Layout pattern (EditorSplitLayout, CalculatorShell, custom)
 * - Complexity (file size, line count)
 *
 * Output: docs/tool-inventory.md (machine-generated, with manual-review flags)
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, relative, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const TOOLS_DIR = join(PROJECT_ROOT, 'src', 'pages', 'tools');
const TOOLS_DATA_FILE = join(PROJECT_ROOT, 'src', 'data', 'tools.ts');
const DOCS_DIR = join(PROJECT_ROOT, 'docs');

// ---- scanners ----

function findFetchCalls(content) {
  const patterns = [];
  if (/fetch\s*\(/.test(content)) patterns.push('fetch()');
  if (/XMLHttpRequest/.test(content)) patterns.push('XMLHttpRequest');
  if (/axios/.test(content)) patterns.push('axios');
  if (/WebSocket/.test(content)) patterns.push('WebSocket');
  return patterns;
}

function findExternalDomains(content) {
  const urlRegex = /https?:\/\/([a-zA-Z0-9.-]+)/g;
  const domains = new Set();
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    const domain = match[1].toLowerCase();
    // Skip own domains and common CDNs/libs
    if (
      domain === 'buildbetter.tools' ||
      domain === 'bb4bb.me' ||
      domain === 'buildbetter.app' ||
      domain === 'localhost' ||
      domain === '127.0.0.1' ||
      domain === 'github.com' ||
      domain === 'raw.githubusercontent.com' ||
      domain === 'unpkg.com' ||
      domain === 'cdn.jsdelivr.net' ||
      domain === 'cdnjs.cloudflare.com' ||
      domain === 'fonts.googleapis.com' ||
      domain === 'fonts.gstatic.com'
    ) continue;
    // Capture any other external domain
    domains.add(domain);
  }
  return [...domains];
}

function findApiKeyPatterns(content) {
  const risks = [];
  if (/api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i.test(content)) risks.push('hardcoded-api-key');
  if (/secret\s*[:=]\s*['"][^'"]+['"]/i.test(content)) risks.push('hardcoded-secret');
  if (/token\s*[:=]\s*['"][^'"]+['"]/i.test(content) && !/csrf/i.test(content)) risks.push('hardcoded-token');
  if (/VITE_/.test(content) && !/VITE_ADSENSE_PUBLISHER_ID/.test(content)) risks.push('vite-env-var-reference');
  if (/import\.meta\.env/.test(content)) risks.push('env-var-usage');
  return risks;
}

function detectLayoutPattern(content) {
  if (/EditorSplitLayout/.test(content)) return 'EditorSplitLayout';
  if (/CalculatorShell/.test(content)) return 'CalculatorShell';
  if (/MergeLayout/.test(content)) return 'MergeLayout';
  return 'custom';
}

function detectRuntimeType(content, filePath) {
  const hasFetch = /fetch\s*\(/.test(content);
  const hasXHR = /XMLHttpRequest/.test(content);
  const hasWebSocket = /WebSocket/.test(content);
  const hasWorker = /new\s+Worker\s*\(/.test(content);
  const usesWebCrypto = /crypto\.(subtle|getRandomValues|randomUUID)/.test(content);
  const usesCanvas = /getContext\s*\(\s*['"]2d['"]/.test(content) || /toDataURL/.test(content);
  const usesClipboard = /navigator\.clipboard/.test(content);
  const usesFileAPI = /new\s+FileReader/.test(content) || /createObjectURL/.test(content);

  // Check for Cloudflare Functions / backend calls
  const hasBackendCall = /\/api\//.test(content) || /\/functions\//.test(content);
  const hasSupabaseCall = /supabase/.test(content) || /SUPABASE_/.test(content);
  const externalDomains = findExternalDomains(content);
  const hasExternalAPI = externalDomains.length > 0;

  const browserAPIs = [];
  if (usesWebCrypto) browserAPIs.push('Web Crypto');
  if (usesCanvas) browserAPIs.push('Canvas');
  if (usesClipboard) browserAPIs.push('Clipboard');
  if (usesFileAPI) browserAPIs.push('File/Blob');
  if (hasWorker) browserAPIs.push('Web Worker');

  let type = 'pure-frontend';
  const flags = [];

  if (hasBackendCall || hasSupabaseCall) {
    type = 'backend-dependent';
    if (hasBackendCall) flags.push('Cloudflare Function');
    if (hasSupabaseCall) flags.push('Supabase');
  } else if (hasFetch || hasXHR || hasExternalAPI) {
    type = 'external-api';
    if (hasFetch || hasXHR) flags.push('HTTP request');
    if (hasExternalAPI) flags.push(`External domain: ${externalDomains.join(', ')}`);
  } else if (hasWebSocket) {
    type = 'external-api';
    flags.push('WebSocket connection');
  }

  return { type, flags, browserAPIs };
}

function getToolFiles(dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getToolFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ---- parse tools.ts for metadata ----

function parseToolsData() {
  try {
    const content = readFileSync(TOOLS_DATA_FILE, 'utf8');
    // Extract tool entries using regex
    const toolRegex = /\{\s*\n?\s*id:\s*['"]([^'"]+)['"]/g;
    const tools = [];
    let match;
    while ((match = toolRegex.exec(content)) !== null) {
      tools.push({ id: match[1] });
    }
    return tools;
  } catch {
    return [];
  }
}

function guessCategory(filePath) {
  const rel = relative(TOOLS_DIR, filePath);
  const parts = rel.split('/');
  if (parts.length > 1) {
    const catDir = parts[0].toLowerCase();
    const catMap = {
      text: 'Text',
      json: 'JSON Tools',
      image: 'Image',
      crypto: 'Crypto & Security',
      devops: 'DevOps',
      network: 'Network & Chat',
      calculators: 'Finance',
      web3: 'Web3',
      ai: 'AI',
      chat: 'Network & Chat',
      games: 'Games',
      data: 'Data',
      sql: 'SQL',
      encoding: 'Encoding',
    };
    return catMap[catDir] || catDir;
  }
  // Try to infer from filename
  const name = basename(filePath, '.tsx').toLowerCase();
  if (/json/i.test(name)) return 'JSON Tools';
  if (/sql/i.test(name)) return 'SQL';
  if (/image|compress|resize|convert|crop|watermark/i.test(name)) return 'Image';
  if (/hash|encrypt|decrypt|cipher|password|token|key/i.test(name)) return 'Crypto & Security';
  if (/docker|k8s|kubernetes|nginx|systemd|devops|yaml/i.test(name)) return 'DevOps';
  if (/calc|margin|discount|roi|profit|tax|rate/i.test(name)) return 'Finance';
  if (/encode|decode|base64|url|unicode/i.test(name)) return 'Encoding';
  return 'Developer';
}

// ---- MAIN ----

function main() {
  console.log('🔍 Scanning tools directory...\n');

  const toolFiles = getToolFiles(TOOLS_DIR);
  const toolsDataEntries = parseToolsData();

  console.log(`Found ${toolFiles.length} tool source files in src/pages/tools/`);
  console.log(`Found ${toolsDataEntries.length} entries in src/data/tools.ts\n`);

  const inventory = [];
  const stats = {
    total: toolFiles.length,
    pureFrontend: 0,
    externalAPI: 0,
    backendDependent: 0,
    unknown: 0,
    layoutPatterns: { EditorSplitLayout: 0, CalculatorShell: 0, MergeLayout: 0, custom: 0 },
    apiKeyRisks: 0,
    categories: {},
  };

  for (const filePath of toolFiles) {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const size = statSync(filePath).size;
    const relativePath = relative(PROJECT_ROOT, filePath);
    const name = basename(filePath, '.tsx').replace(/\.ts$/, '');

    const fetchCalls = findFetchCalls(content);
    const externalDomains = findExternalDomains(content);
    const apiKeyRisks = findApiKeyPatterns(content);
    const layoutPattern = detectLayoutPattern(content);
    const { type, flags, browserAPIs } = detectRuntimeType(content, filePath);
    const category = guessCategory(filePath);

    // Update stats
    stats[type === 'pure-frontend' ? 'pureFrontend' : type === 'external-api' ? 'externalAPI' : type === 'backend-dependent' ? 'backendDependent' : 'unknown']++;
    stats.layoutPatterns[layoutPattern]++;
    if (apiKeyRisks.length > 0) stats.apiKeyRisks++;
    stats.categories[category] = (stats.categories[category] || 0) + 1;

    inventory.push({
      name,
      path: relativePath,
      category,
      type,
      flags,
      browserAPIs,
      fetchCalls,
      externalDomains,
      apiKeyRisks,
      layoutPattern,
      lines: lines.length,
      sizeKB: Math.round(size / 1024),
      needsManualReview: type !== 'pure-frontend' || apiKeyRisks.length > 0,
    });
  }

  // Sort: backend-dependent first, then external-api, then pure-frontend
  inventory.sort((a, b) => {
    const priority = { 'backend-dependent': 0, 'external-api': 1, 'pure-frontend': 2, unknown: 3 };
    return priority[a.type] - priority[b.type];
  });

  // ---- Generate markdown output ----

  const now = new Date().toISOString().split('T')[0];

  let md = `# Tool Inventory (Automated Scan)\n\n`;
  md += `> Generated: ${now}\n`;
  md += `> Total tools scanned: ${stats.total}\n\n`;

  md += `## Summary\n\n`;
  md += `| Classification | Count |\n`;
  md += `|---|---|\n`;
  md += `| Pure Frontend | ${stats.pureFrontend} |\n`;
  md += `| External API | ${stats.externalAPI} |\n`;
  md += `| Backend Dependent | ${stats.backendDependent} |\n`;
  md += `| Unknown | ${stats.unknown} |\n`;
  md += `| **Total** | **${stats.total}** |\n\n`;

  md += `### Layout Patterns\n\n`;
  md += `| Pattern | Count |\n`;
  md += `|---|---|\n`;
  for (const [pattern, count] of Object.entries(stats.layoutPatterns)) {
    md += `| ${pattern} | ${count} |\n`;
  }

  md += `\n### By Category\n\n`;
  md += `| Category | Count |\n`;
  md += `|---|---|\n`;
  for (const [cat, count] of Object.entries(stats.categories).sort((a, b) => b[1] - a[1])) {
    md += `| ${cat} | ${count} |\n`;
  }

  md += `\n### Security Flags\n\n`;
  md += `- Tools with potential API key/secret exposure: **${stats.apiKeyRisks}**\n\n`;

  md += `---\n\n## Full Inventory\n\n`;

  // Legend
  md += `### Legend\n\n`;
  md += `| Symbol | Meaning |\n`;
  md += `|---|---|\n`;
  md += `| 🟢 | Pure frontend — no external dependencies |\n`;
  md += `| 🟡 | Uses external API |\n`;
  md += `| 🔴 | Depends on backend (Cloudflare Functions, Supabase, etc.) |\n`;
  md += `| ⚠️ | Needs manual review |\n`;
  md += `| 🔑 | API key / secret risk |\n\n`;

  for (const tool of inventory) {
    const typeIcon = tool.type === 'pure-frontend' ? '🟢' : tool.type === 'external-api' ? '🟡' : tool.type === 'backend-dependent' ? '🔴' : '❓';
    const reviewIcon = tool.needsManualReview ? ' ⚠️' : '';
    const keyIcon = tool.apiKeyRisks.length > 0 ? ' 🔑' : '';

    md += `### ${typeIcon}${reviewIcon}${keyIcon} ${tool.name}\n\n`;
    md += `| Field | Value |\n`;
    md += `|---|---|\n`;
    md += `| Path | \`${tool.path}\` |\n`;
    md += `| Category | ${tool.category} |\n`;
    md += `| Type | **${tool.type}** |\n`;
    md += `| Layout | ${tool.layoutPattern} |\n`;
    md += `| Lines | ${tool.lines} |\n`;
    md += `| Size | ${tool.sizeKB} KB |\n`;

    if (tool.flags.length > 0) {
      md += `| Runtime flags | ${tool.flags.join(', ')} |\n`;
    }
    if (tool.browserAPIs.length > 0) {
      md += `| Browser APIs | ${tool.browserAPIs.join(', ')} |\n`;
    }
    if (tool.fetchCalls.length > 0) {
      md += `| HTTP patterns | ${tool.fetchCalls.join(', ')} |\n`;
    }
    if (tool.externalDomains.length > 0) {
      md += `| External domains | ${tool.externalDomains.join(', ')} |\n`;
    }
    if (tool.apiKeyRisks.length > 0) {
      md += `| ⚠️ Security flags | ${tool.apiKeyRisks.join(', ')} |\n`;
    }
    md += `\n`;
  }

  // ---- Write output ----
  if (!existsSync(DOCS_DIR)) {
    mkdirSync(DOCS_DIR, { recursive: true });
  }

  const outputPath = join(DOCS_DIR, 'tool-inventory.md');
  writeFileSync(outputPath, md, 'utf8');

  console.log(`✅ Written: ${outputPath}`);
  console.log(`   ${stats.pureFrontend} pure frontend, ${stats.externalAPI} external API, ${stats.backendDependent} backend-dependent`);
  console.log(`   ${stats.apiKeyRisks} tools with potential security flags`);
  console.log(`   ${Object.values(stats.layoutPatterns).reduce((a, b) => a + b, 0)} tools classified by layout\n`);

  // Print tools that need manual review
  const toReview = inventory.filter(t => t.needsManualReview);
  if (toReview.length > 0) {
    console.log(`⚠️  ${toReview.length} tools need manual review:`);
    for (const t of toReview) {
      console.log(`   ${t.type === 'backend-dependent' ? '🔴' : t.type === 'external-api' ? '🟡' : '🟢'} ${t.name} (${t.path})`);
      if (t.apiKeyRisks.length > 0) {
        console.log(`      🔑 ${t.apiKeyRisks.join(', ')}`);
      }
    }
  }
}

main();