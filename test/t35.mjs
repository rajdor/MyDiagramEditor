// Monkey test with model checks: thousands of random (but repeatable, seeded) mouse, keyboard and menu actions.
// After every batch the diagram must still be valid: unique ids, finite geometry, lines only joined to shapes that
// exist, no parent loops, a stable save, and Undo all the way back must give the starting diagram exactly.
import { open, ROOT } from './harness.mjs';
import fs from 'fs';
import path from 'path';
const SAMPLE = fs.readFileSync(path.join(ROOT, 'samples', 'architecture-demo.drawio'), 'utf8');
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(900);
const SEEDS = (process.env.MONKEY_SEEDS || '1,2,3').split(',').map(Number), STEPS = +(process.env.MONKEY_STEPS || 250);

const check = () => pg.evaluate(async () => {
  const E = DiagramEditor, S = E.S, bad = [];
  for (const p of S.doc.pages) {
    const ids = new Set(), byId = new Map(p.cells.map(c => [c.id, c])), layers = new Set(p.layers.map(l => l.id));
    for (const c of p.cells) {
      if (ids.has(c.id)) bad.push('duplicate id ' + c.id); ids.add(c.id);
      for (const k of ['x', 'y', 'w', 'h']) if (c.v && !isFinite(c[k])) bad.push('non-finite ' + k + ' on ' + c.id);
      if (c.v && (c.w < 0 || c.h < 0)) bad.push('negative size on ' + c.id);
      if (c.e) { for (const t of [c.source, c.target]) if (t && !byId.has(t)) bad.push('line ' + c.id + ' joined to missing ' + t); for (const q of c.pts || []) if (!isFinite(q.x) || !isFinite(q.y)) bad.push('bad bend on ' + c.id); }
      if (!layers.has(c.parent) && !byId.has(c.parent)) bad.push('missing parent ' + c.parent + ' of ' + c.id);
      if (c.isEdgeLabel && !(byId.get(c.parent) || {}).e) bad.push('line label without its line ' + c.id);
      let q = c, n = 0; while (q && !layers.has(q.parent) && n < 1000) { q = byId.get(q.parent); n++; } if (n >= 1000) bad.push('parent loop at ' + c.id);
      for (const k in c.style) if (/[;=]/.test(k) || /;/.test(c.style[k] || '')) bad.push('broken style key ' + k + ' on ' + c.id);
    }
  }
  if (S.pi < 0 || S.pi >= S.doc.pages.length) bad.push('current page out of range');
  for (const id of S.sel) if (!E.page().cells.some(c => c.id === id)) bad.push('selection holds missing ' + id);
  const x = E.serializeDoc(S.doc), x2 = E.serializeDoc(await E.parseDrawio(x));
  if (x !== x2) bad.push('save, reopen, save is not stable');
  return bad;
});

