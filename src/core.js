/* ===== Core: utilities, styles, geometry, shapes, model, draw.io file format ===== */
const APP_NAME = 'Diagram Editor';
const APP_VERSION = '1.0.0';
const SVGNS = 'http://www.w3.org/2000/svg';
const XHTMLNS = 'http://www.w3.org/1999/xhtml';
const SKETCH_FONT = 'Architects Daughter';
const SKETCH_FONT_SOURCE = 'https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DArchitects%2BDaughter';
const DEFAULT_FONT = 'Helvetica';

let _idc = 0;
function uid() { return 'c' + Date.now().toString(36) + (++_idc).toString(36) + Math.random().toString(36).slice(2, 6); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function deep(o) { return JSON.parse(JSON.stringify(o)); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escAttr(s) { return esc(s).replace(/\n/g, '&#xa;').replace(/\r/g, '&#xd;').replace(/\t/g, '&#x9;'); }
// A colour value that is safe to put into CSS: hex, a colour name, rgb()/hsl() with numbers only, or draw.io's light-dark().
const COLOUR_TOKEN = '(?:#[0-9a-f]{3,8}|[a-z]{3,30}|(?:rgba?|hsla?)\\(\\s*[0-9.,%\\s/deg]+\\))';
const SAFE_COLOUR = new RegExp('^\\s*(?:' + COLOUR_TOKEN + '|light-dark\\(\\s*' + COLOUR_TOKEN + '\\s*,\\s*' + COLOUR_TOKEN + '\\s*\\))\\s*$', 'i');
function safeColour(v) { return SAFE_COLOUR.test(String(v)); }
function round2(v) { return Math.round(v * 100) / 100; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h) % 2147483646 + 1; }

/* ---------- styles ---------- */
function parseStyle(s) {
  const o = {};
  if (!s) return o;
  for (const part of String(s).split(';')) {
    if (!part) continue;
    const i = part.indexOf('=');
    const k = i < 0 ? part : part.slice(0, i);
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue; // never touch the object prototype
    o[k] = i < 0 ? null : part.slice(i + 1);
  }
  return o;
}
function styleStr(o) {
  const ks = Object.keys(o);
  if (!ks.length) return '';
  return ks.map(k => o[k] === null ? k : k + '=' + o[k]).join(';') + ';';
}
function sv(st, k, d) { const v = st[k]; return (v === undefined || v === null || v === '') ? d : v; }
function sn(st, k, d) { const v = parseFloat(st[k]); return isNaN(v) ? d : v; }
function sb(st, k, d) { const v = st[k]; if (v === undefined || v === null) return d; return v === '1' || v === 'true'; }
function setStyle(st, k, v) { if (v === undefined || v === null) delete st[k]; else st[k] = String(v); }

/* ---------- geometry ---------- */
const P = (x, y) => ({ x, y });
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function rot(p, c, deg) {
  if (!deg) return { x: p.x, y: p.y };
  const a = deg * Math.PI / 180, cs = Math.cos(a), sn_ = Math.sin(a);
  const dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx * cs - dy * sn_, y: c.y + dx * sn_ + dy * cs };
}
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]); return L; }
function pointAtFrac(pts, f) {
  const L = polyLen(pts); let target = clamp(f, 0, 1) * L;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (target <= d || i === pts.length - 1) {
      const t = d ? clamp(target / d, 0, 1) : 0;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t, seg: i - 1 };
    }
    target -= d;
  }
  return { x: pts[0].x, y: pts[0].y, seg: 0 };
}
function nearestOnSeg(a, b, p) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
  let t = L2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2 : 0; t = clamp(t, 0, 1);
  const q = { x: a.x + dx * t, y: a.y + dy * t };
  return { pt: q, t, d: dist(q, p) };
}
function nearestOnPoly(pts, p, closed) {
  let best = null, acc = 0; const L = polyLen(closed ? pts.concat([pts[0]]) : pts);
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const r = nearestOnSeg(a, b, p), segL = dist(a, b);
    if (!best || r.d < best.d) best = { pt: r.pt, d: r.d, seg: i, frac: L ? (acc + segL * r.t) / L : 0 };
    acc += segL;
  }
  return best;
}
function segInter(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a.x + r.x * t, y: a.y + r.y * t, t, u };
}
function rayPolyHit(c, dir, poly) {
  let best = null;
  const far = { x: c.x + dir.x * 1e6, y: c.y + dir.y * 1e6 };
  for (let i = 0; i < poly.length; i++) {
    const h = segInter(c, far, poly[i], poly[(i + 1) % poly.length]);
    if (h && (!best || h.t > best.t)) best = h;
  }
  return best ? { x: best.x, y: best.y } : null;
}
function pointInPoly(p, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (((a.y > p.y) !== (b.y > p.y)) && (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)) ins = !ins;
  }
  return ins;
}
function bboxOf(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
function unionBox(a, b) {
  if (!a) return b; if (!b) return a;
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}
function boxIntersects(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }

/* ---------- shape kinds ---------- */
const STENCIL_SHAPES = {}; // filled by build: 'stencil(...)' -> 'person'
function shapeKind(cell) {
  const st = cell.style;
  if (st.group !== undefined) return 'group';
  if (st.dePh) return 'icon';
  if (st.edgeLabel !== undefined) return 'edgeLabel';
  if (st.text !== undefined || st.shape === 'text') return 'text';
  const shape = st.shape;
  if (shape) {
    if (shape.startsWith('stencil(')) return STENCIL_SHAPES[shape] || 'unknown';
    if (shape === 'ellipse') return 'ellipse';
    if (shape === 'rhombus') return 'rhombus';
    if (shape === 'parallelogram') return 'parallelogram';
    if (shape === 'cylinder3' || shape === 'cylinder') return 'cylinder';
    if (shape === 'document') return 'document';
    if (shape === 'callout') return 'callout';
    if (shape === 'note' || shape === 'note2') return 'note';
    if (shape === 'rectangle' || shape === 'rect') return 'rect';
    if (shape === 'umlActor') return 'person';
    const MAP = { triangle: 'triangle', hexagon: 'hexagon', trapezoid: 'trapezoid', step: 'step', cloud: 'cloud', cross: 'cross', singleArrow: 'singleArrow', doubleArrow: 'doubleArrow',
      process: 'predef', manualInput: 'manualInput', delay: 'delay', 'mxgraph.flowchart.display': 'display', internalStorage: 'internalStorage', card: 'card', dataStorage: 'dataStorage',
      loopLimit: 'loopLimit', offPageConnector: 'offPage', 'mxgraph.flowchart.multi-document': 'multidoc', folder: 'folder', partialRectangle: 'partialRect' };
    if (MAP[shape]) return MAP[shape];
    return 'unknown';
  }
  if (st.ellipse !== undefined) return 'ellipse';
  if (st.rhombus !== undefined) return 'rhombus';
  if (st.triangle !== undefined) return 'triangle';
  if (st.hexagon !== undefined) return 'hexagon';
  if (st.swimlane !== undefined) return 'rect';
  return 'rect';
}

const RECT12 = [[0.25, 0], [0.5, 0], [0.75, 0], [1, 0.25], [1, 0.5], [1, 0.75], [0.25, 1], [0.5, 1], [0.75, 1], [0, 0.25], [0, 0.5], [0, 0.75]];
const ELLIPSE8 = (() => { const r = []; for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4; r.push([round3(0.5 + 0.5 * Math.cos(a)), round3(0.5 + 0.5 * Math.sin(a))]); } return r; })();
function round3(v) { return Math.round(v * 1000) / 1000; }
function edgePts(a, b) { return [0.25, 0.5, 0.75].map(t => [round3(a[0] + (b[0] - a[0]) * t), round3(a[1] + (b[1] - a[1]) * t)]); }
const RHOMBUS12 = [[0.5, 0]].concat(edgePts([0.5, 0], [1, 0.5]), [[1, 0.5]], edgePts([1, 0.5], [0.5, 1]), [[0.5, 1]], edgePts([0.5, 1], [0, 0.5]), [[0, 0.5]], edgePts([0, 0.5], [0.5, 0]));

