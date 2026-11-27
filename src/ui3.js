/* ===== Auto arrange, files, exports, Gliffy export, test diagram, start-up ===== */

/* ---------- shape layouts ---------- */
function arrangeUnits() {
  let units = topUnits(selCells()).filter(c => !c.e && !c.isEdgeLabel);
  if (units.length < 2) units = topUnits(page().cells.filter(c => !c.e && !c.isEdgeLabel));
  return units;
}
function applyShapeLayout(units, o) {
  const items = units.filter(u => !isLocked(u)).map(u => ({ u, b: isGroup(u) ? { x: u.x, y: u.y, w: u.w, h: u.h } : worldBox(u) }));
  if (!items.length) return;
  if (o.order === 'reading') items.sort((a, b) => (Math.round(a.b.y / 40) - Math.round(b.b.y / 40)) || (a.b.x - b.b.x));
  const origin = items.reduce((a, it) => unionBox(a, it.b), null);
  const pad = o.padding, gap = o.spacing, n = items.length;
  const maxW = Math.max(...items.map(i => i.b.w)), maxH = Math.max(...items.map(i => i.b.h));
  const cw = maxW + 2 * pad, ch = maxH + 2 * pad;
  const place = (it, cx, cy) => translateCells([it.u], cx - (it.b.x + it.b.w / 2), cy - (it.b.y + it.b.h / 2));
  const ox = origin.x, oy = origin.y;
  if (o.type === 'grid') {
    const cols = o.cols > 0 ? o.cols : Math.ceil(Math.sqrt(n));
    items.forEach((it, i) => { const r = Math.floor(i / cols), c = i % cols; place(it, ox + c * (cw + gap) + cw / 2, oy + r * (ch + gap) + ch / 2); });
  } else if (o.type === 'rows') {
    let x = ox;
    items.forEach(it => { const w = it.b.w + 2 * pad; const cy = o.align === 'top' ? oy + pad + it.b.h / 2 : o.align === 'bottom' ? oy + ch - pad - it.b.h / 2 : oy + ch / 2; place(it, x + w / 2, cy); x += w + gap; });
  } else if (o.type === 'columns') {
    let y = oy;
    items.forEach(it => { const h = it.b.h + 2 * pad; const cx = o.align === 'left' ? ox + pad + it.b.w / 2 : o.align === 'right' ? ox + cw - pad - it.b.w / 2 : ox + cw / 2; place(it, cx, y + h / 2); y += h + gap; });
  } else if (o.type === 'circle') {
    const slot = Math.max(cw, ch) + gap;
    const R = Math.max(slot * n / (2 * Math.PI), slot * 0.75);
    const cx = ox + R + cw / 2, cy = oy + R + ch / 2;
    items.forEach((it, i) => { const a = (o.start - 90) * Math.PI / 180 + (o.clockwise ? 1 : -1) * i * 2 * Math.PI / n; place(it, cx + R * Math.cos(a), cy + R * Math.sin(a)); });
  } else if (o.type === 'pyramid') {
    const tiers = []; let k = 1, i = 0;
    while (i < n) { tiers.push(items.slice(i, i + k)); i += k; k++; }
    const vertical = o.dir === 'up' || o.dir === 'down';
    const maxTier = Math.max(...tiers.map(t => t.length));
    const along = vertical ? ch : cw, across = vertical ? cw : ch;
    tiers.forEach((t, ti) => {
      const level = (o.dir === 'down' || o.dir === 'right') ? tiers.length - 1 - ti : ti;
      t.forEach((it, j) => {
        const off = (j - (t.length - 1) / 2) * (across + gap) + (maxTier - 1) / 2 * (across + gap) + across / 2;
        const pos = level * (along + gap) + along / 2;
        if (vertical) place(it, ox + off, oy + pos); else place(it, ox + pos, oy + off);
      });
    });
  }
}
function arrangeDialog() {
  const units = arrangeUnits();
  if (units.length < 2) return toast('Add or select at least two shapes to arrange.');
  const pre = snapshot();
  const o = { type: 'grid', cols: 0, spacing: 40, padding: 0, align: 'middle', start: 0, clockwise: true, dir: 'up', order: 'selection' };
  const d = document.createElement('div'); d.style.width = '380px';
  d.innerHTML = `
  <div class="frow"><label class="l">Layout</label><select id="alType"><option value="grid">Grid</option><option value="rows">Row</option><option value="columns">Column</option><option value="circle">Circular</option><option value="pyramid">Pyramid</option></select></div>
  <div class="frow" data-for="grid"><label class="l">Columns</label><input id="alCols" type="number" min="0" value="0"> <span class="hint">0 = automatic</span></div>
  <div class="frow" data-for="rows"><label class="l">Align</label><select id="alAlignR"><option value="top">Top</option><option value="middle" selected>Middle</option><option value="bottom">Bottom</option></select></div>
  <div class="frow" data-for="columns"><label class="l">Align</label><select id="alAlignC"><option value="left">Left</option><option value="center" selected>Centre</option><option value="right">Right</option></select></div>
  <div class="frow" data-for="circle"><label class="l">Start angle</label><input id="alStart" type="number" step="15" value="0"><label class="chk"><input id="alCw" type="checkbox" checked>Clockwise</label></div>
  <div class="frow" data-for="pyramid"><label class="l">Apex</label><select id="alDir"><option value="up">Pointing up</option><option value="down">Pointing down</option><option value="left">Pointing left</option><option value="right">Pointing right</option></select></div>
  <div class="frow"><label class="l">Spacing</label><input id="alSp" type="range" min="0" max="200" value="40" style="flex:1"><span id="alSpV">40</span></div>
  <div class="frow"><label class="l">Padding</label><input id="alPad" type="range" min="0" max="100" value="0" style="flex:1"><span id="alPadV">0</span></div>
  <div class="frow"><label class="l">Order</label><select id="alOrder"><option value="selection">Selection order</option><option value="reading">Reading order (left to right, top to bottom)</option></select></div>
  <p class="hint">Applies to the selected shapes, or every shape if fewer than two are selected. Locked shapes stay put. The preview updates as you change settings.</p>`;
  const q = (id) => d.querySelector('#' + id);
  const ids = units.map(u => u.id);
  const preview = () => {
    o.type = q('alType').value; o.cols = +q('alCols').value || 0; o.spacing = +q('alSp').value; o.padding = +q('alPad').value;
    o.align = o.type === 'rows' ? q('alAlignR').value : q('alAlignC').value; o.start = +q('alStart').value || 0; o.clockwise = q('alCw').checked; o.dir = q('alDir').value; o.order = q('alOrder').value;
    q('alSpV').textContent = o.spacing; q('alPadV').textContent = o.padding;
    d.querySelectorAll('[data-for]').forEach(r => r.style.display = r.dataset.for === o.type ? '' : 'none');
    const keepSel = S.sel.slice();
    restoreQuiet(pre); S.sel = keepSel;
    applyShapeLayout(ids.map(id => cellById(id)).filter(Boolean), o); updateGroups(page()); refreshMap(); requestRender();
  };
  d.querySelectorAll('input,select').forEach(i => { i.addEventListener('input', preview); i.addEventListener('change', preview); });
  let applied = false;
  const m = modal('Auto arrange shapes', d, [{ t: 'Cancel', fn: () => { restoreQuiet(pre); afterChange(); } }, { t: 'Apply', primary: true, fn: () => { applied = true; refreshMap(); if (snapshot() !== pre) pushUndo(pre); afterChange(); } }], { sticky: true, side: true });
  m.back._onclose = () => { if (!applied) { restoreQuiet(pre); afterChange(); } };
  preview();
}
function restoreQuiet(snap) { const o = JSON.parse(snap); S.doc = o.doc; S.pi = o.pi; refreshMap(); }

