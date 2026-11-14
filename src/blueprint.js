/* ===== Blueprint style (based on the Fine Line Blueprint style guide). Rules and token tables: docs/STYLES.md, permutation 21 ===== */
// Every Blueprint colour and size comes from these tokens; nothing else in the editor hard-codes them. Keep docs/STYLES.md in step.
const BP = {
  ink: '#12355B', inkSoft: '#3D5A7A', redline: '#B23C0B', fill: '#EAF1F8', fillRed: '#FDF1EA', paper: '#FFFFFF', dots: '#CFDBE8',
  shadow: { color: '#12355B', opacity: 20, dx: 2, dy: 3 },
  font: SKETCH_FONT, outline: 1.5, radius: 3, line: 2.5,
  size: { box: 22, label: 17, note: 21, title: 38, subtitle: 18 }
};
// Semantic states: ink (outline, text, icon) and pale fill; ink on fill is at least 4.5:1.
const BP_STATES = {
  note: { label: 'Note', ink: '#1F5FA8', fill: '#E6F0FB', icon: 'info' },
  good: { label: 'Good', ink: '#1E6B45', fill: '#E3F4EA', icon: 'check-circle' },
  bad: { label: 'Bad', ink: '#A1162B', fill: '#FBE4E7', icon: 'x-circle' },
  warning: { label: 'Warning', ink: '#8A5300', fill: '#FFF1D1', icon: 'warning' },
  alert: { label: 'Alert', ink: '#B54708', fill: '#FEEBDD', icon: 'bell-ringing', width: 2.5, solid: true },
  critical: { label: 'Critical', ink: '#8E1027', fill: '#FBE4E7', icon: 'warning-octagon', width: 4, double: true, solid: true },
  new: { label: 'New', ink: '#1E6B45', fill: '#E3F4EA', icon: 'plus-circle' },
  changed: { label: 'Changed', ink: '#8A5300', fill: '#FFF1D1', icon: 'pencil-simple' },
  retire: { label: 'Retire', ink: '#5F6B7A', fill: '#F1F3F5', icon: 'archive', dashed: true, noShadow: true },
  comment: { label: 'Comment', ink: '#3A3A3A', fill: '#FFFDF0', line: '#D9C66A', pin: '#FFF6C2', icon: 'chat-circle-text', radius: 12 },
  neutral: { label: 'Neutral', ink: '#5F6B7A', fill: '#F1F3F5', icon: 'minus-circle' }
};
// Emphasis (not semantic): no icon, no marker.
const BP_EMPHASIS = {
  focus: { label: 'Focus', ink: BP.redline, fill: BP.fillRed, line: BP.ink },
  external: { label: 'External', ink: BP.ink, fill: BP.paper, line: BP.ink, dashed: true }
};
// Names come from files, so only the table's own entries count (never 'constructor' and the like).
function bpSemantic(id) { return typeof id === 'string' && Object.hasOwn(BP_STATES, id) ? BP_STATES[id] : null; }
function bpState(id) { return bpSemantic(id) || (typeof id === 'string' && Object.hasOwn(BP_EMPHASIS, id) ? BP_EMPHASIS[id] : null); }
// Line types. Patterns are the guide's pixel lengths at 2.5 px; the renderer multiplies dashPattern by the width, so they are stored divided by 2.5.
const BP_LINES = [
  { id: 'existing', label: 'Existing', stroke: BP.ink, dash: null, head: 'block' },
  { id: 'planned', label: 'Planned', stroke: BP.ink, dash: [8, 6], head: 'block' },
  { id: 'async', label: 'Async', stroke: BP.ink, dash: [1, 6], head: 'block' },
  { id: 'retire', label: 'Retire', stroke: '#5F6B7A', dash: [8, 6], head: 'block' },
  { id: 'annotation', label: 'Annotation', stroke: BP.redline, dash: [6, 6], head: 'block' },
  { id: 'association', label: 'Association', stroke: BP.ink, dash: null, head: 'none' }
];
function bpLine(id) { return BP_LINES.find(l => l.id === id) || BP_LINES[0]; }
function bpDashPattern(px) { return px.map(v => +(v / BP.line).toFixed(3)).join(' '); }