function defaultPoints(cell) {
  const k = shapeKind(cell);
  if (k === 'ellipse') return ELLIPSE8.map(p => p.slice());
  if (k === 'rhombus') return RHOMBUS12.map(p => p.slice());
  if (EDGE_POINT_KINDS.has(k)) {
    const poly = outlineLocal(cell).map(p => [(p.x - cell.x) / Math.max(1, cell.w), (p.y - cell.y) / Math.max(1, cell.h)]);
    let out = []; for (let i = 0; i < poly.length; i++) { out.push(poly[i].map(round3)); out = out.concat(edgePts(poly[i], poly[(i + 1) % poly.length])); }
    return out;
  }
  if (k === 'folder') { const ty = round3(clamp(sn(cell.style, 'tabHeight', 24) / Math.max(1, cell.h), 0, 0.9)); return RECT12.map(p => [p[0], p[1] === 0 ? ty : p[1] === 1 ? 1 : round3(ty + (1 - ty) * p[1])]); }
  if (k === 'parallelogram') {
    const s = clamp(sn(cell.style, 'size', 20) / Math.max(1, cell.w), 0, 0.5);
    return [].concat(edgePts([s, 0], [1, 0]), edgePts([1, 0], [1 - s, 1]), edgePts([1 - s, 1], [0, 1]), edgePts([0, 1], [s, 0]));
  }
  return RECT12.map(p => p.slice());
}
function getPoints(cell) {
  if (cell.style.points) {
    try { const a = JSON.parse(cell.style.points); if (Array.isArray(a)) return a.filter(p => Array.isArray(p) && p.length >= 2).map(p => [ +p[0], +p[1] ]); } catch (e) { }
  }
  return defaultPoints(cell);
}
function setPoints(cell, pts) { cell.style.points = JSON.stringify(pts.map(p => [round3(p[0]), round3(p[1])])); }

/* local outline (unrotated, absolute coords) */
const POLY_KINDS = new Set(['rhombus', 'parallelogram', 'callout', 'triangle', 'hexagon', 'trapezoid', 'step', 'singleArrow', 'doubleArrow', 'cross', 'manualInput', 'card', 'loopLimit', 'offPage', 'cloud', 'delay', 'display', 'dataStorage']);
const EDGE_POINT_KINDS = new Set(['triangle', 'hexagon', 'trapezoid', 'step']);
function fixedOrRel(st, w, d, rel) { return sb(st, 'fixedSize', false) ? Math.min(sn(st, 'size', d), w / 2) : w * clamp(sn(st, 'size', rel), 0, 0.5); }
function outlineLocal(cell) {
  const x = cell.x, y = cell.y, w = cell.w, h = cell.h, k = shapeKind(cell), st = cell.style;
  const L = (arr) => arr.map(q => P(x + q[0], y + q[1]));
  if (k === 'triangle') { const d = sv(st, 'direction', 'east'); return d === 'north' ? L([[w / 2, 0], [w, h], [0, h]]) : d === 'south' ? L([[0, 0], [w, 0], [w / 2, h]]) : d === 'west' ? L([[w, 0], [w, h], [0, h / 2]]) : L([[0, 0], [w, h / 2], [0, h]]); }
  if (k === 'hexagon') { const s_ = fixedOrRel(st, w, 20, 0.25); return L([[s_, 0], [w - s_, 0], [w, h / 2], [w - s_, h], [s_, h], [0, h / 2]]); }
  if (k === 'trapezoid') { const s_ = fixedOrRel(st, w, 20, 0.2); return sb(st, 'flipV', false) ? L([[0, 0], [w, 0], [w - s_, h], [s_, h]]) : L([[s_, 0], [w - s_, 0], [w, h], [0, h]]); }
  if (k === 'step') { const s_ = fixedOrRel(st, w, 20, 0.2); return L([[0, 0], [w - s_, 0], [w, h / 2], [w - s_, h], [0, h], [s_, h / 2]]); }
  if (k === 'singleArrow' || k === 'doubleArrow') {
    const aw = h * clamp(sn(st, 'arrowWidth', 0.3), 0, 1), as = w * clamp(sn(st, 'arrowSize', 0.2), 0, 1), at = (h - aw) / 2, ab = at + aw;
    if (k === 'singleArrow') return L([[0, at], [w - as, at], [w - as, 0], [w, h / 2], [w - as, h], [w - as, ab], [0, ab]]);
    return L([[0, h / 2], [as, 0], [as, at], [w - as, at], [w - as, 0], [w, h / 2], [w - as, h], [w - as, ab], [as, ab], [as, h]]);
  }
  if (k === 'cross') { const m = Math.min(w, h), z = clamp(m * sn(st, 'size', 0.2), 0, m), t = (h - z) / 2, b = t + z, l = (w - z) / 2, r = l + z; return L([[l, 0], [r, 0], [r, t], [w, t], [w, b], [r, b], [r, h], [l, h], [l, b], [0, b], [0, t], [l, t]]); }
  if (k === 'manualInput') { const s_ = Math.min(sn(st, 'size', 30), h); return L([[0, s_], [w, 0], [w, h], [0, h]]); }
  if (k === 'card') { const s_ = Math.min(sn(st, 'size', 30), w, h); return L([[s_, 0], [w, 0], [w, h], [0, h], [0, s_]]); }
  if (k === 'loopLimit') { const s_ = Math.min(sn(st, 'size', 20), w / 2, h); return L([[s_, 0], [w - s_, 0], [w, s_], [w, h], [0, h], [0, s_]]); }
  if (k === 'offPage') { const s_ = h * clamp(sn(st, 'size', 0.375), 0, 1); return L([[0, 0], [w, 0], [w, h - s_], [w / 2, h], [0, h - s_]]); }
  if (k === 'cloud') { const r = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2; r.push(P(x + w / 2 + w / 2 * Math.cos(a), y + h / 2 + h / 2 * Math.sin(a))); } return r; }
  if (k === 'delay') { const dx = Math.min(w / 2, h / 2), r = [P(x, y), P(x + w - dx, y)]; for (let i = 1; i < 12; i++) { const a = -Math.PI / 2 + i / 12 * Math.PI; r.push(P(x + w - dx + dx * Math.cos(a), y + h / 2 + h / 2 * Math.sin(a))); } r.push(P(x + w - dx, y + h), P(x, y + h)); return r; }
  if (k === 'display') { const d = w * 0.15, r = [P(x, y + h / 2), P(x + d, y), P(x + w - d, y)]; for (let i = 1; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI; r.push(P(x + w - d + d * Math.cos(a), y + h / 2 + h / 2 * Math.sin(a))); } r.push(P(x + w - d, y + h), P(x + d, y + h)); return r; }
  if (k === 'ellipse') { const r = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2; r.push(P(x + w / 2 + w / 2 * Math.cos(a), y + h / 2 + h / 2 * Math.sin(a))); } return r; }
  if (k === 'rhombus') return [P(x + w / 2, y), P(x + w, y + h / 2), P(x + w / 2, y + h), P(x, y + h / 2)];
  if (k === 'parallelogram') { const s = Math.min(sn(st, 'size', 20), w / 2); return [P(x + s, y), P(x + w, y), P(x + w - s, y + h), P(x, y + h)]; }
  if (k === 'callout') {
    const s = sn(st, 'size', 20), dx = w * clamp(sn(st, 'position', 0.5), 0, 1), dx2 = w * clamp(sn(st, 'position2', 0.5), 0, 1), base = clamp(sn(st, 'base', 20), 0, w);
    return [P(x, y), P(x + w, y), P(x + w, y + h - s), P(x + Math.min(w, dx + base), y + h - s), P(x + dx2, y + h), P(x + Math.max(0, dx), y + h - s), P(x, y + h - s)];
  }
  return [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)];
}
function cellCenter(c) { return { x: c.x + c.w / 2, y: c.y + c.h / 2 }; }
function cellRot(c) { return sn(c.style, 'rotation', 0); }
function outlineWorld(cell) { const r = cellRot(cell), c = cellCenter(cell); return outlineLocal(cell).map(p => rot(p, c, r)); }
/* constraint (relative) -> world point, projected to perimeter like draw.io */
function constraintPoint(cell, rel) {
  const lp = P(cell.x + rel[0] * cell.w, cell.y + rel[1] * cell.h), c = cellCenter(cell);
  const poly = outlineLocal(cell);
  let q = lp;
  const near = nearestOnPoly(poly, lp, true);
  if (near && near.d > 0.5) {
    const dir = { x: lp.x - c.x, y: lp.y - c.y };
    if (shapeKind(cell) === 'ellipse' && Math.hypot(dir.x, dir.y) > 1e-6) { const a = cell.w / 2, b = cell.h / 2, t = 1 / Math.sqrt(dir.x * dir.x / (a * a) + dir.y * dir.y / (b * b)); return rot({ x: c.x + dir.x * t, y: c.y + dir.y * t }, c, cellRot(cell)); }
    if (Math.hypot(dir.x, dir.y) > 1e-6) { const h = rayPolyHit(c, dir, poly); if (h) q = h; }
  }
  return rot(q, c, cellRot(cell));
}
function worldBox(cell) { // axis-aligned bbox of rotated cell
  const r = cellRot(cell); if (!r) return { x: cell.x, y: cell.y, w: cell.w, h: cell.h };
  const c = cellCenter(cell);
  return bboxOf([P(cell.x, cell.y), P(cell.x + cell.w, cell.y), P(cell.x + cell.w, cell.y + cell.h), P(cell.x, cell.y + cell.h)].map(p => rot(p, c, r)));
}