/* ---------- line crossing minimisation ---------- */
function polyCrossCount(a, b) {
  let n = 0;
  for (let i = 0; i < a.length - 1; i++) for (let j = 0; j < b.length - 1; j++) {
    const h = segInter(a[i], a[i + 1], b[j], b[j + 1]);
    if (h && h.t > 0.001 && h.t < 0.999 && h.u > 0.001 && h.u < 0.999) n++;
  }
  return n;
}
function segHitsBox(a, b, box) {
  const pts = [P(box.x, box.y), P(box.x + box.w, box.y), P(box.x + box.w, box.y + box.h), P(box.x, box.y + box.h)];
  if (pointInPoly(a, pts) || pointInPoly(b, pts)) return true;
  for (let i = 0; i < 4; i++) if (segInter(a, b, pts[i], pts[(i + 1) % 4])) return true;
  return false;
}
function routeScore(e, poly, others, boxes) {
  let crosses = 0;
  for (const o of others) crosses += polyCrossCount(poly, o);
  let through = 0;
  for (const b of boxes) { if (b.id === e.source || b.id === e.target) continue; for (let i = 0; i < poly.length - 1; i++) if (segHitsBox(poly[i], poly[i + 1], b.box)) { through++; break; } }
  return { crosses, score: crosses * 1000 + through * 400 + polyLen(poly) * 0.05 + (poly.length - 2) * 4 };
}
function countAllCrossings(edges) {
  const map = refreshMap(); let n = 0;
  const polys = page().cells.filter(c => c.e).map(e => routePolyline(edgeRoute(e, map)));
  for (let i = 0; i < polys.length; i++) for (let j = i + 1; j < polys.length; j++) n += polyCrossCount(polys[i], polys[j]);
  return n;
}
function minimiseCrossings(edges, opts) {
  opts = opts || {};
  const pg = page(), map = refreshMap();
  const before = countAllCrossings();
  const boxes = pg.cells.filter(c => isConnectable(c)).map(c => ({ id: c.id, box: (() => { const b = worldBox(c); return { x: b.x + 2, y: b.y + 2, w: b.w - 4, h: b.h - 4 }; })() }));
  const targets = edges.filter(e => !isLocked(e) && (!opts.keepWaypoints || !(e.pts && e.pts.length)));
  for (let pass = 0; pass < 2; pass++) {
    for (const e of targets) {
      const others = pg.cells.filter(c => c.e && c.id !== e.id).map(o => routePolyline(edgeRoute(o, map)));
      const sC = e.source ? map.get(e.source) : null, tC = e.target ? map.get(e.target) : null;
      const candS = isConnectable(sC) ? [null].concat(getPoints(sC)) : [undefined];
      const candT = isConnectable(tC) ? [null].concat(getPoints(tC)) : [undefined];
      let best = null;
      const tmp = { id: e.id, style: Object.assign({}, e.style), source: e.source, target: e.target, pts: [], sp: e.sp, tp: e.tp };
      const setEnd = (pfx, rel) => { if (rel === undefined) return; if (rel === null) { delete tmp.style[pfx + 'X']; delete tmp.style[pfx + 'Y']; } else { tmp.style[pfx + 'X'] = String(rel[0]); tmp.style[pfx + 'Y'] = String(rel[1]); } };
      for (const a of candS) for (const b of candT) {
        setEnd('exit', a); setEnd('entry', b);
        const poly = routePolyline(edgeRoute(tmp, map));
        const sc = routeScore(e, poly, others, boxes);
        if (!best || sc.score < best.score) best = { score: sc.score, a, b };
      }
      if (best) {
        e.pts = [];
        const apply = (pfx, rel) => { if (rel === undefined) return; if (rel === null) { delete e.style[pfx + 'X']; delete e.style[pfx + 'Y']; delete e.style[pfx + 'Dx']; delete e.style[pfx + 'Dy']; } else { e.style[pfx + 'X'] = String(rel[0]); e.style[pfx + 'Y'] = String(rel[1]); } };
        apply('exit', best.a); apply('entry', best.b);
      }
    }
  }
  return { before, after: countAllCrossings() };
}

/* ---------- layered layout (shapes and lines) ---------- */
function layeredLayout(o) {
  const pg = page(); refreshMap();
  let units = topUnits(selCells()).filter(c => !c.e && !c.isEdgeLabel);
  if (units.length < 2) units = topUnits(pg.cells.filter(c => !c.e && !c.isEdgeLabel));
  units = units.filter(u => !isLocked(u));
  const unitOf = new Map();
  for (const u of units) { unitOf.set(u.id, u); for (const d of descendants(u.id)) unitOf.set(d.id, u); }
  const edges = pg.cells.filter(c => c.e && c.source && c.target && unitOf.has(c.source) && unitOf.has(c.target) && unitOf.get(c.source) !== unitOf.get(c.target));
  const ids = units.map(u => u.id), idx = new Map(ids.map((id, i) => [id, i]));
  const out = ids.map(() => []), inn = ids.map(() => []);
  const seen = new Set();
  for (const e of edges) { const a = idx.get(unitOf.get(e.source).id), b = idx.get(unitOf.get(e.target).id); const k = a + '>' + b; if (seen.has(k)) continue; seen.add(k); out[a].push(b); inn[b].push(a); }
  const connected = ids.map((_, i) => out[i].length + inn[i].length > 0);
  // attach notes/text with no lines to their nearest connected shape
  const attach = [];
  const isNote = (u) => ['callout', 'note', 'text'].includes(shapeKind(u));
  units.forEach((u, i) => {
    if (connected[i] || !isNote(u)) return;
    let best = null, bd = Infinity; const c0 = isGroup(u) ? { x: u.x + u.w / 2, y: u.y + u.h / 2 } : cellCenter(u);
    units.forEach((v, j) => { if (!connected[j]) return; const c1 = isGroup(v) ? { x: v.x + v.w / 2, y: v.y + v.h / 2 } : cellCenter(v); const d = dist(c0, c1); if (d < bd) { bd = d; best = { v, off: { x: c0.x - c1.x, y: c0.y - c1.y } }; } });
    if (best) attach.push({ u, to: best.v, off: best.off });
  });
  const attachedIds = new Set(attach.map(a => a.u.id));
  const nodes = ids.map((_, i) => i).filter(i => !attachedIds.has(ids[i]));
  // break cycles with DFS
  const state = new Map(), rev = new Set();
  const dfs = (v) => { state.set(v, 1); for (const w of out[v]) { if (state.get(w) === 1) rev.add(v + '>' + w); else if (!state.get(w)) dfs(w); } state.set(v, 2); };
  for (const v of nodes) if (!state.get(v)) dfs(v);
  const succOf = new Map(nodes.map(v => [v, []])), predOf = new Map(nodes.map(v => [v, []]));
  for (const v of nodes) for (const w of out[v]) { if (!succOf.has(w)) continue; if (rev.has(v + '>' + w)) { succOf.get(w).push(v); predOf.get(v).push(w); } else { succOf.get(v).push(w); predOf.get(w).push(v); } }
  // longest-path layering
  const layer = new Map();
  const lay = (v, guard) => { if (layer.has(v)) return layer.get(v); if (guard > 500) return 0; let L = 0; for (const p of predOf.get(v)) L = Math.max(L, lay(p, guard + 1) + 1); layer.set(v, L); return L; };
  nodes.forEach(v => lay(v, 0));
  // isolated non-note shapes go into a final layer
  const maxL = Math.max(0, ...Array.from(layer.values()));
  for (const v of nodes) if (!connected[v]) layer.set(v, maxL + 1);
  // build layers with dummy nodes
  const L = []; const node = (id, real) => ({ id, real, ord: 0 });
  const nodeObj = new Map();
  for (const v of nodes) { const n = node(v, true); nodeObj.set(v, n); (L[layer.get(v)] = L[layer.get(v)] || []).push(n); }
  const links = []; let dummyId = 0;
  for (const v of nodes) for (const w of succOf.get(v)) {
    let prev = nodeObj.get(v);
    for (let l = layer.get(v) + 1; l < layer.get(w); l++) { const d = node('d' + (dummyId++), false); (L[l] = L[l] || []).push(d); links.push([prev, d]); prev = d; }
    links.push([prev, nodeObj.get(w)]);
  }
  for (let i = 0; i < L.length; i++) L[i] = L[i] || [];
  // initial order by current position
  const H = o.dir === 'LR' || o.dir === 'RL';
  for (const lv of L) { lv.sort((a, b) => { const pa = a.real ? units[a.id] : null, pb = b.real ? units[b.id] : null; return (pa ? (H ? pa.y : pa.x) : 0) - (pb ? (H ? pb.y : pb.x) : 0); }); lv.forEach((n, i) => n.ord = i); }
  const up = new Map(), down = new Map();
  for (const [a, b] of links) { (down.get(a) || down.set(a, []).get(a)).push(b); (up.get(b) || up.set(b, []).get(b)).push(a); }
  for (let it = 0; it < 12; it++) {
    const sweep = (range, nbrs) => { for (const i of range) { const lv = L[i]; for (const n of lv) { const ns = nbrs.get(n) || []; n.bc = ns.length ? ns.reduce((s, m) => s + m.ord, 0) / ns.length : n.ord; } lv.sort((a, b) => a.bc - b.bc); lv.forEach((n, k) => n.ord = k); } };
    if (it % 2 === 0) sweep(L.map((_, i) => i).slice(1), up); else sweep(L.map((_, i) => i).reverse().slice(1), down);
  }
  // coordinates
  const size = (n) => { if (!n.real) return { w: 10, h: 10 }; const u = units[n.id]; const b = isGroup(u) ? u : worldBox(u); return { w: b.w, h: b.h }; };
  const all0 = units.reduce((a, u) => unionBox(a, isGroup(u) ? { x: u.x, y: u.y, w: u.w, h: u.h } : worldBox(u)), null);
  let along = 0; const pos = new Map();
  const layerOrder = (o.dir === 'BT' || o.dir === 'RL') ? L.map((_, i) => i).reverse() : L.map((_, i) => i);
  const widths = L.map(lv => lv.reduce((s, n) => s + (H ? size(n).h : size(n).w), 0) + Math.max(0, lv.length - 1) * o.nodeGap);
  const maxWidth = Math.max(...widths, 0);
  for (const li of layerOrder) {
    const lv = L[li]; const thick = Math.max(0, ...lv.map(n => H ? size(n).w : size(n).h));
    let across = (maxWidth - widths[li]) / 2;
    for (const n of lv) { const s = size(n); const sa = H ? s.h : s.w; pos.set(n, { across: across + sa / 2, along: along + thick / 2 }); across += sa + o.nodeGap; }
    along += thick + o.layerGap;
  }
  for (const v of nodes) {
    const n = nodeObj.get(v), p = pos.get(n), u = units[v];
    const cx = all0.x + (H ? p.along : p.across), cy = all0.y + (H ? p.across : p.along);
    const b = isGroup(u) ? u : worldBox(u);
    translateCells([u], cx - (b.x + b.w / 2), cy - (b.y + b.h / 2));
  }
  updateGroups(pg); refreshMap();
  const boxOf = (u) => isGroup(u) ? { x: u.x, y: u.y, w: u.w, h: u.h } : worldBox(u);
  const placed = units.filter(u => !attachedIds.has(u.id)).map(boxOf);
  for (const a of attach) {
    const b = boxOf(a.to), bu = boxOf(a.u), g = 24;
    const cands = [{ x: b.x + b.w / 2 + a.off.x - bu.w / 2, y: b.y + b.h / 2 + a.off.y - bu.h / 2 }, { x: b.x + b.w + g, y: b.y }, { x: b.x, y: b.y - bu.h - g }, { x: b.x, y: b.y + b.h + g }, { x: b.x - bu.w - g, y: b.y }];
    let pick = cands[0];
    for (const c of cands) { const nb = { x: c.x, y: c.y, w: bu.w, h: bu.h }; if (!placed.some(p => boxIntersects(p, { x: nb.x - 6, y: nb.y - 6, w: nb.w + 12, h: nb.h + 12 }))) { pick = c; break; } }
    translateCells([a.u], pick.x - bu.x, pick.y - bu.y);
    placed.push({ x: pick.x, y: pick.y, w: bu.w, h: bu.h });
  }
  updateGroups(pg); refreshMap();
  for (const e of edges) { e.pts = []; for (const p of ['exit', 'entry']) { delete e.style[p + 'X']; delete e.style[p + 'Y']; delete e.style[p + 'Dx']; delete e.style[p + 'Dy']; } }
  return minimiseCrossings(edges, { keepWaypoints: false });
}
function layeredDialog() {
  const pre = snapshot();
  const d = document.createElement('div'); d.style.width = '380px';
  d.innerHTML = `
  <div class="frow"><label class="l">Direction</label><select id="lyDir"><option value="TB">Top to bottom</option><option value="BT">Bottom to top</option><option value="LR">Left to right</option><option value="RL">Right to left</option></select></div>
  <div class="frow"><label class="l">Layer gap</label><input id="lyL" type="range" min="20" max="250" value="70" style="flex:1"><span id="lyLV">70</span></div>
  <div class="frow"><label class="l">Shape gap</label><input id="lyN" type="range" min="10" max="200" value="40" style="flex:1"><span id="lyNV">40</span></div>
  <p class="hint">Repositions the selected shapes (or all shapes) in layers that follow the lines, ordered to reduce crossings, then re-routes the lines. Notes and text without lines stay next to the shape they were closest to.</p>
  <p class="hint" id="lyRes"></p>`;
  const q = (id) => d.querySelector('#' + id);
  const preview = () => {
    const o = { dir: q('lyDir').value, layerGap: +q('lyL').value, nodeGap: +q('lyN').value };
    q('lyLV').textContent = o.layerGap; q('lyNV').textContent = o.nodeGap;
    const keep = S.sel.slice(); restoreQuiet(pre); S.sel = keep;
    const r = layeredLayout(o); q('lyRes').textContent = 'Line crossings: ' + r.before + ' before, ' + r.after + ' after.';
    requestRender();
  };
  d.querySelectorAll('input,select').forEach(i => { i.addEventListener('input', preview); });
  let applied = false;
  const m = modal('Auto arrange shapes and lines', d, [{ t: 'Cancel', fn: () => { restoreQuiet(pre); afterChange(); } }, { t: 'Apply', primary: true, fn: () => { applied = true; refreshMap(); if (snapshot() !== pre) pushUndo(pre); afterChange(); } }], { sticky: true, side: true });
  m.back._onclose = () => { if (!applied) { restoreQuiet(pre); afterChange(); } };
  preview();
}

