/* ===== Commands, menus, toolbar, palette, format panel, pages, dialogs ===== */
const ICONS = {
  brush: '<path d="M14 4l6 6-7.5 7.5-6-6z"/><path d="M6.5 11.5L4 14c-1 1-1 3 0 4l2 2c1 1 3 1 4 0l2.5-2.5"/><path d="M16 6l2-2"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6M11 8v6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  line: '<path d="M4 20L18 6"/><path d="M12 6h6v6"/>',
  front: '<rect x="8" y="8" width="12" height="12" rx="1.5" fill="currentColor" opacity=".25"/><rect x="4" y="4" width="12" height="12" rx="1.5"/>',
  back: '<rect x="4" y="4" width="12" height="12" rx="1.5" fill="currentColor" opacity=".25"/><rect x="8" y="8" width="12" height="12" rx="1.5"/>',
  group: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 2"/><rect x="7" y="7" width="5" height="5"/><rect x="12" y="12" width="5" height="5"/>',
  ungroup: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  alignL: '<path d="M4 3v18"/><rect x="7" y="6" width="12" height="4"/><rect x="7" y="14" width="7" height="4"/>',
  alignC: '<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4"/><rect x="8" y="14" width="8" height="4"/>',
  alignR: '<path d="M20 3v18"/><rect x="5" y="6" width="12" height="4"/><rect x="10" y="14" width="7" height="4"/>',
  alignT: '<path d="M3 4h18"/><rect x="6" y="7" width="4" height="12"/><rect x="14" y="7" width="4" height="7"/>',
  alignM: '<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14"/><rect x="14" y="8" width="4" height="8"/>',
  alignB: '<path d="M3 20h18"/><rect x="6" y="5" width="4" height="12"/><rect x="14" y="10" width="4" height="7"/>',
  distH: '<path d="M4 3v18M20 3v18"/><rect x="9" y="8" width="6" height="8"/>',
  matchW: '<path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3"/><path d="M3 5v3M21 5v3M3 16v3M21 16v3"/>',
  matchH: '<path d="M12 3v18M9 6l3-3 3 3M9 18l3 3 3-3"/><path d="M5 3h3M16 3h3M5 21h3M16 21h3"/>',
  matchWH: '<rect x="6" y="6" width="12" height="12"/><path d="M3 3l3 3M21 3l-3 3M3 21l3-3M21 21l-3-3"/>',
  widthLeft: '<path d="M4 3v18"/><rect x="7" y="5" width="13" height="5"/><rect x="7" y="14" width="13" height="5"/>',
  heightTop: '<path d="M3 4h18"/><rect x="5" y="7" width="5" height="13"/><rect x="14" y="7" width="5" height="13"/>',
  distV: '<path d="M3 4h18M3 20h18"/><rect x="8" y="9" width="8" height="6"/>',
  sketch: '<path d="M3 17c3-1 4-6 7-6s2 5 5 5 4-4 6-5"/><path d="M14 4l6 6-9 9H5v-6z" opacity=".35"/>',
  st_outline: '<rect x="4" y="5" width="16" height="14" rx="3"/>',
  st_filled: '<rect x="4" y="5" width="16" height="14" rx="3" fill="currentColor"/>',
  st_duotone: '<rect x="4" y="5" width="16" height="14" rx="3" fill="currentColor" fill-opacity=".3"/>',
  st_sketch: '<path d="M4.5 6.2c4-.6 10.5-.9 15.2-.3M19.6 5.4c.4 4.2.3 9 .1 13.4M20 18.6c-5 .5-10.6.6-15.6.2M4.2 19c-.3-4.4-.2-8.8.4-13.3"/><path d="M7 16l9-9M10 17l7-7M7 12l5-5" stroke-width="1" opacity=".6"/>',
  st_neon: '<rect x="4" y="5" width="16" height="14" rx="3" stroke-width="3.6" opacity=".25"/><rect x="4" y="5" width="16" height="14" rx="3"/>',
  st_blueprint: '<circle cx="4" cy="4" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="4" r=".9" fill="currentColor" stroke="none"/><circle cx="20" cy="4" r=".9" fill="currentColor" stroke="none"/><rect x="4" y="8" width="16" height="11" rx="1.5"/><path d="M6 21h15V10" opacity=".35"/>',
  chev: '<path d="M7 10l5 5 5-5"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  open: '<path d="M3 7h6l2 2h10v10H3z"/>',
  exportI: '<path d="M12 3v12M7 8l5-5 5 5M5 15v5h14v-5"/>',
  arrange: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17.5v.1"/>'
};
function icon(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>'; }

/* ---------- UI themes: the editor's own look (not the diagram). Remembered in this browser's preferences. ---------- */
const UI_THEMES = [
  { id: 'classic', label: 'Classic' }, { id: 'flat-minimal', label: 'Flat / Minimal' },
  { id: 'material', label: 'Material Design' }, { id: 'neumorphism', label: 'Neumorphism' }
];
const DEFAULT_UI_THEME = 'neumorphism';
function applyUiTheme(id) {
  if (!UI_THEMES.some(t => t.id === id)) id = DEFAULT_UI_THEME;
  if (id === 'classic') delete document.documentElement.dataset.uiTheme; else document.documentElement.dataset.uiTheme = id;
  S.prefs.uiTheme = id; savePrefs();
  if (typeof renderRulers === 'function') requestRender();
}

/* ---------- commands ---------- */
const COMMANDS = {
  new: () => confirmDiscard(() => { S.doc = newDoc(); S.pi = 0; S.file = { handle: null, name: 'Untitled.drawio' }; S.undo = []; S.redo = []; S.sel = []; clearCache(); setDirty(false); clearAutosave(); afterChange(); fitView(); }),
  open: () => openFile(), save: () => saveFile(false), saveAs: () => saveFile(true),
  exportGliffy: () => exportGliffy(), exportPng: () => exportPngDialog(), exportSvg: () => exportSvg(), exportPdf: () => exportPdf(),
  testDiagram: () => confirmDiscard(loadTestDiagram),
  undo: () => undo(), redo: () => redo(),
  copy: () => copySel(), cut: () => cutSel(), paste: () => pasteClip(), duplicate: () => { const keep = S.clipboard; copySel(true); pasteClip(true); S.clipboard = keep; },
  delete: () => deleteSel(), selectAll: () => setSelAuto(topUnits(page().cells.filter(c => !isHiddenByLayer(page(), c, S.map) && (!c.isEdgeLabel && !isGroup(c) || isGroup(c)))).filter(c => !c.isEdgeLabel).map(c => selectionUnitTop(c).id).filter((v, i, a) => a.indexOf(v) === i)),
  copyXml: () => copyAsXml(), pasteXml: () => { pasteXml(); }, copyStyle: () => copyStyle(), pasteStyle: () => pasteStyle(), paintStyle: () => S.painter ? paintEnd() : paintStart(false),
  zoomIn: () => setZoom(S.zoom * 1.2), zoomOut: () => setZoom(S.zoom / 1.2), zoom100: () => setZoom(1), fit: () => fitView(),
  toggleClean: () => { S.clean = !S.clean; S.hover = null; S.hoverPoint = null; if (S.clean) { if (S.editing) finishEdit(); toast('Screenshot mode: press Esc or Ctrl+Shift+E to return'); } requestRender(); updateToolbar(); },
  canvasBg: () => canvasBgDialog(),
  toggleGrid: () => mutate(() => { page().gridVisible = !page().gridVisible; }),
  toggleSnap: () => mutate(() => { page().grid = !page().grid; }),
  toggleRulers: () => mutate(() => { page().rulers = !page().rulers; }),
  toggleGuides: () => mutate(() => { page().guidesVisible = !page().guidesVisible; }),
  lockGuides: () => mutate(() => { page().guidesLocked = !page().guidesLocked; S.selGuides = []; }),
  clearGuides: () => mutate(() => { page().guides = []; S.selGuides = []; }),
  distributeGuides: () => distributeGuides(),
  toggleSmart: () => mutate(() => { page().smartGuides = !page().smartGuides; }),
  toggleSketch: () => setDiagramStyle(S.doc.mode === 'sketch' ? 'outline' : 'sketch'),
  styleOutline: () => setDiagramStyle('outline'), styleFilled: () => setDiagramStyle('filled'), styleDuotone: () => setDiagramStyle('duotone'),
  styleSketch: () => setDiagramStyle('sketch'), styleNeon: () => setDiagramStyle('neon'), styleBlueprint: () => setDiagramStyle('blueprint'), styleMenu: () => styleMenu(),
  hopsAll: () => mutate(() => { const on = !page().cells.some(c => c.e && sv(c.style, 'jumpStyle', 'none') !== 'none'); for (const c of page().cells) if (c.e) { c.style.jumpStyle = on ? 'arc' : 'none'; if (on) c.style.jumpSize = '8'; } toast(on ? 'Line hops on for all lines' : 'Line hops off for all lines'); }),
  alignL: () => alignSel('left'), alignC: () => alignSel('center'), alignR: () => alignSel('right'),
  alignT: () => alignSel('top'), alignM: () => alignSel('middle'), alignB: () => alignSel('bottom'),
  distH: () => distributeSel('h'), distV: () => distributeSel('v'),
  matchW: () => matchSize('w'), matchH: () => matchSize('h'), matchWH: () => matchSize('wh'), widthLeft: () => sizeAndAlign('w'), heightTop: () => sizeAndAlign('h'),
  group: () => groupSel(), ungroup: () => ungroupSel(), toFront: () => zOrder(true), toBack: () => zOrder(false),
  lock: () => mutate(() => { const cs = selCells(); const on = !cs.every(isLocked); for (const c of cs) setStyle(c.style, 'locked', on ? 1 : null); }),
  arrangeShapes: () => arrangeDialog(), arrangeLines: () => { mutate(() => { const n = minimiseCrossings(selectedOrAllEdges(), { keepWaypoints: false }); toast('Lines re-routed. Crossings: ' + n.before + ' to ' + n.after); }); },
  arrangeAll: () => layeredDialog(),
  addLine: () => addFreeLine(),
  shortcuts: () => shortcutsDialog(), crowsFoot: () => crowsFootDialog(), register: () => registerDialog(), about: () => aboutDialog(),
  restoreAutosave: () => checkAutosave(true),
  fixText: () => manualContrast('text'), fixContrast: () => manualContrast('all'), contrast: () => contrastDialog()
};
function runCommand(id) {
  if (S.embed && EMBED_BLOCKED.has(id)) { if (id === 'save') toast('Press Done to return the diagram.'); return; } // the host page owns files in embed mode
  if (S.editing && !['undo', 'redo'].includes(id)) finishEdit(); const f = COMMANDS[id]; if (f) f();
}

/* ---------- menus ---------- */
function menuDefs() {
  const pg = page(), has = S.sel.length > 0, multi = topUnits(selCells()).length > 1;
  const chk = (v) => ({ check: !!v });
  return {
    File: S.embed ? [
      { t: 'Done', c: 'embedDone', hint: 'Return the diagram to the document' }, { t: 'Cancel', c: 'embedCancel', hint: 'Close without returning changes' }, '-',
      { t: 'UI theme', sub: UI_THEMES.map(t => ({ t: t.label, check: (S.prefs.uiTheme || DEFAULT_UI_THEME) === t.id, fn: () => { applyUiTheme(t.id); toast('UI theme: ' + t.label); } })) }
    ] : [
      { t: 'New', c: 'new' }, { t: 'Open…', c: 'open', sc: 'Ctrl+O' }, { t: 'Open recent', sub: recentMenu() }, '-',
      { t: 'Save', c: 'save', sc: 'Ctrl+S' }, { t: 'Save as…', c: 'saveAs', sc: 'Ctrl+Shift+S' }, '-',
      { t: 'Export draw.io (Gliffy compatible)…', c: 'exportGliffy' }, { t: 'Export PNG…', c: 'exportPng' }, { t: 'Export SVG', c: 'exportSvg' }, { t: 'Export PDF', c: 'exportPdf' }, '-',
      { t: 'UI theme', sub: UI_THEMES.map(t => ({ t: t.label, check: (S.prefs.uiTheme || DEFAULT_UI_THEME) === t.id, fn: () => { applyUiTheme(t.id); toast('UI theme: ' + t.label); } })) }, '-',
      { t: 'Recover autosaved work…', c: 'restoreAutosave' }, { t: 'Load test diagram', c: 'testDiagram' }
    ],
    Edit: [
      { t: 'Undo', c: 'undo', sc: 'Ctrl+Z', dis: !S.undo.length }, { t: 'Redo', c: 'redo', sc: 'Ctrl+Y', dis: !S.redo.length }, '-',
      { t: 'Cut', c: 'cut', sc: 'Ctrl+X', dis: !has }, { t: 'Copy', c: 'copy', sc: 'Ctrl+C', dis: !has }, { t: 'Paste', c: 'paste', sc: 'Ctrl+V', dis: !S.clipboard },
      { t: 'Duplicate', c: 'duplicate', sc: 'Ctrl+D', dis: !has }, { t: 'Delete', c: 'delete', sc: 'Del', dis: !has }, '-',
      { t: 'Select all', c: 'selectAll', sc: 'Ctrl+A' }, { t: 'Copy selection as draw.io XML', c: 'copyXml', dis: !has }, { t: 'Paste from draw.io XML (clipboard)', c: 'pasteXml' }, '-',
      { t: 'Copy style', c: 'copyStyle', sc: 'Alt+Shift+C', dis: !has }, { t: 'Paste style', c: 'pasteStyle', sc: 'Alt+Shift+V', dis: !has || !S.styleClip }
    ],
    View: [
      { t: 'Zoom in', c: 'zoomIn', sc: 'Ctrl++' }, { t: 'Zoom out', c: 'zoomOut', sc: 'Ctrl+-' }, { t: 'Actual size', c: 'zoom100', sc: 'Ctrl+0' }, { t: 'Fit diagram', c: 'fit', sc: 'Ctrl+Shift+H' }, '-',
      Object.assign({ t: 'Screenshot mode (hide grid, rulers, guides, selection)', c: 'toggleClean', sc: 'Ctrl+Shift+E' }, chk(S.clean)), { t: 'Canvas background colour…', c: 'canvasBg' }, '-',
      Object.assign({ t: 'Show grid', c: 'toggleGrid' }, chk(pg.gridVisible)), Object.assign({ t: 'Snap to grid', c: 'toggleSnap' }, chk(pg.grid)),
      Object.assign({ t: 'Smart guides', c: 'toggleSmart' }, chk(pg.smartGuides)), Object.assign({ t: 'Rulers', c: 'toggleRulers' }, chk(pg.rulers)), '-',
      Object.assign({ t: 'Show guides', c: 'toggleGuides' }, chk(pg.guidesVisible)), Object.assign({ t: 'Lock guides', c: 'lockGuides' }, chk(pg.guidesLocked)),
      { t: 'Distribute selected guides', c: 'distributeGuides', dis: S.selGuides.length < 3 }, { t: 'Clear all guides', c: 'clearGuides', dis: !pg.guides.length }, '-',
      { t: 'Diagram style', sub: STYLE_MODES.map(m => Object.assign({ t: m.label + ': ' + m.hint, c: 'style' + m.label }, chk(S.doc.mode === m.id))) }, { t: 'Toggle line hops on all lines', c: 'hopsAll' }
    ],
    Arrange: [
      { t: 'Align', sub: [{ t: 'Left', c: 'alignL' }, { t: 'Centre', c: 'alignC' }, { t: 'Right', c: 'alignR' }, '-', { t: 'Top', c: 'alignT' }, { t: 'Middle', c: 'alignM' }, { t: 'Bottom', c: 'alignB' }], dis: !multi },
      { t: 'Distribute', sub: [{ t: 'Horizontally', c: 'distH' }, { t: 'Vertically', c: 'distV' }], dis: topUnits(selCells()).length < 3 },
      { t: 'Match size', sub: [{ t: 'Width', c: 'matchW' }, { t: 'Height', c: 'matchH' }, { t: 'Width and height', c: 'matchWH' }, '-', { t: 'Same width, align left', c: 'widthLeft' }, { t: 'Same height, align top', c: 'heightTop' }], dis: !multi }, '-',
      { t: 'Group', c: 'group', sc: 'Ctrl+G', dis: !multi }, { t: 'Ungroup', c: 'ungroup', sc: 'Ctrl+Shift+G', dis: !selCells().some(isGroup) }, '-',
      { t: 'Bring to front', c: 'toFront', sc: 'Ctrl+Shift+F', dis: !has }, { t: 'Send to back', c: 'toBack', sc: 'Ctrl+Shift+B', dis: !has },
      { t: 'Lock / unlock', c: 'lock', sc: 'Ctrl+L', dis: !has }, '-',
      { t: 'Auto arrange shapes…', c: 'arrangeShapes' }, { t: 'Auto arrange lines (fewer crossings)', c: 'arrangeLines' }, { t: 'Auto arrange shapes and lines…', c: 'arrangeAll' }
    ],
    Help: [{ t: 'Keyboard shortcuts', c: 'shortcuts' }, { t: "Crow's foot cheat sheet", c: 'crowsFoot' }, { t: 'Gliffy compatibility register', c: 'register' }, '-', { t: 'About', c: 'about' }]
  };
}
function buildMenus() {
  const nav = $('#menus'); nav.innerHTML = '';
  for (const name of ['File', 'Edit', 'View', 'Arrange', 'Help']) {
    const b = document.createElement('button'); b.textContent = name;
    b.onclick = (e) => { e.stopPropagation(); const open = b.classList.contains('open'); closeMenus(); if (!open) { b.classList.add('open'); const r = b.getBoundingClientRect(); showPopup(menuDefs()[name], r.left, r.bottom + 2); } };
    b.onmouseenter = () => { if (nav.querySelector('.open') && !b.classList.contains('open')) b.click(); };
    nav.appendChild(b);
  }
}
function buildPopup(items) {
  const p = document.createElement('div'); p.className = 'popup';
  for (const it of items) {
    if (it === '-') { const s = document.createElement('div'); s.className = 'sep'; p.appendChild(s); continue; }
    const m = document.createElement('div'); m.className = 'mi' + (it.dis ? ' disabled' : '') + (it.sub ? ' sub' : '');
    m.innerHTML = '<span>' + (it.check !== undefined ? '<span class="chk">' + (it.check ? '✓' : '') + '</span>' : '') + (it.ic ? '<span class="mic">' + icon(it.ic) + '</span>' : '') + esc(it.t) + (it.hint ? '<span class="mhint">' + esc(it.hint) + '</span>' : '') + '</span><span class="sc">' + (it.sc ? esc(it.sc) : (it.sub ? '›' : '')) + '</span>';
    if (it.sub) m.appendChild(buildPopup(it.sub.length ? it.sub : [{ t: '(none)', dis: true }]));
    else m.onclick = (e) => { e.stopPropagation(); closeMenus(); if (it.fn) it.fn(); else runCommand(it.c); };
    p.appendChild(m);
  }
  return p;
}
function showPopup(items, x, y) {
  const host = $('#menuPopup'); host.innerHTML = ''; host.className = '';
  const p = buildPopup(items); p.style.left = x + 'px'; p.style.top = y + 'px'; host.appendChild(p);
  const r = p.getBoundingClientRect();
  if (r.bottom > innerHeight) p.style.top = Math.max(4, innerHeight - r.height - 4) + 'px';
  if (r.right > innerWidth) p.style.left = Math.max(4, innerWidth - r.width - 4) + 'px';
}
function closeMenus() { $('#menuPopup').innerHTML = ''; document.querySelectorAll('#menus .open').forEach(b => b.classList.remove('open')); }
function contextMenu(ev) {
  ev.preventDefault();
  const w = toWorld(ev), hit = hitCell(w);
  if (hit && !S.sel.includes(hit.id) && !S.sel.includes(selectionUnit(hit).id)) setSel([hit.isEdgeLabel ? hit.id : selectionUnit(hit).id]);
  const c = singleSel();
  const items = [];
  if (c && !c.e && !isGroup(c)) items.push({ t: 'Edit text', fn: () => startEdit(c) }, { t: S.editPoints === c.id ? 'Finish editing connection points' : 'Edit connection points', fn: () => toggleEditPoints(c) }, '-');
  if (c && c.e) items.push({ t: 'Add label', fn: () => addLabelToEdge(c) }, { t: 'Reset path', fn: () => mutate(() => { c.pts = []; }) }, '-');
  if (S.sel.length) items.push({ t: 'Cut', c: 'cut' }, { t: 'Copy', c: 'copy' }, { t: 'Duplicate', c: 'duplicate' }, { t: 'Delete', c: 'delete' }, '-',
    { t: 'Copy style', c: 'copyStyle', sc: 'Alt+Shift+C' }, { t: 'Paste style', c: 'pasteStyle', sc: 'Alt+Shift+V', dis: !S.styleClip }, '-',
    { t: 'Bring to front', c: 'toFront' }, { t: 'Send to back', c: 'toBack' }, { t: 'Lock / unlock', c: 'lock' });
  if (topUnits(selCells()).length > 1) items.push({ t: 'Group', c: 'group' });
  if (selCells().some(isGroup)) items.push({ t: 'Ungroup', c: 'ungroup' });
  if (!S.sel.length) items.push({ t: 'Paste', c: 'paste', dis: !S.clipboard }, { t: 'Paste from draw.io XML (clipboard)', c: 'pasteXml' }, { t: 'Select all', c: 'selectAll' }, '-', { t: 'Fit diagram', c: 'fit' }, { t: 'Auto arrange shapes…', c: 'arrangeShapes' });
  showPopup(items, ev.clientX, ev.clientY);
}

/* ---------- toolbar ---------- */
function buildToolbar() {
  const tb = $('#toolbar'); tb.innerHTML = '';
  const B = (ic, title, cmd, extra) => { const b = document.createElement('button'); b.className = 'tb'; b.title = title; b.innerHTML = icon(ic) + (extra || ''); b.onclick = () => runCommand(cmd); b.dataset.cmd = cmd; tb.appendChild(b); return b; };
  const sep = () => { const s = document.createElement('div'); s.className = 'tbsep'; tb.appendChild(s); };
  if (!S.embed) { B('save', 'Save (Ctrl+S)', 'save'); B('open', 'Open (Ctrl+O)', 'open'); sep(); }
  B('undo', 'Undo (Ctrl+Z)', 'undo'); B('redo', 'Redo (Ctrl+Y)', 'redo'); B('trash', 'Delete', 'delete'); sep();
  B('zoomOut', 'Zoom out', 'zoomOut');
  const zl = document.createElement('button'); zl.className = 'tb'; zl.id = 'zoomLabel'; zl.title = 'Actual size'; zl.onclick = () => runCommand('zoom100'); tb.appendChild(zl);
  B('zoomIn', 'Zoom in', 'zoomIn'); B('fit', 'Fit diagram', 'fit'); sep();
  B('line', 'Add a line (or drag from any connection point)', 'addLine', '<span>Line</span>'); sep();
  for (const a of ['alignL', 'alignC', 'alignR', 'alignT', 'alignM', 'alignB']) B(a, { alignL: 'Align left', alignC: 'Align centre', alignR: 'Align right', alignT: 'Align top', alignM: 'Align middle', alignB: 'Align bottom' }[a], a);
  B('distH', 'Distribute horizontally', 'distH'); B('distV', 'Distribute vertically', 'distV'); sep();
  B('group', 'Group (Ctrl+G)', 'group'); B('ungroup', 'Ungroup (Ctrl+Shift+G)', 'ungroup'); B('front', 'Bring to front', 'toFront'); B('back', 'Send to back', 'toBack'); sep();
  B('arrange', 'Auto arrange shapes', 'arrangeShapes');
  const sk = B('st_outline', 'Diagram style', 'styleMenu', '<span class="stName">Outline</span>' + icon('chev').replace('<svg ', '<svg class="chev" ')); sk.id = 'styleBtn'; sep();
  const cb = B('fit', 'Screenshot mode: hide grid, rulers, guides and selection (Ctrl+Shift+E, Esc to leave)', 'toggleClean', '<span>Screenshot</span>'); cb.id = 'cleanBtn'; cb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg><span>Screenshot</span>'; sep();
  if (!S.embed) B('exportI', 'Export PNG', 'exportPng', '<span>Export</span>');
  else {
    const cn = B('undo', 'Close without returning changes', 'embedCancel', '<span>Cancel</span>'); cn.id = 'embedCancel'; cn.innerHTML = '<span>Cancel</span>';
    const dn = B('save', 'Return the diagram to the document', 'embedDone', '<span>Done</span>'); dn.id = 'embedDone'; dn.classList.add('primary');
  }
  updateZoomLabel();
}
function updateToolbar() {
  const sk = $('#styleBtn');
  if (sk) { const m = STYLE_MODES.find(x => x.id === S.doc.mode) || STYLE_MODES[0]; sk.innerHTML = icon('st_' + m.id) + '<span class="stName">' + m.label + '</span>' + icon('chev').replace('<svg ', '<svg class="chev" '); sk.title = 'Diagram style: ' + m.label; sk.classList.toggle('on', m.id !== 'outline'); }
  const cl = $('#cleanBtn'); if (cl) cl.classList.toggle('on', !!S.clean);
}
function styleMenu() {
  const b = $('#styleBtn'), r = b.getBoundingClientRect();
  const dark = S.doc.pages.every(p => isDarkBg(pageBackground(p))), light = S.doc.pages.every(p => !isDarkBg(pageBackground(p)));
  showPopup(STYLE_MODES.map(m => ({ t: m.label, hint: m.hint, ic: 'st_' + m.id, check: S.doc.mode === m.id, c: 'style' + m.label })).concat(['-',
    { t: 'Light canvas', hint: 'White background on every page', check: light, fn: () => switchCanvas('#ffffff') },
    { t: 'Dark canvas', hint: 'Dark navy background on every page', check: dark, fn: () => switchCanvas(NAVY) }, '-',
    { t: 'Auto-correct contrast', hint: 'Fix text, outline, line and icon colours after a style or canvas switch', check: autoContrastOn(), fn: () => setAutoContrast(!autoContrastOn()) },
    { t: 'Fix text colours', hint: 'Make all text readable (WCAG 4.5:1)', fn: () => runCommand('fixText') },
    { t: 'Contrast report…', hint: 'Corrections made and anything that fails', fn: () => runCommand('contrast') }]), r.left, r.bottom + 2);
}
function switchCanvas(bg) {
  mutate(() => { setCanvasAll(S.doc, bg); clearCache(); });
  toast((bg === NAVY ? 'Dark' : 'Light') + ' canvas on every page' + (S.doc.mode === 'neon' ? '; Neon colours re-tuned.' : '.') + contrastSummary(S.lastContrast), 0, { label: 'Undo', fn: () => undo() });
}
// Style switches are one-way recolours (docs/STYLES.md): warn, offer the options, then one Undo step.
function setDiagramStyle(mode, opts) {
  if (!STYLE_MODES.some(m => m.id === mode)) return;
  if (S.editing) finishEdit();
  if (opts) return doStyleSwitch(mode, Object.assign(styleOpts(mode), opts));
  styleDialog(mode);
}
function doStyleSwitch(mode, o) {
  const from = S.doc.mode;
  let res = { fixed: 0 };
  S.styleOpts = Object.assign({}, S.styleOpts, { [mode]: o });
  mutate(() => { res = runStyleSwitch(S.doc, from, mode, o); clearCache(); });
  buildPalette();
  const lbl = STYLE_MODES.find(m => m.id === mode).label;
  S.lastContrast = Object.assign(res.report, { when: 'Style: ' + lbl + (autoContrastOn() ? '' : ' (auto-correct off)'), t: Date.now() });
  toast('Style: ' + lbl + '.' + contrastSummary(res.report) + (mode === 'neon' && !isDarkBg(pageBackground(page())) ? ' Neon looks best on a dark background.' : ''), 0, { label: 'Undo', fn: () => undo() });
}
function styleDialog(mode) {
  const from = S.doc.mode, m = STYLE_MODES.find(x => x.id === mode), o = styleOpts(mode);
  const d = document.createElement('div'); d.className = 'styleDlg'; d.style.width = '420px';
  d.innerHTML = '<p>Shapes, icons and text will be ' + (mode === 'sketch' ? 'restyled' : 'recoloured') + '. Undo (Ctrl+Z) reverses this. Switching back to a previous style later may not restore the original ' + (mode === 'sketch' ? 'look' : 'colours') + '.</p>';
  const sect = (title) => { const h = document.createElement('div'); h.className = 'sdh'; h.textContent = title; d.appendChild(h); return h; };
  const row = (label, ctrl, hint) => { const r = frow(d); const l = document.createElement('label'); l.className = 'l'; l.textContent = label; r.appendChild(l); r.appendChild(ctrl); if (hint) { const h = document.createElement('div'); h.className = 'hint sdhint'; h.textContent = hint; d.appendChild(h); } return r; };
  const chkBox = (label, key) => { const r = frow(d); const l = document.createElement('label'); l.className = 'chk'; const i = document.createElement('input'); i.type = 'checkbox'; i.checked = !!o[key]; i.onchange = () => { o[key] = i.checked; refresh(); }; l.append(i, document.createTextNode(' ' + label)); r.appendChild(l); return r; };
  const select = (key, opts_) => mkSel(opts_.map(x => ({ v: x[0], label: x[1] })), o[key], (v) => { o[key] = v; refresh(); });
  const presets = PALETTE.map(p => [p.name, p.name]);
  const shown = [];
  const when = (el, fn) => { shown.push([el, fn]); return el; };
  const refresh = () => { for (const [el, fn] of shown) el.style.display = fn() ? '' : 'none'; };
  const fromNeon = from === 'neon', hasIcons = S.doc.pages.some(p => p.cells.some(c => c.style.dePh));
  if (mode === 'filled' || mode === 'outline') {
    sect('Shapes');
    chkBox('Override existing fills', 'override');
    row('Fill style', select('fill', mode === 'filled' ? [['block', 'Block (solid colour)'], ['auto', 'Auto (light tint)'], ['pick', 'Pick from list']] : [['none', 'None (white)'], ['auto', 'Auto (light tint)'], ['pick', 'Pick from list']]));
    when(row('Preset', select('preset', presets)), () => o.fill === 'pick');
    if (hasIcons) {
      sect('Icons');
      chkBox('Override icon colours', 'iconOverride');
      if (mode === 'filled') { row('Icon style', select('icon', [['block', 'Block (solid icon)'], ['auto', 'Auto (duotone icon)'], ['pick', 'Pick from list']])); when(row('Preset', select('iconPreset', presets)), () => o.icon === 'pick'); }
      else when(row('Preset', select('iconPreset', presets)), () => o.iconOverride);
    }
    if (mode === 'outline' && from === 'sketch') { sect('Text'); chkBox('Reset handwriting font', 'resetFont'); }
  } else if (mode === 'duotone') {
    sect('Colours');
    chkBox('Override existing colours', 'override');
    row('Scheme', select('scheme', DUO_SCHEMES.map(s => [s.id, s.label])));
    when(chkBox('Rotate anticlockwise', 'ccw'), () => !['monochromatic', 'complementary'].includes(o.scheme));
    row('Tint', select('tint', [['standard', 'Standard'], ['lighter', 'Lighter']]));
    row('Apply', select('scope', [['shape', 'Per shape (keeps colour coding)'], ['diagram', 'Entire diagram (one colour pair)']]));
    const warn = document.createElement('div'); warn.className = 'hint sdhint'; warn.textContent = 'Entire diagram replaces your per-shape colour coding with one colour pair.'; d.appendChild(warn);
    when(warn, () => o.scope === 'diagram');
    const pv = document.createElement('div'); pv.className = 'duoPreview'; d.appendChild(pv);
    shown.push([pv, () => {
      const sch = DUO_SCHEMES.find(s => s.id === o.scheme), deg = (o.ccw ? -1 : 1) * sch.deg, L = o.tint === 'lighter' ? 0.94 : 0.87;
      const bases = o.scope === 'diagram' ? [dominantColour(S.doc) || '#2563eb'] : ['#2563eb', '#16a34a', '#d97706'];
      pv.innerHTML = bases.map(b => { const c1 = strongOf(b), c2 = tintOf(rybRotate(c1, deg), L); return '<span style="border:2px solid ' + c1 + ';background:' + c2 + ';color:' + c1 + '">Aa</span>'; }).join('');
      return true;
    }]);
  } else if (mode === 'sketch') {
    sect('Drawing');
    row('Fill style', select('fillStyle', SKETCH_FILLS));
    row('Roughness', select('rough', [['subtle', 'Subtle'], ['normal', 'Normal'], ['rough', 'Rough']]));
    chkBox('Override font (handwriting)', 'font');
  } else if (mode === 'blueprint') {
    sect('Blueprint');
    chkBox('Apply guide text sizes (box labels 22 px bold, line labels 17 px)', 'sizes');
    chkBox('Shadows (crisp navy offset, no blur)', 'shadows');
    const h = document.createElement('div'); h.className = 'hint sdhint'; h.textContent = 'One navy ink: colour coding is replaced. Add colour back with Blueprint states (Format panel). For the dotted page, use Backgrounds, Dot matrix in the palette.'; d.appendChild(h);
    if (!S.doc.pages.every(p => pageBackground(p).toLowerCase() === '#ffffff')) { sect('Canvas'); chkBox('Switch the canvas to white', 'whiteCanvas'); }
  } else if (mode === 'neon') {
    sect('Canvas');
    o.darkCanvas = o.darkCanvas !== false && !S.doc.pages.every(p => isDarkBg(pageBackground(p)));
    chkBox('Also switch the canvas to dark navy', 'darkCanvas');
  }
  if (fromNeon && mode !== 'neon') {
    sect('Canvas'); chkBox('Switch canvas back to white', 'whiteCanvas');
  }
  refresh();
  modal('Switch to ' + m.label + '?', d, [{ t: 'Cancel' }, { t: 'Switch to ' + m.label, primary: true, fn: () => doStyleSwitch(mode, o) }], { width: '460px' });
}
function canvasBgDialog() {
  const pg = page(), cur = pageBackground(pg);
  const d = document.createElement('div'); d.style.width = '330px';
  const presets = ['#ffffff', '#f8fafc', '#f1f5f9', '#fffbeb', '#ecfdf5', '#eff6ff', '#1e293b', '#0f172a'];
  d.innerHTML = '<div class="swatches" style="grid-template-columns:repeat(8,1fr)">' + presets.map(c => '<div class="sw" data-c="' + c + '" title="' + c + '" style="background:' + c + ';border-color:#cbd5e1"></div>').join('') + '</div><div class="frow"><label class="l">Custom</label><input type="color" id="bgC"></div><p class="hint">Applies to this page. Saved in the file as the draw.io page background, and used for PNG, SVG and PDF exports. Text colours are re-checked for readability, and Neon colours re-tuned. For every page at once, use Light or Dark canvas in the Style menu.</p>';
  const inp = d.querySelector('#bgC'); inp.value = /^#[0-9a-f]{6}$/i.test(cur) ? cur : '#ffffff';
  const pre = snapshot();
  const set = (c) => { pg.modelAttrs = pg.modelAttrs || {}; if (c.toLowerCase() === '#ffffff') delete pg.modelAttrs.background; else pg.modelAttrs.background = c; inp.value = c; requestRender(); };
  d.querySelectorAll('.sw').forEach(sw => sw.onclick = () => set(sw.dataset.c));
  inp.oninput = () => set(inp.value);
  modal('Canvas background', d, [{ t: 'Cancel', fn: () => { restoreQuiet(pre); afterChange(); } }, { t: 'OK', primary: true, fn: () => { retuneForCanvas(S.doc, [pg]); clearCache(); if (snapshot() !== pre) pushUndo(pre); afterChange(); } }]);
}

/* ---------- palette ---------- */
// Tree of collapsible sections: shape groups, then Collections > Phosphor > themes. Open state is remembered per section key.
const PAL_DEFAULT_CLOSED = (key) => key.startsWith('Collections/Phosphor/');
function palOpen(key) {
  const st = S.prefs.palState || {};
  if (st[key] !== undefined) return !!st[key];
  if (Array.isArray(S.prefs.palCollapsed) && S.prefs.palCollapsed.includes(key)) return false;
  return !PAL_DEFAULT_CLOSED(key);
}
function setPalOpen(key, open) { S.prefs.palState = Object.assign({}, S.prefs.palState, { [key]: !!open }); savePrefs(); }
function buildPalette() {
  const pal = $('#palette'); const keepScroll = pal.scrollTop; pal.innerHTML = '';
  S.paletteMode = S.doc.mode;
  const groups = {};
  for (const d of SHAPE_LIB) (groups[d.group] = groups[d.group] || []).push(d);
  groups.Lines = [{ key: '__line', label: 'Line' }];

  const sections = [];
  const setOpen = (sec, open) => {
    sec.classList.toggle('collapsed', !open);
    sec.querySelector(':scope > .pghead').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && sec._render) { sec._render(); sec._render = null; }
  };
  const section = (key, title, count, level, parent, render) => {
    const sec = document.createElement('div'); sec.className = 'pgroup lvl' + level; sec.dataset.group = key;
    const head = document.createElement('button'); head.type = 'button'; head.className = 'pghead';
    head.innerHTML = '<span class="pgchev" aria-hidden="true"></span><span class="pgname"></span><span class="pgcount"></span>';
    head.querySelector('.pgname').textContent = title;
    head.querySelector('.pgcount').textContent = count === null ? '' : count;
    head.title = 'Show or hide ' + title + ' (Alt+click: only this one)';
    head.addEventListener('click', (e) => {
      if (e.altKey) {
        for (const other of sec.parentElement.querySelectorAll(':scope > .pgroup')) { setOpen(other, other === sec); setPalOpen(other.dataset.group, other === sec); }
      } else { const open = sec.classList.contains('collapsed'); setOpen(sec, open); setPalOpen(key, open); }
    });
    sec.appendChild(head);
    const body = document.createElement('div'); body.className = 'pgbody'; sec.appendChild(body);
    sec._render = () => render(body);
    parent.appendChild(sec); sections.push(sec);
    setOpen(sec, palOpen(key));
    return sec;
  };
  const shapeTiles = (body, list) => {
    const tiles = document.createElement('div'); tiles.className = 'ptiles';
    for (const d of list) {
      const t = document.createElement('div'); t.className = 'ptile'; t.title = d.label;
      t.appendChild(paletteIcon(d));
      t.addEventListener('pointerdown', (e) => startPaletteDrag(e, d));
      tiles.appendChild(t);
    }
    body.appendChild(tiles);
  };
  const iconTiles = (body, list) => {
    const tiles = document.createElement('div'); tiles.className = 'ptiles icons';
    for (const ic of list) {
      const d = { icon: ic.name, label: phLabel(ic.name) };
      const t = document.createElement('div'); t.className = 'ptile'; t.title = d.label + (ic.tags ? '\n' + ic.tags.split(' ').slice(0, 8).join(', ') : '');
      t.appendChild(paletteIcon(d));
      t.addEventListener('pointerdown', (e) => startPaletteDrag(e, d));
      tiles.appendChild(t);
    }
    body.appendChild(tiles);
  };

  // controls: search, expand all, collapse all
  const top = document.createElement('div'); top.className = 'ptop';
  top.innerHTML = '<input type="search" class="psearch" placeholder="Search shapes and icons" aria-label="Search shapes and icons"><div class="pbar"><button type="button" data-act="expand">Expand all</button><button type="button" data-act="collapse">Collapse all</button></div>';
  pal.appendChild(top);
  const tree = document.createElement('div'); tree.className = 'ptree'; pal.appendChild(tree);
  const results = document.createElement('div'); results.className = 'presults'; results.hidden = true; pal.appendChild(results);
  top.querySelector('.pbar').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const open = b.dataset.act === 'expand';
    for (const sec of sections) { setOpen(sec, open); setPalOpen(sec.dataset.group, open); }
  });
  const search = top.querySelector('.psearch');
  search.value = S.palQuery || '';
  const runSearch = () => {
    const q = search.value.trim(); S.palQuery = q;
    tree.hidden = !!q; results.hidden = !q; results.innerHTML = '';
    if (!q) return;
    const ql = q.toLowerCase();
    const shapes = SHAPE_LIB.filter(d => d.label.toLowerCase().includes(ql) || d.group.toLowerCase().includes(ql));
    if (shapes.length) { const h = document.createElement('div'); h.className = 'pres-h'; h.textContent = 'Shapes (' + shapes.length + ')'; results.appendChild(h); shapeTiles(results, shapes); }
    const icons = PH.ready ? phSearch(q) : [];
    const h = document.createElement('div'); h.className = 'pres-h'; h.textContent = PH.ready ? 'Phosphor icons (' + icons.length + (icons.length > 240 ? ', first 240 shown' : '') + ')' : 'Phosphor icons (loading…)'; results.appendChild(h);
    iconTiles(results, icons.slice(0, 240));
    if (!shapes.length && !icons.length && PH.ready) { const p = document.createElement('p'); p.className = 'hint'; p.style.margin = '6px 4px'; p.textContent = 'Nothing matches "' + q + '".'; results.appendChild(p); }
  };
  search.addEventListener('input', runSearch);
  search.addEventListener('keydown', (e) => { if (e.key === 'Escape') { search.value = ''; runSearch(); } e.stopPropagation(); });

  for (const g in groups) section(g, g, groups[g].length, 0, tree, (body) => shapeTiles(body, groups[g]));

  // Collections
  const coll = section('Collections', 'Collections', null, 0, tree, (body) => {
    section('Collections/Phosphor', 'Phosphor', PH.ready ? PH.list.length : null, 1, body, (pb) => {
      if (!PH.ready) { pb.innerHTML = '<p class="hint" style="margin:6px 4px">Loading icons…</p>'; onPhosphorReady(() => buildPalette()); return; }
      PH.themes.forEach((t, i) => {
        const list = PH.list.filter(ic => ic.theme === i);
        section('Collections/Phosphor/' + t, t, list.length, 2, pb, (tb) => iconTiles(tb, list));
      });
      const credit = document.createElement('p'); credit.className = 'hint'; credit.style.margin = '8px 4px';
      credit.innerHTML = 'Phosphor Icons ' + esc(PH.version) + ', MIT licence. Icons follow the diagram style.';
      pb.appendChild(credit);
    });
  });
  coll.classList.add('pcoll');

  const hint = document.createElement('p'); hint.className = 'hint'; hint.style.margin = '14px 4px';
  hint.innerHTML = 'Click or drag a shape onto the canvas. Hover a shape and drag from a <b style="color:#2563eb">×</b> point to draw a line. Double-click to edit text.';
  tree.appendChild(hint);
  if (search.value) runSearch();
  pal.scrollTop = keepScroll;
}
function paletteIcon(d) {
  const svg = document.createElementNS(SVGNS, 'svg');
  if (d.icon) {
    svg.setAttribute('viewBox', '-24 -24 304 304');
    const mode = S.doc.mode, w = iconWeightFor(mode), col = mode === 'neon' ? '#0891b2' : '#475569';
    const ls = PH.ready ? phLayers(d.icon, w) : null;
    if (ls) for (const l of ls) el('path', { d: l.d, fill: col, opacity: l.alpha < 1 ? l.alpha : null }, svg);
    if (mode === 'neon') svg.firstChild && svg.setAttribute('filter', 'url(#deGlow)');
    return svg;
  }
  svg.setAttribute('viewBox', '0 0 46 38');
  if (d.key === '__line') { svg.innerHTML = '<path d="M6 30 C 20 30, 26 8, 40 8" fill="none" stroke="#475569" stroke-width="1.6"/><path d="M34 5l6 3-5 4" fill="none" stroke="#475569" stroke-width="1.6"/>'; return svg; }
  const c = makeVertex(d.key, 0, 0, S.doc.mode);
  const s = Math.min(40 / c.w, 30 / c.h); c.w *= s; c.h *= s; c.x = (46 - c.w) / 2; c.y = (38 - c.h) / 2;
  if (d.key === 'text') { svg.innerHTML = '<text x="23" y="24" text-anchor="middle" font-size="15" font-family="Georgia, serif" fill="#334155">Aa</text>'; return svg; }
  if (d.key === 'question') { svg.innerHTML = '<text x="23" y="25" text-anchor="middle" font-size="15" font-family="Georgia, serif" fill="#B23C0B">\u2192 ?</text>'; return svg; }
  if (d.key === 'annotation') { svg.innerHTML = '<text x="4" y="15" font-size="11" font-family="Georgia, serif" fill="#B23C0B">note</text><path d="M14 19 L36 31" stroke="#B23C0B" stroke-width="1.5" stroke-dasharray="3 3" fill="none"/><path d="M37 32 l-6 -1 3 -4z" fill="#B23C0B"/>'; return svg; }
  if (d.key === 'checklist') { svg.innerHTML = '<text x="6" y="16" font-size="12" fill="#334155">\u2611 \u2014</text><text x="6" y="31" font-size="12" fill="#334155">\u2610 \u2014</text>'; return svg; }
  if (d.key === 'dots') { let h = '<rect x="3" y="4" width="40" height="30" rx="2" fill="#ffffff" stroke="#cbd5e1"/>'; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) h += '<circle cx="' + (7 + i * 8) + '" cy="' + (8 + j * 7.5) + '" r="1.1" fill="#9fb3c8"/>'; svg.innerHTML = h; return svg; }
  c.style.strokeWidth = '1.2';
  svg.appendChild(renderVertex(c, { noLabel: true }));
  return svg;
}
let paletteCount = 0;
function startPaletteDrag(e, d) {
  e.preventDefault();
  const sx = e.clientX, sy = e.clientY; let ghost = null, moved = false;
  const mv = (ev) => {
    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 4) { moved = true; ghost = e.currentTarget ? null : null; ghost = document.createElement('div'); ghost.className = 'dragGhost'; ghost.appendChild(paletteIcon(d)); ghost.firstChild.style.width = '64px'; ghost.firstChild.style.height = '52px'; document.body.appendChild(ghost); }
    if (ghost) { ghost.style.left = (ev.clientX - 32) + 'px'; ghost.style.top = (ev.clientY - 26) + 'px'; }
  };
  const up = (ev) => {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
    if (ghost) ghost.remove();
    const r = vpRect();
    if (moved) { if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return; insertShape(d, Object.assign(toWorld(ev), { dropped: true })); }
    else { paletteCount = (paletteCount + 1) % 8; const c = { x: (r.width / 2 - S.tx) / S.zoom + paletteCount * 20 - 70, y: (r.height / 2 - S.ty) / S.zoom + paletteCount * 20 - 70 }; insertShape(d, c); }
  };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}