/* ---------- HTML sanitising ---------- */
const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'BR', 'DIV', 'P', 'SPAN', 'FONT', 'UL', 'OL', 'LI', 'SUB', 'SUP', 'A', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'PRE', 'CODE', 'HR', 'TABLE', 'TBODY', 'TR', 'TD', 'TH']);
// Links in labels: only web, mail and phone links, page anchors and relative paths. Browsers ignore tabs, newlines and
// control characters inside a URL scheme ("java\tscript:"), so those are removed before the scheme is checked.
function safeUrl(u) {
  const t = String(u || '').replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(t);
  return !m || ['http', 'https', 'mailto', 'tel'].includes(m[1].toLowerCase());
}
// Inline CSS in labels: keep plain declarations; drop anything that can load a resource, run code or escape the label box.
function safeCss(css) {
  return String(css || '').split(';').map(d => d.trim()).filter(d => {
    if (!d) return false;
    const i = d.indexOf(':'); if (i < 1) return false;
    const prop = d.slice(0, i).trim().toLowerCase(), val = d.slice(i + 1).toLowerCase();
    if (!/^-?[a-z-]+$/.test(prop) || /^(position|behavior|-moz-binding|content|cursor|mask|filter)/.test(prop)) return false;
    return !/url\s*\(|expression|image-set|@import|javascript:|[<>{}\\]/.test(val); // a backslash could hide any of these as a CSS escape
  }).join(';');
}
function sanitizeHtml(html) {
  if (!html) return '';
  let out = sanitizeOnce(html);
  for (let i = 0; i < 3; i++) { const again = sanitizeOnce(out); if (again === out) break; out = again; }
  return out;
}
function sanitizeOnce(html) {
  const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
  const root = doc.body.firstChild;
  const walk = (el) => {
    for (const ch of Array.from(el.childNodes)) {
      if (ch.nodeType === 1) {
        if (!ALLOWED_TAGS.has(ch.tagName)) {
          if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'].includes(ch.tagName)) { ch.remove(); continue; }
          walk(ch); while (ch.firstChild) el.insertBefore(ch.firstChild, ch); ch.remove(); continue;
        }
        for (const a of Array.from(ch.attributes)) {
          const n = a.name.toLowerCase();
          if (!['style', 'color', 'face', 'size', 'href', 'align'].includes(n)) ch.removeAttribute(a.name);
          else if (n === 'href' && (ch.tagName !== 'A' || !safeUrl(a.value))) ch.removeAttribute(a.name);
          else if (n === 'style') { const v = safeCss(a.value); if (v) ch.setAttribute('style', v); else ch.removeAttribute('style'); }
          else if (n === 'color' && !safeColour(a.value)) ch.removeAttribute(a.name);
          else if (n === 'face' && /[<>{};\\]/.test(a.value)) ch.removeAttribute(a.name);
        }
        walk(ch);
      } else if (ch.nodeType !== 3) ch.remove();
    }
  };
  walk(root);
  return root ? root.innerHTML : '';
}
function labelHtml(cell) {
  const v = cell.value || '';
  if (sb(cell.style, 'html', false)) return sanitizeHtml(v);
  return esc(v).replace(/\n/g, '<br>');
}
function htmlToPlain(html) { const d = document.createElement('div'); d.innerHTML = html; return d.innerText || d.textContent || ''; }

/* ---------- model ---------- */
function newPage(name) {
  return { id: uid(), name: name || 'Page-1', cells: [], layers: [{ id: '1', attrs: {}, extra: null }], rootId: '0', rootAttrs: {}, rootTag: null,
    modelAttrs: {}, grid: true, gridSize: 10, smartGuides: true, gridVisible: true, guides: [], guidesLocked: false, guidesVisible: true, rulers: true };
}
function newDoc() { return { pages: [newPage('Page-1')], sketch: false, mode: 'outline' }; }
function cellMap(page) { const m = new Map(); for (const c of page.cells) m.set(c.id, c); return m; }

/* ---------- compression ---------- */
const MAX_PAGE_BYTES = 64 << 20; // 64 MB of XML per compressed page
async function inflateRawB64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const parts = []; let total = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    total += value.length;
    if (total > MAX_PAGE_BYTES) { try { reader.cancel(); } catch (e) { } throw new Error('A compressed page is larger than ' + (MAX_PAGE_BYTES >> 20) + ' MB when expanded.'); }
    parts.push(value);
  }
  const u8 = new Uint8Array(total); let o = 0; for (const p of parts) { u8.set(p, o); o += p.length; }
  const s = new TextDecoder('utf-8').decode(u8);
  try { return decodeURIComponent(s); } catch (e) { return s; }
}