/* ---------- files ---------- */
const HAS_FSA = typeof window.showSaveFilePicker === 'function' && typeof window.showOpenFilePicker === 'function';
const FILE_TYPES = [{ description: 'draw.io diagram', accept: { 'text/xml': ['.drawio', '.xml'] } }];
function ensureExt(n, ext) { ext = ext || '.drawio'; return n.toLowerCase().endsWith(ext) ? n : n.replace(/\.(drawio|xml|dio)$/i, '') + ext; }
function baseName() { return S.file.name.replace(/\.(drawio|xml|dio)$/i, ''); }
function download(data, name, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
async function saveFile(as) {
  if (S.editing) finishEdit();
  const xml = serializeDoc(S.doc);
  try {
    if (HAS_FSA) {
      let h = S.file.handle;
      if (as || !h) h = await window.showSaveFilePicker({ suggestedName: ensureExt(S.file.name), types: FILE_TYPES });
      const w = await h.createWritable(); await w.write(xml); await w.close();
      S.file = { handle: h, name: h.name }; addRecent(h);
    } else {
      if (as || !S.file.saved) {
        const name = await new Promise(res => promptDialog(as ? 'Save as' : 'Save', 'File name', ensureExt(S.file.name), (v) => res(v)));
        if (!name) return false;
        S.file.name = ensureExt(name);
      }
      download(xml, S.file.name, 'application/xml'); S.file.saved = true;
    }
  } catch (e) { if (e && e.name === 'AbortError') return false; toast('Save failed: ' + e.message, 4000); return false; }
  if (serializeDoc(S.doc) === xml) { setDirty(false); clearAutosave(); } // edits made while the save dialog was open stay unsaved
  toast('Saved ' + S.file.name);
  return true;
}
function openFile() {
  confirmDiscard(async () => {
    if (HAS_FSA) {
      try { const [h] = await window.showOpenFilePicker({ types: FILE_TYPES, multiple: false }); const f = await h.getFile(); if (await openFileObject(f, h)) addRecent(h); }
      catch (e) { if (e && e.name !== 'AbortError') toast('Could not open: ' + e.message, 4000); }
    } else $('#fileInput').click();
  });
}
const MAX_FILE_BYTES = 100 << 20; // 100 MB
async function openFileObject(f, handle) {
  if (f.size > MAX_FILE_BYTES) { toast('Could not open ' + f.name + ': it is larger than ' + (MAX_FILE_BYTES >> 20) + ' MB.', 5000); return false; }
  return loadText(await f.text(), f.name, handle);
}
async function loadText(text, name, handle) {
  try {
    const doc = await parseDrawio(text);
    S.doc = doc; S.pi = 0; S.sel = []; S.undo = []; S.redo = []; S.selGuides = []; S.editPoints = null;
    S.file = { handle: handle || null, name: name || 'Untitled.drawio', saved: !!handle };
    clearCache(); setDirty(false); afterChange(); fitView(); toast('Opened ' + S.file.name);
    return true;
  } catch (e) { toast('Could not open this file: ' + e.message, 5000); return false; }
}
/* recent files (handles kept in IndexedDB where the browser supports it) */
let RECENT = [];
function idb() { return new Promise((res, rej) => { const r = indexedDB.open('de-recent', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function loadRecent() {
  try { const db = await idb(); const tx = db.transaction('files', 'readonly'); const st = tx.objectStore('files'); const req = st.get('list'); req.onsuccess = () => { RECENT = req.result || []; }; } catch (e) { RECENT = []; }
}
async function addRecent(h) {
  try {
    const list = [];
    for (const r of RECENT) { if (r.handle && h.isSameEntry && await h.isSameEntry(r.handle)) continue; list.push(r); }
    list.unshift({ name: h.name, handle: h, t: Date.now() }); RECENT = list.slice(0, 8);
    const db = await idb(); db.transaction('files', 'readwrite').objectStore('files').put(RECENT, 'list');
  } catch (e) { }
}
function recentMenu() {
  if (!HAS_FSA) return [{ t: 'Not available in this browser', dis: true }];
  if (!RECENT.length) return [{ t: 'No recent files', dis: true }];
  return RECENT.map(r => ({ t: r.name, fn: () => confirmDiscard(async () => {
    try {
      if (r.handle.queryPermission && (await r.handle.queryPermission({ mode: 'readwrite' })) !== 'granted') await r.handle.requestPermission({ mode: 'readwrite' });
      const f = await r.handle.getFile(); if (await openFileObject(f, r.handle)) addRecent(r.handle);
    } catch (e) { toast('Could not reopen ' + r.name + ': ' + e.message, 4000); }
  }) }));
}
/* autosave */
const AUTOSAVE_KEY = 'de-autosave-v1';
let autosaveWarned = false;
function autosaveTick() {
  if (!S.dirty || S.embed) return; // embed mode: the host page keeps the diagram, nothing is stored here
  try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ xml: serializeDoc(S.doc), name: S.file.name, t: Date.now() })); autosaveWarned = false; }
  catch (e) { if (!autosaveWarned) { autosaveWarned = true; toast('Autosave is not working (browser storage is full or blocked). Save your work with Ctrl+S.', 6000); } }
}
function clearAutosave() { try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) { } }
function checkAutosave(manual) {
  if (S.embed || EMBED.inFrame) return;
  let a = null; try { a = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || 'null'); } catch (e) { }
  if (!a) { if (manual) toast('There is no autosaved work to recover.'); return; }
  const when = new Date(a.t).toLocaleString();
  const ban = document.createElement('div'); ban.className = 'banner';
  ban.innerHTML = '<span>Unsaved work from <b>' + esc(when) + '</b> (' + esc(a.name) + ') can be recovered.</span>';
  const r = mkBtn('Recover', async () => { ban.remove(); await loadText(a.xml, a.name); setDirty(true); }, 'primary');
  const x = mkBtn('Discard', () => { ban.remove(); clearAutosave(); });
  ban.append(r, x); $('#stage').appendChild(ban);
}
function updateTitle() {
  const t = (S.dirty ? '● ' : '') + S.file.name;
  $('#docTitle').textContent = t; document.title = S.file.name + (S.dirty ? ' (unsaved)' : '') + ' · ' + APP_NAME;
}

