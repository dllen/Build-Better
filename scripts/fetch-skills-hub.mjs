#!/usr/bin/env node
/**
 * Skills Hub Fetcher - 从 skills-hub.ai API 拉取 Skills 数据并保存为 JSON
 *
 * Usage:
 *     node scripts/fetch-skills-hub.mjs [output_file]
 *
 * API: https://skills-hub.ai/api/v1/skills?sort=most_installed&limit=20&cursor=...
 *
 * 无需额外依赖，使用 Node.js 内置 fetch API
 */

import { writeFileSync } from "fs";

const BASE_URL = "https://skills-hub.ai";
const API_URL = `${BASE_URL}/api/v1/skills`;
const BROWSE_URL = `${BASE_URL}/browse`;
const DEFAULT_OUTPUT = "src/data/skills-hub.json";
const PAGE_SIZE = 20;
const PAGES_PER_SORT = 10;

const SORT_MODES = [
  "highest_rated",
  "most_liked",
  "most_installed",
  "newest",
  "recently_updated",
];

/**
 * 标准化单个 skill 数据，兼容多种 field name
 */
function normalizeSkill(raw) {
  return {
    name: raw.name || raw.title || "",
    description: raw.description || raw.desc || raw.summary || raw.shortDescription || "",
    author: raw.author || raw.creator || raw.user?.name || raw.owner?.name || raw.publisher || "",
    installs: raw.installs ?? raw.installCount ?? raw.downloads ?? raw.install_count ?? 0,
    category: raw.category || raw.type || raw.primaryCategory || "",
    url: raw.url || raw.link || (raw.slug ? `${BASE_URL}/${raw.slug}` : (raw.id ? `${BASE_URL}/skill/${raw.id}` : "")),
    icon: raw.icon || raw.image || raw.avatar || raw.logo || raw.iconUrl || "",
  };
}

/**
 * 浏览器 User-Agent 池，随机轮换
 */
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * 抓取单页 API 数据
 */
async function fetchApiPage(sort, cursor) {
  const params = new URLSearchParams({
    sort,
    limit: String(PAGE_SIZE),
  });
  if (cursor) params.set("cursor", cursor);

  const url = `${API_URL}?${params}`;
  console.log(`    Fetching: ${url}`);

  const resp = await fetch(url, {
    headers: {
      "accept": "*/*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7,ja;q=0.6",
      "accept-encoding": "gzip, deflate, br",
      "cache-control": "no-cache",
      "connection": "keep-alive",
      "dnt": "1",
      "origin": BASE_URL,
      "priority": "u=1, i",
      "referer": `https://skills-hub.ai/browse?sort=${sort}`,
      "sec-ch-ua": '"Google Chrome";v="155", "Chromium";v="155", "Not(A:Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": randomUA(),
    },
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }

  const json = await resp.json();
  return json;
}

/**
 * 从 API 响应中提取 skills 数组和 nextCursor
 */
function parseApiResponse(json, page) {
  // 打印第一页的结构帮助调试
  if (page === 1) {
    console.log("  Response keys:", Object.keys(json));
  }

  // 尝试找到 skills 数组
  let skills = [];
  for (const key of ["skills", "data", "items", "results", "list", "records"]) {
    if (Array.isArray(json[key]) && json[key].length > 0) {
      skills = json[key];
      if (page === 1) {
        console.log(`  Found skills array in "${key}"`);
        console.log(`  First skill keys:`, Object.keys(skills[0]));
        console.log(`  First skill:`, JSON.stringify(skills[0], null, 2).substring(0, 500));
      }
      break;
    }
  }

  // 如果顶层本身就是数组
  if (skills.length === 0 && Array.isArray(json)) {
    skills = json;
  }

  // 尝试找到下一页 cursor
  let nextCursor = null;
  for (const key of ["nextCursor", "cursor", "next", "nextPageCursor", "pagination"]) {
    if (typeof json[key] === "string") {
      nextCursor = json[key];
      break;
    }
  }

  // 有些 API 分页信息放在 pagination 对象里
  if (!nextCursor && json.pagination) {
    nextCursor = json.pagination.nextCursor || json.pagination.cursor || null;
  }

  // 或者有 hasMore / total 判断
  if (!nextCursor && json.meta) {
    nextCursor = json.meta.nextCursor || json.meta.cursor || null;
  }

  return { skills, nextCursor };
}

/**
 * 主函数
 */
async function main() {
  const outputFile = process.argv[2] || DEFAULT_OUTPUT;
  console.log("🚀 Skills Hub Fetcher (API mode)");
  console.log(`  Output: ${outputFile}`);
  console.log(`  Sort modes: ${SORT_MODES.join(", ")}`);
  console.log(`  Pages per sort: ${PAGES_PER_SORT}\n`);

  // 模拟人类首次加载页面后的"浏览"间隔
  console.log("⏳ Browsing...\n");
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 2000));

  const allSkills = [];
  const seen = new Set();

  for (let si = 0; si < SORT_MODES.length; si++) {
    const sort = SORT_MODES[si];
    console.log(`📋 Sort [${si + 1}/${SORT_MODES.length}]: ${sort}`);
    console.log(`────────────────────────────────────────`);

    let cursor = null;
    let page = 1;
    let sortSkills = 0;

    while (page <= PAGES_PER_SORT) {
      try {
        const json = await fetchApiPage(sort, cursor);
        const { skills, nextCursor } = parseApiResponse(json, page);

        if (skills.length === 0) {
          console.log(`    Page ${page}: 0 skills — done.\n`);
          break;
        }

        // 去重并添加
        let newCount = 0;
        for (const raw of skills) {
          const skill = normalizeSkill(raw);
          if (skill.name && !seen.has(skill.name)) {
            seen.add(skill.name);
            allSkills.push(skill);
            newCount++;
          }
        }

        sortSkills += skills.length;
        console.log(`    Page ${page}: ${skills.length} skills (${newCount} new), total unique: ${allSkills.length}`);

        cursor = nextCursor;
        if (!cursor) {
          console.log("    No next cursor — done.\n");
          break;
        }

        page++;
        const delay = 1500 + Math.random() * 3000;
        console.log(`    ⏳ Sleeping ${(delay / 1000).toFixed(1)}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } catch (e) {
        console.error(`    Error on page ${page}:`, e.message);
        break;
      }
    }

    console.log(`  → ${sort}: ${sortSkills} fetched, ${allSkills.length} total unique\n`);

    // 切换排序方式之间较长的"浏览"间隔
    if (si < SORT_MODES.length - 1) {
      const gap = 3000 + Math.random() * 5000;
      console.log(`  🔄 Switching sort mode... (${(gap / 1000).toFixed(1)}s)\n`);
      await new Promise((r) => setTimeout(r, gap));
    }
  }

  const output = {
    source: "skills-hub.ai API",
    api_url: API_URL,
    sort_modes: SORT_MODES,
    fetched_at: new Date().toISOString(),
    total_count: allSkills.length,
    browse_url: BROWSE_URL,
    skills: allSkills,
  };

  writeFileSync(outputFile, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✅ Saved ${allSkills.length} unique skills to ${outputFile}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});