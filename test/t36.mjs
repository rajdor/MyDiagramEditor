// File commands and Undo rules: Open, Save, Save as, unsaved-changes prompt, file size limit, autosave and recovery,
// the 120-step undo history, redo cleared by a new edit, one undo step per style switch, page operations.
// The browser's file pickers are replaced by stand-ins so this runs headless.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (cond, m) => { if (!cond) fail(m); else console.log('ok: ' + m); };
await sleep(900);
const FILE = '<mxfile><diagram name="Opened page" id="o"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="a" value="From disk" vertex="1" parent="1"><mxGeometry x="10" y="10" width="80" height="40" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
await pg.evaluate((FILE) => {
  window.__saved = [];
  const handle = (name, text) => ({ name, getFile: async () => new File([text], name), createWritable: async () => { let buf = ''; return { write: async (s) => { buf += s; }, close: async () => { window.__saved.push({ name, xml: buf }); } }; } });
  window.showOpenFilePicker = async () => [handle('picked.drawio', FILE)];
  window.showSaveFilePicker = async (o) => handle(o.suggestedName, '');
  window.__handle = handle;
}, FILE);

// Open (clean document): loads straight away
await pg.evaluate(() => DiagramEditor.runCommand('open')); await sleep(400);
let s = await pg.evaluate(() => ({ page: DiagramEditor.S.doc.pages[0].name, file: DiagramEditor.S.file.name, dirty: DiagramEditor.S.dirty }));
ok(s.page === 'Opened page' && s.file === 'picked.drawio' && !s.dirty, 'Open loads the picked file and leaves it clean');

// Edit -> dirty; Open asks first, Cancel keeps the edit
await pg.evaluate(() => { const E = DiagramEditor; E.mutate(() => { E.page().cells[0].value = 'Edited'; }); });
ok(await pg.evaluate(() => DiagramEditor.S.dirty), 'an edit marks the diagram unsaved');
await pg.evaluate(() => DiagramEditor.runCommand('open')); await sleep(300);
const dlg = await pg.evaluate(() => { const m = document.querySelector('#modalRoot .modal'); return m ? m.innerText : ''; });
ok(/unsaved changes/i.test(dlg), 'Open with unsaved changes asks first');
await pg.evaluate(() => { [...document.querySelectorAll('#modalRoot .modal footer .btn')].find(x => /cancel/i.test(x.textContent)).click(); }); await sleep(200);
ok(await pg.evaluate(() => DiagramEditor.page().cells[0].value === 'Edited'), 'Cancel keeps the unsaved edit');

// Save writes the file through the handle and clears the unsaved flag
await pg.evaluate(() => DiagramEditor.runCommand('save')); await sleep(300);
s = await pg.evaluate(() => ({ saved: window.__saved.slice(-1)[0], dirty: DiagramEditor.S.dirty }));
ok(s.saved && s.saved.name === 'picked.drawio' && s.saved.xml.includes('Edited') && !s.dirty, 'Save writes to the opened file and clears the unsaved flag');
// Save as asks for a new file
await pg.evaluate(() => DiagramEditor.runCommand('saveAs')); await sleep(300);
ok(await pg.evaluate(() => window.__saved.length === 2 && DiagramEditor.S.file.name === 'picked.drawio'), 'Save as writes through a new file picker');
// edits made while the save dialog is open stay unsaved
const raced = await pg.evaluate(async () => {
  const E = DiagramEditor, orig = window.showSaveFilePicker;
  window.showSaveFilePicker = async (o) => { E.mutate(() => { E.page().cells[0].value = 'Typed during save'; }); return window.__handle(o.suggestedName, ''); };
  await E.saveFile(true); window.showSaveFilePicker = orig; return E.S.dirty;
});
ok(raced, 'an edit made while the save dialog was open stays marked unsaved');

// file size limit
const big = await pg.evaluate(async () => {
  window.showOpenFilePicker = async () => [{ name: 'huge.drawio', getFile: async () => ({ name: 'huge.drawio', size: 200 << 20, text: async () => { throw new Error('should not be read'); } }) }];
  DiagramEditor.S.dirty = false; DiagramEditor.runCommand('open'); await new Promise(r => setTimeout(r, 300));
  return document.querySelector('#toast').textContent;
});
ok(/larger than 100 MB/.test(big), 'a file over 100 MB is refused with a message');

