/* ===== Editor state, rendering loop, hit testing, interactions ===== */
const $ = (s) => document.querySelector(s);
const PREF_KEY = 'de-prefs-v1';
function loadPrefs() {
  const d = { gridStyle: 'lines', gridMajor: 5, gridColor: '#e5e7eb' };
  try { return Object.assign(d, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) { return d; }
}
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(S.prefs)); } catch (e) { } }

const S = {
  doc: newDoc(), pi: 0, sel: [], zoom: 1, tx: 80, ty: 60, dirty: false,
  file: { handle: null, name: 'Untitled.drawio' }, undo: [], redo: [], clipboard: null,
  hover: null, hoverPoint: null, drag: null, editing: null, editPoints: null, selPoint: null, selGuides: [], smart: [],
  prefs: loadPrefs(), cache: new Map(), map: new Map(), routes: new Map(), space: false, marquee: null
};
function page() { return S.doc.pages[S.pi]; }
function cellById(id) { return S.map.get(id); }
function refreshMap() { S.map = cellMap(page()); return S.map; }

/* ---------- history ---------- */
function snapshot() { return JSON.stringify({ pi: S.pi, doc: S.doc }); }
function setDirty(v) { S.dirty = v !== false; updateTitle(); if (S.embed) embedDirty(); }
function mutate(fn, opts) {
  const snap = snapshot();
  fn();
  for (const c of page().cells) if (!c.e && shapeKind(c) === 'folder') fitFolderTab(c);
  refreshMap(); updateGroups(page());
  if (snapshot() !== snap) { pushUndo(snap); }
  afterChange(opts);
}
function pushUndo(snap) { S.undo.push(snap); if (S.undo.length > 120) S.undo.shift(); S.redo = []; setDirty(); }
function restore(snap) {
  const o = JSON.parse(snap); S.doc = o.doc; S.pi = clamp(o.pi, 0, S.doc.pages.length - 1);
  refreshMap(); S.sel = S.sel.filter(id => S.map.has(id)); S.editPoints = null; S.selPoint = null;
  clearCache(); afterChange();
}
function undo() { if (S.editing) finishEdit(); if (!S.undo.length) return; S.redo.push(snapshot()); restore(S.undo.pop()); setDirty(); }
function redo() { if (!S.redo.length) return; S.undo.push(snapshot()); restore(S.redo.pop()); setDirty(); }
function afterChange(opts) { refreshMap(); requestRender(); if (!opts || !opts.keepPanel) buildFormat(); renderTabs(); if (S.paletteMode !== undefined && S.paletteMode !== S.doc.mode) buildPalette(); updateToolbar(); }
function clearCache() { S.cache.clear(); $('#content').innerHTML = ''; }

/* ---------- groups ---------- */
function descendants(id) { const out = []; const walk = (pid) => { for (const c of page().cells) if (c.parent === pid && !c.isEdgeLabel) { out.push(c); walk(c.id); } }; walk(id); return out; }
function isGroup(c) { return c && c.style.group !== undefined; }
function ancestors(c) { const out = []; let p = cellById(c.parent), g = 0; while (p && !p.e && g++ < 50) { out.unshift(p); p = cellById(p.parent); } return out; }
function updateGroups(pg) {
  const map = cellMap(pg);
  const groups = pg.cells.filter(isGroup);
  const depth = (c) => { let d = 0, p = map.get(c.parent); while (p && d < 50) { d++; p = map.get(p.parent); } return d; };
  groups.sort((a, b) => depth(b) - depth(a));
  for (const g of groups) {
    let b = null;
    for (const c of pg.cells) if (c.parent === g.id && !c.e && !c.isEdgeLabel) b = unionBox(b, isGroup(c) ? { x: c.x, y: c.y, w: c.w, h: c.h } : worldBox(c));
    if (b) { g.x = b.x; g.y = b.y; g.w = b.w; g.h = b.h; }
  }
  // remove empty groups
  for (const g of groups) if (!pg.cells.some(c => c.parent === g.id)) pg.cells.splice(pg.cells.indexOf(g), 1);
}

/* ---------- view ---------- */
function vpRect() { return $('#viewport').getBoundingClientRect(); }
function toWorld(ev) { const r = vpRect(); return { x: (ev.clientX - r.left - S.tx) / S.zoom, y: (ev.clientY - r.top - S.ty) / S.zoom }; }
function toScreen(p) { return { x: p.x * S.zoom + S.tx, y: p.y * S.zoom + S.ty }; }
function setZoom(z, center) {
  z = clamp(z, 0.1, 6);
  const r = vpRect();
  const c = center || { x: r.width / 2, y: r.height / 2 };
  const wx = (c.x - S.tx) / S.zoom, wy = (c.y - S.ty) / S.zoom;
  S.zoom = z; S.tx = c.x - wx * z; S.ty = c.y - wy * z;
  requestRender(); updateZoomLabel(); positionEditor();
}
function contentBounds(pg) {
  pg = pg || page();
  const map = cellMap(pg); let b = null;
  const { routes } = computeRoutes(pg, map);
  for (const c of pg.cells) {
    if (c.e) { const r = routes.get(c.id); if (r) b = unionBox(b, bboxOf(r.pts)); }
    else if (!c.isEdgeLabel && !isGroup(c)) { b = unionBox(b, worldBox(c)); if (labelHtml(c)) b = unionBox(b, labelBox(c)); }
  }
  return b;
}
function fitView() {
  const b = contentBounds(); const r = vpRect();
  if (!b) { S.zoom = 1; S.tx = 80; S.ty = 60; requestRender(); updateZoomLabel(); return; }
  const z = clamp(Math.min((r.width - 80) / Math.max(b.w, 1), (r.height - 80) / Math.max(b.h, 1)), 0.1, 2);
  S.zoom = z; S.tx = (r.width - b.w * z) / 2 - b.x * z; S.ty = (r.height - b.h * z) / 2 - b.y * z;
  requestRender(); updateZoomLabel();
}
function updateZoomLabel() { const l = $('#zoomLabel'); if (l) l.textContent = Math.round(S.zoom * 100) + '%'; }

/* ---------- render ---------- */
let renderPending = false;
function requestRender() { if (!renderPending) { renderPending = true; requestAnimationFrame(() => { renderPending = false; renderAll(); }); } }
function renderAll() {
  $('#view').setAttribute('transform', `translate(${S.tx},${S.ty}) scale(${S.zoom})`);
  $('#htmlLayer').style.transform = `translate(${S.tx}px,${S.ty}px) scale(${S.zoom})`;
  $('#stage').classList.toggle('norulers', !page().rulers || !!S.clean);
  const bg = pageBackground(page());
  $('#stage').style.background = bg;
  renderGrid(); renderContent(); renderOverlay(); renderRulers();
}
function renderGrid() {
  const pg = page(), layer = $('#gridLayer'), defs = $('#defs');
  layer.innerHTML = '';
  if (!pg.gridVisible || S.clean) return;
  const gs0 = pg.gridSize, r = vpRect(), z = S.zoom;
  const major0 = Math.max(1, S.prefs.gridMajor | 0);
  let gs = gs0, majorOnly = false;
  if (gs0 * z < 7) { if (gs0 * major0 * z < 7) return; gs = gs0 * major0; majorOnly = true; }
  const major = majorOnly ? 1 : major0, col = S.prefs.gridColor || '#e5e7eb';
  const bgc = pageBackground(pg), darkBg = isDarkBg(bgc); // the grid dims itself on a dark canvas
  const cMinor = darkBg ? mixHex(bgc, '#ffffff', 0.07) : col, cMajor = darkBg ? mixHex(bgc, '#ffffff', 0.14) : shade(col, -30);
  defs.querySelectorAll('.gridpat').forEach(n => n.remove());
  const sw = 1 / z;
  const pm = el('pattern', { id: 'gpMinor', class: 'gridpat', width: gs, height: gs, patternUnits: 'userSpaceOnUse' }, defs);
  const pM = el('pattern', { id: 'gpMajor', class: 'gridpat', width: gs * major, height: gs * major, patternUnits: 'userSpaceOnUse' }, defs);
  if (S.prefs.gridStyle === 'dots') {
    el('circle', { cx: 0, cy: 0, r: 1 / z, fill: darkBg ? cMajor : shade(col, -40) }, pm);
    el('circle', { cx: 0, cy: 0, r: 1.8 / z, fill: darkBg ? mixHex(bgc, '#ffffff', 0.25) : shade(col, -70) }, pM);
  } else {
    el('path', { d: `M${gs},0V${gs}M0,${gs}H${gs}`, stroke: cMinor, 'stroke-width': sw, fill: 'none' }, pm);
    el('path', { d: `M${gs * major},0V${gs * major}M0,${gs * major}H${gs * major}`, stroke: cMajor, 'stroke-width': sw * 1.2, fill: 'none' }, pM);
  }
  const x0 = -S.tx / z, y0 = -S.ty / z;
  el('rect', { x: x0, y: y0, width: r.width / z, height: r.height / z, fill: 'url(#gpMinor)' }, layer);
  if (major > 1 && gs * major * z > 12) el('rect', { x: x0, y: y0, width: r.width / z, height: r.height / z, fill: 'url(#gpMajor)' }, layer);
}
function shade(hex, amt) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return hex;
  const n = parseInt(m[1], 16); const f = (v) => clamp(v + amt, 0, 255);
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function renderContent() {
  const pg = page(), map = refreshMap();
  const { routes, hops } = computeRoutes(pg, map);
  S.routes = routes;
  const content = $('#content'), keep = new Set();
  const editId = S.editing ? S.editing.id : null;
  let idx = 0;
  for (const c of pg.cells) {
    if (isGroup(c) || isHiddenByLayer(pg, c, map)) continue;
    let key, make;
    if (c.e) {
      const r = routes.get(c.id);
      key = 'e' + JSON.stringify([c.style, r.pts, r.kind, hops.get(c.id) || 0]);
      make = () => renderEdge(c, r, hops.get(c.id));
    } else if (c.isEdgeLabel) {
      const r = routes.get(c.parent); if (!r) continue;
      key = 'l' + JSON.stringify([c.style, c.value, c.lx, c.lo, r.pts, editId === c.id]);
      make = () => { const g = renderEdgeLabel(c, r, { exportText: IS_SAFARI }); if (editId === c.id) g.style.visibility = 'hidden'; return g; };
    } else {
      key = 'v' + JSON.stringify([c.style, c.value, c.x, c.y, c.w, c.h, editId === c.id]);
      make = () => renderVertex(c, { noLabel: editId === c.id, exportText: IS_SAFARI });
    }
    let ent = S.cache.get(c.id);
    if (!ent || ent.key !== key) { const g = make(); if (ent) ent.g.remove(); ent = { key, g }; S.cache.set(c.id, ent); }
    const cur = content.childNodes[idx];
    if (cur !== ent.g) content.insertBefore(ent.g, cur || null);
    idx++; keep.add(c.id);
  }
  for (const [id, ent] of S.cache) if (!keep.has(id)) { ent.g.remove(); S.cache.delete(id); }
  while (content.childNodes.length > idx) content.lastChild.remove();
}