function insertShape(d, at) {
  if (d.key === '__line') return addFreeLine(at);
  if (d.icon && !PH.ready) return toast('Icons are still loading.');
  mutate(() => {
    const c = d.icon ? makeIconVertex(d.icon, 0, 0, S.doc.mode) : makeVertex(d.key, 0, 0, S.doc.mode);
    const p = snapPoint({ x: at.x - c.w / 2, y: at.y - c.h / 2 }); c.x = p.x; c.y = p.y;
    c.parent = page().layers[0].id;
    if (d.back) page().cells.unshift(c); else page().cells.push(c);
    S.sel = [c.id];
    if (d.withLine) { const e = makeAnnotationLine(c); page().cells.push(e); }
    if (at.dropped && !d.back) { refreshMap(); reparentToContainers([c]); }
  });
}
// An annotation's dashed red arrow starts at the note and points down-right, ready to be dragged onto its subject.
function makeAnnotationLine(note) {
  const e = makeEdge('outline'); e.style = parseStyle(ANNOTATION_EDGE_STYLE); e.parent = note.parent;
  e.source = note.id; e.style.exitX = '1'; e.style.exitY = '0.5';
  e.tp = { x: note.x + note.w + 80, y: note.y + note.h / 2 + 50 };
  if (S.doc.mode && S.doc.mode !== 'outline') styleNewCell(e, S.doc.mode);
  return e;
}
function addFreeLine(at) {
  const r = vpRect(); at = at || { x: (r.width / 2 - S.tx) / S.zoom, y: (r.height / 2 - S.ty) / S.zoom };
  mutate(() => { const e = makeEdge(S.doc.mode); e.parent = page().layers[0].id; const p = snapPoint(at); e.sp = { x: p.x - 60, y: p.y }; e.tp = { x: p.x + 60, y: p.y }; e.style.edgeStyle = 'none'; delete e.style.rounded; page().cells.push(e); S.sel = [e.id]; });
}

