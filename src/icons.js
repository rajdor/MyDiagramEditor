/* ===== Icon collections (Phosphor), SVG path tools, draw.io stencils ===== */

/* ---------- SVG path parsing: absolute M L C Q A Z ---------- */
function parsePathAbs(d) {
  const toks = String(d).match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const out = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lc = null, lq = null;
  const num = () => parseFloat(toks[i++]);
  const flag = () => { // arc flags may be packed ("0 01" or "011")
    const t = toks[i];
    if (t === '0' || t === '1') { i++; return +t; }
    toks[i] = t.slice(1); return +t[0];
  };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { out.push(['Z']); x = sx; y = sy; lc = lq = null; continue; }
    if (C === 'M') { x = ox + num(); y = oy + num(); sx = x; sy = y; out.push(['M', x, y]); cmd = rel ? 'l' : 'L'; lc = lq = null; continue; }
    if (C === 'L') { x = ox + num(); y = oy + num(); out.push(['L', x, y]); lc = lq = null; continue; }
    if (C === 'H') { x = ox + num(); out.push(['L', x, y]); lc = lq = null; continue; }
    if (C === 'V') { y = oy + num(); out.push(['L', x, y]); lc = lq = null; continue; }
    if (C === 'C') { const a = [ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num()]; out.push(['C', ...a]); lc = [a[2], a[3]]; lq = null; x = a[4]; y = a[5]; continue; }
    if (C === 'S') { const c1 = lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y]; const a = [ox + num(), oy + num(), ox + num(), oy + num()]; out.push(['C', c1[0], c1[1], ...a]); lc = [a[0], a[1]]; lq = null; x = a[2]; y = a[3]; continue; }
    if (C === 'Q') { const a = [ox + num(), oy + num(), ox + num(), oy + num()]; out.push(['Q', ...a]); lq = [a[0], a[1]]; lc = null; x = a[2]; y = a[3]; continue; }
    if (C === 'T') { const c1 = lq ? [2 * x - lq[0], 2 * y - lq[1]] : [x, y]; const a = [ox + num(), oy + num()]; out.push(['Q', c1[0], c1[1], ...a]); lq = c1; lc = null; x = a[0]; y = a[1]; continue; }
    if (C === 'A') { const rx = num(), ry = num(), rot_ = num(), la = flag(), sw = flag(); x = ox + num(); y = oy + num(); out.push(['A', rx, ry, rot_, la, sw, x, y]); lc = lq = null; continue; }
    i++; // unknown token: skip
  }
  return out;
}
// Scale (uniform s) and translate an absolute command list back into a path string.
function pathAbsToD(cmds, s, tx, ty) {
  const X = (v) => round2(tx + v * s), Y = (v) => round2(ty + v * s);
  let d = '';
  for (const c of cmds) {
    if (c[0] === 'Z') d += 'Z';
    else if (c[0] === 'A') d += 'A' + round2(c[1] * s) + ',' + round2(c[2] * s) + ' ' + c[3] + ' ' + c[4] + ' ' + c[5] + ' ' + X(c[6]) + ',' + Y(c[7]);
    else { d += c[0]; for (let k = 1; k < c.length; k += 2) d += (k > 1 ? ' ' : '') + X(c[k]) + ',' + Y(c[k + 1]); }
  }
  return d;
}

/* ---------- draw.io stencils ---------- */
function stencilPathXml(cmds) {
  let s = '<path>';
  for (const c of cmds) {
    if (c[0] === 'M') s += '<move x="' + c[1] + '" y="' + c[2] + '"/>';
    else if (c[0] === 'L') s += '<line x="' + c[1] + '" y="' + c[2] + '"/>';
    else if (c[0] === 'C') s += '<curve x1="' + c[1] + '" y1="' + c[2] + '" x2="' + c[3] + '" y2="' + c[4] + '" x3="' + c[5] + '" y3="' + c[6] + '"/>';
    else if (c[0] === 'Q') s += '<quad x1="' + c[1] + '" y1="' + c[2] + '" x2="' + c[3] + '" y2="' + c[4] + '"/>';
    else if (c[0] === 'A') s += '<arc rx="' + c[1] + '" ry="' + c[2] + '" x-axis-rotation="' + c[3] + '" large-arc-flag="' + c[4] + '" sweep-flag="' + c[5] + '" x="' + c[6] + '" y="' + c[7] + '"/>';
    else if (c[0] === 'Z') s += '<close/>';
  }
  return s + '</path>';
}
// layers: [{ d, alpha }] in a 256 x 256 box. Glyphs are filled with the shape's fillColor.
function stencilFromLayers(name, layers) {
  let xml = '<shape name="' + esc(name) + '" w="256" h="256" aspect="fixed" strokewidth="inherit"><background></background><foreground>';
  for (const l of layers) {
    if (l.alpha < 1) xml += '<alpha alpha="' + l.alpha + '"/>';
    xml += stencilPathXml(parsePathAbs(l.d)) + '<fill/>';
    if (l.alpha < 1) xml += '<alpha alpha="1"/>';
  }
  return xml + '</foreground></shape>';
}
// draw.io reads stencil(...) as base64 of raw-deflated, URI-encoded XML. Stored (uncompressed) deflate blocks are valid and need no library.
function deflateStoredB64(ascii) {
  const n = ascii.length, parts = [];
  for (let off = 0; off < n || off === 0; off += 65535) {
    const len = Math.min(65535, n - off), last = off + len >= n;
    let h = String.fromCharCode(last ? 1 : 0, len & 255, len >> 8, (~len) & 255, ((~len) >> 8) & 255);
    parts.push(h + ascii.slice(off, off + len));
    if (last) break;
  }
  return btoa(parts.join(''));
}
function stencilCode(xml) { return 'stencil(' + deflateStoredB64(encodeURIComponent(xml)) + ')'; }

