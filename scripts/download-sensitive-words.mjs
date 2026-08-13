// scripts/download-sensitive-words.mjs
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SOURCES = [
  // fwwdn/sensitive-stop-words (branch: master)
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/master/色情类.txt',
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/master/政治类.txt',
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/master/广告.txt',
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/master/涉枪涉爆违法信息关键词.txt',
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/master/网址.txt',
  // konsheng/Sensitive-lexicon (branch: main, files under Vocabulary/)
  'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/政治类型.txt',
  'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/色情类型.txt',
  'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/广告类型.txt',
];

async function downloadWords() {
  const words = new Set();

  for (const url of SOURCES) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch ${url}: ${res.status}`);
        continue;
      }
      const text = await res.text();
      text.split(/[\r\n,，]+/).forEach(w => {
        const trimmed = w.trim();
        if (trimmed && trimmed.length > 1) {
          words.add(trimmed);
        }
      });
      console.log(`Downloaded ${url}: ${words.size} total words`);
    } catch (err) {
      console.warn(`Error fetching ${url}:`, err.message);
    }
  }

  const output = {
    version: '1.0.0',
    updated: new Date().toISOString().split('T')[0],
    sources: ['fwwdn/sensitive-stop-words (master)', 'konsheng/Sensitive-lexicon (main/Vocabulary)'],
    words: Array.from(words).sort(),
  };

  mkdirSync(join(__dirname, '../public/data'), { recursive: true });
  writeFileSync(
    join(__dirname, '../public/data/sensitive-words.json'),
    JSON.stringify(output, null, 2)
  );
  console.log(`Generated sensitive-words.json with ${words.size} words`);
}

downloadWords().catch(console.error);