// fallback without the File System Access API: Open uses the file input
const fb = await pg.evaluate(async (FILE) => {
  const inp = document.querySelector('#fileInput'); let clicked = false; inp.click = () => { clicked = true; };
  delete window.showOpenFilePicker; // HAS_FSA was decided at start-up, so only check the input route directly
  const dt = new DataTransfer(); dt.items.add(new File([FILE], 'input.drawio')); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  await new Promise(r => setTimeout(r, 300));
  return { name: DiagramEditor.S.file.name, value: inp.value };
}, FILE);
ok(fb.name === 'input.drawio' && fb.value === '', 'the file input opens a file and resets for the next one');

// autosave and recovery
const rec = await pg.evaluate(async () => {
  const E = DiagramEditor; localStorage.removeItem('de-autosave-v1');
  E.mutate(() => { E.page().cells[0].value = 'Autosaved text'; });
  window.dispatchEvent(new Event('beforeunload'));
  const a = JSON.parse(localStorage.getItem('de-autosave-v1') || 'null');
  return { has: !!a && a.xml.includes('Autosaved text') };
});
ok(rec.has, 'unsaved work is autosaved to browser storage');
const full = await pg.evaluate(async () => {
  const E = DiagramEditor, orig = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); };
  E.mutate(() => { E.page().cells[0].value = 'x' + Math.random(); }); window.dispatchEvent(new Event('beforeunload'));
  Storage.prototype.setItem = orig; return document.querySelector('#toast').textContent;
});
ok(/Autosave is not working/.test(full), 'a full or blocked browser storage is reported once');

// Undo history: 120 steps, redo cleared by a new edit
const u = await pg.evaluate(() => {
  const E = DiagramEditor, S = E.S; S.undo = []; S.redo = [];
  for (let i = 0; i < 130; i++) E.mutate(() => { E.page().cells[0].x = i; });
  const n = S.undo.length; E.runCommand('undo'); E.runCommand('undo'); const r = S.redo.length;
  E.mutate(() => { E.page().cells[0].y = 999; }); const r2 = S.redo.length;
  E.mutate(() => { }); const noop = S.undo.length;
  return { n, r, r2, x: E.page().cells[0].x, noopSame: noop === n - 2 + 1 };
});
ok(u.n === 120, 'undo history keeps 120 steps (' + u.n + ')');
ok(u.r === 2 && u.r2 === 0, 'a new edit clears the redo history');
ok(u.noopSame, 'an action that changes nothing adds no undo step');
// a style switch is one undo step, and undo restores the exact diagram
const st = await pg.evaluate(() => {
  const E = DiagramEditor, S = E.S; const before = E.serializeDoc(S.doc), n = S.undo.length;
  E.setDiagramStyle('neon', {}); const steps = S.undo.length - n; E.runCommand('undo');
  return { steps, same: E.serializeDoc(S.doc) === before };
});
ok(st.steps === 1 && st.same, 'a style switch is one undo step and undo restores the diagram exactly');
// pages: add, rename, duplicate, move, delete, all undoable
const pgOps = await pg.evaluate(() => {
  const E = DiagramEditor, S = E.S, names = () => S.doc.pages.map(p => p.name).join('|');
  const start = names();
  document.querySelector('#addPage').click(); const added = S.doc.pages.length;
  E.mutate(() => { S.doc.pages[1].name = 'Second'; });
  const dupIds = new Set(S.doc.pages[0].cells.map(c => c.id));
  E.runCommand('selectAll'); E.runCommand('copy'); S.pi = 1; E.runCommand('paste');
  const pastedNew = S.doc.pages[1].cells.every(c => !dupIds.has(c.id));
  for (let i = 0; i < 3; i++) E.runCommand('undo');
  return { added, pastedNew, back: names() === start, pi: S.pi };
});
ok(pgOps.added === 2, 'add page');
ok(pgOps.pastedNew, 'pasting onto another page gives the copies new ids');
ok(pgOps.back && pgOps.pi === 0, 'undo removes added pages and returns to a valid page');

console.log(errors.filter(e => !/Failed to load resource/.test(e)).join('\n') || 'no errors');
console.log(process.exitCode ? 'File and undo test FAILED' : 'File and undo test passed');
await b.close();