/* ---------- pages ---------- */
function renderTabs() {
  const t = $('#tabs'); t.innerHTML = '';
  S.doc.pages.forEach((p, i) => {
    const d = document.createElement('div'); d.className = 'tab' + (i === S.pi ? ' on' : ''); d.textContent = p.name;
    d.onclick = () => switchPage(i);
    d.ondblclick = () => renamePage(i);
    d.oncontextmenu = (e) => { e.preventDefault(); showPopup([{ t: 'Rename…', fn: () => renamePage(i) }, { t: 'Duplicate', fn: () => duplicatePage(i) }, { t: 'Delete', fn: () => deletePage(i), dis: S.doc.pages.length < 2 }, '-', { t: 'Move left', fn: () => movePage(i, -1), dis: i === 0 }, { t: 'Move right', fn: () => movePage(i, 1), dis: i === S.doc.pages.length - 1 }], e.clientX, e.clientY - 120); };
    t.appendChild(d);
  });
  updateToolbar();
}
function switchPage(i) { if (S.editing) finishEdit(); S.pi = i; S.sel = []; S.selGuides = []; S.editPoints = null; clearCache(); afterChange(); }
function renamePage(i) { promptDialog('Rename page', 'Page name', S.doc.pages[i].name, (v) => { if (v) mutate(() => { S.doc.pages[i].name = v; }); }); }
function duplicatePage(i) { mutate(() => { const p = deep(S.doc.pages[i]); p.id = uid(); p.name += ' copy'; remapIds(p); S.doc.pages.splice(i + 1, 0, p); S.pi = i + 1; }); clearCache(); }
function deletePage(i) { if (S.doc.pages.length < 2) return; mutate(() => { S.doc.pages.splice(i, 1); S.pi = clamp(S.pi >= i ? S.pi - 1 : S.pi, 0, S.doc.pages.length - 1); }); clearCache(); }
function movePage(i, d) { mutate(() => { const p = S.doc.pages.splice(i, 1)[0]; S.doc.pages.splice(i + d, 0, p); S.pi = i + d; }); }
function addPage() { mutate(() => { const p = newPage('Page-' + (S.doc.pages.length + 1)); if (S.doc.pages[S.pi]) { const c = page(); p.grid = c.grid; p.gridSize = c.gridSize; } S.doc.pages.push(p); S.pi = S.doc.pages.length - 1; S.sel = []; }); clearCache(); }
function remapIds(pg) {
  const m = new Map();
  for (const c of pg.cells) m.set(c.id, uid());
  for (const c of pg.cells) { c.id = m.get(c.id); if (m.has(c.parent)) c.parent = m.get(c.parent); if (c.source && m.has(c.source)) c.source = m.get(c.source); if (c.target && m.has(c.target)) c.target = m.get(c.target); }
}

