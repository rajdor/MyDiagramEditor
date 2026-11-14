/* ===== Embed mode: a host page opens the editor in an iframe, passes it a diagram and gets the result back =====
   postMessage only, nothing touches the network. Messages:
     editor -> host  { type: 'de:ready' }                                   once, on start-up inside an iframe
     host -> editor  { type: 'de:init', xml, title, mode }                  load this diagram (empty xml: a new one in `mode`)
     editor -> host  { type: 'de:save', xml, svg, width, height, title }    Done
     editor -> host  { type: 'de:cancel' }                                  Cancel
     editor -> host  { type: 'de:dirty', dirty }                            unsaved-change flag changed
   Only messages whose source is window.parent are accepted. The host may be a file:// or srcdoc page (origin "null"),
   so the source is checked, not the origin, and replies go to '*'. The editor runs normally until a de:init arrives. */
const EMBED = { inFrame: (() => { try { return window.parent !== window; } catch (e) { return true; } })(), title: '', lastDirty: null, seq: 0 };
const EMBED_BLOCKED = new Set(['new', 'open', 'save', 'saveAs', 'exportGliffy', 'exportPng', 'exportSvg', 'exportPdf', 'restoreAutosave', 'testDiagram']);
function embedPost(msg) { try { window.parent.postMessage(msg, '*'); } catch (e) { } }
function embedStart() {
  if (!EMBED.inFrame) return;
  window.addEventListener('message', onEmbedMessage);
  embedPost({ type: 'de:ready' });
}
function onEmbedMessage(ev) {
  if (ev.source !== window.parent) return;
  const m = ev.data;
  if (!m || typeof m !== 'object' || m.type !== 'de:init') return;
  embedLoad(m);
}
async function embedLoad(m) {
  if (S.editing) finishEdit(true);
  const title = typeof m.title === 'string' ? m.title.slice(0, 200) : '';
  const mode = typeof m.mode === 'string' && STYLE_MODES.some(x => x.id === m.mode) ? m.mode : 'outline';
  const firstTime = !S.embed;
  S.embed = true; EMBED.title = title; EMBED.lastDirty = null;
  document.body.classList.add('embed');
  if (firstTime) { buildToolbar(); closeMenus(); }
  const xml = typeof m.xml === 'string' ? m.xml : '';
  const name = (title || 'Diagram').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.drawio';
  if (xml.trim() && xml.length <= MAX_FILE_BYTES && await loadText(xml, name)) { /* loaded */ }
  else {
    if (xml.trim()) toast('Could not open the diagram from the document; starting a new one.', 5000);
    S.doc = newDoc(); S.doc.mode = mode; S.doc.sketch = mode === 'sketch';
    S.pi = 0; S.sel = []; S.undo = []; S.redo = []; S.selGuides = []; S.editPoints = null; S.file = { handle: null, name };
    clearCache(); setDirty(false); afterChange(); fitView();
  }
  buildPalette(); updateTitle();
  embedDirty();
}
function embedDirty() {
  if (!S.embed || EMBED.lastDirty === !!S.dirty) return;
  EMBED.lastDirty = !!S.dirty;
  embedPost({ type: 'de:dirty', dirty: !!S.dirty });
}
// Done: the whole diagram as draw.io XML, and the current page as SVG ready to place inline in the host page.
function embedDone() {
  if (!S.embed) return;
  if (S.editing) finishEdit();
  const prefix = 'de' + Date.now().toString(36) + (++EMBED.seq).toString(36) + Math.random().toString(36).slice(2, 6) + '-';
  const title = EMBED.title || page().name;
  const ex = buildExportSvg(page(), { fonts: false, idPrefix: prefix, title });
  embedPost({ type: 'de:save', xml: serializeDoc(S.doc), svg: ex.svg, width: ex.w, height: ex.h, title: EMBED.title });
  setDirty(false);
}
function embedCancel() {
  if (!S.embed) return;
  if (S.editing) finishEdit(true);
  if (!S.dirty) return embedPost({ type: 'de:cancel' });
  confirmDialog('Discard changes?', 'Your changes to this diagram will not be returned to the document.', 'Discard', () => embedPost({ type: 'de:cancel' }));
}
// Give every id in an SVG a prefix and rewrite its references, so several diagrams can share one HTML page.
function prefixSvgIds(svg, p) {
  const ids = new Set();
  svg.replace(/\sid="([^"]+)"/g, (m, id) => { ids.add(id); return m; });
  if (!ids.size) return svg;
  const map = (id) => ids.has(id) ? p + id : id;
  return svg.replace(/(\sid=")([^"]+)"/g, (m, a, id) => a + map(id) + '"')
    .replace(/url\(\s*#([^)\s]+)\s*\)/g, (m, id) => 'url(#' + map(id) + ')')
    .replace(/((?:xlink:)?href=")#([^"]+)"/g, (m, a, id) => a + '#' + map(id) + '"');
}
COMMANDS.embedDone = embedDone;
COMMANDS.embedCancel = embedCancel;
Object.assign(window.DiagramEditor, { embedDone, embedCancel, prefixSvgIds, EMBED });
