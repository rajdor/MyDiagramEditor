/* ===== Orthogonal routing =====
 * Port of mxEdgeStyle.OrthConnector and mxEdgeStyle.SegmentConnector from mxGraph 4.2.2
 * Copyright (c) 2006-2018, JGraph Ltd / Copyright (c) 2006-2018, Gaudenz Alder
 * Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 * Adapted to plain boxes and points so lines are routed the way draw.io routes them. */
const MXR = (() => {
  const W = 1, N = 2, So = 4, E = 8, ALL = 15;
  const reverse = (c) => ((c & W) << 3) | ((c & N) << 1) | ((c & So) >> 1) | ((c & E) >> 3);
  const orthBuffer = 10;
  const dirVectors = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]];
  const routePatterns = [
    [[513, 2308, 2081, 2562], [513, 1090, 514, 2184, 2114, 2561], [513, 1090, 514, 2564, 2184, 2562], [513, 2308, 2561, 1090, 514, 2568, 2308]],
    [[514, 1057, 513, 2308, 2081, 2562], [514, 2184, 2114, 2561], [514, 2184, 2562, 1057, 513, 2564, 2184], [514, 1057, 513, 2568, 2308, 2561]],
    [[1090, 514, 1057, 513, 2308, 2081, 2562], [2114, 2561], [1090, 2562, 1057, 513, 2564, 2184], [1090, 514, 1057, 513, 2308, 2561, 2568]],
    [[2081, 2562], [1057, 513, 1090, 514, 2184, 2114, 2561], [1057, 513, 1090, 514, 2184, 2562, 2564], [1057, 2561, 1090, 514, 2568, 2308]]];
  const TARGET_MASK = 2048, SOURCE_MASK = 1024, SIDE_MASK = 480, CENTER_MASK = 512;
  const r10 = (v) => Math.round(v * 10) / 10;
  const contains = (b, x, y) => b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

  // src/tgt: {x,y,w,h} (already the rotated bounding box) or null; p0/pe: fixed end points or null
  function jetty(st, isSource) {
    let v = st[isSource ? 'sourceJettySize' : 'targetJettySize'];
    if (v === undefined || v === null) v = st.jettySize;
    if (v === undefined || v === null || v === '') return orthBuffer;
    if (v === 'auto') {
      const type = st[isSource ? 'startArrow' : 'endArrow'] || (isSource ? 'none' : 'classic');
      if (type !== 'none') { const size = parseFloat(st[isSource ? 'startSize' : 'endSize']) || 6; return Math.max(2, Math.ceil((size + orthBuffer) / orthBuffer)) * orthBuffer; }
      return 2 * orthBuffer;
    }
    const n = parseFloat(v); return isNaN(n) ? orthBuffer : n;
  }
  function orth(src, tgt, p0, pe, hints, style) {
    style = style || {};
    let sourceBuffer = jetty(style, true), targetBuffer = jetty(style, false);
    if (src && tgt && src === tgt) { targetBuffer = Math.max(sourceBuffer, targetBuffer); sourceBuffer = targetBuffer; }
    const totalBuffer = sourceBuffer + targetBuffer;
    let tooShort = false;
    if (p0 && pe) { const dx = pe.x - p0.x, dy = pe.y - p0.y; tooShort = dx * dx + dy * dy < totalBuffer * totalBuffer; }
    if (tooShort || (hints && hints.length)) return segment(src, tgt, p0, pe, hints || []);
    const sourceX = src ? src.x : p0.x, sourceY = src ? src.y : p0.y, sourceWidth = src ? src.w : 0, sourceHeight = src ? src.h : 0;
    const targetX = tgt ? tgt.x : pe.x, targetY = tgt ? tgt.y : pe.y, targetWidth = tgt ? tgt.w : 0, targetHeight = tgt ? tgt.h : 0;
    const portConstraint = [ALL, ALL];
    const dir = [0, 0];
    const geo = [[sourceX, sourceY, sourceWidth, sourceHeight], [targetX, targetY, targetWidth, targetHeight]];
    const buffer = [sourceBuffer, targetBuffer];
    const limits = [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];
    for (let i = 0; i < 2; i++) {
      limits[i][1] = geo[i][0] - buffer[i]; limits[i][2] = geo[i][1] - buffer[i];
      limits[i][4] = geo[i][0] + geo[i][2] + buffer[i]; limits[i][8] = geo[i][1] + geo[i][3] + buffer[i];
    }
    const sourceCenX = geo[0][0] + geo[0][2] / 2, sourceCenY = geo[0][1] + geo[0][3] / 2;
    const targetCenX = geo[1][0] + geo[1][2] / 2, targetCenY = geo[1][1] + geo[1][3] / 2;
    const dx = sourceCenX - targetCenX, dy = sourceCenY - targetCenY;
    let quad = 0;
    if (dx < 0) quad = dy < 0 ? 2 : 1;
    else if (dy <= 0) { quad = 3; if (dx === 0) quad = 2; }
    let currentTerm = src ? p0 : null;
    const constraint = [[0.5, 0.5], [0.5, 0.5]];
    for (let i = 0; i < 2; i++) {
      if (currentTerm) {
        constraint[i][0] = (currentTerm.x - geo[i][0]) / geo[i][2];
        if (Math.abs(currentTerm.x - geo[i][0]) <= 1) dir[i] = W;
        else if (Math.abs(currentTerm.x - geo[i][0] - geo[i][2]) <= 1) dir[i] = E;
        constraint[i][1] = (currentTerm.y - geo[i][1]) / geo[i][3];
        if (Math.abs(currentTerm.y - geo[i][1]) <= 1) dir[i] = N;
        else if (Math.abs(currentTerm.y - geo[i][1] - geo[i][3]) <= 1) dir[i] = So;
      }
      currentTerm = tgt ? pe : null;
    }
    const sourceTopDist = geo[0][1] - (geo[1][1] + geo[1][3]);
    const sourceLeftDist = geo[0][0] - (geo[1][0] + geo[1][2]);
    const sourceBottomDist = geo[1][1] - (geo[0][1] + geo[0][3]);
    const sourceRightDist = geo[1][0] - (geo[0][0] + geo[0][2]);
    const vertexSeperations = [];
    vertexSeperations[1] = Math.max(sourceLeftDist - totalBuffer, 0);
    vertexSeperations[2] = Math.max(sourceTopDist - totalBuffer, 0);
    vertexSeperations[4] = Math.max(sourceBottomDist - totalBuffer, 0);
    vertexSeperations[3] = Math.max(sourceRightDist - totalBuffer, 0);
    const dirPref = [], horPref = [], vertPref = [];
    horPref[0] = (sourceLeftDist >= sourceRightDist) ? W : E;
    vertPref[0] = (sourceTopDist >= sourceBottomDist) ? N : So;
    horPref[1] = reverse(horPref[0]); vertPref[1] = reverse(vertPref[0]);
    const preferredHorizDist = sourceLeftDist >= sourceRightDist ? sourceLeftDist : sourceRightDist;
    const preferredVertDist = sourceTopDist >= sourceBottomDist ? sourceTopDist : sourceBottomDist;
    const prefOrdering = [[0, 0], [0, 0]];
    let preferredOrderSet = false;
    for (let i = 0; i < 2; i++) {
      if (dir[i] !== 0) continue;
      if ((horPref[i] & portConstraint[i]) === 0) horPref[i] = reverse(horPref[i]);
      if ((vertPref[i] & portConstraint[i]) === 0) vertPref[i] = reverse(vertPref[i]);
      prefOrdering[i][0] = vertPref[i]; prefOrdering[i][1] = horPref[i];
    }
    if (preferredVertDist > 0 && preferredHorizDist > 0) {
      if (((horPref[0] & portConstraint[0]) > 0) && ((vertPref[1] & portConstraint[1]) > 0)) {
        prefOrdering[0][0] = horPref[0]; prefOrdering[0][1] = vertPref[0]; prefOrdering[1][0] = vertPref[1]; prefOrdering[1][1] = horPref[1]; preferredOrderSet = true;
      } else if (((vertPref[0] & portConstraint[0]) > 0) && ((horPref[1] & portConstraint[1]) > 0)) {
        prefOrdering[0][0] = vertPref[0]; prefOrdering[0][1] = horPref[0]; prefOrdering[1][0] = horPref[1]; prefOrdering[1][1] = vertPref[1]; preferredOrderSet = true;
      }
    }
    if (preferredVertDist > 0 && !preferredOrderSet) { prefOrdering[0][0] = vertPref[0]; prefOrdering[0][1] = horPref[0]; prefOrdering[1][0] = vertPref[1]; prefOrdering[1][1] = horPref[1]; preferredOrderSet = true; }
    if (preferredHorizDist > 0 && !preferredOrderSet) { prefOrdering[0][0] = horPref[0]; prefOrdering[0][1] = vertPref[0]; prefOrdering[1][0] = horPref[1]; prefOrdering[1][1] = vertPref[1]; preferredOrderSet = true; }
    for (let i = 0; i < 2; i++) {
      if (dir[i] !== 0) continue;
      if ((prefOrdering[i][0] & portConstraint[i]) === 0) prefOrdering[i][0] = prefOrdering[i][1];
      dirPref[i] = prefOrdering[i][0] & portConstraint[i];
      dirPref[i] |= (prefOrdering[i][1] & portConstraint[i]) << 8;
      dirPref[i] |= (prefOrdering[1 - i][i] & portConstraint[i]) << 16;
      dirPref[i] |= (prefOrdering[1 - i][1 - i] & portConstraint[i]) << 24;
      if ((dirPref[i] & 0xF) === 0) dirPref[i] = dirPref[i] << 8;
      if ((dirPref[i] & 0xF00) === 0) dirPref[i] = (dirPref[i] & 0xF) | dirPref[i] >> 8;
      if ((dirPref[i] & 0xF0000) === 0) dirPref[i] = (dirPref[i] & 0xFFFF) | ((dirPref[i] & 0xF000000) >> 8);
      dir[i] = dirPref[i] & 0xF;
    }
    let sourceIndex = dir[0] === E ? 3 : dir[0], targetIndex = dir[1] === E ? 3 : dir[1];
    sourceIndex -= quad; targetIndex -= quad;
    if (sourceIndex < 1) sourceIndex += 4;
    if (targetIndex < 1) targetIndex += 4;
    const routePattern = routePatterns[sourceIndex - 1][targetIndex - 1];
    const wp = []; for (let i = 0; i < 12; i++) wp.push([0, 0]);
    wp[0][0] = geo[0][0]; wp[0][1] = geo[0][1];
    switch (dir[0]) {
      case W: wp[0][0] -= sourceBuffer; wp[0][1] += constraint[0][1] * geo[0][3]; break;
      case So: wp[0][0] += constraint[0][0] * geo[0][2]; wp[0][1] += geo[0][3] + sourceBuffer; break;
      case E: wp[0][0] += geo[0][2] + sourceBuffer; wp[0][1] += constraint[0][1] * geo[0][3]; break;
      case N: wp[0][0] += constraint[0][0] * geo[0][2]; wp[0][1] -= sourceBuffer; break;
    }
    let currentIndex = 0;
    let lastOrientation = (dir[0] & (E | W)) > 0 ? 0 : 1;
    const initialOrientation = lastOrientation;
    let currentOrientation = 0;
    for (let i = 0; i < routePattern.length; i++) {
      const nextDirection = routePattern[i] & 0xF;
      let directionIndex = nextDirection === E ? 3 : nextDirection;
      directionIndex += quad;
      if (directionIndex > 4) directionIndex -= 4;
      const direction = dirVectors[directionIndex - 1];
      currentOrientation = (directionIndex % 2 > 0) ? 0 : 1;
      if (currentOrientation !== lastOrientation) { currentIndex++; wp[currentIndex][0] = wp[currentIndex - 1][0]; wp[currentIndex][1] = wp[currentIndex - 1][1]; }
      const tar = (routePattern[i] & TARGET_MASK) > 0, sou = (routePattern[i] & SOURCE_MASK) > 0;
      let side = (routePattern[i] & SIDE_MASK) >> 5;
      side = side << quad;
      if (side > 0xF) side = side >> 4;
      const center = (routePattern[i] & CENTER_MASK) > 0;
      if ((sou || tar) && side < 9) {
        let limit = 0; const souTar = sou ? 0 : 1;
        if (center && currentOrientation === 0) limit = geo[souTar][0] + constraint[souTar][0] * geo[souTar][2];
        else if (center) limit = geo[souTar][1] + constraint[souTar][1] * geo[souTar][3];
        else limit = limits[souTar][side];
        if (currentOrientation === 0) { const lastX = wp[currentIndex][0], deltaX = (limit - lastX) * direction[0]; if (deltaX > 0) wp[currentIndex][0] += direction[0] * deltaX; }
        else { const lastY = wp[currentIndex][1], deltaY = (limit - lastY) * direction[1]; if (deltaY > 0) wp[currentIndex][1] += direction[1] * deltaY; }
      } else if (center) {
        wp[currentIndex][0] += direction[0] * Math.abs(vertexSeperations[directionIndex] / 2);
        wp[currentIndex][1] += direction[1] * Math.abs(vertexSeperations[directionIndex] / 2);
      }
      if (currentIndex > 0 && wp[currentIndex][currentOrientation] === wp[currentIndex - 1][currentOrientation]) currentIndex--;
      else lastOrientation = currentOrientation;
    }
    const result = [];
    for (let i = 0; i <= currentIndex; i++) {
      if (i === currentIndex) {
        const targetOrientation = (dir[1] & (E | W)) > 0 ? 0 : 1;
        const sameOrient = targetOrientation === initialOrientation ? 0 : 1;
        if (sameOrient !== (currentIndex + 1) % 2) break;
      }
      result.push({ x: r10(wp[i][0]), y: r10(wp[i][1]) });
    }
    let index = 1;
    while (index < result.length) { if (result[index - 1].x !== result[index].x || result[index - 1].y !== result[index].y) index++; else result.splice(index, 1); }
    return result;
  }

  function segment(source, target, p0, pe, controlHints) {
    const tol = 1, result = [];
    let lastPushed = null, horizontal = true, hint = null;
    const pushPoint = (pt) => { pt = { x: r10(pt.x), y: r10(pt.y) }; if (!lastPushed || Math.abs(lastPushed.x - pt.x) >= tol || Math.abs(lastPushed.y - pt.y) >= 1) { result.push(pt); lastPushed = pt; } return lastPushed; };
    let pt = p0 ? { x: p0.x, y: p0.y } : (source ? { x: source.x + source.w / 2, y: source.y + source.h / 2 } : null);
    if (controlHints && controlHints.length) {
      let hints = controlHints.map(h => ({ x: h.x, y: h.y }));
      if (pt && hints[0]) { if (Math.abs(hints[0].x - pt.x) < tol) hints[0].x = pt.x; if (Math.abs(hints[0].y - pt.y) < tol) hints[0].y = pt.y; }
      if (pe && hints[hints.length - 1]) { const h = hints[hints.length - 1]; if (Math.abs(h.x - pe.x) < tol) h.x = pe.x; if (Math.abs(h.y - pe.y) < tol) h.y = pe.y; }
      hint = hints[0];
      let currentTerm = source, currentPt = p0, hozChan = false, vertChan = false, currentHint = hint;
      if (currentPt) currentTerm = null;
      for (let i = 0; i < 2; i++) {
        const fixedVertAlign = currentPt != null && currentPt.x === currentHint.x;
        const fixedHozAlign = currentPt != null && currentPt.y === currentHint.y;
        const inHozChan = currentTerm != null && (currentHint.y >= currentTerm.y && currentHint.y <= currentTerm.y + currentTerm.h);
        const inVertChan = currentTerm != null && (currentHint.x >= currentTerm.x && currentHint.x <= currentTerm.x + currentTerm.w);
        hozChan = fixedHozAlign || (currentPt == null && inHozChan);
        vertChan = fixedVertAlign || (currentPt == null && inVertChan);
        if (!(i === 0 && ((hozChan && vertChan) || (fixedVertAlign && fixedHozAlign)))) {
          if (currentPt != null && (!fixedHozAlign && !fixedVertAlign) && (inHozChan || inVertChan)) { horizontal = inHozChan ? false : true; break; }
          if (vertChan || hozChan) { horizontal = hozChan; if (i === 1) horizontal = hints.length % 2 === 0 ? hozChan : vertChan; break; }
        }
        currentTerm = target; currentPt = pe;
        if (currentPt) currentTerm = null;
        currentHint = hints[hints.length - 1];
        if (fixedVertAlign && fixedHozAlign) hints = hints.slice(1);
      }
      if (horizontal && ((p0 && p0.y !== hint.y) || (!p0 && source && (hint.y < source.y || hint.y > source.y + source.h)))) pushPoint({ x: pt.x, y: hint.y });
      else if (!horizontal && ((p0 && p0.x !== hint.x) || (!p0 && source && (hint.x < source.x || hint.x > source.x + source.w)))) pushPoint({ x: hint.x, y: pt.y });
      if (horizontal) pt.y = hint.y; else pt.x = hint.x;
      for (let i = 0; i < hints.length; i++) {
        horizontal = !horizontal; hint = hints[i];
        if (horizontal) pt.y = hint.y; else pt.x = hint.x;
        pushPoint({ x: pt.x, y: pt.y });
      }
    } else { hint = pt; horizontal = true; }
    pt = pe ? pe : (target ? { x: target.x + target.w / 2, y: target.y + target.h / 2 } : null);
    if (pt && hint) {
      if (horizontal && ((pe && pe.y !== hint.y) || (!pe && target && (hint.y < target.y || hint.y > target.y + target.h)))) pushPoint({ x: pt.x, y: hint.y });
      else if (!horizontal && ((pe && pe.x !== hint.x) || (!pe && target && (hint.x < target.x || hint.x > target.x + target.w)))) pushPoint({ x: hint.x, y: pt.y });
    }
    if (!p0 && source) while (result.length > 1 && result[1] && contains(source, result[1].x, result[1].y)) result.splice(1, 1);
    if (!pe && target) while (result.length > 1 && result[result.length - 1] && contains(target, result[result.length - 1].x, result[result.length - 1].y)) result.splice(result.length - 1, 1);
    if (pe && result.length && Math.abs(pe.x - result[result.length - 1].x) <= tol && Math.abs(pe.y - result[result.length - 1].y) <= tol) {
      result.splice(result.length - 1, 1);
      const last = result[result.length - 1];
      if (last) { if (Math.abs(last.x - pe.x) < tol) last.x = pe.x; if (Math.abs(last.y - pe.y) < tol) last.y = pe.y; }
    }
    return result;
  }
  return { orth, segment };
})();