for (const seed of SEEDS) {
  let s = seed * 2654435761 % 4294967296; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  await pg.evaluate(async (x) => { const E = DiagramEditor; E.S.dirty = false; await E.loadText(x, 'start.drawio'); }, SAMPLE);
  await pg.evaluate(() => { const E = DiagramEditor; E.S.dirty = false; E.runCommand('fit'); window.__start = E.serializeDoc(E.S.doc); window.__undo0 = E.S.undo.length; });
  const vp = await pg.evaluate(() => { const r = document.querySelector('#viewport').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const pt = () => ({ x: vp.x + 10 + rnd() * (vp.w - 20), y: vp.y + 10 + rnd() * (vp.h - 20) });
  const tiles = await pg.$$eval('.ptile', t => t.length);
  const keys = ['Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape', 'Control+z', 'Control+y', 'Control+c', 'Control+v', 'Control+x', 'Control+d', 'Control+a', 'Control+g', 'Control+Shift+G', 'Shift+ArrowRight', 'Control+Shift+E', 'Control+Shift+E'];
  const cmds = ['alignL', 'alignC', 'alignR', 'alignT', 'alignM', 'alignB', 'distH', 'distV', 'matchW', 'matchH', 'matchWH', 'group', 'ungroup', 'toFront', 'toBack', 'lock', 'arrangeLines', 'hopsAll', 'toggleGrid', 'toggleSnap', 'toggleRulers', 'toggleGuides', 'zoomIn', 'zoomOut', 'zoom100', 'fit', 'duplicate', 'selectAll', 'undo', 'redo', 'cut', 'paste'];
  const log = [];
  for (let i = 0; i < STEPS; i++) {
    const a = rnd();
    try {
      if (a < 0.22) { const p = pt(); log.push('click'); await pg.mouse.click(p.x, p.y); }
      else if (a < 0.45) { const p = pt(), q = pt(); log.push('drag'); await pg.mouse.move(p.x, p.y); await pg.mouse.down(); await pg.mouse.move((p.x + q.x) / 2, (p.y + q.y) / 2, { steps: 3 }); await pg.mouse.move(q.x, q.y, { steps: 3 }); await pg.mouse.up(); }
      else if (a < 0.52) { const p = pt(); log.push('type'); await pg.mouse.click(p.x, p.y, { count: 2 }); await pg.keyboard.type(pick(['A', 'Hello', '<b>x</b>', '😀', ''])); await pg.keyboard.press(pick(['Escape', 'Tab'])); }
      else if (a < 0.67) { const k = pick(keys); log.push(k); const parts = k.split('+'); for (const m of parts.slice(0, -1)) await pg.keyboard.down(m); await pg.keyboard.press(parts[parts.length - 1]); for (const m of parts.slice(0, -1).reverse()) await pg.keyboard.up(m); }
      else if (a < 0.77) { const t = Math.floor(rnd() * tiles); log.push('tile ' + t); await pg.evaluate(t => document.querySelectorAll('.ptile')[t] && document.querySelectorAll('.ptile')[t].click(), t); }
      else if (a < 0.90) { const c = pick(cmds); log.push(c); await pg.evaluate(c => DiagramEditor.runCommand(c), c); }
      else if (a < 0.95) { const p = pt(), q = pt(); log.push('right-drag'); await pg.mouse.move(p.x, p.y); await pg.mouse.down({ button: 'right' }); await pg.mouse.move(q.x, q.y, { steps: 4 }); await pg.mouse.up({ button: 'right' }); }
      else { const p = pt(); log.push('wheel'); await pg.mouse.move(p.x, p.y); await pg.mouse.wheel({ deltaY: (rnd() - 0.5) * 600 }); }
      await pg.evaluate(() => { document.querySelectorAll('#menuPopup').forEach(m => { m.innerHTML = ''; }); if (document.querySelector('#modalRoot').children.length) document.querySelector('#modalRoot').innerHTML = ''; });
    } catch (e) { fail('seed ' + seed + ' step ' + i + ' (' + log[log.length - 1] + '): ' + e.message); break; }
    if (i % 50 === 49 || i === STEPS - 1) {
      await pg.keyboard.press('Escape');
      const bad = await check();
      if (bad.length) { fail('seed ' + seed + ' after step ' + (i + 1) + ' (last: ' + log.slice(-5).join(', ') + '): ' + [...new Set(bad)].slice(0, 6).join('; ')); break; }
    }
  }
  // Undo everything, compare with the start; Redo everything, compare with the end
  const u = await pg.evaluate(() => {
    const E = DiagramEditor, S = E.S; if (S.editing) E.finishEdit();
    const end = E.serializeDoc(S.doc), n = S.undo.length;
    for (let i = 0; i < n; i++) E.runCommand('undo');
    const back = E.serializeDoc(S.doc);
    for (let i = 0; i < n; i++) E.runCommand('redo');
    return { n, full: n < 120, backOk: back === window.__start, redoOk: E.serializeDoc(S.doc) === end };
  });
  if (u.full && !u.backOk) fail('seed ' + seed + ': undoing all ' + u.n + ' steps did not give the starting diagram');
  if (!u.redoOk) fail('seed ' + seed + ': redoing all steps did not give the final diagram');
  const counts = {}; for (const l of log) counts[l.split(' ')[0]] = (counts[l.split(' ')[0]] || 0) + 1;
  console.log('seed ' + seed + ': ' + log.length + ' actions, ' + u.n + ' undo steps' + (u.full ? '' : ' (history full; undo-to-start not checked)') + '; ' + Object.entries(counts).map(([k, v]) => k + ' ' + v).join(', '));
}
console.log(errors.filter(e => !/Failed to load resource/.test(e)).join('\n') || 'no errors');
console.log(process.exitCode ? 'Monkey test FAILED' : 'Monkey test passed');
await b.close();
