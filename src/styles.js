/* ===== Diagram styles: Outline, Filled, Duotone, Sketch, Neon. Rules: docs/STYLES.md ===== */
// A style switch is a one-way recolour (no hidden originals). The user is warned first; the switch is one Undo step.

const STYLE_MODES = [
  { id: 'outline', label: 'Outline', hint: 'Clean lines, the normal look' },
  { id: 'filled', label: 'Filled', hint: 'Solid or tinted colour shapes' },
  { id: 'duotone', label: 'Duotone', hint: 'Two harmonising colours' },
  { id: 'sketch', label: 'Sketch', hint: 'Hand-drawn whiteboard' },
  { id: 'neon', label: 'Neon', hint: 'Glowing lines, best on dark backgrounds' },
  { id: 'blueprint', label: 'Blueprint', hint: 'Navy ink on a dotted page, with status colours' }
];
const STYLE_DEFAULTS = {
  outline: { override: true, fill: 'auto', preset: 'Blue', iconOverride: false, iconPreset: 'Blue', resetFont: true, whiteCanvas: true },
  filled: { override: true, fill: 'block', preset: 'Blue', iconOverride: true, icon: 'block', iconPreset: 'Blue', whiteCanvas: true },
  duotone: { override: true, scheme: 'analogous', ccw: false, tint: 'standard', scope: 'shape', whiteCanvas: true },
  sketch: { fillStyle: 'hachure', rough: 'normal', font: true, whiteCanvas: false },
  neon: { darkCanvas: true },
  blueprint: { sizes: true, shadows: true, whiteCanvas: true }
};
const DUO_SCHEMES = [
  { id: 'monochromatic', label: 'Monochromatic', deg: 0 }, { id: 'analogous', label: 'Analogous', deg: 30 },
  { id: 'complementary', label: 'Complementary', deg: 180 }, { id: 'split', label: 'Split complementary', deg: 150 },
  { id: 'triadic', label: 'Triadic', deg: 120 }, { id: 'tetradic', label: 'Tetradic', deg: 60 }
];
const SKETCH_FILLS = [['hachure', 'Hachure (diagonal lines)'], ['none', 'Transparent (outlines only)'], ['solid', 'Solid'], ['cross-hatch', 'Cross-hatch'], ['zigzag', 'Zigzag'], ['dots', 'Dots'], ['dashed', 'Dashed']];
const NAVY = '#0f172a', SLATE_STROKE = '#475569', LIGHT_GREY = '#e2e8f0';