/* ---------- handles & overlay ---------- */
const H_R = 5;
function selCells() { return S.sel.map(id => cellById(id)).filter(Boolean); }
function singleSel() { const s = selCells(); return s.length === 1 ? s[0] : null; }
function isLocked(c) { return c && sb(c.style, 'locked', false); }
// Shapes that can be resized together: two or more selected, unlocked, not lines, labels or groups.
function multiResizable() { const cs = selCells(); if (cs.length < 2) return []; return topUnits(cs).filter(c => !c.e && !c.isEdgeLabel && !isGroup(c) && !isLocked(c)); }
function resizeHandles(c, out, id) {
  const z = S.zoom, r = cellRot(c), cc = cellCenter(c);
  const pos = { nw: [0, 0], n: [0.5, 0], ne: [1, 0], e: [1, 0.5], se: [1, 1], s: [0.5, 1], sw: [0, 1], w: [0, 0.5] };
  for (const k in pos) {
    if (c.w * z < 24 && k.length === 1) continue;
    const off = 9 / z, ox = (pos[k][0] - 0.5) * 2 * off, oy = (pos[k][1] - 0.5) * 2 * off;
    const p = rot({ x: c.x + pos[k][0] * c.w + ox, y: c.y + pos[k][1] * c.h + oy }, cc, r);
    out.push({ type: 'resize', dir: k, x: p.x, y: p.y, id });
  }
}
function getHandles() {
  const out = [], z = S.zoom, c = singleSel();
  if (!c) { if (!S.editPoints) for (const m of multiResizable()) resizeHandles(m, out, m.id); return out; }
  if (S.editPoints === c.id) {
    // a point too close to its neighbours to be offered at this zoom is still shown, faded
    const k = (p) => round3(p[0]) + ',' + round3(p[1]), off = new Set(offeredPoints(c).map(k));
    workingPoints(c).forEach((p, i) => { const q = constraintPoint(c, p); out.push({ type: 'cpoint', i, x: q.x, y: q.y, hid: !off.has(k(p)) }); });
    return out;
  }
  if (!c.e && !c.isEdgeLabel && !isLocked(c)) {
    const r = cellRot(c), cc = cellCenter(c);
    resizeHandles(c, out);
    const rp = rot({ x: cc.x, y: c.y - 32 / z }, cc, r);
    out.push({ type: 'rotate', x: rp.x, y: rp.y, line: rot({ x: cc.x, y: c.y - 9 / z }, cc, r) });
  }
  if (c.e && !isLocked(c)) {
    const r = S.routes.get(c.id); if (!r) return out;
    const pts = r.pts;
    out.push({ type: 'eend', which: 's', x: pts[0].x, y: pts[0].y });
    out.push({ type: 'eend', which: 't', x: pts[pts.length - 1].x, y: pts[pts.length - 1].y });
    const orth = ['elbow', 'soft', 'curved'].includes(r.kind);
    (c.pts || []).forEach((p, i) => { if (!orth) out.push({ type: 'wp', i, x: p.x, y: p.y }); });
    if (orth) {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (dist(a, b) < 16 / z) continue;
        out.push({ type: 'seg', i, x: m.x, y: m.y, horiz: Math.abs(a.y - b.y) < 0.5 });
      }
    } else {
      const all = [pts[0]].concat(c.pts || [], [pts[pts.length - 1]]);
      for (let i = 0; i < all.length - 1; i++) { const a = all[i], b = all[i + 1]; if (dist(a, b) < 20 / z) continue; out.push({ type: 'addwp', i, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }); }
    }
  }
  return out;
}
function hitHandle(w) {
  const tol = (H_R + 1.5) / S.zoom;
  const hs = getHandles();
  for (let i = hs.length - 1; i >= 0; i--) if (dist(hs[i], w) <= tol) return hs[i];
  return null;
}
// UI theme colour token, read from CSS (rulers are drawn on a canvas).
function cssVar(name, fallback) { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback; }
function pageBackground(pg) { const b = pg.modelAttrs && pg.modelAttrs.background; return b && b !== 'none' && b !== 'default' ? b : '#ffffff'; }
function renderOverlay() {
  const ov = $('#overlay'); ov.innerHTML = '';
  if (S.clean) return;
  const z = S.zoom, pg = page(), sw = 1 / z;
  // user guides
  if (pg.guidesVisible) {
    const r = vpRect(), x0 = -S.tx / z, y0 = -S.ty / z, x1 = x0 + r.width / z, y1 = y0 + r.height / z;
    pg.guides.forEach((g, i) => {
      const selG = S.selGuides.includes(i);
      const col = g.c || '#ec4899';
      const attrs = { stroke: col, 'stroke-width': (selG ? 2 : 1) * sw, 'stroke-dasharray': pg.guidesLocked ? (4 * sw) + ' ' + (3 * sw) : null };
      if (g.o === 'h') el('line', Object.assign({ x1: x0, x2: x1, y1: g.p, y2: g.p }, attrs), ov);
      else el('line', Object.assign({ y1: y0, y2: y1, x1: g.p, x2: g.p }, attrs), ov);
    });
  }
  // selection outlines
  for (const c of selCells()) {
    if (c.e) {
      const r = S.routes.get(c.id); if (!r) continue;
      el('path', { d: edgePathD(r.pts, r.kind), fill: 'none', stroke: '#2563eb', 'stroke-width': 3 * sw, opacity: 0.35 }, ov);
    } else if (c.isEdgeLabel) {
      const rr = labelRectWorld(c.id), r = S.routes.get(c.parent);
      if (rr) el('rect', { x: rr.x - 2 * sw, y: rr.y - 2 * sw, width: rr.w + 4 * sw, height: rr.h + 4 * sw, fill: 'none', stroke: '#2563eb', 'stroke-width': sw, 'stroke-dasharray': `${3 * sw} ${2 * sw}` }, ov);
      if (r) { const lp = edgeLabelPos(c, r); if (dist(lp.anchor, lp.pos) > 4) el('line', { x1: lp.anchor.x, y1: lp.anchor.y, x2: lp.pos.x, y2: lp.pos.y, stroke: '#2563eb', 'stroke-width': sw, 'stroke-dasharray': `${2 * sw} ${2 * sw}` }, ov); el('circle', { cx: lp.anchor.x, cy: lp.anchor.y, r: 2.5 * sw, fill: '#2563eb' }, ov); }
    } else {
      const o = S.sel.length === 1 && !isLocked(c) ? 9 / z : 0;
      const poly = isGroup(c) ? [P(c.x - o, c.y - o), P(c.x + c.w + o, c.y - o), P(c.x + c.w + o, c.y + c.h + o), P(c.x - o, c.y + c.h + o)] : [P(c.x - o, c.y - o), P(c.x + c.w + o, c.y - o), P(c.x + c.w + o, c.y + c.h + o), P(c.x - o, c.y + c.h + o)].map(p => rot(p, cellCenter(c), cellRot(c)));
      el('path', { d: 'M' + poly.map(p => p.x + ',' + p.y).join('L') + 'Z', fill: 'none', stroke: isLocked(c) ? '#9ca3af' : '#2563eb', 'stroke-width': sw, 'stroke-dasharray': isGroup(c) || isLocked(c) ? `${4 * sw} ${3 * sw}` : null }, ov);
    }
  }
  // handles
  for (const h of getHandles()) {
    if (h.type === 'rotate') {
      el('line', { x1: h.line.x, y1: h.line.y, x2: h.x, y2: h.y, stroke: '#2563eb', 'stroke-width': sw }, ov);
      el('circle', { cx: h.x, cy: h.y, r: H_R * sw, fill: '#fff', stroke: '#2563eb', 'stroke-width': 1.5 * sw }, ov);
      el('path', { d: `M${h.x - 2.5 * sw},${h.y - 1 * sw}A${2.5 * sw},${2.5 * sw} 0 1 1 ${h.x},${h.y + 2.5 * sw}`, fill: 'none', stroke: '#2563eb', 'stroke-width': sw }, ov);
    } else if (h.type === 'resize') el('rect', { x: h.x - H_R * sw, y: h.y - H_R * sw, width: 2 * H_R * sw, height: 2 * H_R * sw, rx: 1.5 * sw, fill: '#fff', stroke: '#2563eb', 'stroke-width': 1.5 * sw }, ov);
    else if (h.type === 'eend') el('circle', { cx: h.x, cy: h.y, r: H_R * sw, fill: '#2563eb', stroke: '#fff', 'stroke-width': 1.5 * sw }, ov);
    else if (h.type === 'wp') el('rect', { x: h.x - 4 * sw, y: h.y - 4 * sw, width: 8 * sw, height: 8 * sw, fill: '#2563eb', stroke: '#fff', 'stroke-width': sw }, ov);
    else if (h.type === 'seg') el('rect', h.horiz ? { x: h.x - 8 * sw, y: h.y - 3 * sw, width: 16 * sw, height: 6 * sw, rx: 3 * sw, fill: '#fff', stroke: '#2563eb', 'stroke-width': 1.5 * sw } : { x: h.x - 3 * sw, y: h.y - 8 * sw, width: 6 * sw, height: 16 * sw, rx: 3 * sw, fill: '#fff', stroke: '#2563eb', 'stroke-width': 1.5 * sw }, ov);
    else if (h.type === 'addwp') el('circle', { cx: h.x, cy: h.y, r: 3.5 * sw, fill: '#fff', stroke: '#2563eb', 'stroke-width': 1.2 * sw, opacity: 0.85 }, ov);
    else if (h.type === 'cpoint') {
      const on = S.selPoint === h.i;
      el('circle', { cx: h.x, cy: h.y, r: (on ? 6 : 5) * sw, fill: on ? '#f59e0b' : '#fff', stroke: on ? '#b45309' : '#2563eb', 'stroke-width': 1.5 * sw, opacity: h.hid && !on ? 0.4 : null, 'stroke-dasharray': h.hid && !on ? `${2 * sw} ${2 * sw}` : null }, ov);
    }
  }
  // connection points of hovered shape
  const hv = S.hover && cellById(S.hover);
  if (hv && isConnectable(hv) && S.editPoints !== hv.id && !(S.drag && ['move', 'resize', 'mresize', 'rotate', 'marquee', 'pan'].includes(S.drag.type))) {
    offeredPoints(hv).forEach((p, i) => {
      const q = constraintPoint(hv, p), active = S.hoverPoint && S.hoverPoint.id === hv.id && S.hoverPoint.i === i;
      const s = (active ? 5 : 3.5) * sw;
      el('path', { d: `M${q.x - s},${q.y - s}L${q.x + s},${q.y + s}M${q.x - s},${q.y + s}L${q.x + s},${q.y - s}`, stroke: active ? '#16a34a' : '#2563eb', 'stroke-width': (active ? 2.2 : 1.5) * sw }, ov);
    });
    if (S.drag && (S.drag.type === 'eend' || S.drag.type === 'newedge') && !S.hoverPoint) {
      const poly = outlineWorld(hv);
      el('path', { d: 'M' + poly.map(p => p.x + ',' + p.y).join('L') + 'Z', fill: 'none', stroke: '#16a34a', 'stroke-width': 2 * sw, opacity: 0.6 }, ov);
    }
  }
  // smart guides
  for (const l of S.smart) {
    if (l.kind === 'gap') el('path', { d: `M${l.x1},${l.y1}L${l.x2},${l.y2}`, stroke: '#ef4444', 'stroke-width': sw, 'marker-start': null }, ov);
    else el('line', { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, stroke: l.guide ? '#ec4899' : '#ef4444', 'stroke-width': sw, 'stroke-dasharray': `${3 * sw} ${2 * sw}` }, ov);
  }
  if (S.marquee) { const m = S.marquee; el('rect', { x: m.x, y: m.y, width: m.w, height: m.h, fill: 'rgba(37,99,235,.08)', stroke: '#2563eb', 'stroke-width': sw }, ov); }
}
function labelRectWorld(id) {
  const ent = S.cache.get(id); if (!ent) return null;
  const sp = ent.g.querySelector('.elbl');
  if (!sp) { try { const bb = ent.g.getBBox(); return bb.width || bb.height ? { x: bb.x, y: bb.y, w: bb.width, h: bb.height } : null; } catch (e) { return null; } }
  const r = sp.getBoundingClientRect(), v = vpRect();
  if (!r.width && !r.height) return null;
  return { x: (r.left - v.left - S.tx) / S.zoom, y: (r.top - v.top - S.ty) / S.zoom, w: r.width / S.zoom, h: r.height / S.zoom };
}