/* ---------- export builders ---------- */
function buildExportSvg(srcPage, opts) {
  opts = opts || {};
  const pg = deep(srcPage);
  if (opts.clean) for (const c of pg.cells) if (sb(c.style, 'sketch', false)) applySketch(c, false);
  const map = cellMap(pg), { routes, hops } = computeRoutes(pg, map);
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('xmlns', SVGNS);
  const g = el('g', {}, svg);
  let usesSketchFont = false;
  for (const c of pg.cells) {
    if (isGroup(c) || isHiddenByLayer(pg, c, map)) continue;
    if ((c.style.fontFamily || '') === SKETCH_FONT || (c.value || '').includes(SKETCH_FONT)) usesSketchFont = true;
    if (c.e) g.appendChild(renderEdge(c, routes.get(c.id), hops.get(c.id), { noHit: true }));
    else if (c.isEdgeLabel) { const r = routes.get(c.parent); if (r) g.appendChild(renderEdgeLabel(c, r, { exportText: true })); }
    else g.appendChild(renderVertex(c, { exportText: true }));
  }
  const holder = document.createElement('div'); holder.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden';
  holder.appendChild(svg); document.body.appendChild(holder);
  let bb; try { bb = g.getBBox(); } catch (e) { bb = { x: 0, y: 0, width: 100, height: 100 }; }
  holder.remove();
  if (!bb.width && !bb.height) bb = { x: 0, y: 0, width: 100, height: 60 };
  const pad = 12, x = Math.floor(bb.x - pad), y = Math.floor(bb.y - pad), w = Math.ceil(bb.width + pad * 2), h = Math.ceil(bb.height + pad * 2);
  svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`); svg.setAttribute('width', w); svg.setAttribute('height', h);
  if (opts.bg !== false) svg.insertBefore(el('rect', { x, y, width: w, height: h, fill: pageBackground(srcPage) }), g);
  if (pg.cells.some(c => sb(c.style, 'deGlow', false))) { const defs = el('defs'); defs.innerHTML = GLOW_FILTER; svg.insertBefore(defs, svg.firstChild); }
  if (usesSketchFont && opts.fonts !== false) { const st = el('style'); st.textContent = "@font-face{font-family:'Architects Daughter';src:url(data:font/woff2;base64," + FONT_B64 + ") format('woff2');}"; svg.insertBefore(st, svg.firstChild); }
  if (opts.title !== undefined) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', opts.title); const t = el('title'); t.textContent = opts.title; svg.insertBefore(t, svg.firstChild); }
  let out = new XMLSerializer().serializeToString(svg);
  if (opts.idPrefix) out = prefixSvgIds(out, opts.idPrefix);
  return { svg: out, w, h };
}
async function renderToCanvas(ex, scale, maxArea) {
  try { await document.fonts.load("16px 'Architects Daughter'"); } catch (e) { }
  maxArea = maxArea || 16000000;
  let s = scale; if (ex.w * ex.h * s * s > maxArea) s = Math.sqrt(maxArea / (ex.w * ex.h));
  s = Math.min(s, 16000 / ex.w, 16000 / ex.h);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ex.svg);
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Image render failed')); });
  await new Promise(r => setTimeout(r, 60));
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(ex.w * s)); cv.height = Math.max(1, Math.round(ex.h * s));
  const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, cv.width, cv.height);
  return { canvas: cv, scale: s };
}
function exportPngDialog() {
  const d = document.createElement('div'); d.style.width = '340px';
  d.innerHTML = `<div class="frow"><label class="l">Scale</label><select id="pxS"><option value="1">1×</option><option value="2" selected>2×</option><option value="3">3×</option></select></div>
  <div class="frow"><label class="l">Style</label><select id="pxStyle"><option value="current">Current style</option><option value="clean">Clean (for image-to-shapes conversion)</option></select></div>
  <div class="frow"><label class="chk"><input type="checkbox" id="pxBg" checked>White background</label></div>`;
  modal('Export PNG', d, [{ t: 'Cancel' }, { t: 'Export', primary: true, fn: () => { exportPng(+d.querySelector('#pxS').value, d.querySelector('#pxStyle').value === 'clean', d.querySelector('#pxBg').checked); } }]);
}
async function exportPng(scale, clean, bg) {
  try {
    const ex = buildExportSvg(page(), { clean, bg });
    const { canvas } = await renderToCanvas(ex, scale || 2);
    canvas.toBlob(b => { if (b) download(b, baseName() + (clean ? '-clean' : '') + '.png', 'image/png'); else toast('PNG export failed.'); }, 'image/png');
  } catch (e) { toast('PNG export failed: ' + e.message, 4000); }
}
function exportSvg() { const ex = buildExportSvg(page(), { bg: true }); download('<?xml version="1.0" encoding="UTF-8"?>\n' + ex.svg, baseName() + '.svg', 'image/svg+xml'); }
async function exportPdf() {
  try {
    const ex = buildExportSvg(page(), { bg: true });
    const { canvas } = await renderToCanvas(ex, 2.5, 30000000);
    const jpg = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.93));
    const bytes = new Uint8Array(await jpg.arrayBuffer());
    let ptW = ex.w * 0.75, ptH = ex.h * 0.75; const k = Math.min(1, 14400 / Math.max(ptW, ptH)); ptW *= k; ptH *= k;
    download(makePdf(bytes, canvas.width, canvas.height, ptW, ptH), baseName() + '.pdf', 'application/pdf');
  } catch (e) { toast('PDF export failed: ' + e.message, 4000); }
}
function makePdf(jpeg, pxW, pxH, W, H) {
  const enc = new TextEncoder(), parts = [], offsets = [];
  let len = 0;
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[\u0080-ÿ]/g, ' '));
  const obj = (n, body) => { offsets[n] = len; push(n + ' 0 obj\n'); body(); push('\nendobj\n'); };
  const content = 'q ' + W.toFixed(2) + ' 0 0 ' + H.toFixed(2) + ' 0 0 cm /Im0 Do Q';
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  obj(3, () => push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W.toFixed(2) + ' ' + H.toFixed(2) + '] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>'));
  obj(4, () => { push('<< /Length ' + content.length + ' >>\nstream\n'); push(content); push('\nendstream'); });
  obj(5, () => { push('<< /Type /XObject /Subtype /Image /Width ' + pxW + ' /Height ' + pxH + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n'); push(jpeg); push('\nendstream'); });
  obj(6, () => push('<< /Producer (' + APP_NAME + ') /Title <FEFF' + Array.from(baseName()).map(ch => { const c = ch.codePointAt(0); const u = c > 0xffff ? [0xd800 + ((c - 0x10000) >> 10), 0xdc00 + ((c - 0x10000) & 0x3ff)] : [c]; return u.map(v => v.toString(16).padStart(4, '0')).join(''); }).join('') + '> >>')); // UTF-16 so any file name survives
  const xref = len;
  let x = 'xref\n0 7\n0000000000 65535 f \n'; for (let i = 1; i <= 6; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  push(x + 'trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
  return new Blob(parts, { type: 'application/pdf' });
}

/* ---------- Gliffy compatible export ---------- */
const GLIFFY_SUPPORTED_POINTS = RECT12;
const GLIFFY_TRANSFORMS = [
  { id: 'repoint', name: 'Re-point line ends on custom or unsupported connection points to the closest supported point on the same side', run: (doc, rep) => {
    for (const pg of doc.pages) {
      const map = cellMap(pg);
      for (const e of pg.cells) {
        if (!e.e) continue;
        let changed = false;
        for (const [end, pfx] of [['source', 'exit'], ['target', 'entry']]) {
          const c = e[end] ? map.get(e[end]) : null;
          if (!isConnectable(c) || e.style[pfx + 'X'] === undefined) continue;
          const rel = [parseFloat(e.style[pfx + 'X']), parseFloat(e.style[pfx + 'Y'])];
          if (GLIFFY_SUPPORTED_POINTS.some(p => Math.abs(p[0] - rel[0]) < 0.006 && Math.abs(p[1] - rel[1]) < 0.006)) continue;
          const side = sideOfRel(rel);
          const onSide = GLIFFY_SUPPORTED_POINTS.filter(p => sideOfRel(p) === side && (side === 'top' ? p[1] === 0 : side === 'bottom' ? p[1] === 1 : side === 'left' ? p[0] === 0 : p[0] === 1));
          const cands = onSide.length ? onSide : GLIFFY_SUPPORTED_POINTS;
          const axisPos = (p) => (side === 'top' || side === 'bottom') ? p[0] : p[1];
          let best = null;
          for (const p of cands) {
            const d = onSide.length ? Math.abs(axisPos(p) - axisPos(rel)) : dist(constraintPoint(c, p), constraintPoint(c, rel)) / Math.max(c.w, c.h);
            const tie = Math.abs(axisPos(p) - 0.5);
            if (!best || d < best.d - 1e-6 || (Math.abs(d - best.d) <= 1e-6 && tie < best.tie)) best = { p, d, tie };
          }
          e.style[pfx + 'X'] = String(best.p[0]); e.style[pfx + 'Y'] = String(best.p[1]); e.style[pfx + 'Dx'] = '0'; e.style[pfx + 'Dy'] = '0';
          rep.push({ page: pg.name, line: edgeName(e, pg, map), end: end === 'source' ? 'start' : 'end', shape: htmlToPlain(labelHtml(c)).trim() || shapeKind(c), from: rel.map(round3).join(', '), to: best.p.join(', ') });
          changed = true;
        }
        if (changed) e.pts = [];
      }
    }
  } },
  { id: 'styles', name: 'Convert diagram styles Gliffy cannot show: Sketch and Neon to Outline, Duotone to Filled. No shapes are removed', run: (doc, rep, srep) => {
    const dominant = dominantColour(doc);
    for (const pg of doc.pages) for (const c of pg.cells) {
      const m = modeOf(c), to = m === 'duotone' ? 'filled' : (m === 'sketch' || m === 'neon') ? 'outline' : null;
      if (!to) continue;
      const canvas = pageBackground(pg);
      convertCell(c, m, to, STYLE_DEFAULTS[to], { dark: isDarkBg(canvas), dominant, canvas });
      srep.push({ page: pg.name, item: htmlToPlain(labelHtml(c) || '').trim().slice(0, 30) || (c.e ? 'line' : shapeKind(c)), change: m + ' to ' + to });
    }
    if (autoContrastOn()) for (const f of contrastRun(doc, { apply: true }).fixes) srep.push({ page: f.page, item: f.element, change: f.what + ' ' + f.old + ' to ' + f.new + ' for contrast' });
  } },
  { id: 'icons', name: 'Embed Phosphor icons as images (SVG), keeping their size, position, colour and label', run: (doc, rep, srep) => {
    for (const pg of doc.pages) for (const c of pg.cells) {
      if (!c.style.dePh) continue;
      const svg = phSvg(c.style.dePh, c.style.deW || 'regular', colorOr(c.style, 'fillColor', '#475569'));
      if (!svg) continue;
      c.style.shape = 'image'; c.style.image = 'data:image/svg+xml,' + btoa(svg); c.style.imageAspect = '0';
      srep.push({ page: pg.name, item: phLabel(c.style.dePh), change: 'icon to embedded image' });
    }
  } },
  { id: 'blueprint', name: 'Harvey balls as images (SVG); list Blueprint extras Gliffy cannot show (shadows, double outlines, icons before labels, markers, dot matrix). Colours, dashes and widths are kept', run: (doc, rep, srep) => {
    for (const pg of doc.pages) for (const c of pg.cells) {
      const st = c.style, item = htmlToPlain(labelHtml(c) || '').trim().slice(0, 30) || (c.e ? 'line' : shapeKind(c));
      if (st.deHarvey !== undefined) {
        const p = harveyOf(st), wd = harveyWedge(0, 0, 100, 100, p), stroke = colorOr(st, 'strokeColor', '#000000'), fill = colorOr(st, 'fillColor', '#ffffff');
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 104 104"><circle cx="50" cy="50" r="50" fill="' + fill + '" stroke="' + stroke + '" stroke-width="5"/>' + (wd ? '<path d="' + wd + '" fill="' + stroke + '" stroke="' + stroke + '" stroke-width="5"/>' : '') + '</svg>';
        st.shape = 'image'; st.image = 'data:image/svg+xml,' + btoa(svg); st.imageAspect = '0'; delete st.deHarvey;
        srep.push({ page: pg.name, item: 'Harvey ball ' + p + '%', change: 'to embedded image' }); continue;
      }
      const lost = [];
      if (shadowOf(st)) lost.push('shadow'); if (sb(st, 'deDouble', false)) lost.push('double outline (single outline kept)');
      if (st.deIcon) lost.push('icon before the label'); if (bpSemantic(st.deMarker)) lost.push('marker'); if (st.deDots !== undefined) lost.push('dot matrix (plain fill kept)');
      if (sb(st, 'deChecklist', false)) lost.push('clickable check boxes (the text keeps its boxes)');
      if (lost.length) srep.push({ page: pg.name, item, change: 'not shown in Gliffy: ' + lost.join(', ') });
    }
  } },
  { id: 'customPoints', name: 'Remove custom connection point definitions from shapes', run: (doc) => { for (const pg of doc.pages) for (const c of pg.cells) if (!c.e) delete c.style.points; } },
  { id: 'editorData', name: 'Remove editor-only data (guides, grid display, ruler settings)', run: (doc) => { for (const pg of doc.pages) { pg.guides = []; pg.guidesLocked = false; pg.guidesVisible = true; pg.gridVisible = true; pg.rulers = true; } } }
];
function edgeName(e, pg, map) {
  const lbl = pg.cells.find(c => c.isEdgeLabel && c.parent === e.id);
  if (lbl) { const t = htmlToPlain(labelHtml(lbl)).trim(); if (t) return '"' + t.slice(0, 30) + '"'; }
  const nm = (id) => { const c = id ? map.get(id) : null; return c ? (htmlToPlain(labelHtml(c)).trim().slice(0, 20) || shapeKind(c)) : 'free end'; };
  return nm(e.source) + ' → ' + nm(e.target);
}
function exportGliffy() {
  if (S.editing) finishEdit();
  const doc = deep(S.doc), rep = [], srep = [];
  if (!PH.ready && doc.pages.some(p => p.cells.some(c => c.style.dePh))) { toast('Icons are still loading; try again in a moment.'); return; }
  for (const t of GLIFFY_TRANSFORMS) t.run(doc, rep, srep);
  const xml = serializeDoc(doc, { stripEditorData: true });
  const name = baseName() + '-gliffy.drawio';
  download(xml, name, 'application/xml');
  const d = document.createElement('div'); d.style.maxWidth = '680px';
  d.innerHTML = '<p>Saved <b>' + esc(name) + '</b>. Your own file is unchanged. Transformations applied:</p><ul>' + GLIFFY_TRANSFORMS.map(t => '<li>' + esc(t.name) + '</li>').join('') + '</ul>';
  if (rep.length) {
    d.insertAdjacentHTML('beforeend', '<p><b>' + rep.length + ' line end' + (rep.length > 1 ? 's were' : ' was') + ' re-pointed:</b></p><table><tr><th>Page</th><th>Line</th><th>End</th><th>Shape</th><th>From</th><th>To</th></tr>' +
      rep.map(r => '<tr><td>' + esc(r.page) + '</td><td>' + esc(r.line) + '</td><td>' + r.end + '</td><td>' + esc(r.shape) + '</td><td>' + r.from + '</td><td>' + r.to + '</td></tr>').join('') + '</table>');
  } else d.insertAdjacentHTML('beforeend', '<p>No line ends needed re-pointing.</p>');
  if (srep.length) {
    d.insertAdjacentHTML('beforeend', '<p><b>' + srep.length + ' style or icon change' + (srep.length > 1 ? 's' : '') + ':</b></p><table><tr><th>Page</th><th>Shape</th><th>Change</th></tr>' +
      srep.slice(0, 200).map(r => '<tr><td>' + esc(r.page) + '</td><td>' + esc(r.item) + '</td><td>' + esc(r.change) + '</td></tr>').join('') + '</table>' + (srep.length > 200 ? '<p class="hint">First 200 shown.</p>' : ''));
  }
  d.insertAdjacentHTML('beforeend', '<p class="hint">More Gliffy transformations will be added once testing confirms what Gliffy\'s import needs. Record findings in Help, Gliffy compatibility register.</p>');
  modal('Gliffy compatible export', d);
}
const REG_KEY = 'de-gliffy-register-v1';
function loadRegister() {
  try { const r = JSON.parse(localStorage.getItem(REG_KEY) || 'null'); if (r) return r; } catch (e) { }
  return [{ feature: 'Custom connection points', survives: 'Assumed no', transform: 'Re-point to nearest supported point', date: 'Not yet tested' },
    { feature: 'Sketch, Neon and Duotone styles', survives: 'Assumed no', transform: 'Sketch and Neon to Outline, Duotone to Filled', date: 'Not yet tested' },
    { feature: 'Phosphor icons (draw.io stencils)', survives: 'Assumed no', transform: 'Embed as SVG image', date: 'Not yet tested' },
    { feature: 'Harvey balls (draw.io stencils)', survives: 'Assumed no', transform: 'Embed as SVG image', date: 'Not yet tested' },
    { feature: 'Blueprint extras: shadows, double outline, icons before labels, markers, dot matrix', survives: 'Assumed no', transform: 'None; listed in the export report', date: 'Not yet tested' }];
}
function registerDialog() {
  let rows = loadRegister();
  const d = document.createElement('div');
  const draw = () => {
    d.innerHTML = '<p class="hint">Record what happens when the test diagram is imported into Gliffy. Stored in this browser; use Export CSV to share it.</p>';
    const t = document.createElement('table'); t.innerHTML = '<tr><th>Feature</th><th>Survives Gliffy import?</th><th>Transformation applied</th><th>Date tested</th><th></th></tr>';
    rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      for (const k of ['feature', 'survives', 'transform', 'date']) { const td = document.createElement('td'); const inp = document.createElement('input'); inp.type = 'text'; inp.value = r[k]; inp.oninput = () => { r[k] = inp.value; }; td.appendChild(inp); tr.appendChild(td); }
      const td = document.createElement('td'); td.appendChild(mkBtn('✕', () => { rows.splice(i, 1); draw(); })); tr.appendChild(td);
      t.appendChild(tr);
    });
    d.appendChild(t);
    const r = frow(d); r.appendChild(mkBtn('Add row', () => { rows.push({ feature: '', survives: '', transform: '', date: new Date().toISOString().slice(0, 10) }); draw(); }));
    r.appendChild(mkBtn('Export CSV', () => { const q = (s) => '"' + String(s).replace(/"/g, '""') + '"'; download(['Feature,Survives Gliffy import?,Transformation applied,Date tested'].concat(rows.map(r => [r.feature, r.survives, r.transform, r.date].map(q).join(','))).join('\n'), 'gliffy-compatibility-register.csv', 'text/csv'); }));
  };
  draw();
  modal('Gliffy compatibility register', d, [{ t: 'Close', fn: () => { try { localStorage.setItem(REG_KEY, JSON.stringify(rows)); } catch (e) { } } }], { width: '760px' });
}

/* ---------- test diagram ---------- */
async function loadTestDiagram() {
  await loadPhosphor();
  const doc = newDoc(); doc.pages = [];
  const build = (name, sketch, bg) => {
    const pg = newPage(name); const cells = pg.cells;
    if (bg) pg.modelAttrs = Object.assign({}, pg.modelAttrs, { background: bg });
    const OFF = 400;
    const V = (key, x, y, val, mod) => { const c = makeVertex(key, x, y, 'outline'); if (val !== undefined) c.value = val; if (mod) mod(c); cells.push(c); return c; };
    const E = (s, t, mod, label) => { const e = makeEdge('outline'); e.source = s ? s.id : null; e.target = t ? t.id : null; if (mod) mod(e); cells.push(e); if (label) { const l = makeEdgeLabel(e, label, 0, { x: 0, y: 0 });  cells.push(l); } return e; };
    const T = (x, y, txt, w) => V('text', x, y, '<b>' + txt + '</b>', c => { c.w = w || 400; c.h = 24; c.style.align = 'left'; c.style.fontSize = '14'; });
    // 1. every shape
    T(40, 10, '1. Every shape');
    let x = 40, row = 0, n = 0;
    for (const d of SHAPE_LIB) {
      if (d.key === 'container' || d.key === 'tabbed' || SHAPES_1_1.has(d.key)) continue; // 1.1.0 shapes are on the Blueprint page, so these pages stay as approved
      const c = V(d.key, x, 50 + row * 110, d.label); if (c.h > 90) { c.h = 90; } x += Math.max(c.w, 90) + 30; n++;
      if (n % 12 === 0) { x = 40; row++; }
    }
    const first = cells.length;
    // 2. text positions
    T(40, 190, '2. Text positions (inside 9, outside 4)');
    let i = 0;
    for (const v of ['top', 'middle', 'bottom']) for (const h of ['left', 'center', 'right']) { V('rect', 40 + (i % 9) * 110, 230, v + ' ' + h, c => { c.w = 100; c.h = 70; c.style.align = h; c.style.verticalAlign = v; }); i++; }
    const out = [['Above', 'top', null], ['Below', 'bottom', null], ['Left of', null, 'left'], ['Right of', null, 'right']];
    out.forEach((o, k) => V('rounded', 140 + k * 230, 360, o[0], c => { c.w = 80; c.h = 50; if (o[1]) { c.style.verticalLabelPosition = o[1]; c.style.verticalAlign = o[1] === 'top' ? 'bottom' : 'top'; } if (o[2]) { c.style.labelPosition = o[2]; c.style.align = o[2] === 'left' ? 'right' : 'left'; } }));
    // 3. rotation
    T(40, 460, '3. Rotation with inside and outside text');
    V('process', 60, 520, 'Rotated 30°', c => { c.style.rotation = '30'; });
    V('person', 260, 500, 'Rotated person', c => { c.style.rotation = '330'; });
    V('decision', 400, 510, 'Rotated 90°', c => { c.style.rotation = '90'; });
    // 4. groups
    T(620, 460, '4. Groups: nested and rotated');
    const ga = V('rect', 620, 510, 'A', c => { c.w = 60; c.h = 40; }), gb = V('rect', 700, 510, 'B', c => { c.w = 60; c.h = 40; }), gc = V('ellipse', 660, 570, 'C', c => { c.w = 50; c.h = 50; });
    const inner = { id: uid(), parent: '1', v: true, value: '', style: parseStyle('group;'), x: 0, y: 0, w: 0, h: 0, extra: null };
    const outer = { id: uid(), parent: '1', v: true, value: '', style: parseStyle('group;'), x: 0, y: 0, w: 0, h: 0, extra: null };
    ga.parent = inner.id; gb.parent = inner.id; inner.parent = outer.id; gc.parent = outer.id;
    cells.splice(cells.indexOf(ga), 0, outer, inner);
    const rg1 = V('rect', 840, 510, 'R1', c => { c.w = 60; c.h = 40; c.style.rotation = '20'; }), rg2 = V('rect', 910, 540, 'R2', c => { c.w = 60; c.h = 40; c.style.rotation = '20'; });
    const rgroup = { id: uid(), parent: '1', v: true, value: '', style: parseStyle('group;'), x: 0, y: 0, w: 0, h: 0, extra: null };
    rg1.parent = rgroup.id; rg2.parent = rgroup.id; cells.splice(cells.indexOf(rg1), 0, rgroup);
    // 5. line ends
    T(40, 660, '5. Line ends: arrows and crow\'s feet');
    ARROW_TYPES.forEach((a, k) => {
      const y = 700 + k * 34;
      V('text', 40, y - 10, a.label, c => { c.w = 120; c.h = 20; c.style.align = 'right'; });
      const tgt = V('rect', 420, y - 12, '', c => { c.w = 40; c.h = 24; });
      E(null, tgt, e => { e.sp = { x: 180, y }; e.style.edgeStyle = 'none'; delete e.style.rounded; e.style.endArrow = a.v; e.style.endSize = /^ER/.test(a.v) ? '12' : '8'; e.style.startArrow = a.v === 'none' ? 'none' : a.v; e.style.startSize = e.style.endSize; e.style.entryX = '0'; e.style.entryY = '0.5'; });
    });
    // 6. routing
    T(560, 660, '6. Routing: straight, elbow, soft elbow, curved; hops; waypoints; labels');
    const kinds = [['straight', 'none'], ['elbow', 'orth'], ['soft', 'soft'], ['curved', 'curved']];
    kinds.forEach((k, j) => {
      const a = V('rounded', 560, 710 + j * 80, k[0], c => { c.w = 90; c.h = 40; }), b = V('rounded', 820, 750 + j * 80, '', c => { c.w = 90; c.h = 40; c.value = 'to'; });
      E(a, b, e => { delete e.style.rounded; if (k[1] === 'none') e.style.edgeStyle = 'none'; else { e.style.edgeStyle = 'orthogonalEdgeStyle'; if (k[1] === 'soft') e.style.rounded = '1'; if (k[1] === 'curved') e.style.curved = '1'; if (k[1] === 'orth') e.style.rounded = '0'; } }, k[0] + ' line');
    });
    const h1 = V('rect', 980, 700, 'Hop A', c => { c.w = 80; c.h = 40; }), h2 = V('rect', 980, 900, 'Hop B', c => { c.w = 80; c.h = 40; });
    E(h1, h2, e => { e.style.exitX = '0.5'; e.style.exitY = '1'; e.style.entryX = '0.5'; e.style.entryY = '0'; });
    const h3 = V('rect', 900, 800, 'Hop C', c => { c.w = 60; c.h = 40; }), h4 = V('rect', 1120, 800, 'Hop D', c => { c.w = 60; c.h = 40; });
    const hopEdge = E(h3, h4, e => { e.style.jumpStyle = 'arc'; e.style.jumpSize = '8'; e.style.exitX = '1'; e.style.exitY = '0.5'; e.style.entryX = '0'; e.style.entryY = '0.5'; e.style.edgeStyle = 'none'; delete e.style.rounded; });
    cells.push(makeEdgeLabel(hopEdge, 'hops over', 0.55, { x: 0, y: -14 }));
    const w1 = V('ellipse', 1200, 700, 'Waypoints', c => { c.w = 80; c.h = 80; }), w2 = V('rect', 1220, 900, 'end', c => { c.w = 80; c.h = 40; });
    const we = E(w1, w2, e => { e.style.edgeStyle = 'none'; delete e.style.rounded; e.pts = [{ x: 1340, y: 760 }, { x: 1340, y: 880 }]; });
    cells.push(Object.assign(makeEdgeLabel(we, 'detached label', -0.2, { x: 50, y: -10 }), {}), makeEdgeLabel(we, 'second<br><i>multi-line</i> label', 0.6, { x: 0, y: 0 }));
    // 7. connection points
    T(40, 1040, '7. Connection points: every default point, and custom points');
    const hubR = V('rect', 260, 1150, 'Rectangle (12 points)', c => { c.w = 140; c.h = 80; });
    const hubC = V('ellipse', 760, 1150, 'Circle (8 points)', c => { c.w = 100; c.h = 100; });
    const ring = (hub, pts, r) => pts.forEach((p, k) => {
      const q = constraintPoint(hub, p), cc = cellCenter(hub), dx = q.x - cc.x, dy = q.y - cc.y, L = Math.hypot(dx, dy) || 1;
      const sat = V('ellipse', q.x + dx / L * r - 8, q.y + dy / L * r - 8, '', c => { c.w = 16; c.h = 16; c.style.fillColor = '#e2e8f0'; });
      E(sat, hub, e => { e.style.edgeStyle = 'none'; delete e.style.rounded; e.style.endArrow = 'none'; e.style.entryX = String(p[0]); e.style.entryY = String(p[1]); });
    });
    ring(hubR, getPoints(hubR), 80); ring(hubC, getPoints(hubC), 80);
    const cp = V('rounded', 1050, 1150, 'Custom points', c => { c.w = 160; c.h = 80; setPoints(c, getPoints(c).concat([[0.1, 0], [0.9, 1], [0, 0.9]])); });
    const cpa = V('rect', 1000, 1060, 'x', c => { c.w = 30; c.h = 24; }), cpb = V('rect', 1220, 1290, 'y', c => { c.w = 30; c.h = 24; }), cpc = V('rect', 940, 1260, 'z', c => { c.w = 30; c.h = 24; });
    E(cpa, cp, e => { e.style.entryX = '0.1'; e.style.entryY = '0'; });
    E(cp, cpb, e => { e.style.exitX = '0.9'; e.style.exitY = '1'; });
    E(cpc, cp, e => { e.style.entryX = '0'; e.style.entryY = '0.9'; });
    // 8. container and notes
    T(40, 1350, '8. Container, callout and sticky note');
    V('container', 40, 1390, 'Container');
    V('callout', 640, 1390, 'A callout with <b>rich</b> <i>text</i> and<br>two lines');
    V('sticky', 840, 1390, '<ul><li>Bullet one</li><li>Bullet two</li></ul>');
    for (let i = first; i < cells.length; i++) { const c = cells[i]; if (c.e) { c.pts = (c.pts || []).map(p => ({ x: p.x, y: p.y + OFF })); if (c.sp) c.sp = { x: c.sp.x, y: c.sp.y + OFF }; if (c.tp) c.tp = { x: c.tp.x, y: c.tp.y + OFF }; } else if (!c.isEdgeLabel) c.y += OFF; }
    V('tabbed', 340, 1390 + OFF, 'Tabbed container');
    // 9. Phosphor icons in a small architecture flow
    const iy = Math.max(...cells.filter(c => !c.e && !isGroupCell(c)).map(c => c.y + c.h)) + 60;
    T(40, iy, '9. Phosphor icons');
    const ICONS9 = ['user', 'browser', 'webhooks-logo', 'cloud', 'queue', 'function', 'database', 'warehouse', 'chart-bar', 'shield-check', 'robot', 'git-branch'];
    let prev = null;
    ICONS9.forEach((n, k) => {
      const c = makeIconVertex(n, 40 + k * 110, iy + 50, 'outline');
      if (k % 3 === 1) c.style.fillColor = '#2563eb'; else if (k % 3 === 2) c.style.fillColor = '#16a34a';
      cells.push(c);
      if (prev && k < 9) E(prev, c);
      prev = c;
    });
    if (sketch !== 'outline') runStyleSwitch({ pages: [pg] }, 'outline', sketch, Object.assign({}, STYLE_DEFAULTS[sketch], { darkCanvas: !!bg }));
    pg.guides = [{ o: 'v', p: 30, c: '#ec4899' }, { o: 'h', p: 1340 + OFF, c: '#14b8a6' }];
    updateGroups(pg);
    doc.pages.push(pg);
  };
  build('Test (Outline)', 'outline');
  build('Test (Filled)', 'filled');
  build('Test (Duotone)', 'duotone');
  build('Test (Sketch)', 'sketch');
  build('Test (Neon dark)', 'neon', NAVY);
  build('Test (Neon light)', 'neon');
  doc.pages.push(blueprintTestPage());
  doc.sketch = false; doc.mode = 'outline';
  S.doc = doc; S.pi = 0; S.sel = []; S.undo = []; S.redo = []; S.file = { handle: null, name: 'Test diagram.drawio' };
  clearCache(); setDirty(true); afterChange(); fitView();
  toast('Test diagram loaded: one page per diagram style.');
}

// Blueprint self-test page: every state, focus, external, a container, every line type with a verb, an icon, and the 1.1.0 shapes.
function blueprintTestPage() {
  const pg = newPage('Test (Blueprint)'), cells = pg.cells;
  const V = (key, x, y, val, mod) => { const c = makeVertex(key, x, y, 'outline'); if (val !== undefined) c.value = val; if (mod) mod(c); cells.push(c); return c; };
  const E = (s, t, verb, line) => { const e = makeEdge('outline'); e.source = s.id; e.target = t.id; cells.push(e); cells.push(makeEdgeLabel(e, verb, 0, { x: 0, y: 0 })); return [e, line]; };
  cells.push(Object.assign(makeVertex('dots', 0, 0, 'outline'), { w: 1440, h: 1040 }));
  V('text', 64, 24, 'Blueprint self-test', c => { c.w = 600; c.h = 44; c.style.align = 'left'; c.style.fontSize = '38'; });
  const states = [''].concat(Object.keys(BP_EMPHASIS), Object.keys(BP_STATES));
  const boxes = states.map((id, i) => V('rect', 64 + (i % 7) * 192, 120 + Math.floor(i / 7) * 120, id ? (bpState(id).label) : 'Plain', c => { c.w = 144; c.h = 64; c._state = id; }));
  const cont = V('container', 40, 380, 'Boundary', c => { c.w = 1360; c.h = 380; });
  const lines = BP_LINES.map(l => l.id), verbs = ['calls', 'will call', 'publishes', 'stops calling', 'see note', 'owns'];
  const pairs = lines.map((l, i) => { const y = 430 + i * 52; const a = V('rect', 80, y, l, c => { c.w = 144; c.h = 40; }), b = V('rect', 600, y, '', c => { c.w = 144; c.h = 40; c.value = 'target'; }); return E(a, b, verbs[i], l); });
  const ic = makeIconVertex('database', 900, 440, 'outline'); cells.push(ic);
  V('harvey0', 900, 560); V('harvey25', 940, 560); V('harvey50', 980, 560); V('harvey75', 1020, 560); V('harvey100', 1060, 560);
  V('checklist', 1120, 430, undefined, c => { c.w = 240; c.h = 90; });
  V('question', 900, 640, undefined, c => { c.w = 420; });
  const note = V('annotation', 520, 40); const an = makeEdge('outline'); an.style = parseStyle(ANNOTATION_EDGE_STYLE); an.source = note.id; an.target = boxes[1].id; cells.push(an);
  V('calloutPanel', 64, 800, '<b>Gateway at 85% capacity</b><br>Scale before the cutover.', c => { c.w = 384; });
  runStyleSwitch({ pages: [pg] }, 'outline', 'blueprint', Object.assign({}, STYLE_DEFAULTS.blueprint));
  const o = STYLE_DEFAULTS.blueprint;
  for (const c of boxes) { if (c._state) bpApplyState(c, c._state, o); delete c._state; }
  boxes[1].style.deMarker = 'alert'; // a focus box can carry an alert marker
  for (const [e, l] of pairs) bpSetLine(e, l);
  cont.style.deCont = '1';
  updateGroups(pg);
  return pg;
}

/* ---------- start-up ---------- */
function init() {
  for (const k of ['person', 'people']) STENCIL_SHAPES[STENCIL_CODES[k]] = k;
  $('#appName').textContent = APP_NAME;
  applyUiTheme(S.prefs.appTheme || DEFAULT_UI_THEME, false);
  initPanels();
  if (!S.doc.pages.some(p => p.cells.length)) S.doc.mode = NEW_STYLE;   // the first, empty diagram starts in Fine Line too
  buildMenus(); buildToolbar(); buildPalette();
  loadPhosphor().then(() => { buildPalette(); clearCache(); requestRender(); }).catch(e => toast('Icons failed to load: ' + e.message, 5000));
  const svg = $('#svg');
  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', onPointerUp);
  svg.addEventListener('pointercancel', onPointerUp);
  // the menu opens on right-button release (see onPointerUp), so a right-drag can pan instead; the keyboard menu key still opens it here
  svg.addEventListener('contextmenu', (e) => { e.preventDefault(); if ((S.drag && S.drag.right) || performance.now() - (S.rightUpAt || 0) < 600) return; contextMenu(e); });
  svg.addEventListener('dblclick', (e) => { if (performance.now() - (S.dblAt || 0) < 600) return; S.dblAt = performance.now(); S.drag = null; onDblClick(e); });
  svg.addEventListener('pointerleave', () => { if (!S.drag && (S.hover || S.hoverPoint)) { S.hover = null; S.hoverPoint = null; requestRender(); } });
  $('#viewport').addEventListener('wheel', onWheel, { passive: false });
  let gs = 1; $('#viewport').addEventListener('gesturestart', (e) => { e.preventDefault(); gs = S.zoom; });
  $('#viewport').addEventListener('gesturechange', (e) => { e.preventDefault(); const r = vpRect(); setZoom(gs * e.scale, { x: e.clientX - r.left, y: e.clientY - r.top }); });
  window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', requestRender);
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.popup') && !e.target.closest('#menus')) closeMenus(); });
  $('#addPage').onclick = addPage;
  $('#docTitle').onclick = () => promptDialog('Rename diagram', 'File name', S.file.name, (v) => { if (v) { S.file.name = ensureExt(v); S.file.handle = HAS_FSA ? null : S.file.handle; updateTitle(); } });
  $('#rulerCorner').onclick = () => runCommand('toggleRulers');
  $('#fileInput').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) await openFileObject(f); e.target.value = ''; });
  // guides from rulers
  for (const [id, o] of [['#rulerTop', 'h'], ['#rulerLeft', 'v']]) {
    $(id).addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const pg = page(); const pre = snapshot();
      if (!pg.guidesVisible) pg.guidesVisible = true;
      const w = toWorld(e); pg.guides.push({ o, p: round2(o === 'h' ? w.y : w.x), c: '#ec4899' });
      S.selGuides = []; S.sel = [];
      S.drag = { type: 'newguide', i: pg.guides.length - 1, pre };
      const mv = (ev) => onPointerMove(ev), up = (ev) => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); onPointerUp(ev); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      requestRender();
    });
  }
  window.addEventListener('beforeunload', (e) => { if (S.dirty && !S.embed) { autosaveTick(); e.preventDefault(); e.returnValue = ''; } });
  setInterval(autosaveTick, 10000);
  loadRecent();
  refreshMap(); afterChange(); updateTitle();
  requestRender();
  setTimeout(() => checkAutosave(false), 300);
  embedStart();
}
function guideDialog(i) {
  const g = page().guides[i]; if (!g) return;
  const d = document.createElement('div');
  d.innerHTML = '<div class="frow"><label class="l">' + (g.o === 'h' ? 'Y position' : 'X position') + '</label><input type="number" id="gdP"></div><div class="frow"><label class="l">Colour</label><input type="color" id="gdC"></div>';
  d.querySelector('#gdP').value = g.p; d.querySelector('#gdC').value = g.c || '#ec4899';
  modal((g.o === 'h' ? 'Horizontal' : 'Vertical') + ' guide', d, [{ t: 'Delete', fn: () => mutate(() => { page().guides.splice(i, 1); S.selGuides = []; }) }, { t: 'Cancel' }, { t: 'OK', primary: true, fn: () => mutate(() => { g.p = parseFloat(d.querySelector('#gdP').value) || g.p; g.c = d.querySelector('#gdC').value; }) }]);
}
document.addEventListener('DOMContentLoaded', init);
/* small scripting hook, used by the self-tests */
window.DiagramEditor = { contrastRun, contrastPass, toneFix, textFix, wcagRatio, apcaLc, hexOklch, oklchHex, hueDelta, isLargeText, autoContrastOn, PALETTE, reparentToContainers, saveFile, openFile, startEdit, finishEdit, sanitizeHtml, safeUrl, safeCss, safeColour, parseStyle, styleStr, labelHtml, applyUiTheme, UI_THEMES, switchCanvas, retuneForCanvas, newDoc, clearCache, pathAbsToD, PH, loadPhosphor, makeIconVertex, runStyleSwitch, convertCell, contrast, styleOpts, STYLE_DEFAULTS, rybRotate, modeOf, setDiagramStyle, iconStyleForSave, dominantColour, phStencil, parsePathAbs, STYLE_MODES, S, renderAll, offeredPoints, workingPoints, computeRoutes, page, runCommand, serializeDoc, parseDrawio, loadText, buildExportSvg, renderToCanvas, mutate, makeVertex, makeEdge, makeEdgeLabel, refreshMap, toScreen, cellById, getPoints, constraintPoint, edgeRoute, exportGliffy, GLIFFY_TRANSFORMS, layeredLayout, applyShapeLayout, minimiseCrossings, countAllCrossings, setSel, fitView, makePdf, deep, BP, BP_STATES, BP_EMPHASIS, BP_LINES, bpApplyState, bpSetLine, bpState, shadowOf, setShadow, harveyStencil, toggleCheck, checkAt, fitChecklist, labelBox, insertShape, SHAPE_LIB, buildFormat, styleRole, getHandles, setPoints, requestRender, addLabelToEdge, styleNewCell, newLabelBackground };