/* ---------- colour maths ---------- */
function hexRgb(h) {
  if (!h || typeof h !== 'string') return null;
  let m = h.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(m)) m = '#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
  if (!/^#[0-9a-f]{6}$/.test(m)) return null;
  return [parseInt(m.slice(1, 3), 16), parseInt(m.slice(3, 5), 16), parseInt(m.slice(5, 7), 16)];
}
function rgbHex(r) { return '#' + r.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
function mixHex(a, b, t) { const A = hexRgb(a), B = hexRgb(b); if (!A || !B) return a; return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); }
function lum(h) { const r = hexRgb(h); if (!r) return 1; const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r[0]) + 0.7152 * f(r[1]) + 0.0722 * f(r[2]); }
function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function chroma(h) { const r = hexRgb(h); if (!r) return 0; return (Math.max(...r) - Math.min(...r)) / 255; }
function isNeutral(h) { return !hexRgb(h) || chroma(h) < 0.16; }
function reliableFill(h) { return !!hexRgb(h) && chroma(h) >= 0.08; }
function existingFill(h) { const r = hexRgb(h); return !!r && Math.min(...r) < 240; } // not none, white or near-white
function strongFill(h) { return !!hexRgb(h) && chroma(h) >= 0.16 && hexHsl(h)[2] < 0.75; } // solid colour, not a tint
function hexHsl(h) {
  const [r, g, b] = hexRgb(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hh * 60, s, l];
}
function hslHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}
// Strong version of a colour's hue (for outlines and text), and a soft tint (for fills).
function strongOf(h) { const [hh, s, l] = hexHsl(h); return hslHex(hh, Math.max(s, 0.55), clamp(l, 0.38, 0.5)); }
function tintOf(h, l) { const [hh, s] = hexHsl(h); return hslHex(hh, Math.min(0.85, Math.max(s, 0.5)), l); }
// Artist's (red, yellow, blue) wheel: piecewise mapping between RYB and RGB hue angles.
const RYB_RGB = [[0, 0], [60, 35], [120, 60], [180, 120], [240, 225], [300, 280], [360, 360]];
function wheelMap(v, from, to) {
  v = ((v % 360) + 360) % 360;
  for (let i = 1; i < RYB_RGB.length; i++) {
    const a = RYB_RGB[i - 1], b = RYB_RGB[i];
    if (v <= b[from]) return a[to] + (v - a[from]) / ((b[from] - a[from]) || 1) * (b[to] - a[to]);
  }
  return v;
}
function rybRotate(h, deg) { const [hh, s, l] = hexHsl(h); const ryb = wheelMap(hh, 1, 0) + deg; return hslHex(wheelMap(ryb, 0, 1), s, l); }
// Neon colour for a canvas: a vivid tone of the hue (light on dark, deep on light), then the OKLCH tonal correction
// until it meets WCAG 1.4.11 non-text contrast (3:1). Same hue in, same Neon colour out, whichever way you switch.
// Only the OKLCH hue is used (in 2 degree steps), so a colour that was already tuned for the other canvas gives the same result.
function neonOf(h, dark, canvas) {
  const H = Math.round(hexOklch(h).H / 2) * 2, bg = canvas || (dark ? NAVY : '#ffffff');
  return toneFix(oklchHex(dark ? 0.8 : 0.55, 0.16, H), bg, GRAPHIC_MIN).hex;
}
// Neon text: a pale (dark canvas) or deep (light canvas) tone of the same hue.
function neonText(nb, dark) { const o = hexOklch(nb); return oklchHex(dark ? 0.93 : 0.3, Math.min(o.C, 0.06), o.H); }

/* ---------- diagram state ---------- */
function isGroupCell(c) { return c.style && c.style.group !== undefined; }
function modeOf(c) { return sb(c.style, 'sketch', false) ? 'sketch' : (c.style.deMode || 'outline'); }
function docModeFromCells(doc) {
  const n = {};
  for (const p of doc.pages) for (const c of p.cells) if (!isGroupCell(c) && !c.isEdgeLabel) { const m = modeOf(c); n[m] = (n[m] || 0) + 1; }
  let best = 'outline', bn = 0; for (const m in n) if (n[m] > bn) { best = m; bn = n[m]; }
  return best;
}
function styleRole(c) {
  if (c.e) return 'edge';
  if (c.isEdgeLabel) return 'label';
  if (c.style.dePh) return 'icon';
  if (c.style.deDots !== undefined) return 'background';
  if (c.style.deHarvey !== undefined) return 'harvey';
  const k = shapeKind(c);
  if (k === 'text' || k === 'edgeLabel') return 'text';
  if (c.style.deCont === '1' || k === 'folder' || k === 'partialRect' || c.style.container === '1' || c.style.swimlane !== undefined || (c.style.fillColor || '') === 'none') return 'container';
  return 'shape';
}
function labelInside(c) { return sv(c.style, 'labelPosition', 'center') === 'center' && sv(c.style, 'verticalLabelPosition', 'middle') === 'middle'; }
function isDarkBg(bg) { return lum(bg) < 0.3; }
// Most common reliable hue among the diagram's shapes (30 degree buckets), as a strong colour.
function dominantColour(doc) {
  const buckets = new Map();
  for (const p of doc.pages) for (const c of p.cells) {
    if (c.e || c.isEdgeLabel || isGroupCell(c)) continue;
    const col = c.style.dePh ? (isNeutral(c.style.fillColor) ? null : c.style.fillColor) : reliableFill(c.style.fillColor) ? c.style.fillColor : !isNeutral(c.style.strokeColor) ? c.style.strokeColor : null;
    if (!col) continue;
    const k = Math.round(hexHsl(col)[0] / 30) % 12, b = buckets.get(k) || { n: 0, col };
    b.n++; buckets.set(k, b);
  }
  let best = null; for (const b of buckets.values()) if (!best || b.n > best.n) best = b;
  return best ? strongOf(best.col) : null;
}
function presetByName(n) { return PALETTE.find(p => p.name === n) || PALETTE[1]; }