/* ---------- rulers ---------- */
function renderRulers() {
  if (!page().rulers || S.clean) return;
  const top = $('#rulerTop'), left = $('#rulerLeft'), dpr = window.devicePixelRatio || 1;
  const z = S.zoom, sel = selCells();
  let sb_ = null; for (const c of sel) sb_ = unionBox(sb_, c.e ? (S.routes.get(c.id) ? bboxOf(S.routes.get(c.id).pts) : null) : worldBox(c));
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  const major = steps.find(s => s * z >= 60) || 5000;
  const minor = major / (String(major)[0] === '2' ? 4 : 5);
  for (const [cv, horiz] of [[top, true], [left, false]]) {
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    g.fillStyle = cssVar('--rulerBg', '#fafafa'); g.fillRect(0, 0, W, H);
    const len = horiz ? W : H, off = horiz ? S.tx : S.ty;
    if (sb_) { g.fillStyle = cssVar('--accentSoft', '#dbeafe'); const a = (horiz ? sb_.x : sb_.y) * z + off, b = (horiz ? sb_.x + sb_.w : sb_.y + sb_.h) * z + off; horiz ? g.fillRect(a, 0, b - a, H) : g.fillRect(0, a, W, b - a); }
    g.strokeStyle = cssVar('--rulerMark', '#9ca3af'); g.fillStyle = cssVar('--rulerText', '#6b7280'); g.font = '9px sans-serif'; g.lineWidth = 1;
    const w0 = -off / z, w1 = (len - off) / z;
    g.beginPath();
    for (let v = Math.floor(w0 / minor) * minor; v <= w1; v += minor) {
      const s = Math.round(v * z + off) + 0.5, isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6;
      const L = isMaj ? 12 : 5;
      if (horiz) { g.moveTo(s, 20); g.lineTo(s, 20 - L); } else { g.moveTo(20, s); g.lineTo(20 - L, s); }
      if (isMaj) {
        const t = String(Math.round(v));
        if (horiz) g.fillText(t, s + 2, 9);
        else { g.save(); g.translate(9, s + 2); g.rotate(-Math.PI / 2); g.fillText(t, -g.measureText(t).width - 2, 0); g.restore(); }
      }
    }
    g.stroke();
    g.fillStyle = cssVar('--rulerLine', '#d1d5db'); horiz ? g.fillRect(0, H - 1, W, 1) : g.fillRect(W - 1, 0, 1, H);
  }
}

/* ---------- hit testing ---------- */
function hitCell(w, opts) {
  opts = opts || {};
  const pg = page(), tol = 6 / S.zoom;
  for (let i = pg.cells.length - 1; i >= 0; i--) {
    const c = pg.cells[i];
    if (isGroup(c) || (opts.exclude && opts.exclude.has(c.id))) continue;
    if (isHiddenByLayer(pg, c, S.map)) continue;
    if (c.isEdgeLabel) {
      if (opts.vertexOnly) continue;
      const r = labelRectWorld(c.id);
      if (r && w.x >= r.x - 2 && w.x <= r.x + r.w + 2 && w.y >= r.y - 2 && w.y <= r.y + r.h + 2) return c;
    } else if (c.e) {
      if (opts.vertexOnly) continue;
      const r = S.routes.get(c.id); if (!r) continue;
      const n = nearestOnPoly(routePolyline(r), w, false);
      if (n && n.d <= tol) return c;
    } else {
      const cc = cellCenter(c), lw = rot(w, cc, -cellRot(c));
      const k = shapeKind(c);
      const lb = labelHtml(c) ? labelBox(c) : null;
      const inBox = (b) => lw.x >= b.x && lw.x <= b.x + b.w && lw.y >= b.y && lw.y <= b.y + b.h;
      if (k === 'text') { if (inBox(c)) return c; continue; }
      const poly = outlineLocal(c);
      const fill = sv(c.style, 'fillColor', '#ffffff');
      if (fill === 'none') {
        const n = nearestOnPoly(poly, lw, true);
        if (n.d <= tol) return c;
        if (lb && inBox({ x: lb.x, y: lb.y, w: lb.w, h: Math.min(lb.h, 30) })) return c;
      } else {
        if (k === 'ellipse' || POLY_KINDS.has(k)) { if (pointInPoly(lw, poly) || nearestOnPoly(poly, lw, true).d <= tol / 2) return c; }
        else if (inBox({ x: c.x - tol / 2, y: c.y - tol / 2, w: c.w + tol, h: c.h + tol })) return c;
      }
      if (lb && (sv(c.style, 'labelPosition', 'center') !== 'center' || sv(c.style, 'verticalLabelPosition', 'middle') !== 'middle')) {
        const ent = S.cache.get(c.id), inner = ent && ent.g.querySelector('.lbl');
        if (inner) {
          const rr = inner.getBoundingClientRect(), v = vpRect();
          const sx = (rr.left - v.left - S.tx) / S.zoom, sy = (rr.top - v.top - S.ty) / S.zoom;
          if (!cellRot(c) && w.x >= sx && w.x <= sx + rr.width / S.zoom && w.y >= sy && w.y <= sy + rr.height / S.zoom) return c;
        }
      }
    }
  }
  return null;
}
function hitGuide(w) {
  const pg = page(); if (!pg.guidesVisible || !pg.rulers && false) return -1;
  const tol = 4 / S.zoom;
  for (let i = pg.guides.length - 1; i >= 0; i--) { const g = pg.guides[i]; if (Math.abs((g.o === 'h' ? w.y : w.x) - g.p) <= tol) return i; }
  return -1;
}
/* Connection points offered to the user scale with the shape's size on screen:
   small shapes offer fewer points (tiny ones none), large shapes offer more. Shapes whose
   points were customised keep exactly their own points (thinned only when too crowded). */
const POINT_SPACING = 40, POINT_MIN_GAP = 14, POINT_MIN_SHAPE = 12;
function samePointSet(a, b) { if (a.length !== b.length) return false; const k = (p) => round3(p[0]) + ',' + round3(p[1]); const sa = new Set(a.map(k)); return b.every(p => sa.has(k(p))); }
function densityPoints(c) {
  const z = S.zoom, k = shapeKind(c), out = [];
  const count = (len) => { let n = Math.max(1, Math.round(len / POINT_SPACING)); if (n % 2 === 0) n -= 1; return Math.min(n, 9); };
  const along = (a, b, len) => { const n = count(len); for (let i = 1; i <= n; i++) { const t = i / (n + 1); out.push([round3(a[0] + (b[0] - a[0]) * t), round3(a[1] + (b[1] - a[1]) * t)]); } };
  if (k === 'ellipse' || k === 'cloud') {
    let n = Math.round(Math.PI * (c.w + c.h) / 2 * z / POINT_SPACING / 4) * 4; n = clamp(n, 4, 32);
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; out.push([round3(0.5 + 0.5 * Math.cos(a)), round3(0.5 + 0.5 * Math.sin(a))]); }
    return out;
  }
  if (EDGE_POINT_KINDS.has(k) || k === 'rhombus' || k === 'parallelogram') {
    const poly = outlineLocal(c).map(p => [(p.x - c.x) / Math.max(1, c.w), (p.y - c.y) / Math.max(1, c.h)]);
    for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; out.push(a.map(round3)); along(a, b, Math.hypot((b[0] - a[0]) * c.w, (b[1] - a[1]) * c.h) * z); }
    return out;
  }
  const ty = k === 'folder' ? round3(clamp(sn(c.style, 'tabHeight', 24) / Math.max(1, c.h), 0, 0.9)) : 0;
  along([0, ty], [1, ty], c.w * z); along([1, ty], [1, 1], c.h * (1 - ty) * z); along([0, 1], [1, 1], c.w * z); along([0, ty], [0, 1], c.h * (1 - ty) * z);
  return out;
}
/* The points Edit points works on. They are the same points a line can attach to: a shape's own points once they have
   been changed, otherwise the points worked out from its size on screen. Editing so starts from exactly what is
   offered, and the first change stores that set with the change made (BUG-002). */
function workingPoints(c) { const stored = getPoints(c); return samePointSet(stored, defaultPoints(c)) ? densityPoints(c) : stored; }
function offeredPoints(c) {
  const z = S.zoom;
  if (Math.min(c.w, c.h) * z < POINT_MIN_SHAPE) return [];
  const cand = workingPoints(c);
  // priority: side middles and corners first, so they survive thinning on small shapes
  const pri = (p) => (Math.abs(p[0] - 0.5) < 0.01 || Math.abs(p[1] - 0.5) < 0.01) ? 0 : ((p[0] === 0 || p[0] === 1) && (p[1] === 0 || p[1] === 1) ? 1 : 2);
  const order = cand.map((p, i) => ({ p, i })).sort((a, b) => pri(a.p) - pri(b.p) || a.i - b.i);
  const kept = [];
  for (const o of order) { const q = constraintPoint(c, o.p); if (kept.every(k => dist(k.q, q) * z >= POINT_MIN_GAP)) kept.push({ p: o.p, q, i: o.i }); }
  return kept.sort((a, b) => a.i - b.i).map(k => k.p);
}
function hoverPointAt(c, w) {
  if (!isConnectable(c)) return null;
  // inside the shape the catch area is small, so the body can still be grabbed and moved
  const inside = pointInPoly(rot(w, cellCenter(c), -cellRot(c)), outlineLocal(c));
  const tol = (inside ? 5 : 10) / S.zoom; let best = null;
  offeredPoints(c).forEach((p, i) => { const q = constraintPoint(c, p), d = dist(q, w); if (d <= tol && (!best || d < best.d)) best = { id: c.id, i, rel: p, d, pt: q }; });
  return best;
}
function selectionUnit(c) {
  // the outermost group containing c (or c itself)
  const anc = ancestors(c).filter(isGroup);
  if (!anc.length) return c;
  const single = S.sel.length === 1 ? S.sel[0] : null;
  const chain = anc.concat([c]);
  if (single) { const k = chain.findIndex(x => x.id === single); if (k >= 0 && k < chain.length - 1) return chain[k + 1]; if (k === chain.length - 1) return c; }
  for (const x of chain) if (S.sel.includes(x.id)) return x;
  return chain[0];
}
function setSelAuto(ids) { setSel(ids); S.selAuto = ids.length > 1; buildFormat(); }   // a selection with no first click: by drag box or Select all
function setSel(ids) { S.selAuto = false; S.sel = ids.slice(); S.selPoint = null; if (S.editPoints && !S.sel.includes(S.editPoints)) S.editPoints = null; if (ids.length) S.selGuides = []; buildFormat(); requestRender(); }

