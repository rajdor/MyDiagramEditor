// Editing behaviour agreed on 24 October 2026 (behaviour review): select all, z-order in containers, line labels,
// delete keeps lines, cut and lock, duplicate and the clipboard, arrow nudges, containers, grouping, Escape, grid size.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (c, m) => { if (!c) fail(m); else console.log('ok: ' + m); };
await sleep(900);
const fresh = () => pg.evaluate(() => { const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; S.sel = []; S.undo = []; S.redo = []; S.clipboard = null; E.clearCache(); S.zoom = 1; S.tx = 0; S.ty = 0; E.renderAll(); });
const ev = (f, ...a) => pg.evaluate(f, ...a);
const at = (x, y) => ev((x, y) => { const r = document.querySelector('#viewport').getBoundingClientRect(); const p = DiagramEditor.toScreen({ x, y }); return { x: r.left + p.x, y: r.top + p.y }; }, x, y);
const drag = async (from, to) => { const a = await at(from.x, from.y), z = await at(to.x, to.y); await pg.mouse.move(a.x, a.y); await pg.mouse.down(); await pg.mouse.move((a.x + z.x) / 2, (a.y + z.y) / 2, { steps: 5 }); await pg.mouse.move(z.x, z.y, { steps: 5 }); await pg.mouse.up(); await sleep(120); };

// 1. Ctrl+A and the marquee skip shapes on hidden layers
let r = await ev(async () => { const E = DiagramEditor; await E.loadText('<mxfile><diagram name="P" id="p"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Hidden" parent="0" visible="0"/><mxCell id="a" value="visible" vertex="1" parent="1"><mxGeometry x="10" y="10" width="80" height="40" as="geometry"/></mxCell><mxCell id="h" value="hidden" vertex="1" parent="2"><mxGeometry x="200" y="10" width="80" height="40" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>', 'x.drawio');
  E.runCommand('selectAll'); const sel = E.S.sel.slice(); E.runCommand('delete'); return { sel, left: E.page().cells.map(c => c.id) }; });
ok(r.sel.join() === 'a' && r.left.join() === 'h', '1. Ctrl+A selects only visible shapes; Delete leaves the hidden one');
await ev(() => { const E = DiagramEditor; E.runCommand('undo'); E.S.zoom = 1; E.S.tx = 60; E.S.ty = 60; E.renderAll(); });
{ const a = await at(-20, -20), z = await at(400, 120); await pg.mouse.move(a.x, a.y); await pg.mouse.down(); await pg.mouse.move(z.x, z.y, { steps: 6 }); await pg.mouse.up(); await sleep(100); }
ok(await ev(() => DiagramEditor.S.sel.join() === 'a'), '1. dragging a selection box over both selects only the visible shape');

// 2. send to back keeps a shape in front of its container
await fresh();
r = await ev(() => { const E = DiagramEditor, P = E.page(); const other = E.makeVertex('rect', 600, 0); const box = E.makeVertex('container', 0, 0); box.w = 300; box.h = 200; box.style.fillColor = '#dbeafe'; const kid = E.makeVertex('rect', 40, 60); kid.parent = box.id;
  E.mutate(() => P.cells.push(other, box, kid)); E.setSel([kid.id]); E.runCommand('toBack'); const i = (c) => P.cells.indexOf(c);
  const inside = i(kid) > i(box); E.setSel([box.id]); E.runCommand('toBack'); return { inside, boxFirst: i(box) === 0, kidAfter: i(kid) > i(box) }; });
ok(r.inside, '2. send to back on a shape inside a container keeps it in front of the container');
ok(r.boxFirst && r.kidAfter, '2. send to back on the container takes its contents with it');