/* ---------- converting one cell ---------- */
// To Outline (permutations 5, 9, 13, 17 and the first step of the others).
function toOutline(c, from, o) {
  const st = c.style, role = styleRole(c);
  if (from === 'blueprint' || st.deMode === 'blueprint') fromBlueprint(c);
  if (sb(st, 'sketch', false)) applySketch(c, false, { resetFont: o.resetFont !== false });
  if (from === 'neon' || st.deGlow) {
    delete st.deGlow; delete st.fillOpacity;
    if (role === 'edge' || role === 'shape' || role === 'container') { if (sn(st, 'strokeWidth', 1) >= 2) st.strokeWidth = '1.5'; }
    if (role === 'label') st.labelBackgroundColor = '#ffffff';
    if ((role === 'shape' || role === 'container') && hexRgb(st.fillColor) && hexRgb(st.strokeColor)) st.fillColor = st.strokeColor; // the 10% wash: treat as the outline colour
  }
  if (role === 'icon') {
    setIconWeight(c, 'regular'); delete st.deC2;
    if (o.iconOverride) st.fillColor = presetByName(o.iconPreset).stroke;
  } else if ((role === 'shape' || role === 'container') && (from === 'filled' || from === 'duotone' || from === 'neon' || from === 'blueprint')) {
    const f = st.fillColor;
    if (o.override || !existingFill(f)) {
      if (role === 'container') { if (strongFill(f)) st.fillColor = tintOf(f, 0.94); }
      else {
        if (strongFill(f) && from !== 'neon') st.strokeColor = f;
        const base = isNeutral(st.strokeColor) ? null : st.strokeColor;
        if (o.fill === 'none') st.fillColor = '#ffffff';
        else if (o.fill === 'pick') { const p = presetByName(o.preset); st.fillColor = p.fill; st.strokeColor = p.stroke; st.fontColor = p.font; }
        else st.fillColor = base ? tintOf(base, 0.9) : '#f8fafc';
      }
    }
  }
  delete st.deMode;
}
function toFilled(c, o) {
  const st = c.style, role = styleRole(c);
  if (role === 'icon') {
    if (o.icon === 'pick') { st.fillColor = presetByName(o.iconPreset).stroke; setIconWeight(c, 'fill'); }
    else { if (o.iconOverride && isNeutral(st.fillColor)) st.fillColor = SLATE_STROKE; setIconWeight(c, o.icon === 'auto' ? 'duotone' : 'fill'); }
    delete st.deC2;
  } else if (role === 'shape' || role === 'container') {
    if (!o.override && existingFill(st.fillColor)) return;
    const colour = !isNeutral(st.strokeColor) ? st.strokeColor : reliableFill(st.fillColor) ? strongOf(st.fillColor) : null;
    if (o.fill === 'pick') { const p = presetByName(o.preset); st.fillColor = role === 'container' ? tintOf(p.stroke, 0.95) : p.fill; st.strokeColor = p.stroke; st.fontColor = p.font; }
    else if (role === 'container') st.fillColor = colour ? tintOf(colour, 0.95) : '#f1f5f9';
    else if (o.fill === 'auto') st.fillColor = colour ? tintOf(colour, 0.9) : '#f1f5f9';
    else if (colour) { st.fillColor = colour; st.strokeColor = mixHex(colour, '#000000', 0.25); }
    else st.fillColor = LIGHT_GREY;
  }
  st.deMode = 'filled';
}
function toDuotone(c, o, ctx) {
  const st = c.style, role = styleRole(c);
  const sch = DUO_SCHEMES.find(s => s.id === o.scheme) || DUO_SCHEMES[1], deg = (o.ccw ? -1 : 1) * sch.deg, L = o.tint === 'lighter' ? 0.94 : 0.87;
  const own = role === 'icon' ? (isNeutral(st.fillColor) ? null : st.fillColor) : reliableFill(st.fillColor) ? st.fillColor : !isNeutral(st.strokeColor) ? st.strokeColor : null;
  const c1 = strongOf(o.scope === 'diagram' ? (ctx.dominant || '#2563eb') : (own || ctx.dominant || '#2563eb'));
  const c2 = tintOf(rybRotate(c1, deg), L);
  if (role === 'icon') { st.fillColor = c1; st.deC2 = c2; setIconWeight(c, 'duotone'); }
  else if (role === 'shape' || role === 'container') {
    if (!o.override && existingFill(st.fillColor)) return;
    st.strokeColor = c1;
    st.fillColor = role === 'container' ? tintOf(rybRotate(c1, deg), 0.96) : c2;
    if (role === 'shape' && labelInside(c)) st.fontColor = c1;
  }
  st.deMode = 'duotone';
}
function toNeon(c, ctx) {
  const st = c.style, role = styleRole(c), dark = ctx.dark;
  const own = role === 'icon' ? (isNeutral(st.fillColor) ? null : st.fillColor) : role === 'edge' ? (isNeutral(st.strokeColor) ? null : st.strokeColor)
    : role === 'text' || role === 'label' ? null : !isNeutral(st.strokeColor) ? st.strokeColor : reliableFill(st.fillColor) ? strongOf(st.fillColor) : null;
  const nb = neonOf(own || ctx.dominant || '#0891b2', dark, ctx.canvas); // from the hue, so dark and light give the same colours whichever way you switch
  const txt = neonText(nb, dark);
  if (role !== 'text') st.deGlow = dark ? '1' : '2';
  if (role === 'shape' || role === 'container') {
    st.strokeColor = nb; st.fillColor = nb; st.fillOpacity = role === 'container' ? '4' : '10';
    st.strokeWidth = String(Math.max(2, sn(st, 'strokeWidth', 1)));
    if (labelInside(c) || dark) st.fontColor = txt;
  } else if (role === 'edge') { st.strokeColor = nb; st.strokeWidth = String(Math.max(2, sn(st, 'strokeWidth', 1))); }
  else if (role === 'icon') { st.fillColor = nb; setIconWeight(c, 'regular'); delete st.deC2; }
  else if (role === 'label') { st.labelBackgroundColor = 'none'; }
  st.deMode = 'neon';
}
function toSketch(c, o) {
  const st = c.style;
  delete st.deGlow; delete st.fillOpacity; delete st.deMode;
  if (st.labelBackgroundColor === 'none' && c.isEdgeLabel) delete st.labelBackgroundColor;
  const role = styleRole(c);
  if (o.fillStyle === 'none' && (role === 'shape' || role === 'container')) st.fillColor = 'none'; // outlines only
  applySketch(c, true, o);
  if (role === 'container' && c.style.fillStyle) c.style.fillStyle = 'solid'; // hatching a whole container is too busy
}
function cardToStyle(c, to, o) {
  const st = c.style;
  if (st.fontFamily === BP.font || st.fontFamily === SKETCH_FONT) { delete st.fontFamily; delete st.fontSource; }
  applySketch(c, false, {}); delete st.deMode;
  if (to === 'blueprint') { bpFont(st); st.deMode = 'blueprint'; }
  else if (to === 'sketch') applySketch(c, true, Object.assign({}, o, { fillStyle: 'solid' }));
}
// One cell from style `from` to style `to` (docs/STYLES.md, permutations 1 to 20).
function convertCell(c, from, to, o, ctx) {
  if (isGroupCell(c)) return;
  if (c.style.deDots !== undefined) return; // background sheets keep their own look in every style
  if (c.style.deCard === '1') { cardToStyle(c, to, o); return; } // an entity card keeps its colours in every style; its font follows the style
  // Containers are recognised once (no fill, dashed boxes) and marked, so they stay containers after they get a tint.
  if (!c.e && !c.isEdgeLabel && styleRole(c) === 'container' && shapeKind(c) !== 'folder' && shapeKind(c) !== 'partialRect') c.style.deCont = '1';
  if (to === 'sketch') { if (from === 'blueprint' || c.style.deMode === 'blueprint') toOutline(c, 'blueprint', Object.assign({}, STYLE_DEFAULTS.outline, { resetFont: true })); toSketch(c, o); return; }
  if (from !== 'outline' || sb(c.style, 'sketch', false) || c.style.deGlow) toOutline(c, from, to === 'outline' ? o : Object.assign({}, STYLE_DEFAULTS.outline, { resetFont: true }));
  if (to === 'filled') toFilled(c, o);
  else if (to === 'duotone') toDuotone(c, o, ctx);
  else if (to === 'neon') toNeon(c, ctx);
  else if (to === 'blueprint') toBlueprint(c, o, ctx);
  // a Harvey ball's wedge is its outline colour, so its fill must never become that colour
  if (c.style.deHarvey !== undefined && hexRgb(c.style.fillColor) && String(c.style.fillColor).toLowerCase() === String(c.style.strokeColor).toLowerCase()) { c.style.fillColor = '#ffffff'; delete c.style.fillOpacity; }
}