/* ---------- shadow (any style) ---------- */
// Crisp offset shadow, never blurred. Defaults for a shape that has shadow switched on without settings.
const SHADOW_DEFAULT = { color: '#000000', opacity: 20, dx: 3, dy: 3 };
function shadowOf(st) {
  if (!sb(st, 'deShadow', false)) return null;
  const col = sv(st, 'deShadowColor', SHADOW_DEFAULT.color);
  return {
    color: safeColour(col) && hexRgb(col) ? col : SHADOW_DEFAULT.color,
    opacity: clamp(sn(st, 'deShadowOpacity', SHADOW_DEFAULT.opacity), 0, 100),
    dx: clamp(sn(st, 'deShadowDx', SHADOW_DEFAULT.dx), -50, 50),
    dy: clamp(sn(st, 'deShadowDy', SHADOW_DEFAULT.dy), -50, 50)
  };
}
function setShadow(st, s) {
  if (!s) { for (const k of ['deShadow', 'deShadowColor', 'deShadowOpacity', 'deShadowDx', 'deShadowDy']) delete st[k]; return; }
  st.deShadow = '1'; st.deShadowColor = s.color; st.deShadowOpacity = String(s.opacity); st.deShadowDx = String(s.dx); st.deShadowDy = String(s.dy);
}
function isBpShadow(st) { const s = shadowOf(st); return !!s && s.color.toLowerCase() === BP.shadow.color.toLowerCase() && s.opacity === BP.shadow.opacity && s.dx === BP.shadow.dx && s.dy === BP.shadow.dy; }
// Blueprint gives shadows to shapes only (not text, lines, icons, containers or Retire); the Drop shadow panel allows any shape.