/* ---------- selection operations ---------- */
function deleteSel() {
  const cs = selCells(); if (!cs.length) return;
  mutate(() => {
    const pg = page(), rm = new Set();
    for (const c of cs) { if (isLocked(c)) continue; rm.add(c.id); for (const d of descendants(c.id)) { if (isLocked(d)) d.parent = layerOf(c); else rm.add(d.id); } }
    // lines connected to a deleted shape stay, with that end left where it was
    for (const c of pg.cells) {
      if (!c.e || rm.has(c.id)) continue;
      const s = c.source && rm.has(c.source), t = c.target && rm.has(c.target);
      if (!s && !t) continue;
      const r = S.routes.get(c.id) || edgeRoute(c, S.map);
      if (s) { c.sp = { x: r.pts[0].x, y: r.pts[0].y }; c.source = null; for (const k of ['exitX', 'exitY', 'exitDx', 'exitDy']) delete c.style[k]; }
      if (t) { const p = r.pts[r.pts.length - 1]; c.tp = { x: p.x, y: p.y }; c.target = null; for (const k of ['entryX', 'entryY', 'entryDx', 'entryDy']) delete c.style[k]; }
    }
    for (const c of pg.cells) if (c.isEdgeLabel && rm.has(c.parent)) rm.add(c.id);
    pg.cells = pg.cells.filter(c => !rm.has(c.id));
    S.sel = []; S.editPoints = null;
  });
}
function collectForCopy(cells) {
  const pg = page(), ids = new Set();
  for (const c of topUnits(cells)) { ids.add(c.id); for (const d of descendants(c.id)) ids.add(d.id); }
  for (const c of pg.cells) if (c.e && !ids.has(c.id) && c.source && c.target && ids.has(c.source) && ids.has(c.target)) ids.add(c.id);
  for (const c of pg.cells) if (c.isEdgeLabel && ids.has(c.parent)) ids.add(c.id);
  return pg.cells.filter(c => ids.has(c.id)).map(deep);
}
function cutSel() {
  const all = selCells(), cs = all.filter(c => !isLocked(c)); if (!all.length) return;
  if (!cs.length) return toast('Locked shapes can\'t be cut. Copy them instead, or unlock them first.');
  S.sel = cs.map(c => c.id); copySel(true); deleteSel();
  toast(cs.length < all.length ? 'Cut ' + cs.length + '; locked shapes were left in place' : 'Cut');
  S.clipText = cellsToXml(S.clipboard.cells); try { if (navigator.clipboard) navigator.clipboard.writeText(S.clipText).catch(() => { }); } catch (e) { }
}
function copySel(internalOnly) {
  const cs = selCells(); if (!cs.length) return;
  S.clipboard = { cells: collectForCopy(cs), n: 0 };
  if (!internalOnly) { S.clipText = cellsToXml(S.clipboard.cells); try { if (navigator.clipboard) navigator.clipboard.writeText(S.clipText).catch(() => { }); } catch (e) { } toast('Copied'); }
}
/* Ctrl+C, Ctrl+X and Ctrl+V go through the browser's own copy, cut and paste, so the shapes reach the system clipboard as
   draw.io XML and come back from it with no permission asked. Shapes copied here can then be pasted into another diagram
   in another document or another tab, or into draw.io; draw.io XML copied anywhere else pastes in as shapes. What was
   last copied here is pasted from the editor's own copy, which keeps every detail and steps each paste aside. */
function clipOff(e) { return isTyping(e) || S.editing || $('#modalRoot').children.length; }
function onClipCopy(e, cut) {
  if (clipOff(e)) return;
  const all = selCells(); if (!all.length) return;
  e.preventDefault();
  if (cut) { const cs = all.filter(c => !isLocked(c)); if (!cs.length) return toast('Locked shapes can\'t be cut. Copy them instead, or unlock them first.'); S.sel = cs.map(c => c.id); }
  copySel(true); S.clipText = cellsToXml(S.clipboard.cells);
  try { e.clipboardData.setData('text/plain', S.clipText); } catch (x) { }
  if (cut) { const n = S.sel.length; deleteSel(); toast(n < all.length ? 'Cut ' + n + '; locked shapes were left in place' : 'Cut'); } else toast('Copied');
}
function onClipPaste(e) {
  if (clipOff(e)) return;
  e.preventDefault();
  let text = ''; try { text = e.clipboardData.getData('text/plain') || ''; } catch (x) { }
  if (S.clipboard && (!text.trim() || text === S.clipText)) return pasteClip();
  if (drawioXmlFrom(text)) { pasteXmlText(text).then(why => { if (why) toast(why, 5000); }); return; }
  if (S.clipboard) return pasteClip();
  toast('Nothing to paste: the clipboard holds no shapes or draw.io XML.');
}
document.addEventListener('copy', e => { S.clipNative = true; onClipCopy(e, false); });
document.addEventListener('cut', e => { S.clipNative = true; onClipCopy(e, true); });
document.addEventListener('paste', e => { S.clipNative = true; onClipPaste(e); });
function pasteClip(dup) {
  if (!S.clipboard) return;
  S.clipboard.n++;
  const step = 15 * S.clipboard.n;
  mutate(() => {
    const cells = S.clipboard.cells.map(deep), m = new Map();
    for (const c of cells) m.set(c.id, uid());
    const ids = new Set(cells.map(c => c.id));
    // bounding box of the copied items, to decide where the copy lands
    const tmpMap = new Map(page().cells.concat(cells).map(c => [c.id, c]));
    let box = null;
    for (const c of cells) {
      if (c.isEdgeLabel || isGroup(c)) continue;
      if (c.e) { const pts = (c.pts || []).concat(c.sp ? [c.sp] : [], c.tp ? [c.tp] : []); if (pts.length) box = unionBox(box, bboxOf(pts)); }
      else box = unionBox(box, worldBox(c));
    }
    let dx = step, dy = step;
    if (box) {
      const r = vpRect(), vis = { x: -S.tx / S.zoom, y: -S.ty / S.zoom, w: r.width / S.zoom, h: r.height / S.zoom };
      const nb = { x: box.x + dx, y: box.y + dy, w: box.w, h: box.h };
      const inside = nb.x >= vis.x && nb.y >= vis.y && nb.x + nb.w <= vis.x + vis.w && nb.y + nb.h <= vis.y + vis.h;
      if (!inside) { const margin = 20 / S.zoom; dx = vis.x + margin - box.x; dy = vis.y + margin - box.y; }
    }
    for (const c of cells) {
      c.id = m.get(c.id);
      if (m.has(c.parent)) c.parent = m.get(c.parent); else if (!c.isEdgeLabel) c.parent = page().layers[0].id;
      if (c.e) {
        const keepS = c.source && ids.has(c.source), keepT = c.target && ids.has(c.target);
        // an end attached to a shape that was not copied becomes a free end where it currently is
        if (!keepS || !keepT) { const r = edgeRoute(Object.assign({}, c, { source: c.source && tmpMap.has(c.source) ? c.source : null, target: c.target && tmpMap.has(c.target) ? c.target : null }), tmpMap); if (!keepS) c.sp = { x: r.pts[0].x, y: r.pts[0].y }; if (!keepT) c.tp = { x: r.pts[r.pts.length - 1].x, y: r.pts[r.pts.length - 1].y }; }
        c.source = keepS ? m.get(c.source) : null; c.target = keepT ? m.get(c.target) : null;
        if (!keepS) for (const k of ['exitX', 'exitY', 'exitDx', 'exitDy']) delete c.style[k];
        if (!keepT) for (const k of ['entryX', 'entryY', 'entryDx', 'entryDy']) delete c.style[k];
        c.pts = (c.pts || []).map(p => ({ x: p.x + dx, y: p.y + dy }));
        if (c.sp) c.sp = { x: c.sp.x + dx, y: c.sp.y + dy }; if (c.tp) c.tp = { x: c.tp.x + dx, y: c.tp.y + dy };
      } else if (!c.isEdgeLabel) { c.x += dx; c.y += dy; }
    }
    // a line label copied without its line becomes a text box beside the original, instead of a hidden copy on the same line
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i]; if (!c.isEdgeLabel || [...m.values()].includes(c.parent)) continue; // its line was pasted too
      const route = S.routes.get(c.parent), pos = route ? edgeLabelPos(c, route).pos : { x: (vpRect().width / 2 - S.tx) / S.zoom, y: (vpRect().height / 2 - S.ty) / S.zoom };
      const t = makeVertex('text', 0, 0, S.doc.mode);
      t.id = c.id; t.value = c.value; t.parent = page().layers[0].id;
      for (const k of ['fontColor', 'fontSize', 'fontFamily', 'fontStyle', 'fontSource', 'align']) if (c.style[k] !== undefined) t.style[k] = c.style[k];
      t.style.html = '1'; t.x = pos.x - t.w / 2 + step; t.y = pos.y - t.h / 2 + step;
      cells[i] = t;
    }
    page().cells.push(...cells);
    S.sel = topUnits(cells.filter(c => !c.isEdgeLabel)).map(c => c.id);
  });
}
/* ---------- copy and paste style ----------
   The look of one shape or line onto others: fonts, colours, fill, line, shadow, rounding, sketch settings and the
   Blueprint state. Never the text, size, place, rotation, connections or kind of shape. From a shape to a line, or a
   line to a shape, only what both have is copied (line and text); a text box takes the text only. Colours, fonts and
   sizes set on single words in a label are taken off, so the whole label takes the copied text style. Keys: Alt+Shift+C
   and Alt+Shift+V (Option on a Mac; Ctrl+Shift+C is the browser's Inspect). The painter: click once to paint the next
   shape clicked, double-click to keep painting until Esc. The copied style lasts while the editor is open. */
const STYLE_TEXT = ['fontColor', 'fontSize', 'fontFamily', 'fontSource', 'fontStyle', 'align', 'verticalAlign', 'labelBackgroundColor', 'deGlow', 'spacing', 'spacingLeft', 'spacingRight', 'spacingTop', 'spacingBottom', 'textOpacity'];
const STYLE_LINE = ['strokeColor', 'strokeWidth', 'dashed', 'dashPattern', 'opacity', 'sketch', 'jiggle', 'curveFitting', 'deMode', 'deShadow', 'deShadowColor', 'deShadowOpacity', 'deShadowDx', 'deShadowDy'];
const STYLE_SHAPE = ['fillColor', 'fillOpacity', 'fillStyle', 'fillWeight', 'hachureGap', 'deHarvey', 'deDots', 'deDotsColor', 'deDouble', 'rounded', 'arcSize', 'absoluteArcSize', 'deState', 'gradientColor', 'gradientDirection'];
const STYLE_EDGE = ['startArrow', 'endArrow', 'startSize', 'endSize', 'startFill', 'endFill', 'jumpStyle', 'jumpSize', 'deLine'];
function styleFamily(c) { if (c.e) return 'edge'; if (c.isEdgeLabel) return 'text'; const k = shapeKind(c); return k === 'text' || k === 'edgeLabel' ? 'text' : 'shape'; }
function styleKeysFor(from, to) {
  const k = STYLE_TEXT.slice();
  if (from !== 'text' && to !== 'text') k.push(...STYLE_LINE);
  if (from === 'shape' && to === 'shape') k.push(...STYLE_SHAPE);
  if (from === 'edge' && to === 'edge') k.push(...STYLE_EDGE);
  return k;
}
function copyStyle(quiet) {
  const c = styleTargets()[0]; if (!c) { if (!quiet) toast('Select a shape or line to copy its style.'); return false; }
  const all = new Set([...STYLE_TEXT, ...STYLE_LINE, ...STYLE_SHAPE, ...STYLE_EDGE]), st = {};
  for (const k of all) if (c.style[k] !== undefined) st[k] = c.style[k];
  S.styleClip = { fam: styleFamily(c), st };
  if (!quiet) toast('Style copied. Alt+Shift+V pastes it on the selected shapes.');
  updateToolbar(); return true;
}
// Colours, fonts and sizes set on single words come off; bold, italic, lists and the words stay.
function plainLabelLook(v) {
  if (typeof v !== 'string' || v.indexOf('<') < 0) return v;
  const t = document.createElement('template'); t.innerHTML = v; const r = t.content;
  r.querySelectorAll('font').forEach(f => { ['color', 'face', 'size'].forEach(a => f.removeAttribute(a)); if (!f.attributes.length) f.replaceWith(...f.childNodes); });
  r.querySelectorAll('[style]').forEach(e => { for (const p of ['color', 'font-family', 'font-size', 'background-color', 'background']) e.style.removeProperty(p); if (!e.getAttribute('style').trim()) e.removeAttribute('style'); });
  r.querySelectorAll('span:not([class]):not([style])').forEach(x => x.replaceWith(...x.childNodes));
  const d = document.createElement('div'); d.appendChild(r); return d.innerHTML;
}
function pasteStyle() {
  const clip = S.styleClip; if (!clip) { toast('Copy a style first: select a shape or line and press Alt+Shift+C.'); return false; }
  const ts = styleTargets().filter(c => !isLocked(c)); if (!ts.length) { toast('Select the shapes or lines to give the style to.'); return false; }
  mutate(() => {
    for (const c of ts) {
      for (const k of styleKeysFor(clip.fam, styleFamily(c))) { if (clip.st[k] !== undefined) c.style[k] = clip.st[k]; else delete c.style[k]; }
      c.value = plainLabelLook(c.value);
    }
  }, { keepPanel: false });
  return true;
}
function paintStart(keep) {
  if (!S.styleClip || S.sel.length) { if (!copyStyle(true)) { toast('Select the shape or line whose style to paint with.'); return; } }
  S.painter = { keep: !!keep }; $('#svg').style.cursor = 'copy';
  toast(keep ? 'Painting the style: click each shape or line. Esc to stop.' : 'Click the shape or line to paint the style on.', 4000);
  updateToolbar(); buildFormat();
}
function paintEnd() { if (!S.painter) return; S.painter = null; $('#svg').style.cursor = ''; updateToolbar(); buildFormat(); }
function paintAt(unit) { const keep = S.sel; S.sel = [unit.id]; pasteStyle(); if (!S.painter || !S.painter.keep) { S.sel = keep.includes(unit.id) ? keep : [unit.id]; paintEnd(); } else S.sel = [unit.id]; requestRender(); }
function cellsToXml(cells) {
  const pg = newPage('clip'); pg.cells = cells.map(deep);
  const ids = new Set(pg.cells.map(c => c.id));
  for (const c of pg.cells) if (!ids.has(c.parent)) c.parent = '1';
  return serializeModel(pg, { stripEditorData: true });
}
function copyAsXml() {
  const xml = cellsToXml(collectForCopy(selCells()));
  if (navigator.clipboard) navigator.clipboard.writeText(xml).then(() => toast('Copied as draw.io XML. Paste it into draw.io with Ctrl+V.'), () => textDialog('draw.io XML', xml));
  else textDialog('draw.io XML', xml);
}
/* Paste from draw.io XML: shapes written as draw.io XML somewhere else (draw.io's own Copy, the text of a file, an
   answer from an AI assistant) are added to the page. The text comes from the clipboard when the browser lets the page
   read it; when it does not, or what is there is not draw.io XML, a box opens to paste into. Accepted: a whole file
   (<mxfile>, compressed pages included), one <mxGraphModel>, a bare <root>, or a run of <mxCell> elements. A Markdown
   code fence and any words around the XML are ignored. Everything on the first page that has shapes is added and
   selected, through the same reading and cleaning as Open. */