/* ---------- draw.io import ---------- */
const KNOWN_CELL_ATTRS = new Set(['id', 'parent', 'value', 'style', 'vertex', 'edge', 'source', 'target']);
const KNOWN_GEO_ATTRS = new Set(['x', 'y', 'width', 'height', 'relative', 'as']);
async function parseDrawio(text) {
  const xml = new DOMParser().parseFromString(text, 'text/xml');
  if (xml.getElementsByTagName('parsererror').length) throw new Error('This file is not valid XML.');
  const top = xml.documentElement;
  const doc = { pages: [], sketch: false, fileAttrs: {} };
  let diagrams = [];
  if (top.nodeName === 'mxfile') {
    for (const a of Array.from(top.attributes)) doc.fileAttrs[a.name] = a.value;
    diagrams = Array.from(top.children).filter(e => e.nodeName === 'diagram');
  } else if (top.nodeName === 'mxGraphModel') {
    diagrams = [{ __model: top, getAttribute: () => null, attributes: [] }];
  } else throw new Error('Not a draw.io file (expected <mxfile> or <mxGraphModel>).');
  let i = 0;
  for (const d of diagrams) {
    i++;
    let model = d.__model || Array.from(d.children || []).find(e => e.nodeName === 'mxGraphModel');
    if (!model) {
      const raw = (d.textContent || '').trim();
      if (raw) {
        let dec = raw;
        if (!raw.startsWith('<')) { try { dec = await inflateRawB64(raw); } catch (e) { throw new Error('Page ' + i + ' could not be decompressed (' + e.message + ').'); } }
        model = new DOMParser().parseFromString(dec, 'text/xml').documentElement;
      }
    }
    const page = newPage(d.getAttribute('name') || ('Page-' + i));
    if (d.getAttribute('id')) page.id = d.getAttribute('id');
    page.diagramAttrs = {};
    for (const a of Array.from(d.attributes || [])) if (!['name', 'id'].includes(a.name)) page.diagramAttrs[a.name] = a.value;
    if (model && model.nodeName === 'mxGraphModel') readModel(model, page);
    doc.pages.push(page);
  }
  if (!doc.pages.length) doc.pages.push(newPage());
  for (const p of doc.pages) for (const c of p.cells) if (c.style.dePh) delete c.style.shape; // icon stencils are regenerated on save
  doc.mode = docModeFromCells(doc);
  doc.sketch = doc.mode === 'sketch';
  return doc;
}

