/* ===== Contrast: WCAG 2.2 checks, OKLCH tonal correction, APCA advisory reading =====
   Rules (docs/STYLES.md, "Contrast"):
   - Pass or fail always uses the WCAG 2.2 contrast ratio. Text 4.5:1 (large text 3:1); graphics 3:1 (WCAG 1.4.11).
   - A failing colour keeps its OKLCH hue and chroma; only its OKLCH lightness changes, by the smallest step that passes,
     away from the background first, then the other way. Chroma is reduced only to stay inside sRGB.
   - If no lightness passes: white or near black, whichever contrasts more.
   - Text on a filled shape: kept if it passes; otherwise the same-hue tone of the text colour, or white or near black.
   - Fill colours are never changed. Text, outline, line and icon colours are.
   - Runs over the whole diagram after a style switch or canvas switch (setting "Auto-correct contrast", on by default)
     and when the user presses Fix text colours or Fix all. Colours the user sets by hand are not touched until then.
   - APCA Lc is shown as an advisory reading only. */
const NEAR_BLACK = '#111827';
const TEXT_MIN = 4.5, LARGE_TEXT_MIN = 3, GRAPHIC_MIN = 3;

/* ---------- WCAG 2.2 ---------- */
function srgbLin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function wcagLum(h) { const r = hexRgb(h); if (!r) return 1; return 0.2126 * srgbLin(r[0]) + 0.7152 * srgbLin(r[1]) + 0.0722 * srgbLin(r[2]); }
function wcagRatio(a, b) { const x = wcagLum(a), y = wcagLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
// Large text: 24 px and above, or bold 19 px and above.
function isLargeText(st) { const fs = sn(st, 'fontSize', 12); return fs >= 24 || ((sn(st, 'fontStyle', 0) & 1) === 1 && fs >= 19); }

/* ---------- APCA 0.0.98G-4g (advisory only; not a standard) ---------- */
function apcaLc(text, bg) {
  const y = (h) => { const r = hexRgb(h) || [0, 0, 0]; const c = r.map(v => Math.pow(v / 255, 2.4)); let Y = 0.2126729 * c[0] + 0.7151522 * c[1] + 0.0721750 * c[2]; if (Y < 0.022) Y += Math.pow(0.022 - Y, 1.414); return Y; };
  const Yt = y(text), Yb = y(bg);
  if (Math.abs(Yb - Yt) < 0.0005) return 0;
  let S;
  if (Yb > Yt) { S = (Math.pow(Yb, 0.56) - Math.pow(Yt, 0.57)) * 1.14; return S < 0.1 ? 0 : Math.round((S - 0.027) * 1000) / 10; }
  S = (Math.pow(Yb, 0.65) - Math.pow(Yt, 0.62)) * 1.14; return S > -0.1 ? 0 : Math.round((S + 0.027) * 1000) / 10;
}

/* ---------- OKLab / OKLCH (Bjorn Ottosson) ---------- */
function hexOklch(h) {
  const [r, g, b] = (hexRgb(h) || [0, 0, 0]).map(srgbLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const C = Math.hypot(A, B); let H = Math.atan2(B, A) * 180 / Math.PI; if (H < 0) H += 360;
  return { L, C, H };
}
function oklchLinear(L, C, H) {
  const a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180);
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
function linHex(rgb) { return rgbHex(rgb.map(v => { v = clamp(v, 0, 1); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); })); }
// Same hue and lightness; chroma reduced only as far as needed to fit inside sRGB.
function oklchHex(L, C, H) {
  L = clamp(L, 0, 1);
  const inside = (c) => oklchLinear(L, c, H).every(v => v >= -1e-4 && v <= 1 + 1e-4);
  if (inside(C)) return linHex(oklchLinear(L, C, H));
  let lo = 0, hi = C; for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (inside(mid)) lo = mid; else hi = mid; }
  return linHex(oklchLinear(L, lo, H));
}
function hueDelta(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

/* ---------- the correction ---------- */
// sRGB has only 256 steps per channel, which can nudge the hue of a muted colour; of the neighbouring hex values that
// still pass, take the one whose OKLCH hue is closest to the original.
function closestHue(hex, H, bg, target) {
  const base = hexRgb(hex); let best = hex, bd = hueDelta(hexOklch(hex).H, H);
  for (let dr = -1; dr <= 1; dr++) for (let dg = -1; dg <= 1; dg++) for (let db = -1; db <= 1; db++) {
    const h2 = rgbHex([base[0] + dr, base[1] + dg, base[2] + db]); if (wcagRatio(h2, bg) < target) continue;
    const d = hueDelta(hexOklch(h2).H, H); if (d < bd - 1e-9) { bd = d; best = h2; }
  }
  return best;
}
// Smallest OKLCH lightness change that reaches the target ratio; away from the background first.
function toneFix(fg, bg, target) {
  const before = wcagRatio(fg, bg);
  if (before >= target) return { hex: fg, method: 'kept', ratio: before, ok: true };
  const o = hexOklch(fg), Lb = hexOklch(bg).L;
  const away = o.L > Lb || (Math.abs(o.L - Lb) < 1e-6 && Lb < 0.5) ? 1 : -1;
  for (const dir of [away, -away]) {
    // walk in steps of 0.01 until it passes, then narrow down to the smallest passing change
    let prev = 0, found = null;
    for (let k = 1; k <= 100; k++) {
      const d = Math.min(k * 0.01, dir > 0 ? 1 - o.L : o.L);
      const hx = oklchHex(o.L + dir * d, o.C, o.H);
      if (wcagRatio(hx, bg) >= target) { found = d; break; }
      prev = d; if (d >= (dir > 0 ? 1 - o.L : o.L)) break;
    }
    if (found === null) continue;
    let lo = prev, hi = found;
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (wcagRatio(oklchHex(o.L + dir * mid, o.C, o.H), bg) >= target) hi = mid; else lo = mid; }
    const hex = closestHue(oklchHex(o.L + dir * hi, o.C, o.H), o.H, bg, target);
    return { hex, method: 'tone', ratio: wcagRatio(hex, bg), ok: true };
  }
  const hex = wcagRatio('#ffffff', bg) >= wcagRatio(NEAR_BLACK, bg) ? '#ffffff' : NEAR_BLACK, ratio = wcagRatio(hex, bg);
  return { hex, method: 'fallback', ratio, ok: ratio >= target };
}
// Text on a filled shape: keep it if it passes; else the same-hue tone; else white or near black, whichever is better.
function textFix(fg, bg, target) {
  const t = toneFix(fg, bg, target);
  if (t.method !== 'fallback') return t;
  const w = wcagRatio('#ffffff', bg), k = wcagRatio(NEAR_BLACK, bg), hex = w >= k ? '#ffffff' : NEAR_BLACK;
  return { hex, method: 'fallback', ratio: Math.max(w, k), ok: Math.max(w, k) >= target };
}

