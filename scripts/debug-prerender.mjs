import puppeteer from 'puppeteer';
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const port = 4181;

const indexHtml = await readFile(path.join(distDir, 'index.html'));
console.log('index.html size:', indexHtml.length);

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url || '/', `http://localhost:${port}`);
  let pathname = decodeURIComponent(reqUrl.pathname);
  const safe = path.normalize(path.join(distDir, pathname));
  if (!safe.startsWith(distDir)) { res.statusCode = 403; return res.end('Forbidden'); }
  let filePath = safe;
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(indexHtml);
  }
  const data = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ({'.js':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.html':'text/html;charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.woff2':'font/woff2'})[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', mime);
  res.end(data);
});

async function stat(p) {
  try {
    const fs = await import('node:fs/promises');
    return await fs.stat(p);
  } catch { throw new Error('not found'); }
}

await new Promise(r => server.listen(port, r));
console.log('server up on', port);

console.log('launching chrome...');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--user-data-dir=/tmp/chrome-prerender'],
});
console.log('chrome launched');

try {
  const page = await browser.newPage();
  page.on('console', msg => console.log('[browser]', msg.type(), msg.text().slice(0, 200)));
  page.on('pageerror', err => console.log('[pageerror]', err.message));
  page.on('requestfailed', req => console.log('[reqfailed]', req.url().slice(0, 80), req.failure()?.errorText));
  
  console.log('goto...');
  const t0 = Date.now();
  await page.goto(`http://localhost:${port}/about/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('domcontentloaded at', Date.now() - t0, 'ms');
  
  // Wait for React mount
  try {
    await page.waitForFunction(() => document.getElementById('root')?.children.length > 0, { timeout: 15000 });
    console.log('react mounted at', Date.now() - t0, 'ms');
  } catch (e) {
    console.log('react mount timeout:', e.message);
  }
  
  // Wait for title change
  try {
    await page.waitForFunction(() => document.title && document.title !== 'Build Better', { timeout: 8000 });
    console.log('title set at', Date.now() - t0, 'ms');
  } catch (e) {
    console.log('title timeout:', e.message);
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  const state = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
    rootChildren: document.getElementById('root')?.children.length || 0,
    bodyText: document.body.innerText.slice(0, 200),
  }));
  console.log('STATE:', JSON.stringify(state, null, 2));
  
  await page.close();
} finally {
  await browser.close();
  server.close();
}
console.log('DONE');