function readModel(model, page) {
  page.modelAttrs = {};
  for (const a of Array.from(model.attributes)) {
    if (a.name === 'grid') page.grid = a.value === '1';
    else if (a.name === 'gridSize') page.gridSize = Math.min(1000, Math.max(1, num(a.value) || 10));
    else if (a.name === 'guides') page.smartGuides = a.value === '1';
    else page.modelAttrs[a.name] = a.value;
  }
  const root = Array.from(model.children).find(e => e.nodeName === 'root');
  const raws = [];
  if (root) for (const el of Array.from(root.children)) {
    let tag = null, wrapAttrs = {}, cellEl = el;
    if (el.nodeName !== 'mxCell') {
      tag = el.nodeName;
      for (const a of Array.from(el.attributes)) wrapAttrs[a.name] = a.value;
      cellEl = Array.from(el.children).find(e => e.nodeName === 'mxCell');
      if (!cellEl) { cellEl = null; }
    }
    const g = (n) => cellEl ? cellEl.getAttribute(n) : null;
    const r = {
      id: tag ? wrapAttrs.id : el.getAttribute('id'),
      parent: g('parent'), style: g('style') || '',
      value: tag ? (wrapAttrs.label !== undefined ? wrapAttrs.label : '') : (el.getAttribute('value') || ''),
      vertex: g('vertex') === '1', edge: g('edge') === '1', source: g('source'), target: g('target'),
      tag, wrapAttrs, cellAttrs: {}, geo: null, rawChildren: []
    };
    if (tag) { delete r.wrapAttrs.id; delete r.wrapAttrs.label; }
    if (cellEl) {
      for (const a of Array.from(cellEl.attributes)) if (!KNOWN_CELL_ATTRS.has(a.name)) r.cellAttrs[a.name] = a.value;
      for (const ch of Array.from(cellEl.children)) {
        if (ch.nodeName === 'mxGeometry') r.geo = readGeo(ch);
        else r.rawChildren.push(new XMLSerializer().serializeToString(ch));
      }
    }
    raws.push(r);
  }
  const seen = new Set();
  for (const r of raws) { if (r.id == null || r.id === '' || seen.has(r.id)) r.id = uid(); seen.add(r.id); }
  const byId = new Map(raws.map(r => [r.id, r]));
  const rootRaw = raws.find(r => !r.parent);
  page.rootId = rootRaw ? rootRaw.id : '0';
  page.rootAttrs = {}; page.rootTag = null;
  if (rootRaw && rootRaw.tag) {
    page.rootTag = rootRaw.tag;
    for (const k in rootRaw.wrapAttrs) {
      const v = rootRaw.wrapAttrs[k];
      if (k === 'deGuides') { try { const g = JSON.parse(v); if (Array.isArray(g)) page.guides = g.filter(x => x && (x.o === 'h' || x.o === 'v') && isFinite(x.p)).map(x => ({ o: x.o, p: +x.p, c: safeColour(x.c) ? String(x.c) : '#ec4899' })).slice(0, 500); } catch (e) { } }
      else if (k === 'deGuidesLocked') page.guidesLocked = v === '1';
      else if (k === 'deGuidesVisible') page.guidesVisible = v !== '0';
      else if (k === 'deGridVisible') page.gridVisible = v !== '0';
      else if (k === 'deRulers') page.rulers = v !== '0';
      else page.rootAttrs[k] = v;
    }
  }
  page.layers = raws.filter(r => r.parent === page.rootId).map(r => ({ id: r.id, raw: r }));
  if (!page.layers.length) page.layers = [{ id: '1', attrs: {}, extra: null }];
  const layerIds = new Set(page.layers.map(l => l.id));
  // absolute positions
  // parents that do not exist, or that loop back to the cell itself, are replaced by the first layer
  for (const r of raws) {
    if (r === rootRaw || layerIds.has(r.id)) continue;
    if (!r.parent || !byId.has(r.parent) || r.parent === r.id) { r.parent = page.layers[0].id; continue; }
    const path = new Set([r.id]); let p = r.parent;
    while (p && !layerIds.has(p) && p !== page.rootId) { if (path.has(p)) { r.parent = page.layers[0].id; break; } path.add(p); const pr = byId.get(p); p = pr ? pr.parent : null; }
  }
  const abs = new Map();
  const absOf = (id) => {
    if (!id || layerIds.has(id) || id === page.rootId) return { x: 0, y: 0 };
    if (abs.has(id)) return abs.get(id);
    const r = byId.get(id); if (!r) return { x: 0, y: 0 };
    abs.set(id, { x: 0, y: 0 });
    let o = { x: 0, y: 0 };
    if (r.vertex && r.geo && !r.geo.relative) { const pa = absOf(r.parent); o = { x: pa.x + r.geo.x, y: pa.y + r.geo.y }; }
    else if (r.edge) o = absOf(r.parent);
    abs.set(id, o); return o;
  };
  page.cells = [];
  for (const r of raws) {
    if (r === rootRaw || layerIds.has(r.id)) continue;
    const st = parseStyle(r.style);
    const cell = { id: r.id, parent: r.parent || page.layers[0].id, value: r.value, style: st, extra: { tag: r.tag, wrapAttrs: r.wrapAttrs, cellAttrs: r.cellAttrs, geoAttrs: r.geo ? r.geo.extra : {}, rawChildren: r.rawChildren, geoRaw: r.geo ? r.geo.raw : [] } };
    if (r.edge) {
      cell.e = true;
      cell.source = r.source && byId.has(r.source) && r.source !== r.id ? r.source : null;
      cell.target = r.target && byId.has(r.target) && r.target !== r.id ? r.target : null;
      const po = absOf(r.parent);
      const g = r.geo || { points: [] };
      cell.pts = (g.points || []).map(p => ({ x: p.x + po.x, y: p.y + po.y }));
      cell.sp = g.sourcePoint ? { x: g.sourcePoint.x + po.x, y: g.sourcePoint.y + po.y } : null;
      cell.tp = g.targetPoint ? { x: g.targetPoint.x + po.x, y: g.targetPoint.y + po.y } : null;
      cell.lx = g.x || 0; cell.ly = g.y || 0; cell.lo = g.offset || { x: 0, y: 0 };
    } else {
      cell.v = true;
      const pr = byId.get(r.parent);
      if (pr && pr.edge && r.geo && r.geo.relative) {
        cell.lx = r.geo.x || 0; cell.ly = r.geo.y || 0; cell.lo = r.geo.offset || { x: 0, y: 0 };
        cell.x = 0; cell.y = 0; cell.w = r.geo.w || 0; cell.h = r.geo.h || 0;
        cell.isEdgeLabel = true;
      } else {
        const a = absOf(r.id), g = r.geo || { x: 0, y: 0, w: 0, h: 0 };
        cell.x = a.x; cell.y = a.y; cell.w = Math.max(0, g.w); cell.h = Math.max(0, g.h);
      }
    }
    page.cells.push(cell);
  }
  // convert edges' own labels into child labels
  const extraLabels = [];
  for (const c of page.cells) {
    if (c.e && c.value && String(c.value).trim()) {
      extraLabels.push({ after: c, label: makeEdgeLabel(c, c.value, c.lx || 0, c.lo || { x: 0, y: 0 }, sb(c.style, 'html', false)) });
      c.value = '';
    }
  }
  for (const it of extraLabels) { const i = page.cells.indexOf(it.after); page.cells.splice(i + 1, 0, it.label); }
}
const COORD_LIMIT = 1e7; // geometry outside +/- 10 million px is treated as damaged
function num(v) { const f = parseFloat(v); return isFinite(f) ? Math.max(-COORD_LIMIT, Math.min(COORD_LIMIT, f)) : 0; }
function readGeo(el) {
  const n = (a) => num(el.getAttribute(a));
  const g = { x: n('x'), y: n('y'), w: n('width'), h: n('height'), relative: el.getAttribute('relative') === '1', points: [], extra: {}, raw: [] };
  for (const a of Array.from(el.attributes)) if (!KNOWN_GEO_ATTRS.has(a.name)) g.extra[a.name] = a.value;
  for (const ch of Array.from(el.children)) {
    const as = ch.getAttribute('as');
    const pt = (e) => ({ x: num(e.getAttribute('x')), y: num(e.getAttribute('y')) });
    if (ch.nodeName === 'mxPoint' && as === 'sourcePoint') g.sourcePoint = pt(ch);
    else if (ch.nodeName === 'mxPoint' && as === 'targetPoint') g.targetPoint = pt(ch);
    else if (ch.nodeName === 'mxPoint' && as === 'offset') g.offset = pt(ch);
    else if (ch.nodeName === 'Array' && as === 'points') g.points = Array.from(ch.children).filter(e => e.nodeName === 'mxPoint').map(pt);
    else g.raw.push(new XMLSerializer().serializeToString(ch));
  }
  return g;
}
function makeEdgeLabel(edge, html, lx, lo, isHtml) {
  return { id: uid(), parent: edge.id, v: true, isEdgeLabel: true, value: isHtml === false ? esc(html).replace(/\n/g, '<br>') : html,
    style: parseStyle('edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];labelBackgroundColor=#ffffff;fontSize=12;'),
    x: 0, y: 0, w: 0, h: 0, lx: lx || 0, ly: 0, lo: { x: lo.x || 0, y: lo.y || 0 }, extra: null };
}