// 3. a line label copied on its own pastes as a text box beside the original
await fresh();
r = await ev(() => { const E = DiagramEditor, P = E.page(); const a = E.makeVertex('rect', 0, 0), b = E.makeVertex('rect', 300, 0), e = E.makeEdge(); e.source = a.id; e.target = b.id; const l = E.makeEdgeLabel(e, 'calls', 0, { x: 0, y: 0 });
  E.mutate(() => P.cells.push(a, b, e, l)); E.renderAll(); E.setSel([l.id]); E.runCommand('copy'); E.runCommand('paste'); const p = E.cellById(E.S.sel[0]);
  return { labels: P.cells.filter(c => c.isEdgeLabel).length, text: p && !p.isEdgeLabel && p.value === 'calls' && E.page().cells.includes(p), pos: p && [p.x, p.y] }; });
ok(r.labels === 1 && r.text, '3. a line label pasted without its line becomes a text box "calls" (' + r.pos + ')');
r = await ev(() => { const E = DiagramEditor, P = E.page(); const e = P.cells.find(c => c.e); E.setSel([e.id]); E.runCommand('copy'); E.runCommand('paste'); return P.cells.filter(c => c.isEdgeLabel).length; });
ok(r === 2, '3. copying a line with its label still pastes the label on the new line');

// 4 + 7. deleting a shape leaves its lines (locked or not), with that end left where it was
await fresh();
r = await ev(() => { const E = DiagramEditor, P = E.page(); const a = E.makeVertex('rect', 0, 0), b = E.makeVertex('rect', 300, 0), c = E.makeVertex('rect', 300, 200); const e1 = E.makeEdge(), e2 = E.makeEdge(); e1.source = a.id; e1.target = b.id; e2.source = a.id; e2.target = c.id; e2.style.locked = '1';
  E.mutate(() => P.cells.push(a, b, c, e1, e2)); E.renderAll(); const start = E.S.routes.get(e1.id).pts[0]; E.setSel([a.id]); E.runCommand('delete');
  return { lines: P.cells.filter(x => x.e).length, free: !e1.source && e1.target === b.id && Math.abs(e1.sp.x - start.x) < 1 && Math.abs(e1.sp.y - start.y) < 1, lockedKept: P.cells.includes(e2) }; });
ok(r.lines === 2 && r.lockedKept, '4/7. deleting a shape keeps both connected lines, including the locked one');
ok(r.free, '7. the line end that was on the deleted shape stays where it was, unconnected');

// 5. locked shapes can't be cut; copy and paste of a locked shape keeps the original
await fresh();
r = await ev(() => { const E = DiagramEditor, P = E.page(); const a = E.makeVertex('rect', 0, 0), b = E.makeVertex('rect', 300, 0); a.style.locked = '1'; E.mutate(() => P.cells.push(a, b));
  E.setSel([a.id]); E.runCommand('cut'); const t = document.querySelector('#toast').textContent, n1 = P.cells.length, clip = E.S.clipboard;
  E.setSel([a.id, b.id]); E.runCommand('cut'); const n2 = P.cells.length, kept = P.cells.includes(a);
  E.runCommand('paste'); const pasted = P.cells.length; E.setSel([a.id]); E.runCommand('copy'); E.runCommand('paste');
  return { t, n1, clip, n2, kept, pasted, after: P.cells.length, orig: P.cells.includes(a) }; });