function drawioXmlFrom(text) {
  let t = String(text || '').replace(/^﻿/, '');
  const fence = t.match(/```[a-zA-Z]*[ \t]*\r?\n([\s\S]*?)```/); if (fence && /<mx|<root/i.test(fence[1])) t = fence[1];
  const cut = (open, close) => { const a = t.search(new RegExp(open + '[\\s>]')), b = t.lastIndexOf(close); return a >= 0 && b > a ? t.slice(a, b + close.length) : null; };
  const whole = cut('<mxfile', '</mxfile>') || cut('<mxGraphModel', '</mxGraphModel>'); if (whole) return whole;
  let cells = null; const root = cut('<root', '</root>');
  if (root) cells = root.replace(/^<root[^>]*>/, '').replace(/<\/root>$/, '');
  else { const a = t.search(/<(mxCell|UserObject|object)[\s>]/), b = Math.max(t.lastIndexOf('</mxCell>') + 9, t.lastIndexOf('</UserObject>') + 13, t.lastIndexOf('</object>') + 9, t.lastIndexOf('/>') + 2); if (a >= 0 && b > a) cells = t.slice(a, b); }
  if (cells === null) return null;
  if (!/<mxCell[^>]*\sid="0"/.test(cells)) cells = '<mxCell id="0"/>' + (/<mxCell[^>]*\sid="1"/.test(cells) ? '' : '<mxCell id="1" parent="0"/>') + cells;
  return '<mxGraphModel><root>' + cells + '</root></mxGraphModel>';
}
async function pasteXmlText(text) { // adds the shapes; answers '' when it did, or the reason it could not
  const xml = drawioXmlFrom(text); if (!xml) return 'No draw.io XML was found in the text.';
  let doc; try { doc = await parseDrawio(xml); } catch (e) { return e.message; }
  const full = doc.pages.filter(p => p.cells.length), src = full[0]; if (!src) return 'The draw.io XML holds no shapes.';
  const empty = !page().cells.length, keep = S.clipboard;
  S.clipboard = { cells: src.cells.map(deep), n: -1 }; // n: -1, so the shapes land where the XML put them when that place is in view
  try { pasteClip(); } finally { S.clipboard = keep; }
  if (empty) fitView();
  const n = src.cells.filter(c => !c.e && !c.isEdgeLabel).length, l = src.cells.filter(c => c.e).length;
  toast('Pasted ' + n + (n === 1 ? ' shape' : ' shapes') + (l ? ' and ' + l + (l === 1 ? ' line' : ' lines') : '') + (full.length > 1 ? ' from the first page of ' + full.length : ''));
  return '';
}
async function pasteXml() {
  let text = '';
  try { if (navigator.clipboard && navigator.clipboard.readText) text = await navigator.clipboard.readText(); } catch (e) { text = ''; }
  const why = text.trim() ? await pasteXmlText(text) : 'The browser did not let the editor read the clipboard, or the clipboard is empty.';
  if (why) pasteXmlDialog(drawioXmlFrom(text) ? text : '', why);
}
function pasteXmlDialog(text, why) {
  const box = document.createElement('div'), msg = document.createElement('p'), ta = document.createElement('textarea'), err = document.createElement('p');
  msg.textContent = 'Paste the draw.io XML here (Ctrl+V), then press Add to diagram.';
  ta.value = text || ''; ta.id = 'pasteXmlText'; ta.spellcheck = false; ta.style.width = '640px'; ta.style.maxWidth = '80vw'; ta.style.height = '260px'; ta.style.fontFamily = 'ui-monospace, Menlo, Consolas, monospace'; ta.style.fontSize = '12px';
  err.id = 'pasteXmlWhy'; err.textContent = why || ''; err.style.color = '#B23C0B'; err.style.minHeight = '1.3em';
  box.append(msg, ta, err);
  const m = modal('Paste from draw.io XML', box, [{ t: 'Cancel' }, { t: 'Add to diagram', primary: true, fn: () => { pasteXmlText(ta.value).then(w => { if (w) { err.textContent = w; ta.focus(); } else closeModal(m.back); }); return false; } }]);
  setTimeout(() => ta.focus(), 0);
}
function alignSel(how) {
  const units = topUnits(selCells()).filter(c => !c.isEdgeLabel && !c.e && !isLocked(c)); if (units.length < 2) return;
  const boxes = units.map(u => isGroup(u) ? { x: u.x, y: u.y, w: u.w, h: u.h } : worldBox(u)), all = boxes.reduce((a, b) => unionBox(a, b), null);
  mutate(() => units.forEach((u, i) => {
    const b = boxes[i]; let dx = 0, dy = 0;
    if (how === 'left') dx = all.x - b.x; if (how === 'right') dx = all.x + all.w - b.x - b.w; if (how === 'center') dx = all.x + all.w / 2 - b.x - b.w / 2;
    if (how === 'top') dy = all.y - b.y; if (how === 'bottom') dy = all.y + all.h - b.y - b.h; if (how === 'middle') dy = all.y + all.h / 2 - b.y - b.h / 2;
    translateCells([u], dx, dy);
  }));
}
function distributeSel(axis) {
  const units = topUnits(selCells()).filter(c => !c.isEdgeLabel && !c.e && !isLocked(c)); if (units.length < 3) return;
  const items = units.map(u => ({ u, b: isGroup(u) ? { x: u.x, y: u.y, w: u.w, h: u.h } : worldBox(u) }));
  const H = axis === 'h';
  items.sort((a, b) => H ? a.b.x - b.b.x : a.b.y - b.b.y);
  const first = items[0].b, last = items[items.length - 1].b;
  const span = H ? (last.x + last.w - first.x) : (last.y + last.h - first.y);
  const total = items.reduce((a, it) => a + (H ? it.b.w : it.b.h), 0);
  const gap = (span - total) / (items.length - 1);
  mutate(() => { let pos = H ? first.x : first.y; for (const it of items) { const d = pos - (H ? it.b.x : it.b.y); translateCells([it.u], H ? d : 0, H ? 0 : d); pos += (H ? it.b.w : it.b.h) + gap; } });
}
/* The shape the others take their size from: the first one clicked. A selection made with a drag box, or Select all, has
   no first click, so there it is the widest (for a width), the tallest (for a height), or the largest (for both). */
function sizeRef(cs, which) {
  if (!S.selAuto) return cs[0];
  const key = which === 'w' ? c => c.w : which === 'h' ? c => c.h : c => c.w * c.h;
  return cs.reduce((a, c) => key(c) > key(a) ? c : a, cs[0]);
}
// Make the same width and align left, or the same height and align top: the size of the reference, the leftmost left edge or the topmost top.
function sizeAndAlign(which) {
  const cs = topUnits(selCells()).filter(c => !c.e && !c.isEdgeLabel && !isGroup(c) && !isLocked(c)); if (cs.length < 2) return;
  const ref = sizeRef(cs, which), W = which === 'w', edge = Math.min(...cs.map(c => W ? worldBox(c).x : worldBox(c).y));
  mutate(() => { for (const c of cs) { if (W) c.w = ref.w; else c.h = ref.h; const b = worldBox(c); translateCells([c], W ? edge - b.x : 0, W ? 0 : edge - b.y); } });
}
function matchSize(which) {
  const cs = topUnits(selCells()).filter(c => !c.e && !c.isEdgeLabel && !isGroup(c) && !isLocked(c)); if (cs.length < 2) return;
  const ref = sizeRef(cs, which);
  mutate(() => { for (const c of cs) { if (c === ref) continue; const cc = cellCenter(c); if (which.includes('w')) { c.w = ref.w; c.x = cc.x - c.w / 2; } if (which.includes('h')) { c.h = ref.h; c.y = cc.y - c.h / 2; } } });
}
function groupSel() {
  const all = topUnits(selCells()).filter(c => !c.isEdgeLabel);
  // as in draw.io, a group is made from shapes that share the first shape's container (or layer); nothing is moved in or out
  const units = all.filter(c => c.parent === (all[0] && all[0].parent));
  if (units.length < all.length) toast(units.length < 2 ? 'Shapes inside and outside a container can\'t be grouped together.' : 'Grouped ' + units.length + ' of ' + all.length + ': the others are in a different container.', 4000);
  if (units.length < 2) return;
  mutate(() => {
    const pg = page(), ms = movedSet(units);
    const g = { id: uid(), parent: units[0].parent, v: true, value: '', style: parseStyle('group;'), x: 0, y: 0, w: 0, h: 0, extra: null };
    const members = pg.cells.filter(c => ms.has(c.id));
    const firstIdx = Math.min(...members.map(c => pg.cells.indexOf(c)));
    pg.cells = pg.cells.filter(c => !ms.has(c.id));
    const labels = pg.cells.filter(c => c.isEdgeLabel && ms.has(c.parent)); pg.cells = pg.cells.filter(c => !labels.includes(c));
    for (const u of units) u.parent = g.id;
    const ordered = members.concat(labels.filter(l => !members.includes(l)));
    pg.cells.splice(Math.min(firstIdx, pg.cells.length), 0, g, ...ordered);
    S.sel = [g.id];
  });
}
function ungroupSel() {
  const gs = selCells().filter(isGroup); if (!gs.length) return;
  mutate(() => {
    const pg = page(), out = [];
    for (const g of gs) { for (const c of pg.cells) if (c.parent === g.id) { c.parent = g.parent; out.push(c.id); } pg.cells.splice(pg.cells.indexOf(g), 1); }
    S.sel = out;
  });
}
function zOrder(front) {
  const units = topUnits(selCells()); if (!units.length) return;
  mutate(() => {
    const pg = page(), ms = movedSet(units);
    for (const c of pg.cells) if (c.isEdgeLabel && ms.has(c.parent)) ms.add(c.id);
    if (front) { pg.cells = pg.cells.filter(c => !ms.has(c.id)).concat(pg.cells.filter(c => ms.has(c.id))); return; }
    // back: to the back of its own container (just after the container), so it never disappears behind it
    for (const u of units.slice().reverse()) {
      const set = movedSet([u]); for (const c of pg.cells) if (c.isEdgeLabel && set.has(c.parent)) set.add(c.id);
      const block = pg.cells.filter(c => set.has(c.id)), rest = pg.cells.filter(c => !set.has(c.id));
      const par = cellById(u.parent), at = par && !isGroup(par) ? rest.indexOf(par) + 1 : 0;
      rest.splice(at, 0, ...block); pg.cells = rest;
    }
  });
}
function toggleEditPoints(c) { S.editPoints = S.editPoints === c.id ? null : c.id; S.selPoint = null; buildFormat(); requestRender(); }
/* A label added to a line by hand starts with a background in the canvas colour, in every style, so the line does not
   run through its words. The Transparent box in the Text section removes it. Labels restyled with a whole diagram
   keep that style's own rule (Blueprint and Neon: no background). */
function newLabelBackground(lbl) {
  if (sv(lbl.style, 'labelBackgroundColor', '#ffffff') !== 'none') return;
  const bg = pageBackground(page()); lbl.style.labelBackgroundColor = hexRgb(bg) ? bg : '#ffffff';
}
function addLabelToEdge(e) {
  let lbl;
  mutate(() => { const n = page().cells.filter(c => c.isEdgeLabel && c.parent === e.id).length; lbl = makeEdgeLabel(e, '', [0, -0.5, 0.5, -0.25, 0.25][n % 5], { x: 0, y: 0 }); if (S.doc.mode !== 'outline') styleNewCell(lbl, S.doc.mode); newLabelBackground(lbl); page().cells.splice(page().cells.indexOf(e) + 1, 0, lbl); S.sel = [lbl.id]; });
  startEdit(cellById(lbl.id), true);
}
function selectedOrAllEdges() { const s = selCells().filter(c => c.e); return s.length ? s : page().cells.filter(c => c.e); }
function distributeGuides() {
  const pg = page(); const sel = S.selGuides.map(i => pg.guides[i]); if (sel.length < 3) return toast('Select three or more guides (Shift+click).');
  const o = sel[0].o; if (!sel.every(g => g.o === o)) return toast('Select guides of the same direction.');
  mutate(() => { sel.sort((a, b) => a.p - b.p); const a = sel[0].p, b = sel[sel.length - 1].p; sel.forEach((g, i) => { g.p = round2(a + (b - a) * i / (sel.length - 1)); }); });
}

/* ---------- format panel ---------- */
function fsec(title, extra) { const s = document.createElement('div'); s.className = 'fsec'; s.innerHTML = '<h3><span>' + title + '</span>' + (extra || '') + '</h3>'; $('#format').appendChild(s); return s; }
function frow(sec, label) { const r = document.createElement('div'); r.className = 'frow'; if (label) r.innerHTML = '<label class="l">' + label + '</label>'; sec.appendChild(r); return r; }
function mkBtn(text, fn, cls, title) { const b = document.createElement('button'); b.className = 'btn sm ' + (cls || ''); b.innerHTML = text; if (title) b.title = title; b.onmousedown = (e) => e.preventDefault(); b.onclick = fn; return b; }
function mkNum(val, fn, step, min) { const i = document.createElement('input'); i.type = 'number'; i.value = round2(val); i.step = step || 1; if (min !== undefined) i.min = min; i.onchange = () => { const v = parseFloat(i.value); if (!isNaN(v)) fn(v); }; return i; }
function mkSel(opts, val, fn) { const s = document.createElement('select'); for (const o of opts) { const op = document.createElement('option'); op.value = o.v; op.textContent = o.label; s.appendChild(op); } s.value = val; s.onchange = () => fn(s.value); return s; }
/* A colour in the format panel is a button showing the colour. It opens a small panel: the palette's colours, a picker
   for any colour, and its hex code. What is chosen is shown at once on the diagram; OK keeps it as one undo step,
   Cancel (or Esc, or a click elsewhere) puts it back. fn(value, true) previews, fn(value) applies. While a label's text is
   being edited the colour is not previewed; OK applies it to the selected words. */
