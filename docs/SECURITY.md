# Security model

Version 1.0.0. The editor is one offline HTML file. It has no server, no account and no network access. The main risk is a **hostile diagram file**: a `.drawio` file from someone else, an autosave, or text pasted as draw.io XML. Everything in a file is treated as untrusted.

## What a hostile file cannot do

| Threat | Protection | Where | Test |
|---|---|---|---|
| Run script through label HTML (`<img onerror>`, `<svg onload>`, `<script>`, `<iframe>`) | Allow-list sanitiser: only formatting tags survive; every attribute except `style`, `color`, `face`, `size`, `href`, `align` is removed | `sanitizeHtml` in `src/core.js` | t33 |
| Mutation XSS (markup that changes meaning when parsed twice) | Sanitise repeatedly until the output is stable | `sanitizeHtml` | t33 |
| `javascript:` and other dangerous links, including disguised ones (`java&#9;script:`, mixed case, control characters) | Links allowed only for `http`, `https`, `mailto`, `tel`, page anchors and relative paths, checked after removing characters browsers ignore | `safeUrl` | t33 |
| Inline CSS that loads a resource, hides an escape (`u\72l(`), or covers the editor (`position: fixed`) | Declarations with `url(`, `image-set`, `expression`, `@import`, backslashes or braces, and `position`, `content`, `filter`, `mask`, `cursor` properties are removed | `safeCss` | t33 |
| CSS injection through shape style values (`fontColor=red;background:url(...)`) | Colours must be real colour values; font names lose quotes, backslashes and brackets; alignment must be left, center, right or justify | `safeColour`, `fontCss`, `alignCss` in `src/render.js` | t33 |
| Prototype pollution through style keys (`__proto__`) | The style parser skips `__proto__`, `constructor` and `prototype` | `parseStyle` | t33 |
| Sending data out or loading tracking images | Content Security Policy: `default-src 'none'`; images, fonts and fetches only from `data:` and `blob:` | `src/index.html` | t33 |
| Crash or hang from a damaged file: parent loops, missing or duplicate ids, missing parents, dangling line ends, `Infinity` or huge numbers, bad guide data | Repaired on open: new ids for missing and duplicate ids, loops and missing parents moved to the first layer, numbers limited to +/- 10 million, guides validated | `readModel`, `readGeo` | t34 |
| Decompression bomb (a small compressed page that expands to gigabytes) | Each compressed page may expand to at most 64 MB | `inflateRawB64` | t34 |
| Very large files | Files over 100 MB are refused with a message | `openFileObject` in `src/ui3.js` | t36 |
| Entity expansion ("billion laughs") | The browser's XML parser limits entity expansion; checked by test | `parseDrawio` | t34 |

Exports are safe to open elsewhere: SVG export converts label HTML into plain SVG text (no `foreignObject`, no script), PDF and PNG are images.

## Known limits

- The page needs `'unsafe-inline'` for its own script and styles, because it is a single file. The sanitiser, not the policy, is what stops script in labels.
- Browser storage (preferences, autosave, the Gliffy register, recent files) belongs to whoever uses that browser profile. Anyone with access to the profile can read or change it.
- Links in labels are kept so a file round-trips to draw.io, but the editor does not follow them.
- Nothing from `node_modules` ships except Rough.js, the Architects Daughter font and the Phosphor icon data, which the build inlines. `npm audit` reports one advisory, in `mxgraph` (a tooltip XSS). mxGraph is a test-only dependency used to compare line routes on a local page with tooltips off; it is not part of `diagram-editor.html`.

## Reporting a problem

Open an issue in the repository with a file that shows the problem. Do not attach diagrams that contain confidential information.