/* ---------- draw.io export ---------- */
function serializeDoc(doc, opts) {
  opts = opts || {};
  let s = '<mxfile host="' + esc(APP_NAME) + '" agent="' + esc(APP_NAME + ' ' + APP_VERSION) + '" version="24.0.0" type="device">\n';
  for (const page of doc.pages) s += serializePage(page, opts);
  return s + '</mxfile>\n';
}
function n2(v) { return String(round2(v)); }
function serializeModel(page, opts) {
  const ma = Object.assign({ dx: '0', dy: '0', grid: page.grid ? '1' : '0', gridSize: String(page.gridSize), guides: page.smartGuides ? '1' : '0' }, page.modelAttrs);
  ma.grid = page.grid ? '1' : '0'; ma.gridSize = String(page.gridSize); ma.guides = page.smartGuides ? '1' : '0';
  if (ma.tooltips === undefined) ma.tooltips = '1';
  if (ma.connect === undefined) ma.connect = '1';
  if (ma.arrows === undefined) ma.arrows = '1';
  if (ma.fold === undefined) ma.fold = '1';
  if (ma.page === undefined) ma.page = '0';
  if (ma.pageScale === undefined) ma.pageScale = '1';
  if (ma.math === undefined) ma.math = '0';
  if (ma.shadow === undefined) ma.shadow = '0';
  let s = '<mxGraphModel' + Object.keys(ma).map(k => ' ' + k + '="' + escAttr(ma[k]) + '"').join('') + '>\n<root>\n';
  // root cell
  const ra = Object.assign({}, page.rootAttrs);
  if (!opts.stripEditorData) {
    if (page.guides && page.guides.length) ra.deGuides = JSON.stringify(page.guides);
    if (page.guidesLocked) ra.deGuidesLocked = '1';
    if (!page.guidesVisible) ra.deGuidesVisible = '0';
    if (!page.gridVisible) ra.deGridVisible = '0';
    if (!page.rulers) ra.deRulers = '0';
  }
  if (Object.keys(ra).length) {
    const tag = page.rootTag || 'object';
    s += '<' + tag + ' label="" id="' + escAttr(page.rootId) + '"' + Object.keys(ra).map(k => ' ' + k + '="' + escAttr(ra[k]) + '"').join('') + '><mxCell/></' + tag + '>\n';
  } else s += '<mxCell id="' + escAttr(page.rootId) + '"/>\n';
  const map = cellMap(page);
  const kids = new Map();
  for (const c of page.cells) { if (!kids.has(c.parent)) kids.set(c.parent, []); kids.get(c.parent).push(c); }
  const emitted = new Set();
  const emit = (c) => {
    if (emitted.has(c.id)) return; emitted.add(c.id);
    s += serializeCell(c, map, page);
    for (const k of (kids.get(c.id) || [])) emit(k);
  };
  for (const l of page.layers) {
    if (l.raw) s += serializeRaw(l.raw, page.rootId);
    else s += '<mxCell id="' + escAttr(l.id) + '" parent="' + escAttr(page.rootId) + '"/>\n';
    for (const c of (kids.get(l.id) || [])) emit(c);
  }
  for (const c of page.cells) emit(c); // orphans
  return s + '</root>\n</mxGraphModel>';
}
function serializePage(page, opts) {
  const da = page.diagramAttrs || {};
  return '<diagram name="' + escAttr(page.name) + '" id="' + escAttr(page.id) + '"' + Object.keys(da).map(k => ' ' + k + '="' + escAttr(da[k]) + '"').join('') + '>\n' + serializeModel(page, opts) + '\n</diagram>\n';
}
function serializeRaw(r, rootId) {
  const attrs = (o) => Object.keys(o).map(k => ' ' + k + '="' + escAttr(o[k]) + '"').join('');
  let inner = '<mxCell' + (r.tag ? '' : ' id="' + escAttr(r.id) + '"') + (r.tag ? '' : (r.value ? ' value="' + escAttr(r.value) + '"' : '')) + (r.style ? ' style="' + escAttr(r.style) + '"' : '') + ' parent="' + escAttr(r.parent || rootId) + '"' + attrs(r.cellAttrs || {});
  inner += (r.rawChildren && r.rawChildren.length) ? '>' + r.rawChildren.join('') + '</mxCell>' : '/>';
  if (r.tag) return '<' + r.tag + ' label="' + escAttr(r.value || '') + '" id="' + escAttr(r.id) + '"' + attrs(r.wrapAttrs || {}) + '>' + inner + '</' + r.tag + '>\n';
  return inner + '\n';
}
function serializeCell(c, map, page) {
  const ex = c.extra || {};
  const attrs = (o) => Object.keys(o || {}).map(k => ' ' + k + '="' + escAttr(o[k]) + '"').join('');
  const tag = ex.tag;
  let cellOpen = '<mxCell' + (tag ? '' : ' id="' + escAttr(c.id) + '"');
  if (!tag) cellOpen += ' value="' + escAttr(c.value || '') + '"';
  const st = styleStr(c.style.dePh ? iconStyleForSave(c.style) : c.style);
  if (st) cellOpen += ' style="' + escAttr(st) + '"';
  cellOpen += c.e ? ' edge="1"' : ' vertex="1"';
  cellOpen += ' parent="' + escAttr(c.parent) + '"';
  if (c.e) {
    if (c.source && map.has(c.source)) cellOpen += ' source="' + escAttr(c.source) + '"';
    if (c.target && map.has(c.target)) cellOpen += ' target="' + escAttr(c.target) + '"';
  }
  const cellAttrs = Object.assign({}, ex.cellAttrs || {});
  if (c.isEdgeLabel && cellAttrs.connectable === undefined) cellAttrs.connectable = '0';
  cellOpen += attrs(cellAttrs) + '>';
  let geo;
  const gAttrs = attrs(ex.geoAttrs || {});
  const graw = (ex.geoRaw || []).join('');
  if (c.e) {
    const pa = parentAbs(c.parent, map);
    geo = '<mxGeometry relative="1"' + gAttrs + ' as="geometry">';
    if (c.sp && !(c.source && map.has(c.source))) geo += '<mxPoint x="' + n2(c.sp.x - pa.x) + '" y="' + n2(c.sp.y - pa.y) + '" as="sourcePoint"/>';
    if (c.tp && !(c.target && map.has(c.target))) geo += '<mxPoint x="' + n2(c.tp.x - pa.x) + '" y="' + n2(c.tp.y - pa.y) + '" as="targetPoint"/>';
    if (c.pts && c.pts.length) geo += '<Array as="points">' + c.pts.map(p => '<mxPoint x="' + n2(p.x - pa.x) + '" y="' + n2(p.y - pa.y) + '"/>').join('') + '</Array>';
    geo += graw + '</mxGeometry>';
  } else if (c.isEdgeLabel) {
    geo = '<mxGeometry x="' + n2(c.lx || 0) + '" y="' + n2(c.ly || 0) + '" relative="1"' + gAttrs + ' as="geometry"><mxPoint x="' + n2(c.lo.x) + '" y="' + n2(c.lo.y) + '" as="offset"/>' + graw + '</mxGeometry>';
  } else {
    const pa = parentAbs(c.parent, map);
    geo = '<mxGeometry x="' + n2(c.x - pa.x) + '" y="' + n2(c.y - pa.y) + '" width="' + n2(c.w) + '" height="' + n2(c.h) + '"' + gAttrs + ' as="geometry">' + graw + '</mxGeometry>';
    if (!graw) geo = geo.replace('></mxGeometry>', '/>');
  }
  let s = cellOpen + geo + (ex.rawChildren || []).join('') + '</mxCell>';
  if (tag) s = '<' + tag + ' label="' + escAttr(c.value || '') + '" id="' + escAttr(c.id) + '"' + attrs(ex.wrapAttrs) + '>' + s + '</' + tag + '>';
  return s + '\n';
}
function parentAbs(pid, map) {
  const p = map.get(pid);
  if (p && !p.e && !p.isEdgeLabel) return { x: p.x, y: p.y };
  return { x: 0, y: 0 };
}

