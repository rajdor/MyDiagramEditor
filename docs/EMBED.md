# Embed mode

Version 1.1.0. A host page (for example a document editor) can open `diagram-editor.html` in an iframe, pass it a diagram and get the result back. It is the same single file as the standalone editor: embed mode switches on only when the editor runs inside an iframe **and** receives a `de:init` message from its parent. Opened any other way, it is the normal editor.

Messages use `postMessage`. Nothing touches the network, and the Content Security Policy is unchanged.

## Messages

| Direction | Message | Meaning |
|---|---|---|
| editor to host | `{ type: 'de:ready' }` | Loaded and listening. Sent once on start-up when inside an iframe |
| host to editor | `{ type: 'de:init', xml, title, mode }` | Load this diagram. `xml` is draw.io XML, or empty for a new diagram; `mode` is the style of a new diagram (`outline`, `filled`, `duotone`, `sketch`, `neon` or `blueprint`); `title` names the diagram |
| editor to host | `{ type: 'de:save', xml, svg, width, height, title }` | The user pressed Done. `xml` is the whole diagram; `svg` is the current page |
| editor to host | `{ type: 'de:cancel' }` | The user pressed Cancel (after confirming, if there were changes) |
| editor to host | `{ type: 'de:dirty', dirty }` | The unsaved-change flag changed, so the host can warn on close |

The editor accepts messages only when `event.source === window.parent`, and replies with `window.parent.postMessage(msg, '*')`. The origin is not checked because a `file://` or `srcdoc` host has the origin `"null"`. A second `de:init` replaces the diagram.

## While embedded

- Done and Cancel replace New, Open, Save, recent files and the export commands (toolbar and File menu). Every editing feature stays. Ctrl+S shows a reminder to press Done.
- Escape never closes the editor. Cancel asks first when there are changes.
- Nothing is written to browser storage except preferences (no autosave, no recent files).

## The SVG returned on Done

- **Unique ids.** Every `id` (patterns, filters and so on) gets a prefix that is new for each Done, and every `url(#…)` and `href="#…"` is rewritten to match, so several diagrams can sit inline on one page.
- **Size.** `width`, `height` and `viewBox` fit the page's content plus a 12 px margin; a Dot matrix background is content, so it is included.
- **Fonts.** No `@font-face` is embedded: the host supplies Architects Daughter. (Normal SVG export still embeds it.)
- **Accessibility.** `role="img"`, an `aria-label` and a `<title>` from the diagram title.
- **Text stays text.** Labels are SVG `<text>`, so the host page stays searchable.

## A minimal host

```html
<iframe id="ed" src="diagram-editor.html" style="width:100%;height:80vh;border:0"></iframe>
<script>
const ed = document.getElementById('ed');
window.addEventListener('message', (e) => {
  if (e.source !== ed.contentWindow) return;
  const m = e.data;
  if (m.type === 'de:ready') ed.contentWindow.postMessage({ type: 'de:init', xml: savedXml || '', title: 'Checkout', mode: 'blueprint' }, '*');
  if (m.type === 'de:save') { savedXml = m.xml; placeSvg(m.svg); closeOverlay(); }
  if (m.type === 'de:cancel') closeOverlay();
});
</script>
```

The editor can also be bundled into the host page as an `<iframe srcdoc="…">` holding the whole of `diagram-editor.html`. Tests: t43 (`test/embed-host.html` is the stand-in host).