ok(r.n1 === 2 && /can't be cut/.test(r.t) && !r.clip, '5. cutting a locked shape does nothing and says why');
ok(r.n2 === 1 && r.kept && r.pasted === 2, '5. cutting a mix cuts only the unlocked shape; paste brings back just that one');
ok(r.after === 3 && r.orig, '5. copy and paste of a locked shape adds a copy and keeps the original');

// 6. locked: text can be edited, colours changed; position and size fixed
await fresh();
r = await ev(() => { const E = DiagramEditor, P = E.page(); const a = E.makeVertex('rect', 0, 0); a.style.locked = '1'; E.mutate(() => P.cells.push(a)); E.setSel([a.id]);
  E.startEdit(a); const editing = !!E.S.editing; E.finishEdit(true);
  const geo = [...document.querySelectorAll('#format .fsec')].find(s => /Size and position/.test(s.textContent)); const disabled = geo && [...geo.querySelectorAll('input')].every(i => i.disabled);
  return { editing, disabled }; });
ok(r.editing, '6. a locked shape\'s text can be edited');
ok(r.disabled, '6. a locked shape\'s position, size and rotation fields are disabled');

// 8. duplicate leaves the clipboard alone; repeated paste keeps cascading
await fresh();
r = await ev(() => { const E = DiagramEditor, P = E.page(); const a = E.makeVertex('rect', 0, 0), b = E.makeVertex('ellipse', 300, 0); a.value = 'A'; b.value = 'B'; E.mutate(() => P.cells.push(a, b));
  E.setSel([a.id]); E.runCommand('copy'); E.runCommand('paste'); const p1 = E.cellById(E.S.sel[0]);
  E.setSel([b.id]); E.runCommand('duplicate'); E.runCommand('paste'); const p2 = E.cellById(E.S.sel[0]);
  return { v: p2.value, step: [p1.x, p2.x] }; });
ok(r.v === 'A', '8. after Ctrl+D, Ctrl+V still pastes what was copied with Ctrl+C');
ok(r.step[1] - r.step[0] === 15, '8. each further paste lands one step further on (' + r.step + ')');

// 9. arrows move 1 px; Shift+arrow moves a grid cell
await fresh();
await ev(() => { const E = DiagramEditor, P = E.page(); const a = E.makeVertex('rect', 100, 100); E.mutate(() => P.cells.push(a)); E.setSel([a.id]); });
await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('ArrowDown');
await pg.keyboard.down('Shift'); await pg.keyboard.press('ArrowRight'); await pg.keyboard.up('Shift');
r = await ev(() => { const c = DiagramEditor.page().cells[0]; return [c.x, c.y]; });
ok(r[0] === 111 && r[1] === 101, '9. ArrowRight + ArrowDown move 1 px, Shift+ArrowRight a grid cell (' + r + ')');

// 10. containers: drop in, move together, drag out
await fresh();
const ids = await ev(() => { const E = DiagramEditor, P = E.page(); const box = E.makeVertex('container', 300, 100); box.w = 300; box.h = 200; const a = E.makeVertex('rect', 20, 140); E.mutate(() => P.cells.push(box, a)); E.renderAll(); return { box: box.id, a: a.id }; });
await drag({ x: 80, y: 170 }, { x: 440, y: 210 });
r = await ev((ids) => { const E = DiagramEditor, a = E.cellById(ids.a), box = E.cellById(ids.box), P = E.page(); return { parent: a.parent === ids.box, front: P.cells.indexOf(a) > P.cells.indexOf(box) }; }, ids);
ok(r.parent && r.front, '10. a shape dragged onto a container goes into it (and is drawn in front of it)');
r = await ev((ids) => { const a = DiagramEditor.cellById(ids.a); return [a.x, a.y]; }, ids);
await drag({ x: 301, y: 250 }, { x: 351, y: 300 }); // grab the container by its left edge
const moved = await ev((ids) => { const a = DiagramEditor.cellById(ids.a), box = DiagramEditor.cellById(ids.box); return { a: [a.x, a.y], box: [box.x, box.y] }; }, ids);
ok(moved.box[0] === 350 && moved.a[0] - r[0] === 50 && moved.a[1] - r[1] === 50, '10. moving the container moves the shape with it ' + JSON.stringify({ before: r, moved }));
await drag({ x: moved.a[0] + 40, y: moved.a[1] + 20 }, { x: moved.a[0] + 40, y: moved.a[1] + 320 });
ok(await ev((ids) => DiagramEditor.cellById(ids.a).parent !== ids.box, ids), '10. dragging the shape off the container takes it out');
r = await ev(() => { const E = DiagramEditor; const x = E.serializeDoc(E.S.doc); return /parent="[^"]+"/.test(x); });
// palette drag onto the container
{ const tile = await pg.$$('.ptile'); const bb = await tile[0].boundingBox(); const tgt = await at(moved.box[0] + 150, moved.box[1] + 120);
  await pg.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await pg.mouse.down(); await pg.mouse.move(tgt.x - 50, tgt.y, { steps: 6 }); await pg.mouse.move(tgt.x, tgt.y, { steps: 4 }); await pg.mouse.up(); await sleep(150); }
ok(await ev((ids) => DiagramEditor.cellById(DiagramEditor.S.sel[0]).parent === ids.box, ids), '10. a shape dragged from the palette onto a container goes into it');
r = await ev(async () => { const E = DiagramEditor, x = E.serializeDoc(E.S.doc), d = await E.parseDrawio(x); return E.serializeDoc(d) === x; });
ok(r, '10. containers with contents save and reopen unchanged');

// 11. grouping only groups shapes that share a container
await fresh();
r = await ev(() => { const E = DiagramEditor, P = E.page(); const box = E.makeVertex('container', 0, 0); box.w = 300; box.h = 200; const kid = E.makeVertex('rect', 40, 60); kid.parent = box.id; const out = E.makeVertex('rect', 500, 60), out2 = E.makeVertex('rect', 700, 60);
  E.mutate(() => P.cells.push(box, kid, out, out2)); E.setSel([out.id, kid.id, out2.id]); E.runCommand('group'); const g = E.cellById(E.S.sel[0]);
  return { kidStays: kid.parent === box.id, grouped: out.parent === g.id && out2.parent === g.id, toast: document.querySelector('#toast').textContent }; });
ok(r.kidStays && r.grouped && /Grouped 2 of 3/.test(r.toast), '11. grouping leaves the shape inside the container where it is and says so');

// 17. Escape cancels text editing; a new text box cancelled is removed
await fresh();
await ev(() => { const E = DiagramEditor, P = E.page(); const a = E.makeVertex('rect', 100, 100); a.value = 'Original'; E.mutate(() => P.cells.push(a)); E.setSel([a.id]); E.startEdit(a); });
await pg.keyboard.down('Control'); await pg.keyboard.press('a'); await pg.keyboard.up('Control'); await pg.keyboard.type('Changed'); await pg.keyboard.press('Escape'); await sleep(100);
r = await ev(() => ({ v: DiagramEditor.page().cells[0].value, undo: DiagramEditor.S.undo.length }));
ok(r.v === 'Original' && r.undo === 1, '17. Escape cancels: the text goes back and no undo step is added');
await ev(() => { const E = DiagramEditor; E.startEdit(E.page().cells[0]); });
await pg.keyboard.down('Control'); await pg.keyboard.press('a'); await pg.keyboard.up('Control'); await pg.keyboard.type('Kept'); await pg.keyboard.down('Control'); await pg.keyboard.press('Enter'); await pg.keyboard.up('Control'); await sleep(100);
ok(await ev(() => DiagramEditor.page().cells[0].value === 'Kept'), '17. Ctrl+Enter keeps the text');
{ const p = await at(500, 400); await pg.mouse.click(p.x, p.y, { count: 2 }); await sleep(150); await pg.keyboard.type('new'); await pg.keyboard.press('Escape'); await sleep(100); }
ok(await ev(() => DiagramEditor.page().cells.length === 1 && !DiagramEditor.S.editing), '17. Escape on a new text box removes it');

// 18. grid size: the same 1 to 1000 range in files and in the panel
await fresh();
r = await ev(() => { const E = DiagramEditor; E.setSel([]); const row = [...document.querySelectorAll('#format .frow')].find(x => x.textContent.startsWith('Size')); const i = row.querySelector('input'); i.value = '500'; i.dispatchEvent(new Event('change')); const a = E.page().gridSize; i.value = '5000'; i.dispatchEvent(new Event('change')); return [a, E.page().gridSize]; });
ok(r[0] === 500 && r[1] === 1000, '18. grid size in the panel accepts up to 1000, like files (' + r + ')');

console.log(errors.join('\n') || 'no errors');
console.log(process.exitCode ? 'Editing behaviour test FAILED' : 'Editing behaviour test passed');
await b.close();