/* ---------- shape library (palette) ---------- */
const PALETTE = [
  { name: 'Slate', fill: '#f8fafc', stroke: '#475569', font: '#1e293b' },
  { name: 'Blue', fill: '#dbeafe', stroke: '#3b82f6', font: '#1e3a8a' },
  { name: 'Green', fill: '#dcfce7', stroke: '#22c55e', font: '#14532d' },
  { name: 'Amber', fill: '#fef3c7', stroke: '#f59e0b', font: '#78350f' },
  { name: 'Red', fill: '#fee2e2', stroke: '#ef4444', font: '#7f1d1d' },
  { name: 'Purple', fill: '#ede9fe', stroke: '#8b5cf6', font: '#4c1d95' },
  { name: 'Teal', fill: '#ccfbf1', stroke: '#14b8a6', font: '#134e4a' },
  { name: 'Pink', fill: '#fce7f3', stroke: '#ec4899', font: '#831843' }
];
const BASE_V = 'whiteSpace=wrap;html=1;fontSize=12;strokeWidth=1.5;fillColor=#f8fafc;strokeColor=#475569;fontColor=#1e293b;';
const BLUE_V = BASE_V.replace('#f8fafc', '#dbeafe').replace('#475569', '#3b82f6').replace('#1e293b', '#1e3a8a');
const SHAPE_LIB = [
  { group: 'Basic', key: 'rect', label: 'Rectangle', w: 120, h: 60, style: 'rounded=0;' + BASE_V, value: '' },
  { group: 'Basic', key: 'rounded', label: 'Rounded rectangle', w: 120, h: 60, style: 'rounded=1;' + BASE_V, value: '' },
  { group: 'Basic', key: 'ellipse', label: 'Circle / ellipse', w: 80, h: 80, style: 'ellipse;' + BASE_V, value: '' },
  { group: 'Basic', key: 'text', label: 'Text box', w: 120, h: 40, style: 'text;html=1;whiteSpace=wrap;align=center;verticalAlign=middle;fontSize=12;fontColor=#1e293b;strokeColor=none;fillColor=none;', value: 'Text' },
  { group: 'Basic', key: 'square', label: 'Square', w: 80, h: 80, style: 'rounded=0;aspect=fixed;' + BASE_V, value: '' },
  { group: 'Basic', key: 'diamond', label: 'Diamond', w: 80, h: 80, style: 'rhombus;' + BASE_V, value: '' },
  { group: 'Basic', key: 'triangle', label: 'Triangle', w: 80, h: 70, style: 'triangle;direction=north;' + BASE_V, value: '' },
  { group: 'Basic', key: 'hexagon', label: 'Hexagon', w: 100, h: 80, style: 'shape=hexagon;perimeter=hexagonPerimeter2;fixedSize=1;size=20;' + BASE_V, value: '' },
  { group: 'Basic', key: 'trapezoid', label: 'Trapezoid', w: 120, h: 60, style: 'shape=trapezoid;perimeter=trapezoidPerimeter;fixedSize=1;size=20;' + BASE_V, value: '' },
  { group: 'Basic', key: 'parallelogram', label: 'Parallelogram', w: 120, h: 60, style: 'shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;size=20;' + BASE_V, value: '' },
  { group: 'Basic', key: 'chevron', label: 'Chevron', w: 120, h: 60, style: 'shape=step;perimeter=stepPerimeter;fixedSize=1;size=20;' + BASE_V, value: '' },
  { group: 'Basic', key: 'cloud', label: 'Cloud', w: 120, h: 80, style: 'ellipse;shape=cloud;' + BASE_V, value: '' },
  { group: 'Basic', key: 'plus', label: 'Plus', w: 60, h: 60, style: 'shape=cross;size=0.3;aspect=fixed;' + BASE_V, value: '' },
  { group: 'Basic', key: 'arrow', label: 'Arrow', w: 120, h: 60, style: 'shape=singleArrow;arrowWidth=0.4;arrowSize=0.35;' + BASE_V, value: '' },
  { group: 'Basic', key: 'arrow2', label: 'Double arrow', w: 140, h: 60, style: 'shape=doubleArrow;arrowWidth=0.4;arrowSize=0.25;' + BASE_V, value: '' },
  { group: 'Flow', key: 'process', label: 'Process', w: 120, h: 60, style: 'rounded=1;arcSize=12;' + BLUE_V, value: 'Process' },
  { group: 'Flow', key: 'decision', label: 'Decision', w: 120, h: 80, style: 'rhombus;' + BASE_V.replace('#f8fafc', '#fef3c7').replace('#475569', '#f59e0b').replace('#1e293b', '#78350f'), value: 'Decision?' },
  { group: 'Flow', key: 'terminator', label: 'Start / end (terminator)', w: 120, h: 44, style: 'rounded=1;arcSize=50;' + BASE_V.replace('#f8fafc', '#dcfce7').replace('#475569', '#22c55e').replace('#1e293b', '#14532d'), value: 'Start' },
  { group: 'Flow', key: 'io', label: 'Data (input / output)', w: 130, h: 60, style: 'shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;size=20;' + BASE_V, value: 'Input' },
  { group: 'Flow', key: 'predef', label: 'Predefined process (subprocess)', w: 130, h: 60, style: 'shape=process;backgroundOutline=1;size=0.1;' + BASE_V, value: 'Subprocess' },
  { group: 'Flow', key: 'document', label: 'Document', w: 120, h: 80, style: 'shape=document;boundedLbl=1;size=0.27;' + BASE_V, value: 'Document' },
  { group: 'Flow', key: 'multidoc', label: 'Multiple documents', w: 120, h: 80, style: 'shape=mxgraph.flowchart.multi-document;' + BASE_V, value: 'Documents' },
  { group: 'Flow', key: 'datastore', label: 'Database (stored data)', w: 70, h: 80, style: 'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=12;' + BASE_V, value: 'Data' },
  { group: 'Flow', key: 'storeddata', label: 'Stored data', w: 120, h: 60, style: 'shape=dataStorage;fixedSize=1;size=12;' + BASE_V, value: 'Stored data' },
  { group: 'Flow', key: 'internal', label: 'Internal storage', w: 100, h: 80, style: 'shape=internalStorage;backgroundOutline=1;dx=12;dy=12;' + BASE_V, value: 'Internal' },
  { group: 'Flow', key: 'manualin', label: 'Manual input', w: 120, h: 60, style: 'shape=manualInput;size=15;' + BASE_V, value: 'Manual input' },
  { group: 'Flow', key: 'manualop', label: 'Manual operation', w: 130, h: 60, style: 'shape=trapezoid;perimeter=trapezoidPerimeter;fixedSize=1;size=20;flipV=1;' + BASE_V, value: 'Manual step' },
  { group: 'Flow', key: 'prep', label: 'Preparation', w: 130, h: 60, style: 'shape=hexagon;perimeter=hexagonPerimeter2;fixedSize=1;size=20;' + BASE_V, value: 'Preparation' },
  { group: 'Flow', key: 'delay', label: 'Delay', w: 110, h: 60, style: 'shape=delay;' + BASE_V, value: 'Delay' },
  { group: 'Flow', key: 'display', label: 'Display', w: 120, h: 60, style: 'shape=mxgraph.flowchart.display;' + BASE_V, value: 'Display' },
  { group: 'Flow', key: 'card', label: 'Card (punched card)', w: 110, h: 70, style: 'shape=card;size=18;' + BASE_V, value: 'Card' },
  { group: 'Flow', key: 'looplimit', label: 'Loop limit', w: 120, h: 60, style: 'shape=loopLimit;size=18;' + BASE_V, value: 'Loop' },
  { group: 'Flow', key: 'connector', label: 'On-page connector', w: 40, h: 40, style: 'ellipse;aspect=fixed;' + BASE_V, value: 'A' },
  { group: 'Flow', key: 'offpage', label: 'Off-page connector', w: 50, h: 60, style: 'shape=offPageConnector;size=0.3;' + BASE_V, value: '1' },
  { group: 'Flow', key: 'merge', label: 'Merge', w: 70, h: 60, style: 'triangle;direction=south;' + BASE_V, value: '' },
  { group: 'Flow', key: 'extract', label: 'Extract', w: 70, h: 60, style: 'triangle;direction=north;' + BASE_V, value: '' },
  { group: 'Data flow', key: 'dfdprocess', label: 'Process (DFD, Yourdon)', w: 100, h: 100, style: 'ellipse;aspect=fixed;' + BLUE_V, value: 'Process' },
  { group: 'Data flow', key: 'entity', label: 'External entity', w: 120, h: 60, style: 'rounded=0;' + BASE_V, value: 'External entity' },
  { group: 'Data flow', key: 'dfdstore', label: 'Data store (Yourdon)', w: 140, h: 40, style: 'shape=partialRectangle;left=0;right=0;' + BASE_V, value: 'Data store' },
  { group: 'Data flow', key: 'gsstore', label: 'Data store (Gane-Sarson)', w: 140, h: 40, style: 'shape=partialRectangle;right=0;align=left;spacingLeft=12;' + BASE_V, value: 'D1 | Data store' },
  { group: 'Notes', key: 'callout', label: 'Callout', w: 150, h: 80, style: 'shape=callout;perimeter=calloutPerimeter;size=20;position=0.2;position2=0.1;base=20;' + BASE_V.replace('#f8fafc', '#ffffff'), value: 'Note' },
  { group: 'Notes', key: 'sticky', label: 'Sticky note', w: 130, h: 100, style: 'shape=note;size=14;align=left;verticalAlign=top;spacingLeft=6;spacingTop=4;' + BASE_V.replace('#f8fafc', '#fff2cc').replace('#475569', '#d6b656').replace('#1e293b', '#5c4a00'), value: 'Sticky note' },
  { group: 'Containers', key: 'container', label: 'Container', w: 260, h: 170, style: 'rounded=1;arcSize=3;verticalAlign=top;align=left;spacingLeft=10;spacingTop=6;dashed=1;fontStyle=1;container=1;' + BASE_V.replace('fillColor=#f8fafc', 'fillColor=none'), value: 'Container' },
  { group: 'Containers', key: 'tabbed', label: 'Tabbed container (tab fits its text)', w: 260, h: 180, style: 'container=1;shape=folder;tabPosition=left;tabWidth=90;tabHeight=24;verticalAlign=top;align=left;spacingLeft=8;spacingTop=3;fontStyle=1;tabAuto=1;' + BASE_V.replace('whiteSpace=wrap;', '').replace('fillColor=#f8fafc', 'fillColor=#ffffff'), value: 'Tabbed container' },
  { group: 'People', key: 'person', label: 'Person', w: 50, h: 60, style: 'shape=PERSON;verticalLabelPosition=bottom;verticalAlign=top;' + BASE_V, value: 'Person' },
  { group: 'People', key: 'people', label: 'People', w: 80, h: 60, style: 'shape=PEOPLE;verticalLabelPosition=bottom;verticalAlign=top;' + BASE_V, value: 'People' }
];
const DEFAULT_EDGE_STYLE = 'edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;startArrow=none;endArrow=classic;startSize=8;endSize=8;strokeColor=#475569;strokeWidth=1.5;jumpStyle=none;';
const ARROW_TYPES = [
  { v: 'none', label: 'None' }, { v: 'classic', label: 'Arrow' }, { v: 'open', label: 'Open arrow' },
  { v: 'ERone', label: 'One' }, { v: 'ERmandOne', label: 'One and only one' }, { v: 'ERzeroToOne', label: 'Zero or one' },
  { v: 'ERmany', label: 'Many' }, { v: 'ERoneToMany', label: 'One or many' }, { v: 'ERzeroToMany', label: 'Zero or many' }
];

