import puppeteer from 'puppeteer';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const port = 4182;
const indexHtml = await readFile(path.join(distDir, 'index.html'));

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url || '/', `http://localhost:${port}`);
  let pathname = decodeURIComponent(reqUrl.pathname);
  const safe = path.normalize(path.join(distDir, pathname));
  if (!safe.startsWith(distDir)) { res.statusCode = 403; return res.end('Forbidden'); }
  let filePath = safe;
  try {
    const fs = await import('node:fs/promises');
    const s = await fs.stat(filePath);
    if (s.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(indexHtml);
  }
  const data = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ({'.js':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.html':'text/html;charset=utf-8'})[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', mime);
  res.end(data);
});

await new Promise(r => server.listen(port, r));
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--user-data-dir=/tmp/chrome-prerender'],
});

try {
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('[pageerror]', err.message));
  
  await page.goto(`http://localhost:${port}/tools/api-debugger/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForFunction(() => document.getElementById('root')?.children.length > 0, { timeout: 15000 });
  try {
    await page.waitForFunction(() => document.title && document.title !== 'Build Better', { timeout: 8000 });
  } catch {}
  await new Promise(r => setTimeout(r, 1500));
  
  const state = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content?.slice(0, 100),
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
    jsonLdTypes: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
      try { return JSON.parse(s.textContent)['@type']; } catch { return 'parse-err'; }
    }),
    rootChildren: document.getElementById('root')?.children.length || 0,
    bodyText: document.body.innerText.slice(0, 150),
  }));
  console.log('STATE:', JSON.stringify(state, null, 2));
  
  await page.close();
} finally {
  await browser.close();
  server.close();
}
