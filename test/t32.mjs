// UI themes (File, UI theme): each applies, is remembered after reload, keeps readable text (WCAG 4.5:1), and does not touch the diagram.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(800);
await pg.evaluate(() => { const E = DiagramEditor; E.mutate(() => { E.page().cells.push(E.makeVertex('process', 100, 100, 'outline')); }); });
const before = await pg.evaluate(() => JSON.stringify(DiagramEditor.S.doc));
const ids = await pg.evaluate(() => DiagramEditor.UI_THEMES.map(t => t.id));
if (ids.join() !== 'classic,flat-minimal,material,neumorphism') fail('unexpected themes ' + ids);
for (const id of ids) {
  const r = await pg.evaluate((id) => {
    const E = DiagramEditor; E.applyUiTheme(id);
    const v = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const rgb = (c) => { const x = document.createElement('div'); x.style.color = c; document.body.appendChild(x); const m = getComputedStyle(x).color.match(/\d+/g).map(Number); x.remove(); return m; };
    const L = (c) => { const f = (u) => { u /= 255; return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); }; const [r, g, b2] = rgb(c); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b2); };
    const cr = (a, b2) => { const x = L(a), y = L(b2); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const pal = getComputedStyle(document.querySelector('#palette')).backgroundColor;
    return { attr: document.documentElement.dataset.uiTheme || 'classic', text: cr(v('--text'), v('--panel')), muted: cr(v('--muted'), v('--panel')), mutedChrome: cr(v('--muted'), v('--chrome')), onAccent: cr(v('--onText'), v('--accent')), pal };
  }, id);
  if (r.attr !== id) fail(id + ': theme attribute not applied');
  if (r.text < 4.5) fail(id + ': text contrast ' + r.text.toFixed(2));
  if (r.muted < 4.5) fail(id + ': muted text contrast ' + r.muted.toFixed(2));
  if (r.mutedChrome < 4.5) fail(id + ': muted text on chrome contrast ' + r.mutedChrome.toFixed(2));
  if (r.onAccent < 4.5) fail(id + ': button text on accent contrast ' + r.onAccent.toFixed(2));
  await sleep(150);
  await pg.screenshot({ path: 'test/out/s_ui_' + id + '.png' });
}
// remembered after reload; menu shows it checked
await pg.evaluate(() => DiagramEditor.applyUiTheme('material'));
pg.on('dialog', d => d.accept()); // unsaved-changes prompt on reload
await pg.evaluate(() => { DiagramEditor.S.dirty = false; });
await pg.reload(); await sleep(900);
if (await pg.evaluate(() => document.documentElement.dataset.uiTheme) !== 'material') fail('theme not remembered after reload');
await pg.click('#menus button'); await sleep(200);
const sub = await pg.evaluate(() => { const mi = [...document.querySelectorAll('#menuPopup .mi')].find(m => m.textContent.startsWith('UI theme')); return mi ? [...mi.querySelectorAll('.popup .mi')].map(x => x.textContent) : null; });
if (!sub || !sub.some(t => t.startsWith('✓') && t.includes('Material Design'))) fail('File, UI theme menu missing or not checked: ' + JSON.stringify(sub));
await pg.keyboard.press('Escape');
// unknown id falls back to the default (Neumorphism); the diagram itself is untouched by themes
await pg.evaluate(() => DiagramEditor.applyUiTheme('nope'));
if (await pg.evaluate(() => document.documentElement.dataset.uiTheme || 'classic') !== 'neumorphism') fail('unknown theme did not fall back to Neumorphism');
// a fresh browser (no saved preference) starts in Neumorphism; the page bar sits above the rulers inside the centre column
await pg.evaluate(() => { localStorage.clear(); DiagramEditor.S.dirty = false; });
await pg.reload(); await sleep(900);
if (await pg.evaluate(() => document.documentElement.dataset.uiTheme) !== 'neumorphism') fail('default theme is not Neumorphism');
const lay = await pg.evaluate(() => { const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; }; return { bar: r('#pagebar'), stage: r('#stage'), pal: r('#palette'), fmt: r('#format'), tb: r('#toolbar') }; });
if (!(lay.bar.top >= lay.tb.bottom - 1 && lay.bar.bottom <= lay.stage.top + 2)) fail('page bar is not between the toolbar and the canvas ' + JSON.stringify(lay));
if (!(lay.bar.left >= lay.pal.right - 1 && lay.bar.right <= lay.fmt.left + 1)) fail('page bar is not between the side panels');
console.log(errors.join('\n') || 'no errors');
console.log(process.exitCode ? 'UI theme test FAILED' : 'UI theme test passed');
await b.close();