function makeVertex(libKey, x, y, sketch) {
  const def = SHAPE_LIB.find(s => s.key === libKey);
  let style = def.style.replace('shape=PERSON', 'shape=' + STENCIL_CODES.person).replace('shape=PEOPLE', 'shape=' + STENCIL_CODES.people);
  const c = { id: uid(), parent: '1', v: true, value: def.value, style: parseStyle(style), x: x, y: y, w: def.w, h: def.h, extra: null };
  if (shapeKind(c) !== 'text') setPoints(c, defaultPoints(c));
  if (shapeKind(c) === 'folder') fitFolderTab(c);
  if (sketch && sketch !== 'outline') styleNewCell(c, sketch === true ? 'sketch' : sketch);
  return c;
}
function makeEdge(sketch) {
  const e = { id: uid(), parent: '1', e: true, value: '', style: parseStyle(DEFAULT_EDGE_STYLE), source: null, target: null, pts: [], sp: null, tp: null, lx: 0, ly: 0, lo: { x: 0, y: 0 }, extra: null };
  if (sketch && sketch !== 'outline') styleNewCell(e, sketch === true ? 'sketch' : sketch);
  return e;
}
// Sketch keys are draw.io's own (sketch, jiggle, fillStyle, hachureGap, fontFamily), so the file looks the same in draw.io.
const SKETCH_ROUGH = { subtle: '0.8', normal: '1.5', rough: '2.6' };
function applySketch(c, on, o) {
  if (c.style.group !== undefined) return;
  o = o || {};
  if (on) {
    c.style.sketch = '1'; c.style.curveFitting = '1'; c.style.jiggle = SKETCH_ROUGH[o.rough || 'normal'] || '1.5';
    if (!c.e) {
      if (c.style.fillColor !== 'none') { c.style.fillStyle = o.fillStyle || 'hachure'; c.style.hachureGap = '5'; c.style.fillWeight = '1'; }
      if (o.font !== false) { c.style.fontFamily = SKETCH_FONT; c.style.fontSource = SKETCH_FONT_SOURCE; }
    }
  } else {
    delete c.style.sketch; delete c.style.curveFitting; delete c.style.jiggle; delete c.style.fillStyle; delete c.style.hachureGap; delete c.style.fillWeight;
    if (o.resetFont !== false && c.style.fontFamily === SKETCH_FONT) { delete c.style.fontFamily; delete c.style.fontSource; }
  }
}

/* tabbed container: the tab grows to fit its text */
function fitFolderTab(c) {
  if (shapeKind(c) !== 'folder' || c.style.tabAuto === '0' || typeof layoutRich !== 'function') return;
  const html = labelHtml(c) || '&nbsp;';
  const lines = layoutRich(html, c.style, 1e6, false);
  const tw = Math.max(0, ...lines.map(l => l.w)), th = lines.reduce((a, l) => a + l.h, 0);
  const tabW = Math.round(Math.max(40, tw + sn(c.style, 'spacingLeft', 8) + 14));
  const tabH = Math.round(Math.max(24, th + sn(c.style, 'spacingTop', 3) + 7));
  const oldH = sn(c.style, 'tabHeight', 24);
  c.style.tabWidth = String(tabW); c.style.tabHeight = String(tabH);
  if (c.w < tabW) c.w = tabW;
  if (oldH !== tabH && c.style.points) setPoints(c, defaultPoints(c));
}