/* ---------- applying the look ---------- */
function bpFont(st) { st.fontFamily = BP.font; st.fontSource = SKETCH_FONT_SOURCE; }
function bpRadius(c, r) {
  if (shapeKind(c) !== 'rect') return;
  const st = c.style;
  // keep pills and other strongly rounded boxes (terminators); square and lightly rounded boxes get the guide's 3 px
  if (sb(st, 'rounded', false) && !sb(st, 'absoluteArcSize', false) && sn(st, 'arcSize', 15) > 20) return;
  st.rounded = '1'; st.absoluteArcSize = '1'; st.arcSize = String(r * 2);
}
function bpPlainShape(c, o) {
  const st = c.style;
  st.fillColor = BP.fill; st.strokeColor = BP.ink; st.strokeWidth = String(BP.outline); st.fontColor = BP.ink;
  delete st.dashed; delete st.dashPattern; delete st.deDouble;
  bpRadius(c, BP.radius);
  if (o.shadows) setShadow(st, BP.shadow); else if (isBpShadow(st)) setShadow(st, null);
}
// Apply a Blueprint state (or 'none') to a shape. The icon goes before the label; Alert and Critical markers are solid.
function bpApplyState(c, id, o) {
  const st = c.style, old = bpState(st.deState);
  if (old && old.icon && st.deIcon === old.icon) delete st.deIcon;
  delete st.deState;
  bpPlainShape(c, o);
  const s = bpState(id);
  if (!s) return;
  st.deState = id;
  st.fillColor = s.fill; st.strokeColor = s.line || s.ink; st.fontColor = s.ink;
  st.strokeWidth = String(s.width || BP.outline);
  if (s.dashed) st.dashed = '1';
  if (s.double) st.deDouble = '1';
  if (s.radius) bpRadius(c, s.radius);
  if (s.noShadow) setShadow(st, null);
  if (s.icon) st.deIcon = s.icon;
}
// The redline notes shapes keep their own look in Blueprint.
function bpNote(c) {
  const st = c.style;
  bpFont(st); st.fontColor = BP.redline; st.fontSize = String(BP.size.note);
}
// Line labels sit beside the line, at least 8 px clear of it (guide: arrow label), instead of on a white box.
function bpOffsetLabel(l, ctx) {
  if (!ctx || !ctx.routes || (l.lo && (Math.abs(l.lo.x) > 0.5 || Math.abs(l.lo.y) > 0.5))) return;
  const r = ctx.routes.get(l.parent); if (!r || !r.pts || r.pts.length < 2) return;
  const poly = routePolyline(r), f = ((l.lx || 0) + 1) / 2;
  let total = 0; for (let i = 1; i < poly.length; i++) total += dist(poly[i - 1], poly[i]);
  let at = f * total, dx = 1, dy = 0;
  for (let i = 1; i < poly.length; i++) { const L = dist(poly[i - 1], poly[i]); dx = poly[i].x - poly[i - 1].x; dy = poly[i].y - poly[i - 1].y; if (at <= L) break; at -= L; }
  const html = labelHtml(l) || '';
  const lines = typeof layoutRich === 'function' ? layoutRich(html, l.style, 300, true) : [];
  const w = Math.max(0, ...lines.map(x => x.w)) + 6, h = lines.reduce((a, x) => a + x.h, 0) + 2;
  const gap = 8 + BP.line / 2;
  l.lo = Math.abs(dx) >= Math.abs(dy) ? { x: 0, y: -Math.round(h / 2 + gap) } : { x: Math.round(w / 2 + gap), y: 0 };
}
function bpEdge(e) {
  const st = e.style, t = bpLine(st.deLine);
  st.strokeColor = t.stroke; st.strokeWidth = String(BP.line);
  if (t.dash) { st.dashed = '1'; st.dashPattern = bpDashPattern(t.dash); } else { delete st.dashed; delete st.dashPattern; }
  // arrowheads become the guide's filled triangle; crow's foot ends and "no head" are kept
  const head = (k) => { const v = sv(st, k + 'Arrow', k === 'end' ? 'classic' : 'none'); if (v === 'none' || /^ER/.test(v)) return; st[k + 'Arrow'] = 'block'; st[k + 'Fill'] = '1'; st[k + 'Size'] = '8'; };
  if (t.head === 'none') { st.endArrow = 'none'; } else { if (sv(st, 'endArrow', 'classic') === 'none' && st.deLine) st.endArrow = 'block'; head('end'); }
  head('start');
  if (t.id === 'existing') delete st.deLine; else st.deLine = t.id;
  // horizontal and vertical lines: straight lines without waypoints become elbows; curved and waypoint routes are kept
  if (!st.deNote && sv(st, 'edgeStyle', 'none') === 'none' && !(e.pts && e.pts.length)) { st.edgeStyle = 'orthogonalEdgeStyle'; st.rounded = '0'; }
  bpFont(st); st.fontColor = BP.inkSoft; st.fontSize = String(BP.size.label); st.labelBackgroundColor = 'none';
}
// Apply a line type to an edge already in Blueprint.
function bpSetLine(e, id) { if (id === 'existing') delete e.style.deLine; else e.style.deLine = id; bpEdge(e); }