/* ---------- snapping ---------- */
function snapVal(v, gs) { return Math.round(v / gs) * gs; }
function snapPoint(p, alt) {
  const pg = page(); if (alt) return p;
  let x = p.x, y = p.y; const th = 6 / S.zoom;
  let gx = false, gy = false;
  if (pg.guidesVisible) for (const g of pg.guides) { if (g.o === 'v' && Math.abs(g.p - x) < th) { x = g.p; gx = true; } if (g.o === 'h' && Math.abs(g.p - y) < th) { y = g.p; gy = true; } }
  if (pg.grid) { if (!gx) x = snapVal(x, pg.gridSize); if (!gy) y = snapVal(y, pg.gridSize); }
  return { x, y };
}
function snapBox(box, exclude, alt) {
  const pg = page(), th = 6 / S.zoom, lines = [];
  let dx = 0, dy = 0;
  if (alt) return { dx, dy, lines };
  const xs = [], ys = [];
  if (pg.smartGuides) for (const c of pg.cells) {
    if (c.e || c.isEdgeLabel || exclude.has(c.id) || c.parent !== page().layers[0].id && !page().layers.some(l => l.id === c.parent)) continue;
    const b = isGroup(c) ? c : worldBox(c);
    const r = vpRect(); const vis = { x: -S.tx / S.zoom, y: -S.ty / S.zoom, w: r.width / S.zoom, h: r.height / S.zoom };
    if (!boxIntersects(b, vis)) continue;
    xs.push({ v: b.x, b }, { v: b.x + b.w / 2, b }, { v: b.x + b.w, b });
    ys.push({ v: b.y, b }, { v: b.y + b.h / 2, b }, { v: b.y + b.h, b });
  }
  if (pg.guidesVisible) for (const g of pg.guides) (g.o === 'v' ? xs : ys).push({ v: g.p, guide: true });
  const mx = [box.x, box.x + box.w / 2, box.x + box.w], my = [box.y, box.y + box.h / 2, box.y + box.h];
  let bx = null, by = null;
  for (const c of xs) for (const m of mx) { const d = c.v - m; if (Math.abs(d) < th && (!bx || Math.abs(d) < Math.abs(bx.d) - 0.01 || (Math.abs(Math.abs(d) - Math.abs(bx.d)) < 0.01 && c.guide))) bx = { d, c }; }
  for (const c of ys) for (const m of my) { const d = c.v - m; if (Math.abs(d) < th && (!by || Math.abs(d) < Math.abs(by.d) - 0.01 || (Math.abs(Math.abs(d) - Math.abs(by.d)) < 0.01 && c.guide))) by = { d, c }; }
  if (bx) dx = bx.d; else if (pg.grid) dx = snapVal(box.x, pg.gridSize) - box.x;
  if (by) dy = by.d; else if (pg.grid) dy = snapVal(box.y, pg.gridSize) - box.y;
  const nb = { x: box.x + dx, y: box.y + dy, w: box.w, h: box.h };
  if (bx) for (const c of xs) if (Math.abs(c.v - (nb.x)) < 0.5 || Math.abs(c.v - (nb.x + nb.w / 2)) < 0.5 || Math.abs(c.v - (nb.x + nb.w)) < 0.5) {
    if (c.guide) continue;
    lines.push({ x1: c.v, x2: c.v, y1: Math.min(nb.y, c.b.y) - 6, y2: Math.max(nb.y + nb.h, c.b.y + c.b.h) + 6 });
  }
  if (by) for (const c of ys) if (Math.abs(c.v - nb.y) < 0.5 || Math.abs(c.v - (nb.y + nb.h / 2)) < 0.5 || Math.abs(c.v - (nb.y + nb.h)) < 0.5) {
    if (c.guide) continue;
    lines.push({ y1: c.v, y2: c.v, x1: Math.min(nb.x, c.b.x) - 6, x2: Math.max(nb.x + nb.w, c.b.x + c.b.w) + 6 });
  }
  // equal spacing (horizontal and vertical neighbours)
  if (pg.smartGuides) {
    const others = xs.filter((c, i) => i % 3 === 0 && c.b).map(c => c.b);
    const eq = (axis) => {
      const H = axis === 'x';
      const pos = H ? nb.x : nb.y, size = H ? nb.w : nb.h;
      const ov = (b) => H ? (b.y < nb.y + nb.h && nb.y < b.y + b.h) : (b.x < nb.x + nb.w && nb.x < b.x + b.w);
      let L = null, R = null;
      for (const b of others) {
        if (!ov(b)) continue;
        const e1 = H ? b.x + b.w : b.y + b.h, s1 = H ? b.x : b.y;
        if (e1 <= pos + 0.5 && (!L || e1 > (H ? L.x + L.w : L.y + L.h))) L = b;
        if (s1 >= pos + size - 0.5 && (!R || s1 < (H ? R.x : R.y))) R = b;
      }
      if (!L || !R) return;
      const gl = pos - (H ? L.x + L.w : L.y + L.h), gr = (H ? R.x : R.y) - (pos + size);
      if (Math.abs(gl - gr) < th * 2 && Math.abs(gl - gr) > 0.01 && !(H ? bx : by)) {
        const adj = (gr - gl) / 2;
        if (H) { dx += adj; nb.x += adj; } else { dy += adj; nb.y += adj; }
      }
      const gl2 = (H ? nb.x : nb.y) - (H ? L.x + L.w : L.y + L.h), gr2 = (H ? R.x : R.y) - ((H ? nb.x : nb.y) + size);
      if (Math.abs(gl2 - gr2) < 0.6) {
        const mid = H ? nb.y + nb.h / 2 : nb.x + nb.w / 2;
        if (H) { lines.push({ kind: 'gap', x1: L.x + L.w, x2: nb.x, y1: mid, y2: mid }); lines.push({ kind: 'gap', x1: nb.x + nb.w, x2: R.x, y1: mid, y2: mid }); }
        else { lines.push({ kind: 'gap', y1: L.y + L.h, y2: nb.y, x1: mid, x2: mid }); lines.push({ kind: 'gap', y1: nb.y + nb.h, y2: R.y, x1: mid, x2: mid }); }
      }
    };
    eq('x'); eq('y');
  }
  return { dx, dy, lines };
}

