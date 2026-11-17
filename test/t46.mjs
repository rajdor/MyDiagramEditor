// A label added to a line by hand starts with a background, in every diagram style: the Add label command and a
// double-click on the line both give it the canvas colour (white, or the dark canvas in Neon). Labels that are
// restyled with the whole diagram keep the style's own rule (Blueprint and Neon: no background), and the Transparent
// box still removes a background.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (name, cond, detail) => { if (cond) console.log('ok   ' + name); else fail(name + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail))); };

for (const mode of await pg.evaluate(() => DiagramEditor.STYLE_MODES.map(m => m.id))) {
  const r = await pg.evaluate((mode) => {
    const E = DiagramEditor; E.S.doc.mode = 'outline'; E.page().modelAttrs = {};
    let e, old;
    E.mutate(() => { const P = E.page(); P.cells.length = 0; const a = E.makeVertex('rect', 100, 100), c = E.makeVertex('rect', 420, 100); e = E.makeEdge('outline'); e.source = a.id; e.target = c.id; P.cells.push(a, c, e); old = E.makeEdgeLabel(e, 'old', -0.5, { x: 0, y: 0 }); P.cells.push(old); });
    if (mode !== 'outline') E.setDiagramStyle(mode, {});
    const restyled = E.cellById(old.id).style.labelBackgroundColor;
    E.addLabelToEdge(E.cellById(e.id));
    return { restyled, edge: e.id, old: old.id };
  }, mode);
  await sleep(150); await pg.keyboard.type('added'); await sleep(80);
  Object.assign(r, await pg.evaluate((oldId) => { const E = DiagramEditor; if (E.S.editing) E.finishEdit(); const added = E.page().cells.filter(x => x.isEdgeLabel && x.id !== oldId)[0]; const bg = E.page().modelAttrs && E.page().modelAttrs.background; return { mode: E.S.doc.mode, added: added && added.style.labelBackgroundColor, canvas: bg && bg !== 'none' ? bg : '#ffffff' }; }, r.old));
  ok(mode + ': a label added to a line has a background in the canvas colour', r.mode === mode && r.added && r.added !== 'none' && r.added.toLowerCase() === r.canvas.toLowerCase(), r);
  if (mode === 'blueprint' || mode === 'neon') ok(mode + ': a label restyled with the diagram still has no background', r.restyled === 'none', r);
  // double-click on the line adds a label the same way
  await sleep(150);
  const p = await pg.evaluate((id) => { const E = DiagramEditor, rt = E.S.routes.get(id), a = rt.pts[0], z = rt.pts[rt.pts.length - 1], w = { x: a.x + (z.x - a.x) * 0.8, y: a.y + (z.y - a.y) * 0.8 }, s = E.toScreen(w), v = document.querySelector('#viewport').getBoundingClientRect(); return [v.left + s.x, v.top + s.y]; }, r.edge);
  await pg.evaluate(() => DiagramEditor.setSel([])); await pg.mouse.click(p[0], p[1]); await pg.mouse.click(p[0], p[1], { clickCount: 2 }); await sleep(250); await pg.keyboard.type('dbl'); await sleep(80);
  const d = await pg.evaluate(() => { const E = DiagramEditor; if (E.S.editing) E.finishEdit(); const ls = E.page().cells.filter(x => x.isEdgeLabel); return { n: ls.length, last: ls.map(l => l.style.labelBackgroundColor) }; });
  ok(mode + ': a label added by double-clicking the line has a background too', d.n === 3 && d.last.filter(v => v && v !== 'none').length >= 2, d);
}
// Transparent still removes it
const t = await pg.evaluate(() => { const E = DiagramEditor; E.S.doc.mode = 'outline'; E.page().modelAttrs = {}; let e; E.mutate(() => { const P = E.page(); P.cells.length = 0; const a = E.makeVertex('rect', 100, 100), c = E.makeVertex('rect', 420, 100); e = E.makeEdge('outline'); e.source = a.id; e.target = c.id; P.cells.push(a, c, e); }); E.setDiagramStyle('blueprint', {}); const l = E.makeEdgeLabel(e, 'x', 0, { x: 0, y: 0 }); E.styleNewCell(l, 'blueprint'); E.newLabelBackground(l); E.mutate(() => E.page().cells.push(l)); E.setSel([l.id]); const box = Array.from(document.querySelectorAll('#format label')).find(x => /Transparent/.test(x.textContent)); const before = l.style.labelBackgroundColor; if (box) box.querySelector('input').click(); return { before, after: E.cellById(l.id).style.labelBackgroundColor, found: !!box }; });
ok('the Transparent box still removes the background', t.found && t.before === '#ffffff' && t.after === 'none', t);
console.log(errors.join('\n') || 'no errors');
await b.close();
