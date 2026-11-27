// App themes (File, App theme), the same as Data Model Studio's: each applies, keeps readable text (WCAG 4.5:1) and leaves the canvas
// white; the choice is remembered after reload when the editor runs on its own; Material Design is the default.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(800);
await pg.evaluate(() => { const E = DiagramEditor; E.mutate(() => { E.page().cells.push(E.makeVertex('process', 100, 100, 'outline')); }); });
const before = await pg.evaluate(() => JSON.stringify(DiagramEditor.S.doc));
const ids = await pg.evaluate(() => DiagramEditor.UI_THEMES.map(t => t.id));
if (ids.join() !== 'system,studio-light,studio-dark,classic,flat-minimal,material,neumorphism,midnight,high-contrast') fail('unexpected themes ' + ids);
for (const id of ids) {
  const r = await pg.evaluate((id) => {
    const E = DiagramEditor; E.applyUiTheme(id);
    const v = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const rgb = (c) => { const x = document.createElement('div'); x.style.color = c; document.body.appendChild(x); const m = getComputedStyle(x).color.match(/\d+/g).map(Number); x.remove(); return m; };
    const L = (c) => { const f = (u) => { u /= 255; return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); }; const [r, g, b2] = rgb(c); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b2); };
    const cr = (a, b2) => { const x = L(a), y = L(b2); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const pal = getComputedStyle(document.querySelector('#palette')).backgroundColor;
    return { canvas: getComputedStyle(document.querySelector('#stage')).backgroundColor, attr: document.documentElement.dataset.uiTheme || 'classic', text: cr(v('--text'), v('--panel')), muted: cr(v('--muted'), v('--panel')), mutedChrome: cr(v('--muted'), v('--chrome')), onAccent: cr(v('--onText'), v('--accent')), pal };
  }, id);
  if (r.attr !== id) fail(id + ': theme attribute not applied');
  if (r.canvas !== 'rgb(255, 255, 255)') fail(id + ': the canvas is not the diagram\'s white: ' + r.canvas);
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
const sub = await pg.evaluate(() => { const mi = [...document.querySelectorAll('#menuPopup .mi')].find(m => m.textContent.startsWith('App theme')); return mi ? [...mi.querySelectorAll('.popup .mi')].map(x => x.textContent) : null; });
if (!sub || !sub.some(t => t.startsWith('✓') && t.includes('Material Design'))) fail('File, App theme menu missing or not checked: ' + JSON.stringify(sub));
await pg.keyboard.press('Escape');
// unknown id falls back to the default (Material Design); the diagram itself is untouched by themes
await pg.evaluate(() => DiagramEditor.applyUiTheme('nope'));
if (await pg.evaluate(() => document.documentElement.dataset.uiTheme || 'classic') !== 'material') fail('unknown theme did not fall back to Material Design');
// a fresh browser (no saved preference) starts in Material Design; the page bar sits above the rulers inside the centre column
await pg.evaluate(() => { localStorage.clear(); DiagramEditor.S.dirty = false; });
await pg.reload(); await sleep(900);
if (await pg.evaluate(() => document.documentElement.dataset.uiTheme) !== 'material') fail('default theme is not Material Design');
const lay = await pg.evaluate(() => { const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; }; return { bar: r('#pagebar'), stage: r('#stage'), pal: r('#palette'), fmt: r('#format'), tb: r('#toolbar') }; });
if (!(lay.bar.top >= lay.tb.bottom - 1 && lay.bar.bottom <= lay.stage.top + 2)) fail('page bar is not between the toolbar and the canvas ' + JSON.stringify(lay));
if (!(lay.bar.left >= lay.pal.right - 1 && lay.bar.right <= lay.fmt.left + 1)) fail('page bar is not between the side panels');
// side panels: hidden ones give the canvas their room and show a tab; auto-show opens the format panel while something is selected
const pn = await pg.evaluate(async () => {
  const E = DiagramEditor, w0 = document.querySelector('#stage').getBoundingClientRect().width;
  E.setPanelMode('pal', 'hide'); E.setPanelMode('fmt', 'autoshow'); await new Promise(r => setTimeout(r, 300));
  const w1 = document.querySelector('#stage').getBoundingClientRect().width, tabs = [...document.querySelectorAll('.paneltab')].map(t => getComputedStyle(t).display);
  const fmtOffEmpty = document.body.classList.contains('fmt-away');
  E.mutate(() => { E.page().cells.push(E.makeVertex('process', 300, 200, 'outline')); }); E.setSel([E.page().cells[E.page().cells.length - 1].id]); E.buildFormat(); await new Promise(r => setTimeout(r, 300));
  const fmtOnSel = !document.body.classList.contains('fmt-away');
  E.setPanelMode('pal', 'show'); E.setPanelMode('fmt', 'show');
  return { wider: w1 > w0 + 150, tabs, fmtOffEmpty, fmtOnSel };
});
if (!pn.wider || pn.tabs[0] !== 'block' || !pn.fmtOffEmpty || !pn.fmtOnSel) fail('side panel modes: ' + JSON.stringify(pn));
console.log(errors.join('\n') || 'no errors');
console.log(process.exitCode ? 'UI theme test FAILED' : 'UI theme test passed');
await b.close();