/* ---------- moving / transforms ---------- */
function topUnits(cells) {
  const ids = new Set(cells.map(c => c.id));
  return cells.filter(c => !ancestors(c).some(a => ids.has(a.id)));
}
/* ---------- containers: drop a shape on one and it moves with it; drag it off and it is free again ---------- */
function isContainerShape(c) { if (!c || c.e || c.isEdgeLabel || isGroup(c)) return false; const st = c.style; return st.deCont === '1' || st.container === '1' || st.swimlane !== undefined || shapeKind(c) === 'folder'; }
function layerOf(c) { let p = c; for (let g = 0; p && g < 60; g++) { const q = cellById(p.parent); if (!q) return p.parent || page().layers[0].id; p = q; } return page().layers[0].id; }
// After shapes are moved (or dropped from the palette): put each one in the frontmost container under its centre, or take it out.
function reparentToContainers(units) {
  const pg = page(), moving = movedSet(units);
  for (const u of units) {
    if (u.e || u.isEdgeLabel || isLocked(u)) continue;
    const cur = cellById(u.parent);
    if (cur && isGroup(cur)) continue; // members of a group stay in their group
    const ctr = cellCenter(worldBox(u));
    let target = null;
    for (const c of pg.cells) {
      if (moving.has(c.id) || !isContainerShape(c) || isHiddenByLayer(pg, c, S.map)) continue;
      const b = worldBox(c);
      if (ctr.x >= b.x && ctr.x <= b.x + b.w && ctr.y >= b.y && ctr.y <= b.y + b.h) target = c; // later in the list = in front
    }
    const newParent = target ? target.id : (cur && isContainerShape(cur) ? layerOf(cur) : u.parent);
    if (newParent === u.parent) continue;
    u.parent = newParent;
    if (target) { // draw the shape (and anything inside it) in front of its new container
      const set = movedSet([u]); for (const c of pg.cells) if (c.isEdgeLabel && set.has(c.parent)) set.add(c.id);
      const block = pg.cells.filter(c => set.has(c.id)), rest = pg.cells.filter(c => !set.has(c.id));
      const inside = new Set([target.id, ...descendants(target.id).map(c => c.id)]);
      let at = 0; rest.forEach((c, i) => { if (inside.has(c.id)) at = i + 1; });
      if (pg.cells.indexOf(u) < pg.cells.indexOf(target)) { rest.splice(at, 0, ...block); pg.cells = rest; }
    }
  }
}
function movedSet(units) {
  const s = new Set();
  for (const u of units) { s.add(u.id); for (const d of descendants(u.id)) s.add(d.id); }
  return s;
}
function translateCells(units, dx, dy, origin) {
  const pg = page(), ms = movedSet(units);
  for (const c of pg.cells) {
    if (!ms.has(c.id)) continue;
    const o = origin ? origin.get(c.id) : null;
    if (c.e) {
      if (o) { c.pts = o.pts.map(p => ({ x: p.x + dx, y: p.y + dy })); if (o.sp) c.sp = { x: o.sp.x + dx, y: o.sp.y + dy }; if (o.tp) c.tp = { x: o.tp.x + dx, y: o.tp.y + dy }; }
      else { c.pts = (c.pts || []).map(p => ({ x: p.x + dx, y: p.y + dy })); if (c.sp) c.sp = { x: c.sp.x + dx, y: c.sp.y + dy }; if (c.tp) c.tp = { x: c.tp.x + dx, y: c.tp.y + dy }; }
    } else if (!c.isEdgeLabel) {
      if (o) { c.x = o.x + dx; c.y = o.y + dy; } else { c.x += dx; c.y += dy; }
    }
  }
  // edges with both ends inside the moved set follow
  for (const e of pg.cells) {
    if (!e.e || ms.has(e.id)) continue;
    const sIn = e.source && ms.has(e.source), tIn = e.target && ms.has(e.target);
    if (sIn && tIn) {
      const o = origin ? origin.get(e.id) : null;
      if (o) e.pts = o.pts.map(p => ({ x: p.x + dx, y: p.y + dy })); else e.pts = (e.pts || []).map(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  }
}
function captureOrigin(units) {
  const m = new Map(), pg = page(), ms = movedSet(units);
  for (const c of pg.cells) {
    if (ms.has(c.id) || (c.e && c.source && c.target && ms.has(c.source) && ms.has(c.target)))
      m.set(c.id, { x: c.x, y: c.y, w: c.w, h: c.h, rotation: cellRot(c), pts: (c.pts || []).map(p => ({ x: p.x, y: p.y })), sp: c.sp ? { x: c.sp.x, y: c.sp.y } : null, tp: c.tp ? { x: c.tp.x, y: c.tp.y } : null });
  }
  return m;
}
function unitBox(units) { let b = null; for (const u of units) b = unionBox(b, isGroup(u) ? { x: u.x, y: u.y, w: u.w, h: u.h } : (u.e ? (S.routes.get(u.id) ? bboxOf(S.routes.get(u.id).pts) : null) : worldBox(u))); return b; }

/* ---------- pointer interactions ---------- */
let lastDown = { t: 0, x: 0, y: 0 };
function onPointerDown(ev) {
  const svg = $('#svg');
  // right button: hold and drag pans the canvas; a click without dragging opens the context menu on release
  if (ev.button === 2) { if (S.editing) finishEdit(); S.drag = { type: 'pan', right: true, moved: false, sx: ev.clientX, sy: ev.clientY, tx: S.tx, ty: S.ty }; svg.setPointerCapture(ev.pointerId); return; }
  const w = toWorld(ev);
  const now = performance.now();
  if (ev.button === 0 && now - lastDown.t < 450 && Math.hypot(ev.clientX - lastDown.x, ev.clientY - lastDown.y) < 6) {
    lastDown = { t: 0, x: 0, y: 0 }; S.dblAt = now;
    if (S.editing) finishEdit();
    S.drag = null; ev.preventDefault();
    return onDblClick(ev);
  }
  lastDown = { t: now, x: ev.clientX, y: ev.clientY };
  if (S.editing) { finishEdit(); }
  closeMenus();
  if (ev.button === 1 || S.space) { S.drag = { type: 'pan', sx: ev.clientX, sy: ev.clientY, tx: S.tx, ty: S.ty }; svg.classList.add('panning'); svg.setPointerCapture(ev.pointerId); return; }
  const pre = snapshot();
  const h = hitHandle(w);
  svg.setPointerCapture(ev.pointerId);
  if (h) return startHandleDrag(h, w, ev, pre);
  // new line from a hovered connection point
  if (S.hoverPoint && S.editPoints !== S.hoverPoint.id) {
    const c = cellById(S.hoverPoint.id);
    if (c) {
      const e = makeEdge(S.doc.mode); e.source = c.id; e.style.exitX = String(S.hoverPoint.rel[0]); e.style.exitY = String(S.hoverPoint.rel[1]); e.style.exitDx = '0'; e.style.exitDy = '0';
      e.tp = { x: w.x, y: w.y };
      page().cells.push(e); refreshMap();
      S.drag = { type: 'newedge', id: e.id, pre, start: w, moved: false };
      setSel([e.id]); return;
    }
  }
  // connection-point editing: click on outline adds a point
  if (S.editPoints) {
    const c = cellById(S.editPoints);
    if (c) {
      const lw = rot(w, cellCenter(c), -cellRot(c)), n = nearestOnPoly(outlineLocal(c), lw, true);
      if (n.d <= 8 / S.zoom) {
        mutate(() => { const pts = workingPoints(c); pts.push([round3((n.pt.x - c.x) / c.w), round3((n.pt.y - c.y) / c.h)]); setPoints(c, pts); S.selPoint = pts.length - 1; });
        S.drag = null; return;
      }
    }
  }
  const gi = hitGuide(w);
  const hit = hitCell(w);
  // checklist: a click on a check box ticks or unticks it (the rest of the box selects and moves as usual)
  if (ev.button === 0 && hit && !ev.shiftKey && !ev.altKey && sb(hit.style, 'deChecklist', false)) {
    const n = checkAt(hit, w);
    if (n >= 0) { mutate(() => { hit.value = toggleCheck(hit.value, n); }); S.drag = null; return; }
  }
  if (gi >= 0 && (!hit || page().guides[gi] && Math.abs((page().guides[gi].o === 'h' ? w.y : w.x) - page().guides[gi].p) < 3 / S.zoom)) {
    if (!page().guidesLocked) {
      if (ev.shiftKey) { S.selGuides = S.selGuides.includes(gi) ? S.selGuides.filter(i => i !== gi) : S.selGuides.concat([gi]); }
      else if (!S.selGuides.includes(gi)) S.selGuides = [gi];
      S.sel = []; buildFormat();
      S.drag = { type: 'guide', pre, start: w, orig: S.selGuides.map(i => ({ i, p: page().guides[i].p })) };
      requestRender(); return;
    }
  }
  S.selGuides = [];
  if (S.painter && ev.button === 0) { if (hit) paintAt(hit.isEdgeLabel ? hit : selectionUnit(hit)); else paintEnd(); S.drag = null; return; }   // the style painter: the shape clicked takes the style
  if (hit) {
    let unit = hit.isEdgeLabel ? hit : selectionUnit(hit);
    if (ev.shiftKey || ev.metaKey || ev.ctrlKey) {
      if (S.sel.includes(unit.id)) setSel(S.sel.filter(id => id !== unit.id)); else setSel(S.sel.concat([unit.id]));
    } else if (!S.sel.includes(unit.id)) setSel([unit.id]);
    else if (S.sel.length === 1 && S.sel[0] !== unit.id) setSel([unit.id]);
    if (hit.isEdgeLabel && S.sel.includes(hit.id)) {
      const r = S.routes.get(hit.parent), lp = r ? edgeLabelPos(hit, r) : null;
      S.drag = { type: 'label', id: hit.id, pre, start: w, grab: lp ? { x: w.x - lp.pos.x, y: w.y - lp.pos.y } : { x: 0, y: 0 } };
      return;
    }
    const units = topUnits(selCells()).filter(c => !c.isEdgeLabel);
    const movable = units.filter(u => !isLocked(u) && !(u.e && ((u.source && cellById(u.source)) || (u.target && cellById(u.target))) && !units.some(o => o.id === u.source || o.id === u.target)));
    if (movable.length) S.drag = { type: 'move', units: movable, pre, start: w, origin: captureOrigin(movable), box: unitBox(movable), moved: false };
    else S.drag = { type: 'none', pre };
    return;
  }
  // empty canvas
  if (!ev.shiftKey) { setSel([]); S.editPoints = null; }
  S.drag = { type: 'marquee', start: w, add: ev.shiftKey ? S.sel.slice() : [] };
  requestRender();
}
function startHandleDrag(h, w, ev, pre) {
  if (h.type === 'resize' && h.id) { const ms = multiResizable(); S.drag = { type: 'mresize', lead: h.id, dir: h.dir, pre, start: w, items: ms.map(m => ({ id: m.id, o: { x: m.x, y: m.y, w: m.w, h: m.h } })) }; return; }
  const c = singleSel();
  if (h.type === 'resize') S.drag = { type: 'resize', id: c.id, dir: h.dir, pre, start: w, o: { x: c.x, y: c.y, w: c.w, h: c.h }, origin: captureOrigin([c]) };
  else if (h.type === 'rotate') S.drag = { type: 'rotate', id: c.id, pre, start: w, r0: cellRot(c), a0: Math.atan2(w.y - cellCenter(c).y, w.x - cellCenter(c).x), origin: captureOrigin([c]), center: cellCenter(c) };
  else if (h.type === 'eend') S.drag = { type: 'eend', id: c.id, which: h.which, pre, start: w };
  else if (h.type === 'wp') S.drag = { type: 'wp', id: c.id, i: h.i, pre, start: w };
  else if (h.type === 'seg') {
    const r = S.routes.get(c.id);
    S.drag = { type: 'seg', id: c.id, i: h.i, horiz: h.horiz, split: ev.shiftKey, pre, start: w, base: r.pts.map(p => ({ x: p.x, y: p.y })) };
  } else if (h.type === 'addwp') {
    S.drag = { type: 'addwp', id: c.id, h, pre, start: w };
  } else if (h.type === 'cpoint') { S.selPoint = h.i; S.drag = { type: 'cpoint', id: c.id, i: h.i, pre, start: w, old: workingPoints(c)[h.i].slice() }; requestRender(); }
}
function onPointerMove(ev) {
  const w = toWorld(ev);
  const d = S.drag;
  updateStatus(w);
  if (!d) {
    // hover feedback
    const c = hitCell(w, { vertexOnly: false });
    const hv = c && !c.e && !c.isEdgeLabel ? c : null;
    let hp = hv ? hoverPointAt(hv, w) : null;
    // stay "hovered" near the shape for points slightly outside
    let near = hv;
    if (!near && S.hover) { const pc = cellById(S.hover); if (pc && isConnectable(pc)) { hp = hoverPointAt(pc, w); if (hp) near = pc; } }
    const changed = (S.hover !== (near ? near.id : null)) || JSON.stringify(S.hoverPoint && [S.hoverPoint.id, S.hoverPoint.i]) !== JSON.stringify(hp && [hp.id, hp.i]);
    S.hover = near ? near.id : null; S.hoverPoint = S.clean || (hp && S.editPoints === hp.id) ? null : hp; // the shape being edited shows its edit handles instead
    const hh = hitHandle(w);
    $('#svg').style.cursor = hh ? handleCursor(hh) : (S.hoverPoint ? 'crosshair' : (c ? 'move' : (hitGuide(w) >= 0 && !page().guidesLocked ? (page().guides[hitGuide(w)].o === 'h' ? 'ns-resize' : 'ew-resize') : 'default')));
    if (changed) requestRender();
    return;
  }
  const alt = ev.altKey;
  if (d.type === 'pan') {
    if (d.right && !d.moved) { if (Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) < 4) return; d.moved = true; $('#svg').classList.add('panning'); }
    S.tx = d.tx + ev.clientX - d.sx; S.ty = d.ty + ev.clientY - d.sy; requestRender(); positionEditor(); return;
  }
  if (d.type === 'marquee') {
    S.marquee = { x: Math.min(d.start.x, w.x), y: Math.min(d.start.y, w.y), w: Math.abs(w.x - d.start.x), h: Math.abs(w.y - d.start.y) };
    requestRender(); return;
  }
  if (d.type === 'move') {
    let dx = w.x - d.start.x, dy = w.y - d.start.y;
    if (!d.moved && Math.hypot(dx, dy) * S.zoom < 3) return;
    d.moved = true;
    if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    if (d.box) {
      const nb = { x: d.box.x + dx, y: d.box.y + dy, w: d.box.w, h: d.box.h };
      const sn_ = snapBox(nb, movedSet(d.units), alt);
      dx += sn_.dx; dy += sn_.dy; S.smart = sn_.lines;
    }
    translateCells(d.units, dx, dy, d.origin); updateGroups(page());
    requestRender(); return;
  }
  if (d.type === 'resize') { doResize(d, w, ev); return; }
  if (d.type === 'mresize') { doMultiResize(d, w, ev); return; }
  if (d.type === 'rotate') {
    const c = cellById(d.id); let a = (Math.atan2(w.y - d.center.y, w.x - d.center.x) - d.a0) * 180 / Math.PI;
    let r = d.r0 + a; if (!alt) r = Math.round(r / 15) * 15; r = ((r % 360) + 360) % 360;
    if (isGroup(c)) rotateGroup(c, d, r - d.r0); else setStyle(c.style, 'rotation', r ? round2(r) : null);
    updateGroups(page()); requestRender(); setStatus('Rotation ' + Math.round(r) + '°'); return;
  }
  if (d.type === 'eend' || d.type === 'newedge') {
    const e = cellById(d.id); const which = d.type === 'newedge' ? 't' : d.which;
    if (d.type === 'newedge' && dist(w, d.start) * S.zoom > 4) d.moved = true;
    const excl = new Set([e.id]);
    let tgt = hitCell(w, { vertexOnly: true, exclude: excl });
    if (tgt && !isConnectable(tgt)) tgt = null;
    let hp = tgt ? hoverPointAt(tgt, w) : null;
    if (!tgt && S.hover) { const pc = cellById(S.hover); if (pc) { hp = hoverPointAt(pc, w); if (hp) tgt = pc; } }
    S.hover = tgt ? tgt.id : null; S.hoverPoint = hp;
    connectEnd(e, which, tgt, hp, snapPoint(w, alt || true));
    requestRender(); return;
  }
  if (d.type === 'addwp') {
    if (dist(w, d.start) * S.zoom < 4) return;
    const c = cellById(d.id), h = d.h;
    if (h.i === 'orth') { c.pts = [{ x: h.x, y: h.y }]; S.drag = { type: 'wp', id: c.id, i: 0, pre: d.pre, start: d.start }; }
    else { c.pts = (c.pts || []).slice(); c.pts.splice(h.i, 0, { x: h.x, y: h.y }); S.drag = { type: 'wp', id: c.id, i: h.i, pre: d.pre, start: d.start }; }
    return onPointerMove(ev);
  }
  if (d.type === 'wp') { const e = cellById(d.id); e.pts[d.i] = snapPoint(w, alt); requestRender(); return; }
  if (d.type === 'seg') {
    if (!d.moved && dist(w, d.start) * S.zoom < 3) return;
    d.moved = true;
    const e = cellById(d.id), R = d.base.map(q => ({ x: q.x, y: q.y })), n = R.length, j = d.i, STUB = 20;
    const a = R[j], b = R[j + 1], L = dist(a, b) || 1, u = { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
    const p = snapPoint(w, alt), coord = d.horiz ? p.y : p.x;
    const mv = (q) => d.horiz ? { x: q.x, y: coord } : { x: coord, y: q.y };
    let out;
    if (d.split) { // Shift: put a bend in the middle third of the segment
      const m1 = { x: a.x + u.x * L / 3, y: a.y + u.y * L / 3 }, m2 = { x: a.x + u.x * 2 * L / 3, y: a.y + u.y * 2 * L / 3 };
      out = R.slice(0, j + 1).concat([m1, mv(m1), mv(m2), m2], R.slice(j + 1));
    } else {
      const first = j === 0, last = j === n - 2;
      const head = R.slice(0, first ? 1 : j), tail = R.slice(last ? n - 1 : j + 2), mids = [];
      if (first) { const A = { x: a.x + u.x * Math.min(STUB, L / 3), y: a.y + u.y * Math.min(STUB, L / 3) }; mids.push(A, mv(A)); } else mids.push(mv(a));
      if (last) { const B = { x: b.x - u.x * Math.min(STUB, L / 3), y: b.y - u.y * Math.min(STUB, L / 3) }; mids.push(mv(B), B); } else mids.push(mv(b));
      out = head.concat(mids, tail);
    }
    const clean = [];
    for (const q of out) { const l = clean[clean.length - 1]; if (!l || Math.abs(l.x - q.x) > 0.5 || Math.abs(l.y - q.y) > 0.5) clean.push(q); }
    for (let k = clean.length - 2; k >= 1; k--) { const x0 = clean[k - 1], x1 = clean[k], x2 = clean[k + 1]; if ((Math.abs(x0.x - x1.x) < 0.5 && Math.abs(x1.x - x2.x) < 0.5) || (Math.abs(x0.y - x1.y) < 0.5 && Math.abs(x1.y - x2.y) < 0.5)) clean.splice(k, 1); }
    e.pts = clean.slice(1, -1).map(q => ({ x: round2(q.x), y: round2(q.y) }));
    requestRender(); return;
  }
  if (d.type === 'label') {
    const l = cellById(d.id), r = S.routes.get(l.parent); if (!r) return;
    const target = { x: w.x - d.grab.x, y: w.y - d.grab.y };
    const poly = routePolyline(r), n = nearestOnPoly(poly, target, false);
    l.lx = round3(n.frac * 2 - 1);
    l.lo = ev.shiftKey ? { x: 0, y: 0 } : { x: round2(target.x - n.pt.x), y: round2(target.y - n.pt.y) };
    requestRender(); return;
  }
  if (d.type === 'cpoint') {
    const c = cellById(d.id), lw = rot(w, cellCenter(c), -cellRot(c));
    const n = nearestOnPoly(outlineLocal(c), lw, true);
    const rel = [round3((n.pt.x - c.x) / c.w), round3((n.pt.y - c.y) / c.h)];
    const pts = workingPoints(c), old = pts[d.i]; pts[d.i] = rel; setPoints(c, pts);
    repointEdges(c, old, rel); requestRender(); return;
  }
  if (d.type === 'guide') {
    const pg = page();
    for (const o of d.orig) { const g = pg.guides[o.i]; const delta = g.o === 'h' ? w.y - d.start.y : w.x - d.start.x; let v = o.p + delta; if (pg.grid && !alt) v = snapVal(v, pg.gridSize); g.p = round2(v); }
    setStatus(d.orig.length === 1 ? 'Guide at ' + pg.guides[d.orig[0].i].p : ''); requestRender(); return;
  }
  if (d.type === 'newguide') {
    const pg = page(), g = pg.guides[d.i]; let v = g.o === 'h' ? w.y : w.x; if (pg.grid && !alt) v = snapVal(v, pg.gridSize); g.p = round2(v);
    setStatus('Guide at ' + g.p); requestRender(); return;
  }
}
function onPointerUp(ev) {
  const d = S.drag; S.drag = null; S.smart = [];
  $('#svg').classList.remove('panning');
  if (!d) return;
  if (d.right) { S.rightUpAt = performance.now(); if (!d.moved) contextMenu({ preventDefault() { }, clientX: ev.clientX, clientY: ev.clientY, shiftKey: ev.shiftKey }); return; }
  if (d.type === 'marquee') {
    const m = S.marquee; S.marquee = null;
    if (m && (m.w > 2 || m.h > 2)) {
      const ids = new Set(d.add);
      const pg = page();
      for (const c of pg.cells) {
        if (isGroup(c) || c.isEdgeLabel || isHiddenByLayer(pg, c, S.map)) continue;
        const b = c.e ? (S.routes.get(c.id) ? bboxOf(S.routes.get(c.id).pts) : null) : worldBox(c);
        if (b && b.x >= m.x && b.y >= m.y && b.x + b.w <= m.x + m.w && b.y + b.h <= m.y + m.h) ids.add(selectionUnitTop(c).id);
      }
      if (d.add.length) setSel(Array.from(ids)); else setSelAuto(Array.from(ids));
    } else requestRender();
    return;
  }
  if (d.type === 'newedge') {
    const e = cellById(d.id);
    if (!d.moved) { page().cells.splice(page().cells.indexOf(e), 1); refreshMap(); setSel([]); }
    else { refreshMap(); pushUndo(d.pre); afterChange(); }
    S.hover = null; S.hoverPoint = null; requestRender(); return;
  }
  if (d.type === 'newguide') {
    const pg = page(), g = pg.guides[d.i];
    const r = vpRect(), sx = ev.clientX - r.left, sy = ev.clientY - r.top;
    if ((g.o === 'h' && sy < 0) || (g.o === 'v' && sx < 0)) { pg.guides.splice(d.i, 1); requestRender(); return; }
    S.selGuides = [d.i]; pushUndo(d.pre); afterChange(); return;
  }
  if (d.type === 'guide') {
    const r = vpRect(), sx = ev.clientX - r.left, sy = ev.clientY - r.top;
    const pg = page();
    if (d.orig.length && ((pg.guides[d.orig[0].i].o === 'h' && sy < 0) || (pg.guides[d.orig[0].i].o === 'v' && sx < 0))) { // dragged back onto ruler
      const rm = new Set(d.orig.map(o => o.i)); pg.guides = pg.guides.filter((g, i) => !rm.has(i)); S.selGuides = [];
    }
    if (snapshot() !== d.pre) pushUndo(d.pre);
    afterChange(); return;
  }
  if (d.type === 'pan' || d.type === 'none') { requestRender(); return; }
  if (d.type === 'move' && d.moved) { refreshMap(); reparentToContainers(d.units); }
  refreshMap(); updateGroups(page());
  if (d.pre && snapshot() !== d.pre) { pushUndo(d.pre); afterChange(); }
  else requestRender();
  S.hover = null; S.hoverPoint = null;
}
function selectionUnitTop(c) { const anc = ancestors(c).filter(isGroup); return anc.length ? anc[0] : c; }
function handleCursor(h) {
  if (h.type === 'resize') { const c = h.id ? cellById(h.id) : singleSel(); const base = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 }[h.dir] + (c ? cellRot(c) : 0); const k = Math.round((((base % 180) + 180) % 180) / 45) % 4; return ['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize'][k]; }
  if (h.type === 'rotate') return 'grab';
  if (h.type === 'seg') return h.horiz ? 'ns-resize' : 'ew-resize';
  return 'pointer';
}
function connectEnd(e, which, tgt, hp, freePt) {
  const pfx = which === 's' ? 'exit' : 'entry';
  const del = () => { delete e.style[pfx + 'X']; delete e.style[pfx + 'Y']; delete e.style[pfx + 'Dx']; delete e.style[pfx + 'Dy']; delete e.style[pfx + 'Perimeter']; };
  if (tgt) {
    if (which === 's') { e.source = tgt.id; e.sp = null; } else { e.target = tgt.id; e.tp = null; }
    if (hp) { e.style[pfx + 'X'] = String(hp.rel[0]); e.style[pfx + 'Y'] = String(hp.rel[1]); e.style[pfx + 'Dx'] = '0'; e.style[pfx + 'Dy'] = '0'; }
    else del();
  } else {
    del();
    if (which === 's') { e.source = null; e.sp = freePt; } else { e.target = null; e.tp = freePt; }
  }
}
function repointEdges(c, oldRel, newRel) {
  for (const e of page().cells) {
    if (!e.e) continue;
    for (const [end, pfx] of [['source', 'exit'], ['target', 'entry']]) {
      if (e[end] !== c.id || e.style[pfx + 'X'] === undefined) continue;
      if (Math.abs(parseFloat(e.style[pfx + 'X']) - oldRel[0]) < 0.006 && Math.abs(parseFloat(e.style[pfx + 'Y']) - oldRel[1]) < 0.006) {
        if (newRel) { e.style[pfx + 'X'] = String(newRel[0]); e.style[pfx + 'Y'] = String(newRel[1]); }
      }
    }
  }
}
function reattachToNearest(c) {
  const pts = getPoints(c);
  for (const e of page().cells) {
    if (!e.e) continue;
    for (const [end, pfx] of [['source', 'exit'], ['target', 'entry']]) {
      if (e[end] !== c.id || e.style[pfx + 'X'] === undefined) continue;
      const rx = parseFloat(e.style[pfx + 'X']), ry = parseFloat(e.style[pfx + 'Y']);
      if (pts.some(p => Math.abs(p[0] - rx) < 0.006 && Math.abs(p[1] - ry) < 0.006)) continue;
      if (!pts.length) { delete e.style[pfx + 'X']; delete e.style[pfx + 'Y']; continue; }
      let best = pts[0], bd = Infinity;
      for (const p of pts) { const d = dist(constraintPoint(c, p), constraintPoint(c, [rx, ry])); if (d < bd) { bd = d; best = p; } }
      e.style[pfx + 'X'] = String(best[0]); e.style[pfx + 'Y'] = String(best[1]);
    }
  }
}
/* Several shapes resized together, as PowerPoint does: the handle dragged sets how much the shape it belongs to changes,
   and every selected shape changes by that same amount, each from its own opposite side or corner, so places and gaps stay
   and shapes of one width stay one width. Shift keeps each shape's own proportions. */
function doMultiResize(d, w, ev) {
  const L = d.items.find(i => i.id === d.lead), lc = cellById(d.lead); if (!L || !lc) return;
  const box = resizedBox(L.o, cellRot(lc), d.dir, w, ev);
  const dw = box.w - L.o.w, dh = box.h - L.o.h, dir = d.dir;
  for (const it of d.items) {
    const c = cellById(it.id); if (!c) continue;
    const o = it.o, r = cellRot(c);
    let nw = dir.includes('e') || dir.includes('w') ? Math.max(10, o.w + dw) : o.w, nh = dir.includes('n') || dir.includes('s') ? Math.max(10, o.h + dh) : o.h;
    if (ev.shiftKey && dir.length === 2) nh = Math.max(10, nw * o.h / o.w);
    let x0 = o.x, y0 = o.y;
    if (dir.includes('w')) x0 = o.x + o.w - nw; if (dir.includes('n')) y0 = o.y + o.h - nh;
    const cc0 = { x: o.x + o.w / 2, y: o.y + o.h / 2 }, wc = rot({ x: x0 + nw / 2, y: y0 + nh / 2 }, cc0, r);
    c.x = round2(wc.x - nw / 2); c.y = round2(wc.y - nh / 2); c.w = round2(nw); c.h = round2(nh);
  }
  setStatus('W ' + Math.round(box.w) + '  H ' + Math.round(box.h) + '  (' + d.items.length + ' shapes)');
  requestRender();
}
// The box a shape gets when the handle dir is dragged to w: snapping, the 10 px minimum and Shift for proportions.
function resizedBox(o, r, dir, w, ev) {
  const cc0 = { x: o.x + o.w / 2, y: o.y + o.h / 2 }, lw = rot(w, cc0, -r), off = 9 / S.zoom;
  let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h;
  let px = lw.x - (dir.includes('w') ? -off : dir.includes('e') ? off : 0), py = lw.y - (dir.includes('n') ? -off : dir.includes('s') ? off : 0);
  if (!r && !ev.altKey) { const sp = snapPoint({ x: px, y: py }, false); px = sp.x; py = sp.y; }
  if (dir.includes('w')) x0 = Math.min(px, x1 - 10); if (dir.includes('e')) x1 = Math.max(px, x0 + 10);
  if (dir.includes('n')) y0 = Math.min(py, y1 - 10); if (dir.includes('s')) y1 = Math.max(py, y0 + 10);
  if (ev.shiftKey && dir.length === 2) {
    const ar = o.w / o.h, nw = x1 - x0, nh = y1 - y0;
    if (nw / nh > ar) { const h2 = nw / ar; if (dir.includes('n')) y0 = y1 - h2; else y1 = y0 + h2; } else { const w2 = nh * ar; if (dir.includes('w')) x0 = x1 - w2; else x1 = x0 + w2; }
  }
  return { w: x1 - x0, h: y1 - y0 };
}
function doResize(d, w, ev) {
  const c = cellById(d.id), o = d.o, r = cellRot(c), alt = ev.altKey;
  const cc0 = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
  const lw = rot(w, cc0, -r);
  let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h;
  const dir = d.dir;
  const off = 9 / S.zoom;
  let px = lw.x - (dir.includes('w') ? -off : dir.includes('e') ? off : 0), py = lw.y - (dir.includes('n') ? -off : dir.includes('s') ? off : 0);
  if (!r && !alt) { const sp = snapPoint({ x: px, y: py }, false); px = sp.x; py = sp.y; }
  if (dir.includes('w')) x0 = Math.min(px, x1 - 10); if (dir.includes('e')) x1 = Math.max(px, x0 + 10);
  if (dir.includes('n')) y0 = Math.min(py, y1 - 10); if (dir.includes('s')) y1 = Math.max(py, y0 + 10);
  if (ev.shiftKey && dir.length === 2) { // keep aspect
    const ar = o.w / o.h, nw = x1 - x0, nh = y1 - y0;
    if (nw / nh > ar) { const h2 = nw / ar; if (dir.includes('n')) y0 = y1 - h2; else y1 = y0 + h2; } else { const w2 = nh * ar; if (dir.includes('w')) x0 = x1 - w2; else x1 = x0 + w2; }
  }
  const nw = x1 - x0, nh = y1 - y0;
  const lc = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  const wc = rot(lc, cc0, r);
  const nx = wc.x - nw / 2, ny = wc.y - nh / 2;
  if (isGroup(c)) {
    const sx = nw / o.w, sy = nh / o.h;
    for (const [id, oo] of d.origin) {
      const cl = cellById(id); if (!cl || cl.id === c.id) continue;
      if (cl.e) { cl.pts = oo.pts.map(p => ({ x: nx + (p.x - o.x) * sx, y: ny + (p.y - o.y) * sy })); continue; }
      if (cl.isEdgeLabel) continue;
      cl.x = nx + (oo.x - o.x) * sx; cl.y = ny + (oo.y - o.y) * sy; cl.w = Math.max(4, oo.w * sx); cl.h = Math.max(4, oo.h * sy);
    }
    updateGroups(page());
  } else { c.x = round2(nx); c.y = round2(ny); c.w = round2(nw); c.h = round2(nh); if (c.style.deCard === '1') fitCardBody(c); }
  setStatus('W ' + Math.round(nw) + '  H ' + Math.round(nh));
  requestRender();
}
function rotateGroup(g, d, delta) {
  for (const [id, oo] of d.origin) {
    const cl = cellById(id); if (!cl || cl.id === g.id || cl.isEdgeLabel) continue;
    if (cl.e) { cl.pts = oo.pts.map(p => rot(p, d.center, delta)); continue; }
    if (isGroup(cl)) continue;
    const oc = { x: oo.x + oo.w / 2, y: oo.y + oo.h / 2 }, nc = rot(oc, d.center, delta);
    cl.x = round2(nc.x - oo.w / 2); cl.y = round2(nc.y - oo.h / 2);
    const nr = (((oo.rotation + delta) % 360) + 360) % 360;
    setStyle(cl.style, 'rotation', nr ? round2(nr) : null);
  }
}

/* ---------- double click & text editing ---------- */
function onDblClick(ev) {
  const w = toWorld(ev);
  const gi = hitGuide(w);
  if (gi >= 0 && !hitCell(w)) return guideDialog(gi);
  const h = hitHandle(w);
  const c0 = singleSel();
  if (h && h.type === 'wp') { mutate(() => { c0.pts.splice(h.i, 1); }); return; }
  if (h && h.type === 'cpoint') { removeConnectionPoint(c0, h.i); return; }
  const hit = hitCell(w);
  if (!hit) {
    // double-click empty canvas: add a text box
    mutate(() => { const p = snapPoint(w); const c = makeVertex('text', p.x - 60, p.y - 20, S.doc.mode); page().cells.push(c); S.sel = [c.id]; });
    startEdit(singleSel(), true); return;
  }
  if (hit.e) {
    const r = S.routes.get(hit.id); const n = nearestOnPoly(routePolyline(r), w, false);
    let lbl;
    mutate(() => { lbl = makeEdgeLabel(hit, '', round3(n.frac * 2 - 1), { x: 0, y: 0 }); if (S.doc.mode !== 'outline') styleNewCell(lbl, S.doc.mode); newLabelBackground(lbl); page().cells.splice(page().cells.indexOf(hit) + 1, 0, lbl); S.sel = [lbl.id]; });
    startEdit(cellById(lbl.id), true); return;
  }
  let target = hit;
  if (!hit.isEdgeLabel) { const anc = ancestors(hit).filter(isGroup); if (anc.length && !S.sel.includes(hit.id)) target = hit; }
  setSel([target.id]);
  startEdit(target);
}
function startEdit(c, isNew) {
  if (!c || c.e || isGroup(c)) return;
  S.editing = { id: c.id, isNew: !!isNew, pre: snapshot() };
  clearCacheFor(c.id);
  const layer = $('#htmlLayer'); layer.innerHTML = '';
  const box = document.createElement('div'); box.className = 'editorBox';
  const ed = document.createElement('div'); ed.className = 'ed'; ed.contentEditable = 'true';
  ed.innerHTML = labelHtml(c);
  box.appendChild(ed); layer.appendChild(box);
  S.editing.box = box; S.editing.ed = ed;
  positionEditor();
  ed.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); finishEdit(true); } // cancel: the text goes back to what it was
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); finishEdit(); }
    else if (e.key === 'Enter' && !e.shiftKey && !e.altKey && sb(c.style, 'deChecklist', false)) { e.preventDefault(); document.execCommand('insertHTML', false, '<br>' + CHECK_OFF + '&nbsp;'); } // a new item
    if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) { e.preventDefault(); document.execCommand({ b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()]); }
  });
  ed.addEventListener('input', () => positionEditor(true));
  // Pasted text takes the label's own font, size and colour: what came with it is dropped, bold, italic, underline, lists and line breaks stay
  ed.addEventListener('paste', (e) => {
    const dt = e.clipboardData; if (!dt) return;
    e.preventDefault(); e.stopPropagation();
    const h = dt.getData('text/html'), t = dt.getData('text/plain');
    if (h && h.trim()) { const x = pastePlainLook(h); if (x.trim()) { document.execCommand('insertHTML', false, x); return; } }
    if (t) document.execCommand('insertText', false, t);
  });
  const focusAll = () => { ed.focus(); const rg = document.createRange(); rg.selectNodeContents(ed); const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg); };
  focusAll();
  requestRender(); buildFormat();
  if (document.activeElement !== ed) setTimeout(focusAll, 0);
}
// While a label is being edited, remember its last selection. Format panel fields such as Size take focus and the selection,
// so the Text section puts it back before formatting (BUG-001).
document.addEventListener('selectionchange', () => {
  const E = S.editing; if (!E) return;
  const s = window.getSelection(); if (!s.rangeCount) return;
  const rg = s.getRangeAt(0); if (E.ed.contains(rg.commonAncestorContainer)) { E.range = rg.cloneRange(); textSelSync(); }
});
// Focus the label and select its remembered range; with wholeIfEmpty, a caret or no range selects the whole label.
function restoreEditSel(wholeIfEmpty) {
  const E = S.editing; if (!E) return;
  E.ed.focus();
  let rg = E.range && E.ed.contains(E.range.commonAncestorContainer) ? E.range : null;
  if (!rg || (wholeIfEmpty && rg.collapsed)) { rg = document.createRange(); rg.selectNodeContents(E.ed); }
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg);
}
function clearCacheFor(id) { const e = S.cache.get(id); if (e) { e.g.remove(); S.cache.delete(id); } }
/* HTML pasted into a label, matched to the label: no font, size, colour, background or spacing of its own; headings and
   paragraphs become lines (a pasted heading is bold), so nothing pasted is larger or further apart than the label's text. */