const colorSwatches = () => [...new Set(['#000000', '#1e293b', '#475569', '#94a3b8', '#e2e8f0', '#ffffff'].concat(PALETTE.map(p => p.font), PALETTE.map(p => p.stroke), PALETTE.map(p => p.fill)).map(c => c.toLowerCase()))];
let colorPanel = null;
function mkColor(val, fn, opts) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'colorBtn';
  const v0 = /^#[0-9a-f]{6}$/i.test(val || '') ? val.toLowerCase() : '#000000';
  b.dataset.value = v0; b.style.setProperty('--c', v0); b.title = 'Colour ' + v0 + ': click to change'; b.setAttribute('aria-label', b.title);
  b.onmousedown = (e) => e.preventDefault();
  b.onclick = (e) => { e.stopPropagation(); if (colorPanel && colorPanel.btn === b) return colorClose(false); openColorPanel(b, fn, !(opts && opts.noPreview)); };
  return b;
}
function openColorPanel(btn, fn, preview) {
  colorClose(false);
  const orig = btn.dataset.value; let cur = orig;
  const d = document.createElement('div'); d.className = 'popup colorPanel'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Choose a colour');
  d.innerHTML = '<div class="swatches">' + colorSwatches().map(c => '<button type="button" class="sw" data-c="' + c + '" title="' + c + '" style="background:' + c + '"></button>').join('') + '</div>'
    + '<div class="frow"><label class="l">Custom</label><input type="color" class="cpPick"><input type="text" class="cpHex" maxlength="7" spellcheck="false" aria-label="Hex code"></div>'
    + '<div class="cpWas"><span>Was</span><i style="background:' + orig + '"></i><span>Now</span><i class="cpNow"></i></div>'
    + '<footer><button type="button" class="btn sm cpCancel">Cancel</button><button type="button" class="btn sm primary cpOk">OK</button></footer>';
  const pick = d.querySelector('.cpPick'), hex = d.querySelector('.cpHex'), now = d.querySelector('.cpNow');
  const show = (c, from) => {
    cur = c; if (from !== pick) pick.value = c; if (from !== hex) hex.value = c; now.style.background = c;
    d.querySelectorAll('.sw').forEach(sw => sw.classList.toggle('on', sw.dataset.c === c));
    btn.style.setProperty('--c', c); if (preview && c !== orig) fn(c, true);
  };
  d.querySelectorAll('.sw').forEach(sw => { sw.onmousedown = (e) => e.preventDefault(); sw.onclick = () => show(sw.dataset.c); sw.ondblclick = () => colorClose(true); });
  pick.oninput = () => show(pick.value.toLowerCase(), pick);
  hex.oninput = () => { const t = hex.value.trim().replace(/^([0-9a-f]{6})$/i, '#$1'); if (/^#[0-9a-f]{6}$/i.test(t)) show(t.toLowerCase(), hex); };
  d.querySelector('.cpOk').onclick = () => colorClose(true);
  d.querySelector('.cpCancel').onclick = () => colorClose(false);
  d.querySelectorAll('footer button').forEach(x => { x.onmousedown = (e) => e.preventDefault(); });
  document.body.appendChild(d);
  const r = btn.getBoundingClientRect(), w = d.offsetWidth, h = d.offsetHeight;
  d.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px'; d.style.top = (r.bottom + 4 + h > innerHeight - 8 ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
  colorPanel = { d, btn, fn, preview, orig, get cur() { return cur; } };
  show(orig);
  setTimeout(() => document.addEventListener('pointerdown', colorOutside, true), 0);
  window.addEventListener('keydown', colorKeys, true);
}
// Esc cancels and Enter keeps, wherever the focus is (the swatches and buttons do not take it, so a label being edited keeps its selection)
function colorKeys(e) { if (!colorPanel) return; if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); colorClose(false); } else if (e.key === 'Enter' && (!e.target.closest || !e.target.closest('[contenteditable=true]') || colorPanel.d.contains(e.target))) { e.preventDefault(); e.stopImmediatePropagation(); colorClose(true); } }
function colorOutside(e) { if (colorPanel && !colorPanel.d.contains(e.target) && e.target !== colorPanel.btn) colorClose(false); }
function colorClose(keep) {
  const p = colorPanel; if (!p) return; colorPanel = null;
  document.removeEventListener('pointerdown', colorOutside, true); window.removeEventListener('keydown', colorKeys, true); p.d.remove();
  if (keep && p.cur !== p.orig) { p.btn.dataset.value = p.cur; p.fn(p.cur); return; }
  p.btn.style.setProperty('--c', p.orig);
  if (!p.preview || p.cur === p.orig) { colorLive = null; return; }
  if (colorLive) { const pre = colorLive; colorLive = null; restoreQuiet(pre); requestRender(); buildFormat(); }   // the shapes as they were before the preview
  else p.fn(p.orig, true);
}
function mkChk(label, val, fn) { const l = document.createElement('label'); l.className = 'chk'; const i = document.createElement('input'); i.type = 'checkbox'; i.checked = !!val; i.onchange = () => fn(i.checked); l.appendChild(i); l.appendChild(document.createTextNode(label)); return l; }
function styleTargets() {
  const out = [];
  for (const c of selCells()) {
    if (isGroup(c)) { for (const d of descendants(c.id)) if (!isGroup(d)) out.push(d); }
    else out.push(c);
  }
  return out;
}
function applyStyle(fn, filter) { mutate(() => { for (const c of styleTargets()) if (!filter || filter(c)) fn(c); }, { keepPanel: true }); }
let colorLive = null;
function liveColor(k, filter) {
  return (v, live) => {
    if (live) { if (!colorLive) colorLive = snapshot(); for (const c of styleTargets()) if (!filter || filter(c)) c.style[k] = v; requestRender(); return; }
    if (colorLive) { const pre = colorLive; colorLive = null; for (const c of styleTargets()) if (!filter || filter(c)) c.style[k] = v; refreshMap(); pushUndo(pre); afterChange({ keepPanel: true }); }
    else applyStyle(c => { c.style[k] = v; }, filter);
  };
}
// Copy style, Paste style and the painter, at the top of the panel for a selection.
function formatStyleCopy() {
  const r = frow(fsec('Style')); r.classList.add('styleCopy');
  r.appendChild(mkBtn('Copy style', () => copyStyle(), '', 'Copy the fonts, colours, fill and line of this shape (Alt+Shift+C)'));
  const p = mkBtn('Paste style', () => pasteStyle(), '', S.styleClip ? 'Give the selected shapes the copied style (Alt+Shift+V)' : 'Copy a style first'); p.disabled = !S.styleClip; r.appendChild(p);
  const b = mkBtn(icon('brush'), null, S.painter ? 'on' : '', 'Paint the style: click once to paint one shape, double-click to keep painting until Esc');
  b.setAttribute('aria-label', 'Paint the style'); b.setAttribute('aria-pressed', S.painter ? 'true' : 'false');
  let t = null; b.onclick = () => { clearTimeout(t); t = setTimeout(() => { if (S.painter) paintEnd(); else paintStart(false); }, 220); };
  b.ondblclick = () => { clearTimeout(t); paintStart(true); };
  r.appendChild(b);
}
function buildFormat() {
  const f = $('#format'); f.innerHTML = '';
  updateToolbar();
  const cs = selCells();
  if (S.selGuides.length) return formatGuides();
  if (!cs.length) return formatDiagram();
  const targets = styleTargets();
  const verts = targets.filter(c => !c.e && !c.isEdgeLabel), edges = targets.filter(c => c.e), labels = targets.filter(c => c.isEdgeLabel);
  const first = cs[0];
  formatStyleCopy();
  if (S.doc.mode === 'blueprint') formatBlueprint(verts, edges);
  if (verts.length) formatShapeStyle(verts);
  if (verts.some(c => shapeKind(c) !== 'text')) formatShadow(verts);
  if (edges.length) formatLine(edges);
  if (verts.length || labels.length || S.editing) formatText(verts.concat(labels), edges);
  if (cs.length === 1 && !first.e && !first.isEdgeLabel) formatGeometry(first);
  if (cs.length === 1 && isConnectable(first)) formatPoints(first);
  formatArrange(cs);
}
function formatDiagram() {
  const pg = page();
  const s = fsec('Diagram');
  const r0 = frow(s, 'Page'); const nm = document.createElement('input'); nm.type = 'text'; nm.value = pg.name; nm.style.flex = '1'; nm.onchange = () => mutate(() => { pg.name = nm.value || pg.name; }); r0.appendChild(nm);
  { const r = frow(s); const l = document.createElement('label'); l.className = 'l'; l.textContent = 'Diagram style'; r.appendChild(l); r.appendChild(mkSel(STYLE_MODES.map(m => ({ v: m.id, label: m.label })), S.doc.mode, (v) => { setDiagramStyle(v); buildFormat(); })); }
  frow(s).appendChild(mkChk('Line hops on all lines', pg.cells.some(c => c.e && sv(c.style, 'jumpStyle', 'none') !== 'none'), () => runCommand('hopsAll')));
  const cs_ = fsec('Contrast');
  frow(cs_).appendChild(mkChk('Auto-correct contrast', autoContrastOn(), (v) => setAutoContrast(v)));
  const cr = frow(cs_); cr.appendChild(mkBtn('Fix text colours', () => runCommand('fixText'))); cr.appendChild(mkBtn('Report…', () => runCommand('contrast')));
  const g = fsec('Grid');
  frow(g).appendChild(mkChk('Show grid', pg.gridVisible, (v) => mutate(() => { pg.gridVisible = v; })));
  frow(g).appendChild(mkChk('Snap to grid', pg.grid, (v) => mutate(() => { pg.grid = v; })));
  frow(g, 'Size').appendChild(mkNum(pg.gridSize, (v) => mutate(() => { pg.gridSize = clamp(v, 1, 1000); }), 1, 1));
  frow(g, 'Style').appendChild(mkSel([{ v: 'lines', label: 'Lines' }, { v: 'dots', label: 'Dots' }], S.prefs.gridStyle, (v) => { S.prefs.gridStyle = v; savePrefs(); requestRender(); }));
  frow(g, 'Major every').appendChild(mkNum(S.prefs.gridMajor, (v) => { S.prefs.gridMajor = clamp(Math.round(v), 1, 50); savePrefs(); requestRender(); }, 1, 1));
  frow(g, 'Colour').appendChild(mkColor(S.prefs.gridColor, (v) => { S.prefs.gridColor = v; savePrefs(); requestRender(); }));
  frow(g).appendChild(mkChk('Smart guides', pg.smartGuides, (v) => mutate(() => { pg.smartGuides = v; })));
  const gu = fsec('Rulers and guides');
  frow(gu).appendChild(mkChk('Show rulers', pg.rulers, (v) => mutate(() => { pg.rulers = v; })));
  frow(gu).appendChild(mkChk('Show guides', pg.guidesVisible, (v) => mutate(() => { pg.guidesVisible = v; })));
  frow(gu).appendChild(mkChk('Lock guides', pg.guidesLocked, (v) => mutate(() => { pg.guidesLocked = v; })));
  const r = frow(gu); r.appendChild(mkBtn('Clear all guides', () => runCommand('clearGuides')));
  const h = document.createElement('p'); h.className = 'hint'; h.textContent = 'Drag from a ruler to add a guide. Drag a guide back onto its ruler, or select it and press Delete, to remove it. Shift+click selects several. Double-click a guide to set its position or colour.'; gu.appendChild(h);
  const sh = fsec('Shortcuts');
  sh.innerHTML += '<p class="hint">Drag empty canvas to select. Scroll to pan, Ctrl+scroll to zoom, right-drag (or hold Space and drag) to pan. Alt while dragging turns snapping off. Double-click the canvas to add a text box.</p>';
}
function formatGuides() {
  const pg = page(); const sel = S.selGuides.map(i => pg.guides[i]).filter(Boolean);
  const s = fsec(sel.length === 1 ? 'Guide' : sel.length + ' guides');
  if (sel.length === 1) {
    const g = sel[0];
    frow(s, g.o === 'h' ? 'Y' : 'X').appendChild(mkNum(g.p, (v) => mutate(() => { g.p = v; })));
  }
  frow(s, 'Colour').appendChild(mkColor(sel[0] ? sel[0].c || '#ec4899' : '#ec4899', (v, live) => { if (live) { sel.forEach(g => g.c = v); requestRender(); } else mutate(() => sel.forEach(g => g.c = v)); }));
  const r = frow(s);
  r.appendChild(mkBtn('Delete', () => mutate(() => { const rm = new Set(S.selGuides); pg.guides = pg.guides.filter((g, i) => !rm.has(i)); S.selGuides = []; })));
  if (sel.length >= 3) r.appendChild(mkBtn('Distribute evenly', () => runCommand('distributeGuides')));
}
// Presets: one row of colour presets plus Subtle and Bold. Clicking applies fill, outline and text colour together.
// Row 1: the eight colours filled. Row 2: the same eight as outlines (no fill). Row 3: Subtle and Bold.
// A preset sets the colours directly, like setting them by hand, whatever the diagram style (Sketch with fill style
// None included): a filled preset always gives the shape its fill colour.
const SHAPE_PRESETS = PALETTE.map(p => ({ n: p.name, f: p.fill, s: p.stroke, t: p.font }))
  .concat(PALETTE.map(p => ({ n: p.name + ' outline', f: 'none', s: p.stroke, t: p.font, o: 1, hint: 'Border only, transparent fill' }))).concat([
  { n: 'Subtle', f: 'none', s: toneFix('#94a3b8', '#ffffff', GRAPHIC_MIN).hex, t: '#475569', d: 1, hint: 'Transparent fill, light dashed outline' },
  { n: 'Bold', f: '#1e293b', s: '#1e293b', t: '#ffffff', b: 1, hint: 'Dark fill, white bold text' }
]);
function presetOf(st) {
  const s = (st.strokeColor || '').toLowerCase(), f = (st.fillColor || '').toLowerCase(), dashed = st.dashed === '1';
  return SHAPE_PRESETS.find(p => p.s === s && p.f === f && !!p.d === dashed) || SHAPE_PRESETS.find(p => p.s === s && p.f === f);
}
// Containers drawn without a fill keep no fill when a filled preset is applied (their contents would be hidden).
function isOpenContainer(cl) { const st = cl.style, k = shapeKind(cl); return st.fillColor === 'none' && (st.deCont === '1' || k === 'folder' || k === 'partialRect' || st.container === '1' || st.swimlane !== undefined); }
function applyShapePreset(cl, p) {
  if (shapeKind(cl) === 'text') { cl.style.fontColor = p.t; return; }
  const was = presetOf(cl.style);
  // containers with no fill keep no fill (unless the no-fill came from Subtle)
  if (p.f === 'none' || !isOpenContainer(cl)) cl.style.fillColor = p.f;
  cl.style.strokeColor = p.s; cl.style.fontColor = p.t;
  if (p.d) setStyle(cl.style, 'dashed', 1); else if (was && was.d) setStyle(cl.style, 'dashed', null);
  if (p.b) setStyle(cl.style, 'fontStyle', 1); else if (was && was.b) setStyle(cl.style, 'fontStyle', null);
}
function formatShapeStyle(verts) {
  const c = verts[0], st = c.style;
  const pre = fsec('Presets');
  const sw = document.createElement('div'); sw.className = 'swatches presets';
  const cur = presetOf(st);
  for (const p of SHAPE_PRESETS) {
    const b = document.createElement('div'); b.className = 'sw' + (cur === p ? ' on' : ''); b.title = p.n + (p.hint ? ': ' + p.hint : '');
    if (p.o) b.classList.add('outline');
    b.style.background = p.f === 'none' ? 'transparent' : p.f; b.style.borderColor = p.s; if (p.d) b.style.borderStyle = 'dashed';
    if (p.b) { b.textContent = 'B'; b.style.color = p.t; }
    b.onclick = () => { applyStyle(cl => applyShapePreset(cl, p)); sw.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b)); }; // the panel is kept, so move the highlight here
    sw.appendChild(b);
  }
  pre.appendChild(sw);
  const s = fsec('Style');
  const r1 = frow(s, 'Fill');
  const fillNone = sv(st, 'fillColor', '#ffffff') === 'none';
  r1.appendChild(mkColor(fillNone ? '#ffffff' : sv(st, 'fillColor', '#ffffff'), liveColor('fillColor')));
  r1.appendChild(mkChk('Transparent', fillNone, (v) => applyStyle(cl => { cl.style.fillColor = v ? 'none' : '#ffffff'; })));
  const r2 = frow(s, 'Outline');
  r2.appendChild(mkColor(sv(st, 'strokeColor', '#000000'), liveColor('strokeColor')));
  r2.appendChild(mkNum(sn(st, 'strokeWidth', 1), (v) => applyStyle(cl => { cl.style.strokeWidth = String(clamp(v, 0, 20)); }), 0.5, 0));
  r2.appendChild(mkChk('Dashed', sb(st, 'dashed', false), (v) => applyStyle(cl => setStyle(cl.style, 'dashed', v ? 1 : null))));
  const r3 = frow(s, 'Opacity'); r3.appendChild(mkNum(sn(st, 'opacity', 100), (v) => applyStyle(cl => setStyle(cl.style, 'opacity', v >= 100 ? null : clamp(v, 0, 100))), 5, 0));
  if (shapeKind(c) === 'callout') {
    const r4 = frow(s, 'Pointer');
    r4.appendChild(mkSel([{ v: '0.1', label: 'Left' }, { v: '0.5', label: 'Centre' }, { v: '0.9', label: 'Right' }], String(clamp(Math.round(sn(st, 'position2', 0.5) * 10) / 10, 0.1, 0.9) > 0.6 ? '0.9' : sn(st, 'position2', 0.5) < 0.35 ? '0.1' : '0.5'), (v) => applyStyle(cl => { const p2 = +v; cl.style.position2 = String(p2); cl.style.position = String(clamp(p2 < 0.5 ? p2 + 0.1 : p2 > 0.5 ? p2 - 0.25 : 0.4, 0, 0.9)); }, cl => shapeKind(cl) === 'callout')));
  }
}
// Drop shadow, any shape, any style: crisp offset (no blur) with colour, opacity, size and direction.
function shadowDefault() { return Object.assign({}, S.doc.mode === 'blueprint' ? BP.shadow : SHADOW_DEFAULT); }
const SHADOW_DIRS = [['se', 'Down right', 1, 1], ['s', 'Down', 0, 1], ['sw', 'Down left', -1, 1], ['w', 'Left', -1, 0], ['nw', 'Up left', -1, -1], ['n', 'Up', 0, -1], ['ne', 'Up right', 1, -1], ['e', 'Right', 1, 0]];
function formatShadow(verts) {
  const st = verts.find(c => shapeKind(c) !== 'text').style, cur = shadowOf(st);
  const s = fsec('Drop shadow');
  const on = (cl) => shapeKind(cl) !== 'text';
  const get = () => shadowOf(st) || shadowDefault();
  const set = (fn) => applyStyle(cl => { const v = shadowOf(cl.style) || shadowDefault(); fn(v); setShadow(cl.style, v); }, on);
  frow(s).appendChild(mkChk('Shadow', !!cur, (v) => applyStyle(cl => setShadow(cl.style, v ? (shadowOf(cl.style) || shadowDefault()) : null), on)));
  if (!cur) return;
  const r1 = frow(s, 'Colour');
  r1.appendChild(mkColor(cur.color, (v, live) => { if (live) { if (!colorLive) colorLive = snapshot(); for (const cl of styleTargets()) if (on(cl)) { const x = shadowOf(cl.style) || shadowDefault(); x.color = v; setShadow(cl.style, x); } requestRender(); return; } if (colorLive) { const pre = colorLive; colorLive = null; for (const cl of styleTargets()) if (on(cl)) { const x = shadowOf(cl.style) || shadowDefault(); x.color = v; setShadow(cl.style, x); } refreshMap(); pushUndo(pre); afterChange({ keepPanel: true }); } else set(x => { x.color = v; }); }));
  const op = mkNum(cur.opacity, (v) => set(x => { x.opacity = clamp(Math.round(v), 0, 100); }), 5, 0); op.title = 'Opacity (%)'; r1.appendChild(op);
  const size = Math.max(Math.abs(cur.dx), Math.abs(cur.dy));
  const dir = SHADOW_DIRS.find(d => d[2] === Math.sign(cur.dx) && d[3] === Math.sign(cur.dy)) || SHADOW_DIRS[0];
  const r2 = frow(s, 'Size');
  r2.appendChild(mkNum(size, (v) => set(x => { const n = clamp(v, 0, 50), d = SHADOW_DIRS.find(q => q[2] === Math.sign(x.dx) && q[3] === Math.sign(x.dy)) || SHADOW_DIRS[0]; x.dx = d[2] * n; x.dy = d[3] * n; }), 1, 0));
  const r3 = frow(s, 'Direction');
  r3.appendChild(mkSel(SHADOW_DIRS.map(d => ({ v: d[0], label: d[1] })), dir[0], (v) => set(x => { const d = SHADOW_DIRS.find(q => q[0] === v), n = Math.max(Math.abs(x.dx), Math.abs(x.dy)) || get().dx; x.dx = d[2] * n; x.dy = d[3] * n; })));
}
// Blueprint: states and markers on shapes, line types on lines (only while the diagram is in Blueprint).
function formatBlueprint(verts, edges) {
  const shapes = verts.filter(c => styleRole(c) === 'shape'), lines = edges.filter(c => !c.style.deNote);
  if (!shapes.length && !lines.length) return;
  const s = fsec('Blueprint');
  const o = styleOpts('blueprint');
  if (shapes.length) {
    const st = shapes[0].style;
    const opts = [{ v: '', label: 'None' }].concat(Object.keys(BP_EMPHASIS).map(k => ({ v: k, label: BP_EMPHASIS[k].label })), Object.keys(BP_STATES).map(k => ({ v: k, label: BP_STATES[k].label })));
    frow(s, 'State').appendChild(mkSel(opts, bpState(st.deState) ? st.deState : '', (v) => applyStyle(cl => { bpApplyState(cl, v, Object.assign({}, o, { shadows: o.shadows || !!shadowOf(cl.style) })); cl.style.deMode = 'blueprint'; }, cl => styleRole(cl) === 'shape')));
    frow(s, 'Marker').appendChild(mkSel([{ v: '', label: 'None' }].concat(Object.keys(BP_STATES).map(k => ({ v: k, label: BP_STATES[k].label }))), bpSemantic(st.deMarker) ? st.deMarker : '', (v) => applyStyle(cl => setStyle(cl.style, 'deMarker', v || null), cl => styleRole(cl) === 'shape')));
    const h = document.createElement('p'); h.className = 'hint'; h.textContent = 'A state sets the colours, outline and icon. A marker is an extra icon disc on the top-right corner, for example an Alert marker on the Focus box.'; s.appendChild(h);
  }
  if (lines.length) {
    const cur = lines[0].style.deLine || (sv(lines[0].style, 'endArrow', 'classic') === 'none' ? 'association' : 'existing');
    frow(s, 'Line').appendChild(mkSel(BP_LINES.map(l => ({ v: l.id, label: l.label })), BP_LINES.some(l => l.id === cur) ? cur : 'existing', (v) => applyStyle(cl => { bpSetLine(cl, v); cl.style.deMode = 'blueprint'; }, cl => cl.e && !cl.style.deNote)));
  }
}
/* While a label is edited, the Font list and Size box show the font and size of the selected words, or Mixed when they
   differ, so that choosing any font or size applies it. They used to show the shape's own, so choosing that one did nothing. */