/* ---------- Phosphor collection ---------- */
const PH = { ready: false, version: '', themes: [], list: [], byName: new Map(), cache: new Map(), waiters: [] };
const PH_WEIGHTS = ['regular', 'fill', 'duotone'];
function loadPhosphor() { return PH.promise || (PH.promise = loadPhosphorNow()); }
async function loadPhosphorNow() {
  if (PH.ready || typeof PHOSPHOR_B64 === 'undefined') return;
  const data = JSON.parse(await inflateRawB64(PHOSPHOR_B64));
  PH.version = data.v;
  PH.themes = data.themes.map(t => t.charAt(0).toUpperCase() + t.slice(1));
  PH.list = data.list.map(r => ({ name: r[0], theme: r[1], tags: r[2], reg: r[3], fill: r[4], duoBg: r[5], duoFg: r[6] || r[3] }));
  for (const ic of PH.list) PH.byName.set(ic.name, ic);
  PH.ready = true;
  for (const f of PH.waiters.splice(0)) f();
}
function onPhosphorReady(f) { if (PH.ready) f(); else PH.waiters.push(f); }
function phLabel(name) { return name.split('-').map((w, i) => i ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }
// Path layers for a weight, as absolute command lists (cached).
function phLayers(name, weight) {
  const key = name + '|' + weight;
  if (PH.cache.has(key)) return PH.cache.get(key);
  const ic = PH.byName.get(name);
  if (!ic) return null;
  let layers;
  if (weight === 'fill') layers = [{ d: ic.fill, alpha: 1 }];
  else if (weight === 'duotone') layers = (ic.duoBg ? [{ d: ic.duoBg, alpha: 0.2 }] : []).concat([{ d: ic.duoFg, alpha: 1 }]);
  else layers = [{ d: ic.reg, alpha: 1 }];
  const out = layers.map(l => ({ cmds: parsePathAbs(l.d), d: l.d, alpha: l.alpha }));
  PH.cache.set(key, out);
  return out;
}
function phStencil(name, weight) { const ic = PH.byName.get(name); return ic ? stencilCode(stencilFromLayers('phosphor-' + name + '-' + weight, phLayers(name, weight))) : null; }
// Icons keep only their Phosphor name (dePh) and weight (deW) while editing; the draw.io stencil is generated on save.
function setIconWeight(c, weight) {
  if (!c.style.dePh) return;
  if (!PH_WEIGHTS.includes(weight) || weight === 'regular') delete c.style.deW; else c.style.deW = weight;
}
const PH_CODES = new Map();
function iconStyleForSave(st) {
  const key = st.dePh + '|' + (st.deW || 'regular');
  if (!PH_CODES.has(key)) PH_CODES.set(key, PH.ready ? phStencil(st.dePh, st.deW || 'regular') : null);
  const code = PH_CODES.get(key);
  return code ? Object.assign({}, st, { shape: code }) : st;
}
const ICON_STYLE = 'html=1;aspect=fixed;strokeColor=none;fillColor=#475569;verticalLabelPosition=bottom;verticalAlign=top;labelPosition=center;align=center;fontSize=12;fontColor=#1e293b;';
function makeIconVertex(name, x, y, mode) {
  const c = { id: uid(), parent: '1', v: true, value: phLabel(name), style: parseStyle(ICON_STYLE), x, y, w: 48, h: 48, extra: null };
  c.style.dePh = name;
  setPoints(c, defaultPoints(c));
  if (mode && mode !== 'outline') styleNewCell(c, mode);
  return c;
}
function iconWeightFor(mode) { return mode === 'filled' ? 'fill' : mode === 'duotone' ? 'duotone' : 'regular'; }
// Phosphor glyph as a standalone SVG string (Gliffy export uses it as an image).
function phSvg(name, weight, color) {
  const ls = phLayers(name, weight);
  if (!ls) return null;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">' + ls.map(l => '<path d="' + l.d + '" fill="' + color + '"' + (l.alpha < 1 ? ' opacity="' + l.alpha + '"' : '') + '/>').join('') + '</svg>';
}
function phSearch(q) {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const words = t.split(/\s+/);
  const scored = [];
  for (const ic of PH.list) {
    const hay = ic.name.replace(/-/g, ' ') + ' ' + ic.tags.toLowerCase();
    if (!words.every(w => hay.includes(w))) continue;
    scored.push({ ic, s: ic.name === t.replace(/\s+/g, '-') ? 0 : ic.name.includes(words[0]) ? 1 : 2 });
  }
  return scored.sort((a, b) => a.s - b.s || a.ic.name.localeCompare(b.ic.name)).map(x => x.ic);
}