function pastePlainLook(html) {
  const t = document.createElement('template'); t.innerHTML = sanitizeHtml(String(html).replace(/^[\s\S]*<!--StartFragment-->|<!--EndFragment-->[\s\S]*$/g, '')); const r = t.content;
  r.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(x => { const d = document.createElement('div'), b = document.createElement('b'); b.append(...x.childNodes); d.appendChild(b); x.replaceWith(d); });
  r.querySelectorAll('p,blockquote,pre').forEach(x => { const d = document.createElement('div'); d.append(...x.childNodes); x.replaceWith(d); });
  r.querySelectorAll('font').forEach(f => { ['color', 'face', 'size'].forEach(a => f.removeAttribute(a)); if (!f.attributes.length) f.replaceWith(...f.childNodes); });
  r.querySelectorAll('[style]').forEach(x => {
    const bold = /^(bold|[6-9]00)$/.test(x.style.fontWeight), it = x.style.fontStyle === 'italic', un = /underline/.test(x.style.textDecorationLine || x.style.textDecoration || '');
    x.removeAttribute('style'); if (bold) x.style.fontWeight = 'bold'; if (it) x.style.fontStyle = 'italic'; if (un) x.style.textDecoration = 'underline';
    if (!x.getAttribute('style')) x.removeAttribute('style');
  });
  r.querySelectorAll('[align]').forEach(x => x.removeAttribute('align'));
  r.querySelectorAll('span:not([style])').forEach(x => x.replaceWith(...x.childNodes));
  const d = document.createElement('div'); d.appendChild(r); return d.innerHTML.replace(/^\s+|\s+$/g, '');
}
function positionEditor(keepContent) {
  if (!S.editing) return;
  const c = cellById(S.editing.id); if (!c) return;
  const box = S.editing.box, ed = S.editing.ed, st = c.style;
  ed.setAttribute('style', textCss(st) + 'text-align:' + alignCss(st) + ';white-space:' + (sv(st, 'whiteSpace', '') === 'wrap' || c.isEdgeLabel ? 'normal' : 'nowrap') + ';overflow-wrap:break-word;');
  if (c.isEdgeLabel) {
    const r = S.routes.get(c.parent); if (!r) return;
    const { pos } = edgeLabelPos(c, r);
    box.style.left = (pos.x - 100) + 'px'; box.style.top = (pos.y - 14) + 'px'; box.style.width = '200px'; box.style.minHeight = '28px'; box.style.height = 'auto'; box.style.justifyContent = 'center'; box.style.transform = '';
    box.style.background = '#fff';
  } else {
    const b = labelBox(c), cc = cellCenter(c), r = cellRot(c);
    box.style.left = b.x + 'px'; box.style.top = b.y + 'px'; box.style.width = b.w + 'px'; box.style.minHeight = b.h + 'px'; box.style.height = 'auto';
    const va = sv(st, 'verticalAlign', 'middle');
    box.style.justifyContent = va === 'top' ? 'flex-start' : va === 'bottom' ? 'flex-end' : 'center';
    box.style.transformOrigin = (cc.x - b.x) + 'px ' + (cc.y - b.y) + 'px';
    box.style.transform = r ? 'rotate(' + r + 'deg)' : '';
  }
}
function finishEdit(cancel) {
  const E = S.editing; if (!E) return;
  S.editing = null;
  const c = cellById(E.id);
  const html = sanitizeHtml(E.ed.innerHTML).replace(/^(<br>)+$/, '');
  $('#htmlLayer').innerHTML = '';
  if (c && !cancel) {
    const plain = htmlToPlain(html).replace(/​/g, '').trim();
    const old = labelHtml(c);
    if (c.isEdgeLabel && !plain) { page().cells.splice(page().cells.indexOf(c), 1); S.sel = []; }
    else if (html !== old) { c.value = plain ? html : ''; c.style.html = '1'; fitFolderTab(c); fitChecklist(c); }
    refreshMap();
    if (snapshot() !== E.pre) pushUndo(E.pre);
  } else if (c && cancel && E.isNew && S.undo.length) { restore(S.undo.pop()); S.sel = []; } // cancelling a brand-new text box or label removes it
  clearCacheFor(E.id);
  afterChange();
}

