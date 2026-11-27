/* ===== Rendering: shapes, lines, labels, sketch, export text ===== */
function el(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const IS_SAFARI = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
const RS_SVG = document.createElementNS(SVGNS, 'svg');
let ROUGH = null;
function rs() { if (!ROUGH && typeof rough !== 'undefined') ROUGH = rough.svg(RS_SVG); return ROUGH; }

function fontCss(fam) {
  if (!fam) return 'Helvetica, Arial, sans-serif';
  if (fam === SKETCH_FONT) return "'Architects Daughter', 'Comic Sans MS', cursive";
  if (/helvetica/i.test(fam)) return 'Helvetica, Arial, sans-serif';
  return "'" + String(fam).replace(/['"\\;{}<>()]/g, '') + "', Helvetica, Arial, sans-serif";
}
function colorOr(st, k, d) { const v = sv(st, k, d); return v === 'default' || !safeColour(v) ? d : v; }
function alignCss(st) { const a = sv(st, 'align', 'center'); return ['left', 'center', 'right', 'justify'].includes(a) ? a : 'center'; }

/* ---------- vertex shape geometry ---------- */
function shapePaths(c) {
  const x = c.x, y = c.y, w = c.w, h = c.h, st = c.style, k = shapeKind(c);
  const R = [];
  const rectD = (r) => r > 0 ? `M${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x + r}Q${x},${y + h} ${x},${y + h - r}V${y + r}Q${x},${y} ${x + r},${y}Z` : `M${x},${y}H${x + w}V${y + h}H${x}Z`;
  const ellD = (ex, ey, ew, eh) => `M${ex},${ey + eh / 2}A${ew / 2},${eh / 2} 0 1 0 ${ex + ew},${ey + eh / 2}A${ew / 2},${eh / 2} 0 1 0 ${ex},${ey + eh / 2}Z`;
  if (k === 'group' || k === 'text') return R;
  if (k === 'icon') {
    const ls = PH.ready ? phLayers(st.dePh, st.deW || 'regular') : null;
    if (!ls) { R.push({ d: rectD(0), fill: false, pending: true }); return R; }
    const s = Math.min(w, h) / 256, tx = x + (w - 256 * s) / 2, ty = y + (h - 256 * s) / 2;
    for (const l of ls) R.push({ d: pathAbsToD(l.cmds, s, tx, ty), fill: true, glyph: true, alpha: l.alpha });
    return R;
  }
  if (k === 'ellipse') {
    R.push({ d: ellD(x, y, w, h), fill: true });
    if (st.deHarvey !== undefined) { const wd = harveyWedge(x, y, w, h, harveyOf(st)); if (wd) R.push({ d: wd, fill: true, wedge: true }); }
  }
  else if (k === 'cloud') {
    const X = (f) => x + f * w, Y = (f) => y + f * h;
    R.push({ d: `M${X(0.25)},${Y(0.25)}C${X(0.05)},${Y(0.25)} ${X(0)},${Y(0.5)} ${X(0.16)},${Y(0.55)}C${X(0)},${Y(0.66)} ${X(0.18)},${Y(0.9)} ${X(0.31)},${Y(0.8)}C${X(0.4)},${Y(1)} ${X(0.7)},${Y(1)} ${X(0.8)},${Y(0.8)}C${X(1)},${Y(0.8)} ${X(1)},${Y(0.6)} ${X(0.875)},${Y(0.5)}C${X(1)},${Y(0.3)} ${X(0.8)},${Y(0.1)} ${X(0.625)},${Y(0.2)}C${X(0.5)},${Y(0.05)} ${X(0.3)},${Y(0.05)} ${X(0.25)},${Y(0.25)}Z`, fill: true });
  } else if (k === 'delay') {
    const dx = Math.min(w / 2, h / 2);
    R.push({ d: `M${x},${y}H${x + w - dx}Q${x + w},${y} ${x + w},${y + h / 2}Q${x + w},${y + h} ${x + w - dx},${y + h}H${x}Z`, fill: true });
  } else if (k === 'display') {
    const d = w * 0.15;
    R.push({ d: `M${x},${y + h / 2}L${x + d},${y}H${x + w - d}Q${x + w},${y} ${x + w},${y + h / 2}Q${x + w},${y + h} ${x + w - d},${y + h}H${x + d}Z`, fill: true });
  } else if (k === 'dataStorage') {
    const s_ = sb(st, 'fixedSize', false) ? Math.min(sn(st, 'size', 12), w / 2) : w * clamp(sn(st, 'size', 0.1), 0, 0.5);
    R.push({ d: `M${x + s_},${y}H${x + w}Q${x + w - 2 * s_},${y + h / 2} ${x + w},${y + h}H${x + s_}Q${x - s_},${y + h / 2} ${x + s_},${y}Z`, fill: true });
  } else if (k === 'predef') {
    const s_ = sb(st, 'fixedSize', false) ? sn(st, 'size', 12) : w * clamp(sn(st, 'size', 0.1), 0, 0.5);
    R.push({ d: `M${x},${y}H${x + w}V${y + h}H${x}Z`, fill: true });
    R.push({ d: `M${x + s_},${y}V${y + h}M${x + w - s_},${y}V${y + h}`, fill: false });
  } else if (k === 'internalStorage') {
    const dx = sn(st, 'dx', 20), dy = sn(st, 'dy', 20);
    R.push({ d: `M${x},${y}H${x + w}V${y + h}H${x}Z`, fill: true });
    R.push({ d: `M${x + dx},${y}V${y + h}M${x},${y + dy}H${x + w}`, fill: false });
  } else if (k === 'multidoc') {
    const o = Math.min(w, h) * 0.08, ww = w - 2 * o, hh = h - 2 * o, dy = hh * 0.2;
    const doc = (ox, oy) => `M${ox},${oy}H${ox + ww}V${oy + hh - dy / 2}Q${ox + ww * 3 / 4},${oy + hh - dy * 1.4} ${ox + ww / 2},${oy + hh - dy / 2}Q${ox + ww / 4},${oy + hh + dy * 0.4} ${ox},${oy + hh - dy / 2}Z`;
    R.push({ d: doc(x + 2 * o, y), fill: true }); R.push({ d: doc(x + o, y + o), fill: true }); R.push({ d: doc(x, y + 2 * o), fill: true });
  } else if (k === 'folder') {
    const tw = Math.min(sn(st, 'tabWidth', 60), w), th = Math.min(sn(st, 'tabHeight', 20), h);
    const tx = sv(st, 'tabPosition', 'right') === 'left' ? x : x + w - tw;
    R.push({ d: `M${tx},${y}H${tx + tw}V${y + th}H${tx}Z`, fill: true });
    R.push({ d: `M${x},${y + th}H${x + w}V${y + h}H${x}Z`, fill: true });
  } else if (k === 'partialRect') {
    R.push({ d: `M${x},${y}H${x + w}V${y + h}H${x}Z`, fill: true, noStroke: true });
    let d = '';
    if (sb(st, 'top', true)) d += `M${x},${y}H${x + w}`;
    if (sb(st, 'right', true)) d += `M${x + w},${y}V${y + h}`;
    if (sb(st, 'bottom', true)) d += `M${x},${y + h}H${x + w}`;
    if (sb(st, 'left', true)) d += `M${x},${y}V${y + h}`;
    if (d) R.push({ d, fill: false });
  } else if (POLY_KINDS.has(k)) {
    const pts = outlineLocal(c);
    if (k === 'callout' && sb(st, 'rounded', false)) R.push({ d: roundedPoly(pts, 8), fill: true });
    else R.push({ d: 'M' + pts.map(p => p.x + ',' + p.y).join('L') + 'Z', fill: true });
  } else if (k === 'cylinder') {
    const dy = Math.min(sn(st, 'size', 15), h / 2);
    R.push({ d: `M${x},${y + dy}C${x},${y - dy / 3} ${x + w},${y - dy / 3} ${x + w},${y + dy}L${x + w},${y + h - dy}C${x + w},${y + h + dy / 3} ${x},${y + h + dy / 3} ${x},${y + h - dy}Z`, fill: true });
    R.push({ d: `M${x},${y + dy}C${x},${y + 2 * dy} ${x + w},${y + 2 * dy} ${x + w},${y + dy}`, fill: false });
  } else if (k === 'document') {
    const dy = h * clamp(sn(st, 'size', 0.3), 0, 1), fy = 1.4;
    R.push({ d: `M${x},${y}H${x + w}V${y + h - dy / 2}Q${x + w * 3 / 4},${y + h - dy * fy} ${x + w / 2},${y + h - dy / 2}Q${x + w / 4},${y + h - dy * (1 - fy)} ${x},${y + h - dy / 2}Z`, fill: true });
  } else if (k === 'note') {
    const s = Math.min(sn(st, 'size', 30), w, h);
    R.push({ d: `M${x},${y}H${x + w - s}L${x + w},${y + s}V${y + h}H${x}Z`, fill: true });
    R.push({ d: `M${x + w - s},${y}V${y + s}H${x + w}`, fill: false });
  } else if (k === 'person' || k === 'people') {
    const def = STENCIL_DEFS[k];
    if (st.shape === 'umlActor') { // simple stick figure for imported actors
      R.push({ d: ellD(x + w / 4, y, w / 2, h / 4), fill: true });
      R.push({ d: `M${x + w / 2},${y + h / 4}V${y + 2 * h / 3}M${x},${y + h / 3}H${x + w}M${x + w / 2},${y + 2 * h / 3}L${x},${y + h}M${x + w / 2},${y + 2 * h / 3}L${x + w},${y + h}`, fill: false });
    } else {
      const sx = w / def.w, sy = h / def.h;
      for (const p of def.prims) {
        if (p.t === 'ellipse') R.push({ d: ellD(x + p.x * sx, y + p.y * sy, p.w * sx, p.h * sy), fill: true });
        else R.push({ d: p.d.map(cmd => cmd[0] + cmd.slice(1).map((v, i) => i % 2 === 0 ? x + v * sx : y + v * sy).join(',')).join(''), fill: true });
      }
    }
  } else if (k === 'unknown') {
    R.push({ d: rectD(0), fill: true, unknown: true });
  } else {
    let r = 0;
    if (sb(st, 'rounded', false)) {
      const as = sn(st, 'arcSize', 15);
      r = sb(st, 'absoluteArcSize', false) ? as / 2 : Math.min(w, h) * as / 100;
      r = Math.min(r, w / 2, h / 2);
    }
    if (st.swimlane !== undefined) {
      // draw.io swimlane: header band (fillColor), body (swimlaneFillColor), one outline and the line under the header
      const sz = Math.min(Math.max(0, sn(st, 'startSize', 26)), h), rr = Math.min(r, sz, (h - sz) || r);
      const body = colorOr(st, 'swimlaneFillColor', 'none');
      if (body !== 'none' && sz < h) R.push({ d: `M${x},${y + sz}H${x + w}V${y + h - rr}Q${x + w},${y + h} ${x + w - rr},${y + h}H${x + rr}Q${x},${y + h} ${x},${y + h - rr}Z`, fill: true, fillColour: body, noStroke: true });
      if (sz > 0) R.push({ d: `M${x},${y + sz}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + sz}Z`, fill: true, noStroke: true });
      R.push({ d: rectD(r), fill: false });
      if (sz > 0 && sz < h && sv(st, 'swimlaneLine', '1') !== '0') R.push({ d: `M${x},${y + sz}H${x + w}`, fill: false });
      return R;
    }
    R.push({ d: rectD(r), fill: true });
  }
  return R;
}
function roundedPoly(pts, r) {
  let d = '';
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const a = Math.min(r, dist(p0, p1) / 2), b = Math.min(r, dist(p1, p2) / 2);
    const u = { x: (p0.x - p1.x) / (dist(p0, p1) || 1), y: (p0.y - p1.y) / (dist(p0, p1) || 1) };
    const v = { x: (p2.x - p1.x) / (dist(p1, p2) || 1), y: (p2.y - p1.y) / (dist(p1, p2) || 1) };
    const s = { x: p1.x + u.x * a, y: p1.y + u.y * a }, e = { x: p1.x + v.x * b, y: p1.y + v.y * b };
    d += (i ? 'L' : 'M') + s.x + ',' + s.y + 'Q' + p1.x + ',' + p1.y + ' ' + e.x + ',' + e.y;
  }
  return d + 'Z';
}

/* ---------- labels ---------- */
function labelBox(c) {
  const st = c.style, k = shapeKind(c);
  let x = c.x, y = c.y, w = c.w, h = c.h;
  if (k === 'callout') h = Math.max(1, h - sn(st, 'size', 20));
  if (st.swimlane !== undefined) h = Math.max(1, Math.min(sn(st, 'startSize', 26), c.h));   // a swimlane's label sits in its header band
  if (k === 'cylinder' && sb(st, 'boundedLbl', false)) { const s = Math.min(sn(st, 'size', 15), h / 2); y += s * 1.5; h -= s * 2; }
  if (k === 'document' && sb(st, 'boundedLbl', false)) h -= h * sn(st, 'size', 0.3) / 2;
  const lp = sv(st, 'labelPosition', 'center'), vlp = sv(st, 'verticalLabelPosition', 'middle');
  if (lp === 'left') x -= c.w; else if (lp === 'right') x += c.w;
  if (vlp === 'top') y -= c.h; else if (vlp === 'bottom') y += c.h;
  const sp = sn(st, 'spacing', 2), sl = sn(st, 'spacingLeft', 0), sr = sn(st, 'spacingRight', 0), stp = sn(st, 'spacingTop', 0), sbm = sn(st, 'spacingBottom', 0);
  const ic = labelIconSlot(c);
  return { x: x + sp + sl + ic, y: y + sp + stp, w: Math.max(1, w - 2 * sp - sl - sr - ic), h: Math.max(1, h - 2 * sp - stp - sbm) };
}
/* ---------- icon before the label (deIcon), marker (deMarker), shadow, double outline, dot matrix ---------- */
const LABEL_ICON = 22, LABEL_ICON_GAP = 8;
const ICON_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
function labelIcon(c) { const n = c.style.deIcon; return n && ICON_NAME.test(n) && !c.e && !c.isEdgeLabel && shapeKind(c) !== 'icon' && labelInside(c) ? n : null; }
function labelIconSlot(c) { return labelIcon(c) ? LABEL_ICON + LABEL_ICON_GAP : 0; }
function glyphPaths(name, size, x, y) {
  const ls = PH.ready ? phLayers(name, 'regular') : null;
  if (!ls) return [];
  const s = size / 256;
  return ls.map(l => pathAbsToD(l.cmds, s, x, y));
}
// The icon sits just before the text block, centred on it (top-aligned labels: level with the first line).
function drawLabelIcon(c, g) {
  const name = labelIcon(c); if (!name) return;
  const st = c.style, b = labelBox(c), html = labelHtml(c) || '';
  const lines = html ? layoutRich(html, st, b.w, sv(st, 'whiteSpace', '') === 'wrap') : [];
  const W = Math.max(0, ...lines.map(l => l.w)), H = lines.reduce((a, l) => a + l.h, 0);
  const al = sv(st, 'align', 'center'), va = sv(st, 'verticalAlign', 'middle');
  const left = al === 'left' ? b.x : al === 'right' ? b.x + b.w - W : b.x + (b.w - W) / 2;
  const top = va === 'top' ? b.y : va === 'bottom' ? b.y + b.h - H : b.y + (b.h - H) / 2;
  const iy = va === 'top' && lines.length ? top + (lines[0].h - LABEL_ICON) / 2 : top + (H - LABEL_ICON) / 2;
  const col = colorOr(st, 'fontColor', '#1e293b');
  for (const d of glyphPaths(name, LABEL_ICON, left - LABEL_ICON - LABEL_ICON_GAP, iy)) el('path', { d, fill: col, stroke: 'none', class: 'deIcon' }, g);
}
// Marker: 28 px disc centred on the top-right corner, 18 px icon; Alert and Critical solid with a white icon.
function drawMarker(c, g) {
  const s = bpSemantic(c.style.deMarker); if (!s || c.e || c.isEdgeLabel) return;
  const cx = c.x + c.w, cy = c.y, solid = !!s.solid;
  el('circle', { cx, cy, r: 14 - 0.75, fill: solid ? s.ink : (s.pin || s.fill), stroke: s.line || s.ink, 'stroke-width': 1.5, 'stroke-dasharray': s.dashed ? '3 2' : null, class: 'deMarker' }, g);
  for (const d of glyphPaths(s.icon, 18, cx - 9, cy - 9)) el('path', { d, fill: solid ? '#ffffff' : s.ink, stroke: 'none' }, g);
}
let DOTS_SEQ = 0;
function dotsFill(c, g) {
  const st = c.style, gap = 20, col = safeColour(st.deDotsColor) && hexRgb(st.deDotsColor) ? st.deDotsColor : BP.dots;
  const id = 'deDots' + (++DOTS_SEQ);
  const pat = el('pattern', { id, width: gap, height: gap, x: c.x, y: c.y, patternUnits: 'userSpaceOnUse' }, el('defs', {}, g));
  el('circle', { cx: gap / 2, cy: gap / 2, r: 1.2, fill: col }, pat);
  return 'url(#' + id + ')';
}
function textCss(st) {
  const fs = sn(st, 'fontStyle', 0);
  return 'font-family:' + fontCss(st.fontFamily) + ';font-size:' + sn(st, 'fontSize', 12) + 'px;color:' + colorOr(st, 'fontColor', '#1e293b') +
    ';font-weight:' + (fs & 1 ? 'bold' : 'normal') + ';font-style:' + (fs & 2 ? 'italic' : 'normal') + ';text-decoration:' + (fs & 4 ? 'underline' : 'none') +
    ';line-height:1.2;' + (sb(st, 'deGlow', false) && lum(colorOr(st, 'fontColor', '#1e293b')) > 0.35 ? 'text-shadow:0 0 4px ' + colorOr(st, 'fontColor', '#1e293b') + ';' : '');
}
// Hatch lines in a very pale fill colour are hard to see on white, so they are drawn a little deeper, toward the outline
// colour: the paler the fill, the more (none below a luminance of 0.7, about a quarter for white). draw.io uses the fill colour as is.
function sketchHatch(f, stroke) { if (!hexRgb(f)) return f; const t = Math.min(0.3, Math.max(0, (lum(f) - 0.7) * 0.9)); return t ? mixHex(f, hexRgb(stroke) ? stroke : '#475569', t) : f; }
function withAlpha(hex, a) { const r = hexRgb(hex); return !r || a >= 1 ? hex : 'rgba(' + r.join(',') + ',' + a + ')'; }
const GLOW_FILTER = '<filter id="deGlow" filterUnits="userSpaceOnUse" x="-20000" y="-20000" width="40000" height="40000" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="b2"/><feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="deGlowSoft" filterUnits="userSpaceOnUse" x="-20000" y="-20000" width="40000" height="40000" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b1"/><feComponentTransfer in="b1" result="b2"><feFuncA type="linear" slope="0.8"/></feComponentTransfer><feMerge><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
function vertexLabelFO(c, parent) {
  const html = labelHtml(c);
  if (!html) return null;
  const st = c.style, b = labelBox(c);
  const fo = el('foreignObject', { x: b.x, y: b.y, width: b.w, height: b.h, 'data-label': c.id }, parent);
  fo.style.overflow = 'visible';
  const outer = document.createElementNS(XHTMLNS, 'div');
  const va = sv(st, 'verticalAlign', 'middle');
  outer.setAttribute('style', 'width:' + b.w + 'px;height:' + b.h + 'px;display:flex;flex-direction:column;justify-content:' + (va === 'top' ? 'flex-start' : va === 'bottom' ? 'flex-end' : 'center') + ';pointer-events:none;');
  const inner = document.createElementNS(XHTMLNS, 'div');
  const wrap = sv(st, 'whiteSpace', '') === 'wrap';
  inner.setAttribute('style', textCss(st) + 'text-align:' + alignCss(st) + ';white-space:' + (wrap ? 'normal' : 'nowrap') + ';overflow-wrap:break-word;word-break:normal;');
  inner.className = 'lbl';
  inner.innerHTML = html;
  outer.appendChild(inner); fo.appendChild(outer);
  return fo;
}

/* ---------- vertex rendering ---------- */
function renderVertex(c, opts) {
  opts = opts || {};
  const k = shapeKind(c), st = c.style;
  const g = el('g', { 'data-id': c.id });
  const r = cellRot(c);
  if (r) { const cc = cellCenter(c); g.setAttribute('transform', `rotate(${r} ${cc.x} ${cc.y})`); }
  if (sn(st, 'opacity', 100) < 100) g.setAttribute('opacity', sn(st, 'opacity', 100) / 100);
  const fill = colorOr(st, 'fillColor', k === 'text' ? 'none' : '#ffffff');
  const stroke = colorOr(st, 'strokeColor', k === 'text' ? 'none' : '#000000');
  const sw = sn(st, 'strokeWidth', 1);
  const dashed = sb(st, 'dashed', false);
  const dash = dashed ? (sv(st, 'dashPattern', '3 3').split(/\s+/).map(v => (+v) * sw).join(' ')) : null;
  const sketch = sb(st, 'sketch', false) && rs();
  const fop = sn(st, 'fillOpacity', 100) / 100;
  const lg = g; let g2 = g;
  const paths = shapePaths(c);
  const shadow = shadowOf(st);
  if (shadow && k !== 'text' && paths.length) {
    // offset in screen space, so the shadow stays down-right on a rotated shape
    const o = rot({ x: shadow.dx, y: shadow.dy }, { x: 0, y: 0 }, -r);
    const sg = el('g', { opacity: shadow.opacity / 100, transform: `translate(${o.x},${o.y})`, class: 'deShadow' }, g);
    for (const p of paths) {
      if (p.pending) continue;
      const filled = p.glyph || (p.fill && fill !== 'none');
      el('path', { d: p.d, fill: filled ? shadow.color : 'none', stroke: p.glyph || stroke === 'none' ? 'none' : shadow.color, 'stroke-width': sw, 'stroke-linejoin': 'round' }, sg);
    }
  }
  const dbl = sb(st, 'deDouble', false) && stroke !== 'none' && sw > 0;
  let dotted = null;
  if (sb(st, 'deGlow', false) && glowable(c)) g2 = el('g', { filter: st.deGlow === '2' ? 'url(#deGlowSoft)' : 'url(#deGlow)' }, g);
  for (const p of paths) {
    const g = g2;
    if (p.pending) { el('path', { d: p.d, fill: 'none', stroke: '#cbd5e1', 'stroke-dasharray': '3 3' }, g); continue; }
    if (p.glyph) {
      const gf = fill === 'none' ? '#475569' : fill;
      if (sketch) {
        const lf = p.alpha < 1 && hexRgb(st.deC2) ? st.deC2 : gf;
        const node = rs().path(p.d, { seed: hashStr(c.id + p.d.length), roughness: 0.45, bowing: 0.6, stroke: lf, strokeWidth: 0.7, fill: lf, fillStyle: 'solid', disableMultiStroke: true });
        if (p.alpha < 1) node.setAttribute('opacity', p.alpha);
        g.appendChild(node);
      } else if (p.alpha < 1 && hexRgb(st.deC2)) el('path', { d: p.d, fill: st.deC2, stroke: 'none' }, g);
      else el('path', { d: p.d, fill: gf, stroke: 'none', opacity: p.alpha < 1 ? p.alpha : null }, g);
      continue;
    }
    const f = p.wedge ? (stroke === 'none' ? '#000000' : stroke) : p.fill ? (p.fillColour || fill) : 'none';
    if (p.noStroke) { if (f !== 'none') el('path', { d: p.d, fill: f, stroke: 'none' }, g); continue; }
    if (sketch) {
      const fs = sv(st, 'fillStyle', 'solid'), rough = clamp(sn(st, 'jiggle', 1.5) * 0.66, 0.3, 2.2);
      const node = rs().path(p.d, { seed: hashStr(c.id + p.d.length), roughness: rough, bowing: 0.8, stroke: stroke === 'none' ? 'transparent' : stroke, strokeWidth: sw,
        fill: f === 'none' ? undefined : withAlpha(fs === 'solid' || fs === 'auto' ? f : sketchHatch(f, stroke), fop), fillStyle: fs === 'auto' ? 'solid' : fs, hachureGap: sn(st, 'hachureGap', 5), fillWeight: sn(st, 'fillWeight', 1), hachureAngle: -41, strokeLineDash: dash ? dash.split(' ').map(Number) : undefined, disableMultiStroke: false });
      g.appendChild(node);
    } else {
      el('path', { d: p.d, fill: f, 'fill-opacity': f !== 'none' && fop < 1 ? fop : null, stroke: stroke, 'stroke-width': sw, 'stroke-dasharray': dash, 'stroke-linejoin': 'round' }, g);
    }
    if (st.deDots !== undefined && p.fill && !p.wedge) { dotted = dotted || dotsFill(c, g); el('path', { d: p.d, fill: dotted, stroke: 'none', class: 'deDots' }, g); }
    // double outline: the full width in the outline colour, then its middle third in the fill colour (two lines and a gap)
    if (dbl && p.fill && !p.wedge && !sketch) el('path', { d: p.d, fill: 'none', stroke: f !== 'none' ? f : '#ffffff', 'stroke-width': sw / 3, 'stroke-linejoin': 'round', class: 'deDouble' }, g);
    if (p.unknown) el('text', { x: c.x + 4, y: c.y + 12, 'font-size': 10, fill: '#94a3b8' }, g).textContent = 'shape: ' + (st.shape || '?').slice(0, 24);
  }
  if (!opts.noLabel) {
    drawLabelIcon(c, lg);
    if (opts.exportText) exportLabel(c, lg);
    else vertexLabelFO(c, lg);
  }
  drawMarker(c, lg);
  return lg;
}

/* ---------- edges: routing ---------- */
function edgeKind(e) {
  const st = e.style, es = st.edgeStyle;
  if (es && es !== 'none') return sb(st, 'curved', false) ? 'curved' : (sb(st, 'rounded', false) ? 'soft' : 'elbow');
  return sb(st, 'curved', false) ? 'curvedFree' : 'straight';
}
function sideOfRel(rel) {
  const d = [rel[0], 1 - rel[0], rel[1], 1 - rel[1]];
  const i = d.indexOf(Math.min.apply(null, d));
  return ['left', 'right', 'top', 'bottom'][i];
}
const SIDE_VEC = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 } };
function snapAxis(v) { return Math.abs(v.x) >= Math.abs(v.y) ? { x: Math.sign(v.x) || 1, y: 0 } : { x: 0, y: Math.sign(v.y) || 1 }; }
function sideDir(cell, rel) { const v = SIDE_VEC[sideOfRel(rel)]; return snapAxis(rot(v, { x: 0, y: 0 }, cellRot(cell))); }
function isConnectable(c) { return c && !c.e && !c.isEdgeLabel && c.style.group === undefined; }
function endInfo(e, which, map) {
  const id = which === 's' ? e.source : e.target;
  const cell = id ? map.get(id) : null;
  const pfx = which === 's' ? 'exit' : 'entry';
  if (isConnectable(cell)) {
    const st = e.style;
    if (st[pfx + 'X'] !== undefined && st[pfx + 'Y'] !== undefined) {
      const rel = [parseFloat(st[pfx + 'X']) || 0, parseFloat(st[pfx + 'Y']) || 0];
      const pt = constraintPoint(cell, rel);
      return { cell, fixed: true, rel, pt, dir: sideDir(cell, rel) };
    }
    return { cell, fixed: false };
  }
  const p = which === 's' ? e.sp : e.tp;
  return { cell: null, fixed: true, pt: p ? { x: p.x, y: p.y } : { x: 0, y: 0 }, dir: null };
}
function lineInter(x0, y0, x1, y1, x2, y2, x3, y3) {
  const denom = ((y3 - y2) * (x1 - x0)) - ((x3 - x2) * (y1 - y0));
  const nume_a = ((x3 - x2) * (y0 - y2)) - ((y3 - y2) * (x0 - x2));
  const nume_b = ((x1 - x0) * (y0 - y2)) - ((y1 - y0) * (x0 - x2));
  const ua = nume_a / denom, ub = nume_b / denom;
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) return { x: x0 + ua * (x1 - x0), y: y0 + ua * (y1 - y0) };
  return null;
}
/* perimeter points as mxGraph computes them (rectangle, ellipse, rhombus; other outlines by polygon) */
function rectPerimeter(b, next, orth) {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, dx = next.x - cx, dy = next.y - cy;
  const alpha = Math.atan2(dy, dx), pi = Math.PI, beta = pi / 2 - alpha, t = Math.atan2(b.h, b.w);
  const p = { x: 0, y: 0 };
  if (alpha < -pi + t || alpha > pi - t) { p.x = b.x; p.y = cy - b.w * Math.tan(alpha) / 2; }
  else if (alpha < -t) { p.y = b.y; p.x = cx - b.h * Math.tan(beta) / 2; }
  else if (alpha < t) { p.x = b.x + b.w; p.y = cy + b.w * Math.tan(alpha) / 2; }
  else { p.y = b.y + b.h; p.x = cx + b.h * Math.tan(beta) / 2; }
  if (orth) {
    if (next.x >= b.x && next.x <= b.x + b.w) p.x = next.x; else if (next.y >= b.y && next.y <= b.y + b.h) p.y = next.y;
    if (next.x < b.x) p.x = b.x; else if (next.x > b.x + b.w) p.x = b.x + b.w;
    if (next.y < b.y) p.y = b.y; else if (next.y > b.y + b.h) p.y = b.y + b.h;
  }
  return p;
}
function ellipsePerimeter(b, next, orth) {
  const x = b.x, y = b.y, a = b.w / 2, bb = b.h / 2, cx = x + a, cy = y + bb, px = next.x, py = next.y;
  const dx = Math.trunc(px - cx), dy = Math.trunc(py - cy);
  if (dx === 0 && dy !== 0) return { x: cx, y: cy + bb * dy / Math.abs(dy) };
  if (dx === 0 && dy === 0) return { x: px, y: py };
  if (orth) {
    if (py >= y && py <= y + b.h) { const ty = py - cy; let tx = Math.sqrt(a * a * (1 - (ty * ty) / (bb * bb))) || 0; if (px <= x) tx = -tx; return { x: cx + tx, y: py }; }
    if (px >= x && px <= x + b.w) { const tx = px - cx; let ty = Math.sqrt(bb * bb * (1 - (tx * tx) / (a * a))) || 0; if (py <= y) ty = -ty; return { x: px, y: cy + ty }; }
  }
  const d = dy / dx, h = cy - d * cx, e = a * a * d * d + bb * bb, f = -2 * cx * e, g = a * a * d * d * cx * cx + bb * bb * cx * cx - a * a * bb * bb;
  const det = Math.sqrt(f * f - 4 * e * g);
  const x1 = (-f + det) / (2 * e), x2 = (-f - det) / (2 * e), y1 = d * x1 + h, y2 = d * x2 + h;
  return Math.hypot(x1 - px, y1 - py) < Math.hypot(x2 - px, y2 - py) ? { x: x1, y: y1 } : { x: x2, y: y2 };
}
function rhombusPerimeter(b, next, orth) {
  const x = b.x, y = b.y, w = b.w, h = b.h, cx = x + w / 2, cy = y + h / 2, px = next.x, py = next.y;
  if (cx === px) return cy > py ? { x: cx, y } : { x: cx, y: y + h };
  if (cy === py) return cx > px ? { x, y: cy } : { x: x + w, y: cy };
  let tx = cx, ty = cy;
  if (orth) { if (px >= x && px <= x + w) tx = px; else if (py >= y && py <= y + h) ty = py; }
  let r;
  if (px < cx) r = py < cy ? lineInter(px, py, tx, ty, cx, y, x, cy) : lineInter(px, py, tx, ty, cx, y + h, x, cy);
  else r = py < cy ? lineInter(px, py, tx, ty, cx, y, x + w, cy) : lineInter(px, py, tx, ty, cx, y + h, x + w, cy);
  return r || { x: cx, y: cy };
}
function polyPerimeter(c, next, orth) {
  const poly = outlineLocal(c), cc = cellCenter(c), b = { x: c.x, y: c.y, w: c.w, h: c.h };
  if (orth) {
    const hitLine = (a1, a2) => { let best = null; for (let i = 0; i < poly.length; i++) { const q = segInter(a1, a2, poly[i], poly[(i + 1) % poly.length]); if (q && (!best || dist(q, next) < dist(best, next))) best = { x: q.x, y: q.y }; } return best; };
    if (next.x >= b.x && next.x <= b.x + b.w) { const q = hitLine({ x: next.x, y: b.y - 1e5 }, { x: next.x, y: b.y + b.h + 1e5 }); if (q) return q; }
    if (next.y >= b.y && next.y <= b.y + b.h) { const q = hitLine({ x: b.x - 1e5, y: next.y }, { x: b.x + b.w + 1e5, y: next.y }); if (q) return q; }
  }
  const dir = { x: next.x - cc.x, y: next.y - cc.y };
  if (Math.hypot(dir.x, dir.y) < 1e-9) return cc;
  return rayPolyHit(cc, dir, poly) || cc;
}
function perimeterPoint(c, next, orth) {
  const r = cellRot(c), cc = cellCenter(c);
  const n = r ? rot(next, cc, -r) : next;
  const o = orth && !r, b = { x: c.x, y: c.y, w: c.w, h: c.h }, k = shapeKind(c);
  let p;
  if (k === 'ellipse') p = ellipsePerimeter(b, n, o);
  else if (k === 'rhombus') p = rhombusPerimeter(b, n, o);
  else if (k === 'cloud') p = ellipsePerimeter(b, n, o);
  else if (POLY_KINDS.has(k)) p = polyPerimeter(c, n, o);
  else p = rectPerimeter(b, n, o);
  return r ? rot(p, cc, r) : p;
}
function edgeRoute(e, map) {
  const k = edgeKind(e), orth = (k === 'elbow' || k === 'soft' || k === 'curved');
  const s = endInfo(e, 's', map), t = endInfo(e, 't', map);
  const way = (e.pts || []).map(p => ({ x: p.x, y: p.y }));
  const p0 = s.fixed ? s.pt : null, pe = t.fixed ? t.pt : null;
  let mid = way;
  if (s.cell && s.cell === t.cell) { // self loop, as mxGraph's Loop style
    if (!(p0 && pe) && !way.length) { const b = worldBox(s.cell), seg = 10, cy = b.y + b.h / 2, x = b.x + b.w + 2 * seg; mid = [{ x, y: cy - seg }, { x, y: cy + seg }]; }
  } else if (orth) {
    try { const sb_ = s.cell ? worldBox(s.cell) : null, tb_ = s.cell && t.cell === s.cell ? sb_ : (t.cell ? worldBox(t.cell) : null);
    mid = MXR.orth(sb_, tb_, p0, pe, way, e.style); }
    catch (err) { mid = way; }
  }
  // floating ends, target first, as draw.io does
  let tp = pe, sp = p0;
  if (!tp) tp = perimeterPoint(t.cell, mid.length ? mid[mid.length - 1] : (p0 || cellCenter(s.cell)), orth);
  if (!sp) sp = perimeterPoint(s.cell, mid.length ? mid[0] : tp, orth);
  const pts = [sp].concat(mid, [tp]);
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { const q = out[out.length - 1]; if (Math.abs(q.x - pts[i].x) > 0.01 || Math.abs(q.y - pts[i].y) > 0.01 || i === pts.length - 1) out.push(pts[i]); }
  if (out.length < 2) out.push({ x: out[0].x, y: out[0].y });
  return { pts: out, kind: k, s, t };
}