/* ---------- what is behind ---------- */
function blendOver(fill, alpha, under) { return alpha >= 1 ? fill : mixHex(under, fill, alpha); }
// Colour directly behind a point: the frontmost filled shape drawn before `before` (z-order) that covers it, else the canvas.
function colourBehind(pg, pt, before, canvas, map) {
  const at = before ? pg.cells.indexOf(before) : -1, stop = at < 0 ? pg.cells.length : at; // a cell not yet on the page goes on top
  let col = canvas, desc = 'canvas';
  for (let i = 0; i < stop; i++) {
    const c = pg.cells[i];
    if (c.e || c.isEdgeLabel || isGroupCell(c) || !hexRgb(c.style.fillColor) || c.style.dePh) continue;
    if (shapeKind(c) === 'text' || (map && isHiddenByLayer(pg, c, map))) continue;
    const b = worldBox(c);
    if (pt.x < b.x || pt.y < b.y || pt.x > b.x + b.w || pt.y > b.y + b.h) continue;
    const a = (sn(c.style, 'fillOpacity', 100) / 100) * (sn(c.style, 'opacity', 100) / 100);
    col = blendOver(c.style.fillColor, a, col); desc = 'fill of "' + cellName(c) + '"';
  }
  return { col, desc };
}
function cellName(c) { const t = htmlToPlain(String(c.value || '')).replace(/\s+/g, ' ').trim(); return t ? (t.length > 28 ? t.slice(0, 27) + '…' : t) : (c.e ? 'line' : c.style.dePh ? 'icon ' + c.style.dePh : (shapeKind(c) || 'shape')); }
function edgeMid(pg, e, map) {
  const ctr = (id) => { const c = map.get(id); return c ? cellCenter(c) : null; };
  const pts = [e.sp || ctr(e.source), ...(e.pts || []), e.tp || ctr(e.target)].filter(Boolean);
  if (!pts.length) return null;
  return pts.length % 2 ? pts[(pts.length - 1) / 2] : { x: (pts[pts.length / 2 - 1].x + pts[pts.length / 2].x) / 2, y: (pts[pts.length / 2 - 1].y + pts[pts.length / 2].y) / 2 };
}