/* ---------- converting one cell to Blueprint (from Outline) ---------- */
function toBlueprint(c, o, ctx) {
  const st = c.style, role = styleRole(c);
  delete st.deGlow; delete st.fillOpacity; delete st.deC2;
  if (role === 'background') return;
  if (st.deNote && role !== 'edge') { bpNote(c); st.deMode = 'blueprint'; return; }
  if (role === 'shape') {
    bpFont(st); st.fontStyle = String(sn(st, 'fontStyle', 0) | 1);
    if (o.sizes) st.fontSize = String(BP.size.box);
    if (bpState(st.deState)) bpApplyState(c, st.deState, o); else { delete st.deState; bpPlainShape(c, o); }
  } else if (role === 'harvey') {
    st.strokeColor = BP.ink; st.fillColor = BP.paper; st.strokeWidth = String(BP.outline); bpFont(st); st.fontColor = BP.ink;
  } else if (role === 'container') {
    const k = shapeKind(c);
    if (k !== 'folder' && k !== 'partialRect') { st.fillColor = 'none'; bpRadius(c, BP.radius); st.align = 'left'; st.verticalAlign = 'top'; }
    st.strokeColor = BP.inkSoft; st.strokeWidth = String(BP.outline); st.dashed = '1';
    bpFont(st); st.fontColor = BP.inkSoft; st.fontSize = String(BP.size.label);
    if (sn(st, 'fontStyle', 0) & 1) st.fontStyle = String(sn(st, 'fontStyle', 0) & ~1);
    if (st.fontStyle === '0') delete st.fontStyle;
    setShadow(st, null);
  } else if (role === 'edge') {
    bpEdge(c);
  } else if (role === 'label') {
    bpFont(st); st.fontColor = BP.inkSoft; st.fontSize = String(BP.size.label); st.labelBackgroundColor = 'none';
    bpOffsetLabel(c, ctx);
  } else if (role === 'icon') {
    setIconWeight(c, 'regular'); st.fillColor = BP.ink; bpFont(st); st.fontColor = BP.ink;
  } else if (role === 'text') {
    bpFont(st); st.fontColor = BP.ink;
    if (o.sizes) st.fontSize = String(Math.max(BP.size.label, sn(st, 'fontSize', 12)));
  }
  st.deMode = 'blueprint';
}
// Leaving Blueprint (first step of every switch away): remove what only Blueprint adds. Colours are then handled by toOutline.
function fromBlueprint(c) {
  const st = c.style, role = styleRole(c);
  const s = bpState(st.deState);
  if (s) {
    if (s.icon && st.deIcon === s.icon) delete st.deIcon;
    if (s.dashed) delete st.dashed;
    if (s.width) st.strokeWidth = String(BP.outline);
  }
  delete st.deState; delete st.deMarker; delete st.deDouble;
  if (isBpShadow(st)) setShadow(st, null);
  if (role === 'edge' && st.deNote) { st.strokeWidth = '1.5'; st.dashPattern = '4 4'; } // annotation lines keep their red dashes
  else if (role === 'edge') {
    if (st.deLine) { delete st.dashed; delete st.dashPattern; }
    delete st.deLine;
    if (sn(st, 'strokeWidth', 1) >= 2.5) st.strokeWidth = '1.5';
    for (const k of ['start', 'end']) if (st[k + 'Arrow'] === 'block') st[k + 'Arrow'] = 'classic';
  }
  if (role === 'label' && st.labelBackgroundColor === 'none') st.labelBackgroundColor = '#ffffff';
  if (role === 'shape' || role === 'container') { if (sb(st, 'absoluteArcSize', false) && shapeKind(c) === 'rect') { delete st.absoluteArcSize; st.arcSize = '12'; } }
  if (!st.deNote && st.fontFamily === SKETCH_FONT) { delete st.fontFamily; delete st.fontSource; }
}