/* ---------- edges: drawing ---------- */
function computeHops(routes, order) {
  // routes: Map id->{pts, kind, hops?}; edges later in order hop over earlier ones
  const H = new Map();
  for (let i = 0; i < order.length; i++) {
    const e = order[i];
    if (sv(e.style, 'jumpStyle', 'none') === 'none') continue;
    const r = routes.get(e.id); if (!r || r.kind === 'curved' || r.kind === 'curvedFree') continue;
    const js = sn(e.style, 'jumpSize', 8) / 2 + 1;
    const list = [];
    for (let j = 0; j < i; j++) {
      const o = routes.get(order[j].id); if (!o) continue;
      for (let a = 0; a < r.pts.length - 1; a++) for (let b = 0; b < o.pts.length - 1; b++) {
        const h = segInter(r.pts[a], r.pts[a + 1], o.pts[b], o.pts[b + 1]);
        if (!h) continue;
        const L = dist(r.pts[a], r.pts[a + 1]);
        if (h.t * L < js * 1.5 || (1 - h.t) * L < js * 1.5) continue;
        if (dist(h, o.pts[b]) < 1 || dist(h, o.pts[b + 1]) < 1) continue;
        list.push({ seg: a, t: h.t, p: { x: h.x, y: h.y } });
      }
    }
    if (list.length) H.set(e.id, list);
  }
  return H;
}
function edgePathD(pts, kind, hops, js) {
  if (pts.length < 2) return '';
  if (kind === 'curved' || kind === 'curvedFree') {
    let d = 'M' + pts[0].x + ',' + pts[0].y;
    if (pts.length === 2) return d + 'L' + pts[1].x + ',' + pts[1].y;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      const m = i < pts.length - 2 ? { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } : q;
      d += 'Q' + p.x + ',' + p.y + ' ' + m.x + ',' + m.y;
    }
    return d;
  }
  const rad = kind === 'soft' ? 10 : 0;
  js = js || 4;
  let d = 'M' + pts[0].x + ',' + pts[0].y;
  let start = pts[0];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], L = dist(a, b) || 1;
    const u = { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
    let end = b, cornerTo = null;
    if (rad && i < pts.length - 2) {
      const c = pts[i + 2], L2 = dist(b, c) || 1;
      const r = Math.min(rad, L / 2, L2 / 2);
      end = { x: b.x - u.x * r, y: b.y - u.y * r };
      cornerTo = { x: b.x + (c.x - b.x) / L2 * r, y: b.y + (c.y - b.y) / L2 * r };
    }
    const hs = (hops || []).filter(h => h.seg === i).sort((p, q) => p.t - q.t);
    for (const h of hs) {
      const before = { x: h.p.x - u.x * js, y: h.p.y - u.y * js }, after = { x: h.p.x + u.x * js, y: h.p.y + u.y * js };
      if (dist(start, before) < 0.1 || dist(a, h.p) > dist(a, end)) continue;
      d += 'L' + before.x + ',' + before.y + 'A' + js + ',' + js + ' 0 0 1 ' + after.x + ',' + after.y;
      start = after;
    }
    d += 'L' + end.x + ',' + end.y;
    if (cornerTo) { d += 'Q' + b.x + ',' + b.y + ' ' + cornerTo.x + ',' + cornerTo.y; start = cornerTo; } else start = end;
  }
  return d;
}
function markerSize(st, which) { return sn(st, which + 'Size', /^ER/.test(sv(st, which + 'Arrow', 'none')) ? 12 : 8); }
/* returns {elems:[{d,fill}], shorten} ; tip = endpoint, u = unit direction pointing into the tip */
function markerGeom(type, tip, u, size, sw) {
  const n = { x: -u.y, y: u.x };
  const at = (k, s) => ({ x: tip.x - u.x * k + n.x * s, y: tip.y - u.y * k + n.y * s });
  const line = (a, b) => 'M' + a.x + ',' + a.y + 'L' + b.x + ',' + b.y;
  const L = size + sw;
  const out = [];
  let shorten = 0;
  if (type === 'classic' || type === 'block') {
    const half = L * 0.45;
    out.push({ d: 'M' + tip.x + ',' + tip.y + 'L' + at(L, half).x + ',' + at(L, half).y + (type === 'classic' ? 'L' + at(L * 0.7, 0).x + ',' + at(L * 0.7, 0).y : '') + 'L' + at(L, -half).x + ',' + at(L, -half).y + 'Z', fill: 'stroke' });
    shorten = L * 0.7;
  } else if (type === 'open') {
    const half = L * 0.45;
    out.push({ d: 'M' + at(L, half).x + ',' + at(L, half).y + 'L' + tip.x + ',' + tip.y + 'L' + at(L, -half).x + ',' + at(L, -half).y, fill: 'none' });
    shorten = sw / 2;
  } else if (/^ER/.test(type)) {
    const s = size, half = s * 0.5;
    const bar = (k) => out.push({ d: line(at(k, half), at(k, -half)), fill: 'none' });
    const circ = (k) => { const c = at(k, 0), r = s * 0.28; out.push({ d: `M${c.x - r},${c.y}A${r},${r} 0 1 0 ${c.x + r},${c.y}A${r},${r} 0 1 0 ${c.x - r},${c.y}Z`, fill: 'white' }); };
    const crow = () => out.push({ d: line(at(s, 0), at(0, half)) + line(at(s, 0), at(0, -half)) + line(at(s, 0), at(0, 0)), fill: 'none' });
    if (type === 'ERone') bar(s * 0.6);
    else if (type === 'ERmandOne') { bar(s * 0.45); bar(s * 0.85); }
    else if (type === 'ERzeroToOne') { bar(s * 0.45); circ(s * 1.15); }
    else if (type === 'ERmany') crow();
    else if (type === 'ERoneToMany') { crow(); bar(s * 1.25); }
    else if (type === 'ERzeroToMany') { crow(); circ(s * 1.6); }
  }
  return { elems: out, shorten };
}
function endDir(pts, atEnd) {
  const n = pts.length;
  let a, b;
  if (atEnd) { b = pts[n - 1]; a = pts[n - 2]; for (let i = n - 2; i >= 0 && dist(a, b) < 0.5; i--) a = pts[i]; }
  else { b = pts[0]; a = pts[1]; for (let i = 1; i < n && dist(a, b) < 0.5; i++) a = pts[i]; }
  const L = dist(a, b) || 1;
  return { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
}
// A glow (blur filter) on something tens of thousands of pixels across can take the browser many seconds to draw; skip it.
function glowable(b) { return b && isFinite(b.w) && isFinite(b.h) && b.w < 20000 && b.h < 20000; }
function renderEdge(e, route, hops, opts) {
  opts = opts || {};
  const st = e.style, g = el('g', { 'data-id': e.id });
  if (sb(st, 'deGlow', false) && (!route || glowable(bboxOf(route.pts)))) g.setAttribute('filter', st.deGlow === '2' ? 'url(#deGlowSoft)' : 'url(#deGlow)');
  const stroke = colorOr(st, 'strokeColor', '#000000'), sw = sn(st, 'strokeWidth', 1);
  const dash = sb(st, 'dashed', false) ? (sv(st, 'dashPattern', '3 3').split(/\s+/).map(v => (+v) * sw).join(' ')) : null;
  const pts = route.pts.map(p => ({ x: p.x, y: p.y }));
  if (pts.length < 2) return g;
  const sA = sv(st, 'startArrow', 'none'), eA = sv(st, 'endArrow', 'classic');
  const uE = endDir(pts, true), uS = endDir(pts, false);
  const mE = markerGeom(eA, pts[pts.length - 1], uE, markerSize(st, 'end'), sw);
  const mS = markerGeom(sA, pts[0], uS, markerSize(st, 'start'), sw);
  const drawPts = pts.slice();
  if (mE.shorten) { const p = drawPts[drawPts.length - 1]; drawPts[drawPts.length - 1] = { x: p.x - uE.x * mE.shorten, y: p.y - uE.y * mE.shorten }; }
  if (mS.shorten) { const p = drawPts[0]; drawPts[0] = { x: p.x - uS.x * mS.shorten, y: p.y - uS.y * mS.shorten }; }
  const d = edgePathD(drawPts, route.kind, hops, sn(st, 'jumpSize', 8) / 2);
  const sketch = sb(st, 'sketch', false) && rs();
  if (!opts.noHit) el('path', { d: edgePathD(pts, route.kind, null), fill: 'none', stroke: 'transparent', 'stroke-width': 12, class: 'hit' }, g);
  if (sketch) g.appendChild(rs().path(d, { seed: hashStr(e.id), roughness: clamp(sn(st, 'jiggle', 1.5) * 0.66, 0.3, 2.2), bowing: 1, stroke, strokeWidth: sw, strokeLineDash: dash ? dash.split(' ').map(Number) : undefined }));
  else el('path', { d, fill: 'none', stroke, 'stroke-width': sw, 'stroke-dasharray': dash, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  for (const m of mE.elems.concat(mS.elems)) {
    const f = m.fill === 'stroke' ? stroke : (m.fill === 'white' ? '#ffffff' : 'none');
    el('path', { d: m.d, fill: f, stroke, 'stroke-width': sw, 'stroke-linejoin': 'round' }, g);
  }
  return g;
}
function routePolyline(route) {
  if (route.kind !== 'curved' && route.kind !== 'curvedFree') return route.pts;
  const p = route.pts; if (p.length < 3) return p;
  const out = [p[0]];
  let cur = p[0];
  for (let i = 1; i < p.length - 1; i++) {
    const c = p[i], q = p[i + 1];
    const m = i < p.length - 2 ? { x: (c.x + q.x) / 2, y: (c.y + q.y) / 2 } : q;
    for (let t = 0.125; t <= 1.0001; t += 0.125) {
      const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, cc = t * t;
      out.push({ x: a * cur.x + b * c.x + cc * m.x, y: a * cur.y + b * c.y + cc * m.y });
    }
    cur = m;
  }
  return out;
}
function edgeLabelPos(label, route) {
  const poly = routePolyline(route);
  const f = ((label.lx || 0) + 1) / 2;
  const p = pointAtFrac(poly, f);
  return { anchor: { x: p.x, y: p.y }, pos: { x: p.x + (label.lo ? label.lo.x : 0), y: p.y + (label.lo ? label.lo.y : 0) } };
}
function renderEdgeLabel(label, route, opts) {
  opts = opts || {};
  const g = el('g', { 'data-id': label.id });
  const { pos } = edgeLabelPos(label, route);
  const html = labelHtml(label);
  if (opts.exportText) { exportEdgeLabel(label, pos, g); return g; }
  const fo = el('foreignObject', { x: pos.x - 200, y: pos.y - 100, width: 400, height: 200, 'data-label': label.id }, g);
  fo.style.overflow = 'visible';
  const outer = document.createElementNS(XHTMLNS, 'div');
  outer.setAttribute('style', 'width:400px;height:200px;display:flex;align-items:center;justify-content:center;pointer-events:none;');
  const span = document.createElementNS(XHTMLNS, 'div');
  const bg = colorOr(label.style, 'labelBackgroundColor', '#ffffff');
  span.setAttribute('style', textCss(label.style) + 'text-align:' + alignCss(label.style) + ';background:' + (bg === 'none' ? 'transparent' : bg) + ';padding:1px 3px;max-width:300px;white-space:normal;overflow-wrap:break-word;min-width:6px;min-height:1.2em;');
  span.className = 'elbl';
  span.innerHTML = html || '&#8203;';
  outer.appendChild(span); fo.appendChild(outer);
  return g;
}

/* ---------- HTML -> SVG text (exports) ---------- */
const MEASURE = document.createElement('canvas').getContext('2d');
function parseRich(html, base) {
  const d = document.createElement('div'); d.innerHTML = html;
  const paras = [[]];
  let started = false;
  const walk = (node, s, listPrefix) => {
    for (const ch of Array.from(node.childNodes)) {
      if (ch.nodeType === 3) {
        const t = ch.nodeValue.replace(/\s+/g, ' ');
        if (t) { paras[paras.length - 1].push(Object.assign({ text: t }, s)); started = true; }
        continue;
      }
      if (ch.nodeType !== 1) continue;
      const tag = ch.tagName;
      const ns = Object.assign({}, s);
      if (tag === 'B' || tag === 'STRONG' || /^H\d$/.test(tag)) ns.b = true;
      if (tag === 'I' || tag === 'EM') ns.i = true;
      if (tag === 'U') ns.u = true;
      if (tag === 'S' || tag === 'STRIKE') ns.strike = true;
      if (tag === 'FONT') { if (ch.getAttribute('color')) ns.color = ch.getAttribute('color'); if (ch.getAttribute('face')) ns.family = ch.getAttribute('face'); if (ch.getAttribute('size')) ns.size = [0, 10, 13, 16, 18, 24, 32, 48][clamp(parseInt(ch.getAttribute('size')) || 3, 1, 7)]; }
      const css = ch.style;
      if (css) {
        if (css.color) ns.color = css.color;
        if (css.fontSize) { const v = parseFloat(css.fontSize); if (!isNaN(v)) ns.size = /em$/.test(css.fontSize) ? v * s.size : v; }
        if (css.fontWeight) { if (css.fontWeight === 'bold' || css.fontWeight === 'bolder' || +css.fontWeight >= 600) ns.b = true; else if (css.fontWeight === 'normal' || css.fontWeight === 'lighter' || +css.fontWeight < 600) ns.b = false; }   // normal inside bold is not bold, as on the canvas
        if (css.fontStyle === 'italic') ns.i = true;
        if (/underline/.test(css.textDecoration || css.textDecorationLine || '')) ns.u = true;
        if (css.fontFamily) ns.family = css.fontFamily.replace(/["']/g, '').split(',')[0];
      }
      const block = ['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'PRE', 'TR', 'UL', 'OL'].includes(tag);
      if (tag === 'BR') { paras.push([]); continue; }
      if (block && started && paras[paras.length - 1].length) paras.push([]);
      if (tag === 'LI') paras[paras.length - 1].push(Object.assign({ text: (listPrefix || '•') + ' ' }, ns));
      let lp = listPrefix;
      if (tag === 'OL') { let n = 0; for (const li of Array.from(ch.children)) { if (li.tagName === 'LI') { n++; if (paras[paras.length - 1].length) paras.push([]); paras[paras.length - 1].push(Object.assign({ text: n + '. ' }, ns)); walk(li, ns); } } started = true; continue; }
      walk(ch, ns, lp);
      if (block && paras[paras.length - 1].length) paras.push([]);
    }
  };
  walk(d, base);
  while (paras.length > 1 && !paras[paras.length - 1].length) paras.pop();
  return paras;
}
function runFont(r) { return (r.i ? 'italic ' : '') + (r.b ? 'bold ' : '') + r.size + 'px ' + fontCss(r.family); }
function layoutRich(html, st, maxW, wrap) {
  const fs = sn(st, 'fontStyle', 0);
  const base = { size: sn(st, 'fontSize', 12), color: colorOr(st, 'fontColor', '#1e293b'), family: st.fontFamily || DEFAULT_FONT, b: !!(fs & 1), i: !!(fs & 2), u: !!(fs & 4) };
  const paras = parseRich(html, base);
  const lines = [];
  for (const para of paras) {
    const toks = [];
    for (const r of para) for (const t of r.text.split(/(\s+)/)) if (t) toks.push(Object.assign({}, r, { text: t }));
    let line = [], w = 0;
    const flush = () => { while (line.length && /^\s+$/.test(line[line.length - 1].text)) { w -= line[line.length - 1].w; line.pop(); } lines.push({ runs: line, w, h: Math.max(base.size, ...line.map(r => r.size)) * 1.2 }); line = []; w = 0; };
    for (const t of toks) {
      MEASURE.font = runFont(t); t.w = MEASURE.measureText(t.text).width;
      if (wrap && line.length && w + t.w > maxW && !/^\s+$/.test(t.text)) flush();
      if (!line.length && /^\s+$/.test(t.text)) continue;
      line.push(t); w += t.w;
    }
    flush();
  }
  return lines;
}
function drawRichText(g, lines, box, align, valign) {
  const total = lines.reduce((a, l) => a + l.h, 0);
  let y = valign === 'top' ? box.y : valign === 'bottom' ? box.y + box.h - total : box.y + (box.h - total) / 2;
  const anchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
  const x = align === 'left' ? box.x : align === 'right' ? box.x + box.w : box.x + box.w / 2;
  for (const l of lines) {
    const baseline = y + l.h * 0.8;
    if (l.runs.length) {
      const t = el('text', { x, y: baseline, 'text-anchor': anchor }, g);
      t.setAttribute('xml:space', 'preserve');
      for (const r of l.runs) {
        const ts = el('tspan', { 'font-family': fontCss(r.family), 'font-size': r.size, fill: r.color, 'font-weight': r.b ? 'bold' : null, 'font-style': r.i ? 'italic' : null, 'text-decoration': r.u ? 'underline' : (r.strike ? 'line-through' : null) }, t);
        ts.textContent = r.text;
      }
    }
    y += l.h;
  }
  return { w: Math.max(0, ...lines.map(l => l.w)), h: total };
}
function exportLabel(c, g) {
  const html = labelHtml(c); if (!html) return;
  if (/<table[\s>]/i.test(html) && exportTableLabel(c, g, html)) return;
  const st = c.style, b = labelBox(c);
  const lines = layoutRich(html, st, b.w, sv(st, 'whiteSpace', '') === 'wrap');
  drawRichText(g, lines, b, sv(st, 'align', 'center'), sv(st, 'verticalAlign', 'middle'));
}
/* A label holding a table (a draw.io entity: name, key and type columns) is set out by the browser, as on the canvas,
   and copied into the picture as plain shapes: each cell's fill and borders as rectangles and lines, and each line of
   words as text at the place, font and colour the browser gave it. The picture needs no HTML and no script. */
function exportTableLabel(c, g, html) {
  const st = c.style, b = labelBox(c), va = sv(st, 'verticalAlign', 'middle');
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none';
  const outer = document.createElement('div');
  outer.style.cssText = 'width:' + b.w + 'px;height:' + b.h + 'px;display:flex;flex-direction:column;justify-content:' + (va === 'top' ? 'flex-start' : va === 'bottom' ? 'flex-end' : 'center');
  const inner = document.createElement('div');
  inner.setAttribute('style', textCss(st) + 'text-align:' + alignCss(st) + ';white-space:' + (sv(st, 'whiteSpace', '') === 'wrap' ? 'normal' : 'nowrap') + ';overflow-wrap:break-word;word-break:normal;');
  inner.innerHTML = html; outer.appendChild(inner); host.appendChild(outer); document.body.appendChild(host);
  const tg = el('g', null);
  try {
    const o = outer.getBoundingClientRect(), X = (v) => round2(b.x + v - o.left), Y = (v) => round2(b.y + v - o.top);
    const seen = (col) => col && !/^(transparent|rgba\([^)]*,\s*0\))$/.test(col);
    for (const e of inner.querySelectorAll('*')) {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
      if (seen(cs.backgroundColor)) el('rect', { x: X(r.left), y: Y(r.top), width: round2(r.width), height: round2(r.height), fill: cs.backgroundColor }, tg);
      for (const [side, x1, y1, x2, y2] of [['Top', r.left, r.top, r.right, r.top], ['Bottom', r.left, r.bottom, r.right, r.bottom], ['Left', r.left, r.top, r.left, r.bottom], ['Right', r.right, r.top, r.right, r.bottom]]) {
        const w = parseFloat(cs['border' + side + 'Width']); if (!w || cs['border' + side + 'Style'] === 'none' || !seen(cs['border' + side + 'Color'])) continue;
        const h = w / 2, dx = side === 'Left' ? h : side === 'Right' ? -h : 0, dy = side === 'Top' ? h : side === 'Bottom' ? -h : 0;
        el('line', { x1: X(x1 + dx), y1: Y(y1 + dy), x2: X(x2 + dx), y2: Y(y2 + dy), stroke: cs['border' + side + 'Color'], 'stroke-width': w }, tg);
      }
    }
    const walk = document.createTreeWalker(inner, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const t = n.data; if (!t.trim()) continue;
      const cs = getComputedStyle(n.parentElement), size = parseFloat(cs.fontSize) || 12, deco = cs.textDecorationLine || '';
      const attrs = { 'font-family': fontCss(cs.fontFamily.split(',')[0].replace(/["']/g, '').trim()), 'font-size': round2(size), fill: cs.color,
        'font-weight': parseInt(cs.fontWeight, 10) >= 600 ? 'bold' : null, 'font-style': cs.fontStyle === 'italic' ? 'italic' : null,
        'text-decoration': /underline/.test(deco) ? 'underline' : /line-through/.test(deco) ? 'line-through' : null };
      // the words of this piece of text, grouped by the line the browser put them on
      const lines = []; const re = /\S+/g; let m;
      while ((m = re.exec(t))) {
        rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); const r = rg.getBoundingClientRect(); if (!r.width) continue;
        const last = lines[lines.length - 1];
        if (last && Math.abs(last.top - r.top) < size * 0.5) { last.end = m.index + m[0].length; } else lines.push({ top: r.top, bottom: r.bottom, left: r.left, start: m.index, end: m.index + m[0].length });
      }
      for (const l of lines) {
        const txt = el('text', Object.assign({ x: X(l.left), y: Y(l.top + (l.bottom - l.top) / 2 + size * 0.35) }, attrs), tg);
        txt.setAttribute('xml:space', 'preserve'); txt.textContent = t.slice(l.start, l.end).replace(/\s+/g, ' ');
      }
    }
    g.appendChild(tg); return true;
  } catch (e) { return false; } finally { host.remove(); }
}
function exportEdgeLabel(label, pos, g) {
  const html = labelHtml(label); if (!html || !htmlToPlain(html).trim()) return;
  const lines = layoutRich(html, label.style, 300, true);
  const w = Math.max(...lines.map(l => l.w)) + 6, h = lines.reduce((a, l) => a + l.h, 0) + 2;
  const bg = colorOr(label.style, 'labelBackgroundColor', '#ffffff');
  if (bg !== 'none') el('rect', { x: pos.x - w / 2, y: pos.y - h / 2, width: w, height: h, fill: bg }, g);
  drawRichText(g, lines, { x: pos.x - w / 2 + 3, y: pos.y - h / 2 + 1, w: w - 6, h: h - 2 }, sv(label.style, 'align', 'center'), 'middle');
}

/* ---------- whole-page rendering helper ---------- */
function computeRoutes(page, map) {
  const routes = new Map(), edges = [];
  for (const c of page.cells) if (c.e) { const r = edgeRoute(c, map); routes.set(c.id, r); edges.push(c); }
  return { routes, edges, hops: computeHops(routes, edges) };
}
function isHiddenByLayer(page, c, map) {
  let p = c.parent, guard = 0;
  while (p && guard++ < 50) {
    const l = page.layers.find(x => x.id === p);
    if (l) return l.raw && l.raw.cellAttrs && l.raw.cellAttrs.visible === '0';
    const pc = map.get(p); if (!pc) return false; p = pc.parent;
  }
  return false;
}
