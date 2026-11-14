// BUG-001: while a label is being edited, Text, Size changes only the selected words, through the real number input
// (click, type, Enter), and the label stays in editing with the selection kept. A caret with nothing selected sizes the
// whole label. Font and Bold still format the selection. Run standalone and in embed mode (test/embed-host.html).
import { open, ROOT } from './harness.mjs';
import { pathToFileURL } from 'url';
import path from 'path';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(800);

// In the page (or frame): the inline font-size and font-family between a word's text node and the label editor
const STATE = () => {
  const E = DiagramEditor, ed = document.querySelector('.editorBox .ed');
  if (!ed) return { editing: !!E.S.editing };
  const fmt = (word) => {
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (n.data.includes(word)) break;
    if (!n) return null;
    const r = { size: '', font: '', bold: false };
    for (let el = n.parentElement; el && el !== ed; el = el.parentElement) {
      if (!r.size && el.style.fontSize) r.size = el.style.fontSize;
      if (!r.font && el.style.fontFamily) r.font = el.style.fontFamily.replace(/"/g, '');
      if (el.tagName === 'B' || /bold|700/.test(el.style.fontWeight)) r.bold = true;
    }
    return r;
  };
  return { editing: !!E.S.editing, focus: document.activeElement === ed, sel: String(window.getSelection()), text: ed.textContent,
    hello: fmt('Hello'), world: fmt('world'), cellSize: E.cellById(E.S.editing.id).style.fontSize || '' };
};
// Select a word in the label (or put the caret at its end) the way a user's drag would
const SELECT = (word, caret) => {
  const ed = document.querySelector('.editorBox .ed'); ed.focus();
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (n.data.includes(word)) break;
  const i = n.data.indexOf(word), rg = document.createRange();
  rg.setStart(n, caret ? i + word.length : i); rg.setEnd(n, i + word.length);
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg);
};
const CONTROL = (label) => {
  const sec = [...document.querySelectorAll('#format .fsec')].find(s => s.querySelector('h3').textContent === 'Text');
  const row = [...sec.querySelectorAll('.frow')].find(r => { const l = r.querySelector('label.l'); return l && l.textContent === label; });
  return row.querySelector(label === 'Size' ? 'input[type=number]' : 'select');
};

async function setSize(ctx, v) {
  const input = await ctx.evaluateHandle(CONTROL, 'Size');
  await input.click({ count: 3 }); // focus the box and select its number; this takes the selection out of the label
  await pg.keyboard.type(String(v)); await pg.keyboard.press('Enter'); await sleep(150);
}

async function run(ctx, where) {
  const say = (m) => fail(where + ': ' + m);
  await ctx.evaluate(() => {
    const E = DiagramEditor; let c;
    E.mutate(() => { c = E.makeVertex('rect', 200, 200); c.value = 'Hello world'; c.style.fontSize = '12'; E.page().cells.push(c); });
    E.setSel([c.id]); E.startEdit(E.cellById(c.id));
  });
  await sleep(300);

  // 1. "world" selected, Size 24 through the input
  await ctx.evaluate(SELECT, 'world'); await sleep(100);
  let s = await ctx.evaluate(STATE);
  if (s.sel !== 'world') say('could not select "world": ' + JSON.stringify(s));
  await setSize(ctx, 24);
  s = await ctx.evaluate(STATE);
  console.log(where, 'size 24 on "world":', JSON.stringify(s));
  if (!s.editing) say('label left editing after Size');
  if (s.world?.size !== '24px') say('"world" is not 24px');
  if (s.hello?.size) say('"Hello" changed size: ' + s.hello.size);
  if (s.sel !== 'world' || !s.focus) say('selection not kept on "world"');
  if (s.text !== 'Hello world') say('text changed: ' + s.text);
  if (s.cellSize !== '12') say('cell fontSize changed: ' + s.cellSize);

  // 2. Size again without reselecting
  await setSize(ctx, 30);
  s = await ctx.evaluate(STATE);
  if (s.world?.size !== '30px' || s.hello?.size) say('second Size change: ' + JSON.stringify(s));

  // 3. Font list and Bold still format the selection
  await ctx.evaluate(SELECT, 'Hello'); await sleep(100);
  const font = await ctx.evaluateHandle(CONTROL, 'Font');
  await font.select('Georgia'); await sleep(150);
  const bold = await ctx.evaluateHandle(() => document.querySelector('#format button[title="Bold"]'));
  await bold.click(); await sleep(150);
  s = await ctx.evaluate(STATE);
  if (s.hello?.font !== 'Georgia' || !s.hello?.bold) say('Font or Bold did not format "Hello": ' + JSON.stringify(s));
  if (s.world?.font || s.world?.bold || s.world?.size !== '30px') say('Font or Bold changed "world": ' + JSON.stringify(s));

  // 4. A caret with nothing selected: Size sizes the whole label
  await ctx.evaluate(SELECT, 'world', true); await sleep(100);
  await setSize(ctx, 18);
  s = await ctx.evaluate(STATE);
  console.log(where, 'size 18 with a caret:', JSON.stringify(s));
  if (!s.editing || s.hello?.size !== '18px' || s.world?.size !== '18px') say('caret Size did not size the whole label');

  // 5. Finish: the sizes are kept in the saved label
  const saved = await ctx.evaluate(() => { const E = DiagramEditor, id = E.S.editing.id; E.finishEdit(); const c = E.cellById(id); return { value: c.value, style: c.style.fontSize }; });
  console.log(where, 'saved label:', JSON.stringify(saved));
  if (!/font-size:\s*18px/.test(saved.value) || /font-size:\s*(24|30)px/.test(saved.value)) say('saved label does not have the 18px size: ' + saved.value);
  if (saved.style !== '12') say('cell fontSize changed on finish: ' + saved.style);

  // 6. Not editing: Size still sets the cell's font size
  await ctx.evaluate(() => { const E = DiagramEditor; E.setSel([E.page().cells.at(-1).id]); E.buildFormat(); });
  await setSize(ctx, 16);
  const cell = await ctx.evaluate(() => DiagramEditor.page().cells.at(-1).style.fontSize);
  if (cell !== '16') say('Size without editing did not set the cell font size: ' + cell);
}

await run(pg, 'standalone');

// Embed mode
await pg.evaluate(() => { DiagramEditor.S.dirty = false; });
await pg.goto(pathToFileURL(path.join(ROOT, 'test', 'embed-host.html')).href);
await sleep(1800);
const frame = pg.frames().find(f => f.url().endsWith('diagram-editor.html'));
if (!frame) fail('no editor frame');
else {
  await pg.evaluate(() => window.sendInit({ type: 'de:init', xml: '', title: 'BUG-001', mode: 'outline' }));
  await sleep(1000);
  if (!(await frame.evaluate(() => !!DiagramEditor.S.embed))) fail('embed mode not on');
  await run(frame, 'embed');
}

console.log(errors.join('\n') || 'no errors');
if (errors.length) process.exitCode = 1;
await b.close();
