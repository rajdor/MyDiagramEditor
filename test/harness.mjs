// Shared headless-browser setup for the tests. Run tests from the repository root: npm test
import pp from 'puppeteer-core';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const APP_URL = pathToFileURL(path.join(ROOT, 'diagram-editor.html')).href;
fs.mkdirSync(path.join(ROOT, 'test', 'out'), { recursive: true });

// Browser: CHROME_PATH if set, else a locally installed Chrome or Edge, else @sparticuz/chromium (Linux).
async function browserPath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  ].find(p => fs.existsSync(p));
  if (local) return local;
  const chromium = (await import('@sparticuz/chromium')).default;
  return chromium.executablePath();
}

export async function launch() {
  return pp.launch({ executablePath: await browserPath(), args: ['--allow-file-access-from-files', '--no-sandbox'], headless: true });
}

export async function open(opts = {}) {
  const b = await launch();
  const pg = await b.newPage();
  await pg.setViewport({ width: opts.w || 1440, height: opts.h || 900, deviceScaleFactor: 1 });
  const errors = [];
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  pg.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await pg.goto(APP_URL);
  await new Promise(r => setTimeout(r, 600));
  return { b, pg, errors };
}