function textSelSync() {
  const E = S.editing, fs = $('#fontSel'), fz = $('#fontNum'); if (!E || !fs || !fz) return;
  const rg = E.range && E.ed.contains(E.range.commonAncestorContainer) ? E.range : null;
  const nodes = []; const w = document.createTreeWalker(E.ed, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) if (n.data.trim() && (!rg || rg.collapsed ? true : rg.intersectsNode(n))) nodes.push(n);
  let pick = nodes; if (rg && rg.collapsed) { let n = rg.startContainer; if (n.nodeType !== 3) n = n.childNodes[rg.startOffset] || n.childNodes[rg.startOffset - 1] || n; pick = n && n.nodeType === 3 ? [n] : n && n.nodeType === 1 ? [n] : []; }
  if (!pick.length) pick = [E.ed];
  const cs = pick.map(n => getComputedStyle(n.nodeType === 3 ? n.parentElement : n));
  const fam = new Set(cs.map(c => { const f = c.fontFamily.split(',')[0].replace(/["']/g, '').trim(); const o = [...fs.options].find(o => o.value && (o.value.toLowerCase() === f.toLowerCase() || fontCss(o.value).split(',')[0].replace(/["']/g, '').trim().toLowerCase() === f.toLowerCase())); return o ? o.value : f; }));
  const size = new Set(cs.map(c => Math.round(parseFloat(c.fontSize))));
  const f = fam.size === 1 ? [...fam][0] : ''; fs.value = [...fs.options].some(o => o.value === f) ? f : '';
  if (document.activeElement !== fz) fz.value = size.size === 1 ? [...size][0] : '';
}
function formatText(cells, edges) {
  const tcells = cells.length ? cells : [];
  const st = tcells.length ? tcells[0].style : {};
  const s = fsec('Text');
  const ed = !!S.editing;
  const fs = sn(st, 'fontStyle', 0);
  const exec = (cmd, val, whole) => { restoreEditSel(whole); document.execCommand('styleWithCSS', false, true); document.execCommand(cmd, false, val); };
  const bits = (bit) => () => { if (ed) return exec({ 1: 'bold', 2: 'italic', 4: 'underline' }[bit]); applyStyle(cl => { const v = sn(cl.style, 'fontStyle', 0) ^ bit; setStyle(cl.style, 'fontStyle', v || null); }, cl => !cl.e); };
  const r1 = frow(s); const g1 = document.createElement('div'); g1.className = 'btngrp';
  g1.appendChild(mkBtn('<b>B</b>', bits(1), !ed && fs & 1 ? 'on' : '', 'Bold')); g1.appendChild(mkBtn('<i>I</i>', bits(2), !ed && fs & 2 ? 'on' : '', 'Italic')); g1.appendChild(mkBtn('<u>U</u>', bits(4), !ed && fs & 4 ? 'on' : '', 'Underline'));
  r1.appendChild(g1);
  if (ed) { r1.appendChild(mkBtn('• List', () => exec('insertUnorderedList'), '', 'Bulleted list')); r1.appendChild(mkBtn('1. List', () => exec('insertOrderedList'), '', 'Numbered list')); r1.appendChild(mkBtn('Clear', () => exec('removeFormat'), '', 'Clear formatting')); }
  const fonts = ['Helvetica', 'Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', SKETCH_FONT];
  const r2 = frow(s, 'Font');
  // with shapes whose fonts differ, the list shows Mixed, so choosing any font applies it (choosing the one shown did nothing)
  const fam0 = (c) => sv(c.style, 'fontFamily', DEFAULT_FONT), famMixed = tcells.some(c => fam0(c) !== fam0(tcells[0])), szMixed = tcells.some(c => sn(c.style, 'fontSize', 12) !== sn(tcells[0].style, 'fontSize', 12));
  const fsel = mkSel([{ v: '', label: 'Mixed' }].concat(fonts.map(f => ({ v: f, label: f }))), famMixed ? '' : sv(st, 'fontFamily', DEFAULT_FONT), (v) => { if (!v) return; if (ed) return exec('fontName', v); applyStyle(cl => { if (v === DEFAULT_FONT) { delete cl.style.fontFamily; delete cl.style.fontSource; } else { cl.style.fontFamily = v; if (v === SKETCH_FONT) cl.style.fontSource = SKETCH_FONT_SOURCE; else delete cl.style.fontSource; } }, cl => !cl.e); });
  fsel.id = 'fontSel'; fsel.options[0].hidden = true; r2.appendChild(fsel);
  const r3 = frow(s, 'Size');
  const fnum = mkNum(sn(st, 'fontSize', 12), (v) => { if (ed) { exec('fontSize', 7, true); S.editing.ed.querySelectorAll('font[size="7"]').forEach(f => { f.removeAttribute('size'); f.style.fontSize = v + 'px'; }); S.editing.ed.querySelectorAll('span').forEach(sp => { if (sp.style.fontSize === 'xxx-large' || sp.style.fontSize === '-webkit-xxx-large') sp.style.fontSize = v + 'px'; }); return; } applyStyle(cl => { cl.style.fontSize = String(clamp(v, 4, 200)); }, cl => !cl.e); }, 1, 4);
  fnum.id = 'fontNum'; fnum.placeholder = 'Mixed'; if (szMixed) fnum.value = ''; r3.appendChild(fnum);
  if (ed) setTimeout(textSelSync, 0);
  r3.appendChild(mkColor(sv(st, 'fontColor', '#1e293b'), ed ? (v, live) => { if (!live) exec('foreColor', v); } : liveColor('fontColor', cl => !cl.e), { noPreview: ed }));
  const verts = tcells.filter(c => !c.isEdgeLabel);
  if (verts.length) {
    const r4 = frow(s, 'Position');
    const a9 = document.createElement('div'); a9.className = 'align9';
    const al = sv(st, 'align', 'center'), va = sv(st, 'verticalAlign', 'middle');
    for (const v of ['top', 'middle', 'bottom']) for (const h of ['left', 'center', 'right']) {
      const b = document.createElement('button'); b.title = v + ' ' + h; b.innerHTML = '<i></i>';
      if (al === h && va === v && sv(st, 'labelPosition', 'center') === 'center' && sv(st, 'verticalLabelPosition', 'middle') === 'middle') b.classList.add('on');
      b.onmousedown = (e) => e.preventDefault();
      b.onclick = () => { applyStyle(cl => { cl.style.align = h; cl.style.verticalAlign = v; delete cl.style.labelPosition; delete cl.style.verticalLabelPosition; }, cl => !cl.e && !cl.isEdgeLabel); positionEditor(); };
      a9.appendChild(b);
    }
    r4.appendChild(a9);
    const out = document.createElement('div'); out.style.display = 'flex'; out.style.flexDirection = 'column'; out.style.gap = '3px';
    const lp = sv(st, 'labelPosition', 'center'), vlp = sv(st, 'verticalLabelPosition', 'middle');
    const cur = vlp === 'top' ? 'above' : vlp === 'bottom' ? 'below' : lp === 'left' ? 'left' : lp === 'right' ? 'right' : 'inside';
    out.appendChild(mkSel([{ v: 'inside', label: 'Inside' }, { v: 'above', label: 'Above shape' }, { v: 'below', label: 'Below shape' }, { v: 'left', label: 'Left of shape' }, { v: 'right', label: 'Right of shape' }], cur, (v) => applyStyle(cl => {
      delete cl.style.labelPosition; delete cl.style.verticalLabelPosition;
      if (v === 'inside') { cl.style.align = 'center'; cl.style.verticalAlign = 'middle'; }
      if (v === 'above') { cl.style.verticalLabelPosition = 'top'; cl.style.verticalAlign = 'bottom'; cl.style.align = 'center'; }
      if (v === 'below') { cl.style.verticalLabelPosition = 'bottom'; cl.style.verticalAlign = 'top'; cl.style.align = 'center'; }
      if (v === 'left') { cl.style.labelPosition = 'left'; cl.style.align = 'right'; cl.style.verticalAlign = 'middle'; }
      if (v === 'right') { cl.style.labelPosition = 'right'; cl.style.align = 'left'; cl.style.verticalAlign = 'middle'; }
    }, cl => !cl.e && !cl.isEdgeLabel)));
    out.appendChild(mkChk('Wrap text', sv(st, 'whiteSpace', '') === 'wrap', (v) => applyStyle(cl => setStyle(cl.style, 'whiteSpace', v ? 'wrap' : null), cl => !cl.e)));
    r4.appendChild(out);
  }
  if (tcells.some(c => c.isEdgeLabel)) {
    const r5 = frow(s, 'Background');
    const bg = sv(st, 'labelBackgroundColor', '#ffffff');
    r5.appendChild(mkColor(bg === 'none' ? '#ffffff' : bg, liveColor('labelBackgroundColor', cl => cl.isEdgeLabel)));
    r5.appendChild(mkChk('Transparent', bg === 'none', (v) => applyStyle(cl => { cl.style.labelBackgroundColor = v ? 'none' : '#ffffff'; }, cl => cl.isEdgeLabel)));
  }
  if (!ed) { const h = document.createElement('p'); h.className = 'hint'; h.textContent = 'Double-click to edit text. While editing, these controls format the selected words.'; s.appendChild(h); }
}
function formatLine(edges) {
  const e = edges[0], st = e.style;
  const s = fsec('Line');
  const apply = (fn) => applyStyle(fn, c => c.e);
  const r1 = frow(s, 'Start'); r1.appendChild(mkSel(ARROW_TYPES.map(a => ({ v: a.v, label: a.label })), sv(st, 'startArrow', 'none'), (v) => apply(c => { c.style.startArrow = v; c.style.startSize = /^ER/.test(v) ? '12' : '8'; c.style.startFill = '1'; })));
  const r2 = frow(s, 'End'); r2.appendChild(mkSel(ARROW_TYPES.map(a => ({ v: a.v, label: a.label })), sv(st, 'endArrow', 'classic'), (v) => apply(c => { c.style.endArrow = v; c.style.endSize = /^ER/.test(v) ? '12' : '8'; c.style.endFill = '1'; })));
  const r2b = frow(s); r2b.appendChild(mkBtn('Swap ends', () => apply(c => { const a = sv(c.style, 'startArrow', 'none'), b = sv(c.style, 'endArrow', 'classic'); c.style.startArrow = b; c.style.endArrow = a; const as = c.style.startSize, bs = c.style.endSize; setStyle(c.style, 'startSize', bs); setStyle(c.style, 'endSize', as); })));
  r2b.appendChild(mkBtn("Crow's foot help", () => runCommand('crowsFoot')));
  const kind = edgeKind(e);
  const r3 = frow(s, 'Routing');
  r3.appendChild(mkSel([{ v: 'straight', label: 'Straight' }, { v: 'elbow', label: 'Elbow' }, { v: 'soft', label: 'Soft elbow' }, { v: 'curved', label: 'Curved' }], kind === 'curvedFree' ? 'curved' : kind, (v) => apply(c => {
    delete c.style.curved; delete c.style.rounded;
    if (v === 'straight') c.style.edgeStyle = 'none';
    else { c.style.edgeStyle = 'orthogonalEdgeStyle'; if (v === 'soft') c.style.rounded = '1'; if (v === 'curved') c.style.curved = '1'; if (v === 'elbow') c.style.rounded = '0'; }
    c.pts = [];
  })));
  const r4 = frow(s, 'Colour');
  r4.appendChild(mkColor(sv(st, 'strokeColor', '#000000'), liveColor('strokeColor', c => c.e)));
  r4.appendChild(mkNum(sn(st, 'strokeWidth', 1), (v) => apply(c => { c.style.strokeWidth = String(clamp(v, 0.5, 20)); }), 0.5, 0.5));
  frow(s).appendChild(mkChk('Dashed', sb(st, 'dashed', false), (v) => apply(c => setStyle(c.style, 'dashed', v ? 1 : null))));
  frow(s).appendChild(mkChk('Line hops where lines cross', sv(st, 'jumpStyle', 'none') !== 'none', (v) => apply(c => { c.style.jumpStyle = v ? 'arc' : 'none'; if (v) c.style.jumpSize = '8'; })));
  const r6 = frow(s);
  if (edges.length === 1) r6.appendChild(mkBtn('Add label', () => addLabelToEdge(e)));
  r6.appendChild(mkBtn('Reset path', () => applyStyle(c => { c.pts = []; }, c => c.e)));
  const h = document.createElement('p'); h.className = 'hint'; h.textContent = 'Drag the end dots onto a shape (or one of its × points) to connect. Drag a segment handle to move that part of the line; on elbow lines each drag adds bends, and Shift+drag puts a new bend in the middle of a segment. Use Reset path to start again. Double-click a waypoint to remove it, or the line to add a label.'; s.appendChild(h);
}
function formatGeometry(c) {
  const s = fsec(isGroup(c) ? 'Group' : 'Size and position');
  const r1 = frow(s, 'X, Y');
  const moveTo = (nx, ny) => mutate(() => translateCells([c], nx - c.x, ny - c.y), { keepPanel: false });
  r1.appendChild(mkNum(c.x, (v) => moveTo(v, c.y))); r1.appendChild(mkNum(c.y, (v) => moveTo(c.x, v)));
  if (!isGroup(c)) {
    const r2 = frow(s, 'W, H');
    r2.appendChild(mkNum(c.w, (v) => mutate(() => { const cc = cellCenter(c); c.w = Math.max(4, v); if (cellRot(c)) c.x = cc.x - c.w / 2; }), 1, 4));
    r2.appendChild(mkNum(c.h, (v) => mutate(() => { const cc = cellCenter(c); c.h = Math.max(4, v); if (cellRot(c)) c.y = cc.y - c.h / 2; }), 1, 4));
    const r3 = frow(s, 'Rotation'); r3.appendChild(mkNum(cellRot(c), (v) => mutate(() => setStyle(c.style, 'rotation', ((v % 360) + 360) % 360 || null)), 15));
    r3.appendChild(mkBtn('↺', () => mutate(() => setStyle(c.style, 'rotation', ((cellRot(c) - 90) % 360 + 360) % 360 || null)), '', 'Rotate left 90°'));
    r3.appendChild(mkBtn('↻', () => mutate(() => setStyle(c.style, 'rotation', ((cellRot(c) + 90) % 360) || null)), '', 'Rotate right 90°'));
  }
  // locked means fixed in place: position, size and rotation can't change (text and colours still can)
  if (isLocked(c)) { s.querySelectorAll('input, button').forEach(i => { i.disabled = true; }); const h = document.createElement('p'); h.className = 'hint'; h.textContent = 'Locked: unlock (Ctrl+L) to move, resize or rotate.'; s.appendChild(h); }
}
function formatPoints(c) {
  const s = fsec('Connection points');
  const n = workingPoints(c).length, faded = S.editPoints === c.id ? n - offeredPoints(c).length : 0;
  const r = frow(s);
  r.appendChild(mkBtn(S.editPoints === c.id ? 'Done' : 'Edit points', () => toggleEditPoints(c), S.editPoints === c.id ? 'on' : ''));
  r.appendChild(mkBtn('Reset to defaults', () => resetConnectionPoints(c)));
  const h = document.createElement('p'); h.className = 'hint';
  h.textContent = n + ' points. ' + (S.editPoints === c.id ? 'Click the outline to add a point, drag a point along the outline to move it, select one and press Delete (or double-click it) to remove it. These are the points a line can attach to.' + (faded > 0 ? ' ' + faded + (faded === 1 ? ' is' : ' are') + ' too close to others to use at this zoom (shown faded); zoom in to use ' + (faded === 1 ? 'it.' : 'them.') : '') : 'Lines attached to a point follow it when it moves.');
  s.appendChild(h);
}
function formatArrange(cs) {
  const s = fsec('Arrange');
  const r = frow(s);
  r.appendChild(mkBtn('Front', () => runCommand('toFront'))); r.appendChild(mkBtn('Back', () => runCommand('toBack')));
  if (topUnits(cs).length > 1) r.appendChild(mkBtn('Group', () => runCommand('group')));
  if (cs.some(isGroup)) r.appendChild(mkBtn('Ungroup', () => runCommand('ungroup')));
  r.appendChild(mkBtn(cs.every(isLocked) ? 'Unlock' : 'Lock', () => runCommand('lock')));
  if (topUnits(cs).length > 1) {
    const r2 = frow(s);
    const ib = (a, title, dis) => { const b = mkBtn(icon(a), () => runCommand(a), '', title); b.setAttribute('aria-label', title); b.querySelector('svg').style.width = '16px'; b.querySelector('svg').style.height = '16px'; if (dis) { b.disabled = true; b.title = title + ' (select three or more)'; } return b; };
    for (const a of ['alignL', 'alignC', 'alignR', 'alignT', 'alignM', 'alignB']) r2.appendChild(ib(a, { alignL: 'Align left', alignC: 'Align centre', alignR: 'Align right', alignT: 'Align top', alignM: 'Align middle', alignB: 'Align bottom' }[a]));
    const few = topUnits(cs).length < 3, r3 = frow(s);
    r3.appendChild(ib('distH', 'Distribute horizontally', few)); r3.appendChild(ib('distV', 'Distribute vertically', few));
    const sz = (cs.length > 1 && !S.selAuto) ? ': the size of the first shape clicked' : ': the size of the widest, tallest or largest';
    r3.appendChild(ib('matchW', 'Match width' + sz)); r3.appendChild(ib('matchH', 'Match height' + sz)); r3.appendChild(ib('matchWH', 'Match width and height' + sz));
    const r4 = frow(s); r4.classList.add('quick');
    const q = (a, t, title) => { const b = mkBtn(icon(a) + '<span>' + t + '</span>', () => runCommand(a), '', title); b.querySelector('svg').style.width = '16px'; b.querySelector('svg').style.height = '16px'; return b; };
    r4.appendChild(q('widthLeft', 'Width, left', 'Same width' + sz + ', and align left')); r4.appendChild(q('heightTop', 'Height, top', 'Same height' + sz + ', and align top'));
  }
}

/* ---------- dialogs ---------- */
function modal(title, body, buttons, opts) {
  const root = $('#modalRoot');
  const back = document.createElement('div'); back.className = 'modalBack' + (opts && opts.side ? ' side' : '');
  const m = document.createElement('div'); m.className = 'modal'; if (opts && opts.width) m.style.width = opts.width;
  const h = document.createElement('header'); h.textContent = title;
  const b = document.createElement('div'); b.className = 'body';
  if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
  const f = document.createElement('footer');
  for (const bt of (buttons || [{ t: 'Close' }])) {
    const x = document.createElement('button'); x.className = 'btn' + (bt.primary ? ' primary' : ''); x.textContent = bt.t;
    x.onclick = () => { if (bt.fn && bt.fn() === false) return; if (!bt.keep) closeModal(back); };
    f.appendChild(x);
  }
  m.append(h, b, f); back.appendChild(m); root.appendChild(back);
  back.addEventListener('pointerdown', (e) => { if (e.target === back && !(opts && opts.sticky)) closeModal(back); });
  return { back, body: b };
}
function closeModal(back) { const root = $('#modalRoot'); if (back) { if (back._onclose) back._onclose(); back.remove(); } else if (root.lastChild) { if (root.lastChild._onclose) root.lastChild._onclose(); root.lastChild.remove(); } }
function promptDialog(title, label, val, fn) {
  const d = document.createElement('div'); d.innerHTML = '<div class="frow"><label class="l">' + esc(label) + '</label><input type="text" style="flex:1"></div>';
  const inp = d.querySelector('input'); inp.value = val || '';
  const m = modal(title, d, [{ t: 'Cancel' }, { t: 'OK', primary: true, fn: () => fn(inp.value.trim()) }]);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { fn(inp.value.trim()); closeModal(m.back); } });
  setTimeout(() => { inp.focus(); inp.select(); }, 0);
}
function confirmDialog(title, text, okText, fn, extra) {
  modal(title, '<p>' + text + '</p>', [{ t: 'Cancel' }].concat(extra || [], [{ t: okText, primary: true, fn }]));
}
function textDialog(title, text) {
  const ta = document.createElement('textarea'); ta.value = text; ta.style.width = '640px'; ta.style.maxWidth = '80vw'; ta.style.height = '300px'; ta.readOnly = true;
  modal(title, ta); setTimeout(() => ta.select(), 0);
}
function confirmDiscard(fn) {
  if (!S.dirty) return fn();
  confirmDialog('Unsaved changes', 'You have unsaved changes. Discard them?', 'Discard', () => { fn(); }, [{ t: 'Save first', fn: () => { saveFile(false).then(ok => { if (ok) fn(); }); } }]);
}
function shortcutsDialog() {
  const rows = [['Ctrl+N via File menu', 'New diagram'], ['Ctrl+O', 'Open'], ['Ctrl+S / Ctrl+Shift+S', 'Save / Save as'], ['Ctrl+Z / Ctrl+Y', 'Undo / Redo'], ['Ctrl+C / X / V / D', 'Copy, cut, paste, duplicate'],
    ['Delete', 'Delete selection (or selected guide or connection point)'], ['Ctrl+A', 'Select all'], ['Ctrl+G / Ctrl+Shift+G', 'Group / ungroup'], ['Ctrl+Shift+F / B', 'Bring to front / send to back'], ['Ctrl+L', 'Lock or unlock'],
    ['Arrow keys', 'Nudge one pixel'], ['Shift+Arrow keys', 'Nudge one grid cell'], ['Enter or F2, or start typing', 'Edit text of selected shape'], ['Ctrl+Enter, or click elsewhere', 'Finish editing text'], ['Esc', 'Cancel editing text (a new text box is removed)'], ['Ctrl+B / I / U', 'Bold, italic, underline while editing'],
    ['Right-drag, Space+drag, middle-drag, scroll', 'Pan'], ['Ctrl+scroll or pinch', 'Zoom'], ['Ctrl+0 / Ctrl+Shift+H', 'Actual size / fit'], ['Alt while dragging', 'Turn snapping off (and free rotation)'], ['Shift while dragging', 'Constrain to horizontal or vertical; keep aspect when resizing from a corner'],
    ['Shift while dragging a line label', 'Snap the label back onto the line'], ['Double-click canvas', 'Add a text box'], ['Double-click line', 'Add a label']];
  modal('Keyboard shortcuts', '<table>' + rows.map(r => '<tr><td><kbd>' + esc(r[0]) + '</kbd></td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>');
}
function crowsFootDialog() {
  const rows = [['ERone', 'One', 'Exactly one (optionality unspecified)'], ['ERmandOne', 'One and only one', 'Mandatory, exactly one'], ['ERzeroToOne', 'Zero or one', 'Optional, at most one'],
    ['ERmany', 'Many', 'One or more (optionality unspecified)'], ['ERoneToMany', 'One or many', 'Mandatory, at least one'], ['ERzeroToMany', 'Zero or many', 'Optional, any number']];
  const t = document.createElement('table');
  t.innerHTML = '<tr><th>Symbol</th><th>Name</th><th>Meaning</th></tr>';
  for (const r of rows) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('width', '110'); svg.setAttribute('height', '36'); svg.setAttribute('viewBox', '0 0 110 36');
    el('rect', { x: 84, y: 6, width: 24, height: 24, rx: 3, fill: '#f8fafc', stroke: '#475569', 'stroke-width': 1.5 }, svg);
    const e = { id: 'x', style: parseStyle('endArrow=' + r[0] + ';endSize=14;startArrow=none;strokeColor=#1e293b;strokeWidth=1.5;') };
    svg.appendChild(renderEdge(e, { pts: [{ x: 6, y: 18 }, { x: 84, y: 18 }], kind: 'straight' }, null, { noHit: true }));
    td.appendChild(svg); tr.appendChild(td);
    tr.insertAdjacentHTML('beforeend', '<td><b>' + r[1] + '</b></td><td>' + r[2] + '</td>');
    t.appendChild(tr);
  }
  const d = document.createElement('div'); d.appendChild(t);
  d.insertAdjacentHTML('beforeend', '<p class="hint">Read each end at the shape it touches: the symbol nearest the shape is the maximum (one or many), the next symbol is the minimum (zero or one). Set line ends in the Line panel, under Start and End.</p>');
  modal("Crow's foot cheat sheet", d);
}
function aboutDialog() {
  modal('About ' + APP_NAME, '<p><b>' + APP_NAME + '</b> ' + APP_VERSION + '. A lightweight diagram editor that saves in the draw.io (.drawio) file format. It works offline as a single HTML file.</p>' +
    '<p class="hint">draw.io is a trademark of JGraph Ltd. This editor is an independent tool that reads and writes the same file format; it is not made by or affiliated with JGraph.</p>' +
    '<h4>Open-source components</h4><table><tr><th>Component</th><th>Licence</th></tr><tr><td>Rough.js 4.6.6 (hand-drawn rendering), Preet Shihn</td><td>MIT</td></tr><tr><td>Phosphor Icons ' + esc(PH.version || '2.1.1') + ' (icon collection), Phosphor Icons</td><td>MIT</td></tr><tr><td>Architects Daughter font, Kimberly Geswein (via Fontsource)</td><td>SIL Open Font License 1.1</td></tr><tr><td>Orthogonal line routing ported from mxGraph 4.2.2 (mxEdgeStyle), JGraph Ltd and Gaudenz Alder</td><td>Apache License 2.0</td></tr></table>' +
    '<p class="hint">Everything else in this file was written for this editor.</p>');
}

/* ---------- contrast (src/contrast.js): notices, manual fixes, report ---------- */
function contrastSummary(r) {
  if (!r) return '';
  const n = autoContrastOn() || r.manual ? r.fixes.length : 0, bad = r.problems.length + (autoContrastOn() || r.manual ? 0 : r.fixes.length);
  return (n ? ' ' + n + ' colour' + (n > 1 ? 's' : '') + ' adjusted for contrast.' : '') + (bad ? ' ' + bad + ' contrast problem' + (bad > 1 ? 's' : '') + ' (Style, Contrast report).' : '');
}
function setAutoContrast(on) { S.prefs.autoContrast = !!on; savePrefs(); toast('Auto-correct contrast ' + (on ? 'on' : 'off')); if (!$('#format .fsec')) return; buildFormat(); }
function manualContrast(only) {
  let res;
  mutate(() => { res = contrastRun(S.doc, { apply: true, only, manual: true }); });
  S.lastContrast = Object.assign(res, { when: only === 'text' ? 'Fix text colours' : 'Fix all contrast', t: Date.now(), manual: true });
  toast((res.fixes.length ? (only === 'text' ? 'Fixed ' + res.fixes.length + ' text colour' : 'Fixed ' + res.fixes.length + ' colour') + (res.fixes.length > 1 ? 's' : '') + '.' : 'Nothing to fix: everything already passes.') + (res.problems.length ? ' ' + res.problems.length + ' could not be fixed (Style, Contrast report).' : ''), 0, res.fixes.length ? { label: 'Undo', fn: () => undo() } : undefined);
}
function swatchHtml(c) { return '<span class="csw" style="background:' + (safeColour(c) ? c : 'transparent') + '"></span><code>' + esc(c) + '</code>'; }
function contrastDialog() {
  const d = document.createElement('div'); d.className = 'contrastDlg';
  const draw = () => {
    const now = contrastRun(S.doc, { apply: false, manual: true }), last = S.lastContrast;
    const rows = (list, showNew) => '<table class="ctab"><tr><th>Page</th><th>Element</th><th>Colour</th><th>Target</th><th>Tested against</th><th>Ratio</th><th title="APCA is not a standard; shown for information only">APCA Lc (advisory)</th></tr>' +
      list.slice(0, 300).map(r => '<tr' + (r.ok === false ? ' class="bad"' : '') + '><td>' + esc(r.page) + '</td><td>' + esc(r.element) + ' <span class="hint">' + esc(r.what) + '</span></td><td>' + swatchHtml(r.old) + (showNew && r.new !== r.old ? ' → ' + swatchHtml(r.new) : '') + '</td><td>' + r.target + ':1</td><td>' + swatchHtml(r.bg) + ' <span class="hint">' + esc(r.against) + '</span></td><td>' + r.before.toFixed(2) + (showNew && r.new !== r.old ? ' → ' + r.after.toFixed(2) : '') + '</td><td>' + (r.apca === null || r.apca === undefined ? '' : Math.abs(r.apca).toFixed(0)) + '</td></tr>' +
        (r.ok === false ? '<tr class="bad"><td></td><td colspan="6">Could not be fixed: ' + esc(r.reason || '') + '</td></tr>' : '')).join('') + '</table>' + (list.length > 300 ? '<p class="hint">First 300 shown.</p>' : '');
    d.innerHTML = '<p class="hint">WCAG 2.2: text 4.5:1 (large text, 24 px or 19 px bold, 3:1); outlines, lines and icons 3:1 against what is behind them. Checked and corrected over the whole diagram when you switch style or canvas (if Auto-correct is on), or when you press a Fix button; colours you set yourself are left as they are until then. Failing colours keep their hue (OKLCH) and only get lighter or darker. Fill colours are never changed.</p>';
    const r0 = frow(d); r0.appendChild(mkChk('Auto-correct contrast', autoContrastOn(), (v) => { setAutoContrast(v); draw(); }));
    const r1 = frow(d); r1.appendChild(mkBtn('Fix text colours', () => { runCommand('fixText'); draw(); }, 'primary')); r1.appendChild(mkBtn('Fix all', () => { runCommand('fixContrast'); draw(); }));
    const fails = now.fixes.concat(now.problems.filter(p => !now.fixes.some(f => f.id === p.id && f.prop === p.prop)));
    d.insertAdjacentHTML('beforeend', '<h4>Now: ' + (fails.length ? fails.length + ' item' + (fails.length > 1 ? 's fail' : ' fails') : 'everything passes') + '</h4>' + (fails.length ? rows(fails, false) : ''));
    if (last) d.insertAdjacentHTML('beforeend', '<h4>Last check: ' + esc(last.when) + ', ' + last.fixes.length + ' correction' + (last.fixes.length === 1 ? '' : 's') + (last.problems.length ? ', ' + last.problems.length + ' could not be fixed' : '') + '</h4>' + (last.fixes.length || last.problems.length ? rows(last.fixes.concat(last.problems.filter(p => !last.fixes.includes(p))), true) : ''));
  };
  draw();
  modal('Contrast', d, [{ t: 'Close' }], { width: '900px' });
}