/* ---------- connection point helpers ---------- */
function removeConnectionPoint(c, i) {
  mutate(() => { const pts = workingPoints(c); pts.splice(i, 1); setPoints(c, pts); reattachToNearest(c); S.selPoint = null; });
}
function resetConnectionPoints(c) {
  mutate(() => { setPoints(c, defaultPoints(c)); reattachToNearest(c); S.selPoint = null; });
}

/* ---------- wheel / keys ---------- */
function onWheel(ev) {
  ev.preventDefault();
  if (ev.ctrlKey || ev.metaKey) {
    const r = vpRect();
    setZoom(S.zoom * Math.exp(-ev.deltaY * (ev.deltaMode ? 0.05 : 0.0025)), { x: ev.clientX - r.left, y: ev.clientY - r.top });
  } else {
    const k = ev.deltaMode ? 20 : 1;
    S.tx -= (ev.shiftKey && !ev.deltaX ? ev.deltaY : ev.deltaX) * k; S.ty -= (ev.shiftKey && !ev.deltaX ? 0 : ev.deltaY) * k;
    requestRender(); positionEditor();
  }
}
function isTyping(e) { const t = e.target; return t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)); }
function onKeyDown(e) {
  if (isTyping(e)) return;
  if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.closest && e.target.closest('button, select, a')) return; // let focused buttons work
  if (S.editing) {
    if (e.key === 'Escape') { finishEdit(true); return; }
    const ed = S.editing.ed;
    if (document.activeElement !== ed) {
      ed.focus();
      const rg = document.createRange(); rg.selectNodeContents(ed); const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg);
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); document.execCommand('insertText', false, e.key); }
    }
    return;
  }
  if ($('#modalRoot').children.length) { if (e.key === 'Escape') closeModal(); return; }
  if (e.key === 'Escape' && S.painter) { e.preventDefault(); paintEnd(); return; }
  if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && (e.code === 'KeyC' || e.code === 'KeyV')) { e.preventDefault(); runCommand(e.code === 'KeyC' ? 'copyStyle' : 'pasteStyle'); return; }   // e.code: on a Mac, Option+Shift+C types a character
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (e.key === ' ' && !S.space) { S.space = true; $('#svg').style.cursor = 'grab'; e.preventDefault(); return; }
  const run = (id) => { e.preventDefault(); runCommand(id); };
  if (mod && k === 'z' && !e.shiftKey) return run('undo');
  if ((mod && k === 'y') || (mod && e.shiftKey && k === 'z')) return run('redo');
  if (mod && k === 's') return run(e.shiftKey ? 'saveAs' : 'save');
  if (mod && k === 'o') return run('open');
  if (mod && !e.shiftKey && !e.altKey && (k === 'c' || k === 'x' || k === 'v')) { // the browser's copy, cut or paste event does the work (ui2.js); the command runs only if none comes
    S.clipNative = false; const id = k === 'c' ? 'copy' : k === 'x' ? 'cut' : 'paste';
    setTimeout(() => { if (!S.clipNative) runCommand(id); }, 0); return;
  }
  if (mod && k === 'd') return run('duplicate');
  if (mod && k === 'a') return run('selectAll');
  if (mod && k === 'g') return run(e.shiftKey ? 'ungroup' : 'group');
  if (mod && (k === '=' || k === '+')) return run('zoomIn');
  if (mod && k === '-') return run('zoomOut');
  if (mod && k === '0') return run('zoom100');
  if (mod && e.shiftKey && k === 'h') return run('fit');
  if (mod && e.shiftKey && k === 'e') return run('toggleClean');
  if (mod && e.shiftKey && k === 'f') return run('toFront');
  if (mod && e.shiftKey && k === 'b') return run('toBack');
  if (mod && k === 'l') return run('lock');
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    if (S.editPoints && S.selPoint != null) { const c = cellById(S.editPoints); if (c) removeConnectionPoint(c, S.selPoint); return; }
    if (S.selGuides.length) { mutate(() => { const rm = new Set(S.selGuides); page().guides = page().guides.filter((g, i) => !rm.has(i)); S.selGuides = []; }); return; }
    return run('delete');
  }
  if (e.key === 'Escape' && S.clean) { runCommand('toggleClean'); return; }
  if (e.key === 'Escape') { if (S.editPoints) { S.editPoints = null; buildFormat(); requestRender(); return; } setSel([]); S.selGuides = []; requestRender(); return; }
  if (e.key === 'Enter' || e.key === 'F2') { const c = singleSel(); if (c && !c.e) { e.preventDefault(); startEdit(c); } return; }
  if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const step = e.shiftKey ? page().gridSize : 1; // fine movement by default
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0, dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
    if (S.selGuides.length) { mutate(() => { for (const i of S.selGuides) { const g = page().guides[i]; g.p += g.o === 'h' ? dy : dx; } }); return; }
    const units = topUnits(selCells()).filter(c => !isLocked(c) && !c.isEdgeLabel);
    if (units.length) mutate(() => translateCells(units, dx, dy), { keepPanel: true });
    buildFormat();
    return;
  }
  if (!mod && !e.altKey && e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
    const c = singleSel();
    if (c && !c.e && !isGroup(c)) { startEdit(c); setTimeout(() => { if (S.editing) { S.editing.ed.textContent = e.key; const rg = document.createRange(); rg.selectNodeContents(S.editing.ed); rg.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg); } }, 1); e.preventDefault(); }
  }
}
function onKeyUp(e) { if (e.key === ' ') { S.space = false; $('#svg').style.cursor = ''; } }

/* ---------- status ---------- */
let statusTimer = null;
function setStatus(t) { $('#statusText').textContent = t; clearTimeout(statusTimer); statusTimer = setTimeout(() => { $('#statusText').textContent = ''; }, 2500); }
function updateStatus(w) { if (!S.drag) $('#statusText').textContent = Math.round(w.x) + ', ' + Math.round(w.y); }
function toast(t, ms, action) {
  const el_ = $('#toast'); el_.textContent = t; el_.classList.remove('hidden'); clearTimeout(el_._t);
  if (action) { const b = document.createElement('button'); b.className = 'toastAct'; b.textContent = action.label; b.onclick = () => { el_.classList.add('hidden'); action.fn(); }; el_.appendChild(b); }
  el_._t = setTimeout(() => el_.classList.add('hidden'), ms || (action ? 6000 : 2200));
}