/* ---------- checking and correcting a page ---------- */
// Every check on a page. opts: { apply, only: 'text' | 'all', cells (limit) }
function contrastPass(pg, opts) {
  opts = opts || {};
  const canvas = pageBackground(pg), map = cellMap(pg), out = { fixes: [], problems: [] };
  const map2 = new Map(map); if (opts.cells) for (const c of opts.cells) map2.set(c.id, c);
  const rec = (c, k, old, nu, target, bg, why, kind) => {
    const r = { page: pg.name, id: c.id, element: cellName(c), what: kind, prop: k, old, new: nu.hex, target, bg: bg.col, against: bg.desc, before: wcagRatio(old, bg.col), after: nu.ratio, method: nu.method, ok: nu.ok, apca: apcaLc(nu.hex, bg.col) };
    if (!nu.ok) out.problems.push(Object.assign({ reason: why }, r));
    if (nu.hex.toLowerCase() !== String(old).toLowerCase()) { out.fixes.push(r); if (opts.apply) c.style[k] = nu.hex; }
  };
  const check = (c, k, old, bg, target, kind, isText, onFill) => {
    if (!hexRgb(old)) return;
    if (wcagRatio(old, bg.col) >= target) return;
    rec(c, k, old, isText && onFill ? textFix(old, bg.col, target) : toneFix(old, bg.col, target), target, bg, 'no colour of the same hue, white or near black reaches ' + target + ':1', kind);
  };
  for (const c of opts.cells || pg.cells) {
    if (isGroupCell(c) || isHiddenByLayer(pg, c, map2)) continue;
    const st = c.style, hasText = !!htmlToPlain(String(c.value || '')).trim(), tTarget = isLargeText(st) ? LARGE_TEXT_MIN : TEXT_MIN;
    if (c.e) {
      if (opts.only === 'text') continue;
      const mid = edgeMid(pg, c, map2); const bg = mid ? colourBehind(pg, mid, c, canvas, map) : { col: canvas, desc: 'canvas' };
      if (st.strokeColor !== 'none') check(c, 'strokeColor', hexRgb(st.strokeColor) ? st.strokeColor : '#000000', bg, GRAPHIC_MIN, 'line', false);
      continue;
    }
    if (c.isEdgeLabel) {
      if (!hasText) continue;
      const e = map2.get(c.parent), mid = e ? edgeMid(pg, e, map2) : null;
      const bg = hexRgb(st.labelBackgroundColor) ? { col: st.labelBackgroundColor, desc: 'label background' } : (mid ? colourBehind(pg, mid, e, canvas, map) : { col: canvas, desc: 'canvas' });
      check(c, 'fontColor', hexRgb(st.fontColor) ? st.fontColor : '#1e293b', bg, tTarget, 'line label text', true, !!hexRgb(st.labelBackgroundColor));
      continue;
    }
    const k = shapeKind(c), box = worldBox(c), ctr = cellCenter(box), behind = colourBehind(pg, ctr, c, canvas, map);
    // text
    if (hasText) {
      const inside = k !== 'text' && k !== 'icon' && !st.dePh && labelInside(c) && hexRgb(st.fillColor);
      const a = (sn(st, 'fillOpacity', 100) / 100) * (sn(st, 'opacity', 100) / 100);
      const bg = inside ? { col: blendOver(st.fillColor, a, behind.col), desc: 'shape fill' } : behind;
      check(c, 'fontColor', hexRgb(st.fontColor) ? st.fontColor : '#1e293b', bg, tTarget, 'text', true, !!inside);
    }
    if (opts.only === 'text') continue;
    // icon glyph (its colour is stored as the fill colour)
    if (st.dePh) { check(c, 'fillColor', hexRgb(st.fillColor) ? st.fillColor : '#475569', behind, GRAPHIC_MIN, 'icon', false); continue; }
    if (k === 'text') continue;
    // outline; and a fill that can't be told apart when there is no outline (fills are never changed)
    const stroke = st.strokeColor === 'none' ? null : (hexRgb(st.strokeColor) ? st.strokeColor : '#000000');
    if (stroke && sn(st, 'strokeWidth', 1) > 0) check(c, 'strokeColor', stroke, behind, GRAPHIC_MIN, 'outline', false);
    else if (hexRgb(st.fillColor) && wcagRatio(st.fillColor, behind.col) < GRAPHIC_MIN)
      out.problems.push({ page: pg.name, id: c.id, element: cellName(c), what: 'fill', prop: 'fillColor', old: st.fillColor, new: st.fillColor, target: GRAPHIC_MIN, bg: behind.col, against: behind.desc, before: wcagRatio(st.fillColor, behind.col), after: wcagRatio(st.fillColor, behind.col), method: 'none', ok: false, apca: null, reason: 'the fill is your choice and the shape has no outline; add an outline or change the fill' });
  }
  return out;
}
// Whole document (or some pages).
function contrastRun(doc, opts) {
  const res = { fixes: [], problems: [] };
  for (const pg of (opts && opts.pages) || doc.pages) { const r = contrastPass(pg, opts); res.fixes.push(...r.fixes); res.problems.push(...r.problems); }
  return res;
}
function autoContrastOn() { return typeof S === 'undefined' || !S.prefs || S.prefs.autoContrast !== false; }

// The preset outline colours are tuned (same hue) to meet 3:1 on white, so presets need no correction on a light canvas.
for (const p of PALETTE) p.stroke = toneFix(p.stroke, '#ffffff', GRAPHIC_MIN).hex;
