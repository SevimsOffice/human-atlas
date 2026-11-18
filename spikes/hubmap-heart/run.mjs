// Serves the spike page + the downloaded GLB, opens it in headless Chromium, prints the report, saves a screenshot.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
// Uses the globally installed Playwright (or a local one if present).
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(require('node:child_process').execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;

const here = resolve(import.meta.dirname);
const modelDir = resolve(here, '../../data/raw/hubmap');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = url.startsWith('/model/') ? join(modelDir, url.slice(7)) : join(here, url === '/' ? 'index.html' : url);
  try { res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }); res.end(await readFile(file)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.__spike, null, { timeout: 60000 });
const report = await page.evaluate(() => window.__spike);
await page.mouse.click(600, 400);
const picked = await page.evaluate(() => window.__picked);
await page.waitForTimeout(300);
await page.screenshot({ path: join(here, 'screenshot.png') });
console.log(JSON.stringify({ ...report, clickAtCenterPicked: picked }, null, 1));
await browser.close(); server.close();