/* ---------- readability: see src/contrast.js ---------- */
/* ---------- switching the whole diagram ---------- */
function styleOpts(mode) { return Object.assign({}, STYLE_DEFAULTS[mode], (S.styleOpts || {})[mode]); }
function runStyleSwitch(doc, from, to, o) {
  // canvas first, so Neon knows whether it is dark
  for (const pg of doc.pages) {
    const bg = pageBackground(pg);
    if (to === 'neon' && o.darkCanvas && !isDarkBg(bg)) pg.modelAttrs = Object.assign({}, pg.modelAttrs, { background: NAVY });
    if (from === 'neon' && to !== 'neon' && o.whiteCanvas && isDarkBg(bg)) { pg.modelAttrs = Object.assign({}, pg.modelAttrs); delete pg.modelAttrs.background; }
    if (to === 'blueprint' && o.whiteCanvas && bg.toLowerCase() !== '#ffffff') { pg.modelAttrs = Object.assign({}, pg.modelAttrs); delete pg.modelAttrs.background; } // Blueprint pages are white
  }
  const dominant = dominantColour(doc);
  let fixed = 0;
  for (const pg of doc.pages) {
    const canvas = pageBackground(pg), ctx = { dark: isDarkBg(canvas), dominant, canvas };
    if (to === 'blueprint') ctx.routes = computeRoutes(pg, cellMap(pg)).routes; // to place line labels beside their lines
    for (const c of pg.cells) convertCell(c, modeOf(c), to, o, ctx);
  }
  const report = autoContrastOn() ? contrastRun(doc, { apply: true }) : contrastRun(doc, { apply: false });
  fixed = autoContrastOn() ? report.fixes.length : 0;
  doc.mode = to; doc.sketch = to === 'sketch';
  return { fixed, report };
}
// After the canvas changes: Neon colours are re-tuned for the new background, and every text is re-checked (WCAG).
function retuneForCanvas(doc, pages) {
  const dominant = dominantColour(doc);
  let fixed = 0;
  for (const pg of pages || doc.pages) {
    const canvas = pageBackground(pg), ctx = { dark: isDarkBg(canvas), dominant, canvas };
    for (const c of pg.cells) if (!isGroupCell(c) && modeOf(c) === 'neon') toNeon(c, ctx);
  }
  if (!autoContrastOn()) { S.lastContrast = Object.assign(contrastRun(doc, { apply: false, pages }), { when: 'Canvas change (auto-correct off)', t: Date.now() }); return 0; }
  const r = contrastRun(doc, { apply: true, pages }); fixed = r.fixes.length;
  S.lastContrast = Object.assign(r, { when: 'Canvas change', t: Date.now() });
  return fixed;
}
function setCanvasAll(doc, bg) {
  for (const pg of doc.pages) { pg.modelAttrs = Object.assign({}, pg.modelAttrs); if (!bg || bg.toLowerCase() === '#ffffff') delete pg.modelAttrs.background; else pg.modelAttrs.background = bg; }
  return retuneForCanvas(doc);
}
// New shapes, lines and icons take the current style, using the options of the last switch.
function styleNewCell(c, mode) {
  let canvas = '#ffffff'; try { canvas = pageBackground(page()); } catch (e) { }
  const doc = (typeof S !== 'undefined' && S.doc) ? S.doc : { pages: [] };
  convertCell(c, 'outline', mode, styleOpts(mode), { dark: isDarkBg(canvas), dominant: dominantColour(doc), canvas });
}