/* ---------- Harvey balls ---------- */
const HARVEY_STEPS = [0, 25, 50, 75, 100];
function harveyOf(st) { const v = sn(st, 'deHarvey', 0); return HARVEY_STEPS.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a, 0); }
// The wedge, in a w x h box, clockwise from 12 o'clock.
function harveyWedge(x, y, w, h, p) {
  const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
  if (p <= 0) return null;
  if (p >= 100) return `M${x},${cy}A${rx},${ry} 0 1 0 ${x + w},${cy}A${rx},${ry} 0 1 0 ${x},${cy}Z`;
  const a = -Math.PI / 2 + 2 * Math.PI * p / 100;
  const ex = cx + rx * Math.cos(a), ey = cy + ry * Math.sin(a);
  return `M${cx},${cy}L${cx},${y}A${rx},${ry} 0 ${p > 50 ? 1 : 0} 1 ${ex},${ey}Z`;
}
// draw.io stencil (generated on save, like icons): the ring in the cell's fill and outline, the wedge in the outline colour.
function harveyStencil(st) {
  const p = harveyOf(st), col = safeColour(st.strokeColor) && hexRgb(st.strokeColor) ? st.strokeColor : '#000000';
  let xml = '<shape name="harvey-' + p + '" w="100" h="100" aspect="variable" strokewidth="inherit"><background><ellipse x="0" y="0" w="100" h="100"/></background><foreground><fillstroke/>';
  if (p >= 100) xml += '<fillcolor color="' + col + '"/><ellipse x="0" y="0" w="100" h="100"/><fillstroke/>';
  else if (p > 0) {
    const a = -Math.PI / 2 + 2 * Math.PI * p / 100, ex = round3(50 + 50 * Math.cos(a)), ey = round3(50 + 50 * Math.sin(a));
    xml += '<fillcolor color="' + col + '"/><path><move x="50" y="50"/><line x="50" y="0"/><arc rx="50" ry="50" x-axis-rotation="0" large-arc-flag="' + (p > 50 ? 1 : 0) + '" sweep-flag="1" x="' + ex + '" y="' + ey + '"/><close/></path><fillstroke/>';
  }
  return stencilCode(xml + '</foreground></shape>');
}

/* ---------- checklist ---------- */
const CHECK_OFF = '☐', CHECK_ON = '☑';
// Toggle the n-th check box (0-based) in a checklist label.
function toggleCheck(html, n) {
  let i = -1;
  return String(html).replace(/[☐☑]/g, (m) => { i++; return i === n ? (m === CHECK_OFF ? CHECK_ON : CHECK_OFF) : m; });
}
// Which check box, if any, is at world point p: the visual line under p must start an item, and p must be on its box.
function checkAt(c, p) {
  if (!sb(c.style, 'deChecklist', false) || cellRot(c)) return -1;
  const html = labelHtml(c); if (!html) return -1;
  const st = c.style, b = labelBox(c);
  const lines = layoutRich(html, st, b.w, sv(st, 'whiteSpace', '') === 'wrap');
  const total = lines.reduce((a, l) => a + l.h, 0), va = sv(st, 'verticalAlign', 'middle');
  let y = va === 'top' ? b.y : va === 'bottom' ? b.y + b.h - total : b.y + (b.h - total) / 2;
  let n = -1;
  for (const l of lines) {
    const first = l.runs.length ? l.runs[0].text : '';
    const starts = /^[☐☑]/.test(first);
    if (starts) n++;
    if (p.y >= y && p.y < y + l.h) {
      if (!starts) return -1;
      const al = sv(st, 'align', 'left'), x0 = al === 'left' ? b.x : al === 'right' ? b.x + b.w - l.w : b.x + (b.w - l.w) / 2;
      MEASURE.font = runFont(l.runs[0]);
      const bw = MEASURE.measureText(first[0]).width;
      return p.x >= x0 - 3 && p.x <= x0 + bw + 3 ? n : -1;
    }
    y += l.h;
  }
  return -1;
}
// The box grows (or shrinks) to fit its items.
function fitChecklist(c) {
  if (!sb(c.style, 'deChecklist', false)) return;
  const b = labelBox(c), lines = layoutRich(labelHtml(c) || '&nbsp;', c.style, b.w, sv(c.style, 'whiteSpace', '') === 'wrap');
  const need = Math.ceil(lines.reduce((a, l) => a + l.h, 0) + (c.h - b.h) + 4);
  if (Math.abs(need - c.h) > 1) c.h = Math.max(20, need);
}
