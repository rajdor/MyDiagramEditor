# Tests

Version 1.1.0: 44 test files. Run them all from the repository root:

```
npm test                          # every test, about 5 minutes; summary in the console, details in test/out/results.txt
node test/run-all.mjs t33 t34     # only these tests
npm run lint                      # static checks only (t37)
```

Tests drive the built `diagram-editor.html` in headless Chrome or Edge (set `CHROME_PATH` if neither is found). Build first (`npm run build`) after changing `src/`.

## How a test passes

A test fails if it exits with an error, if the page reports a script error, or, for tests with a file in `test/baseline/`, if its output differs from that approved output. Generated ids are masked before comparing.

Baselines are regression checks: they record behaviour that was reviewed and approved (routes, sizes, counts, reports). When a change is **meant** to alter that output:

```
npm run test:update-baselines     # rewrites test/baseline/*.txt from this run
git diff test/baseline            # review every changed line before committing
```

Only checks that do not depend on installed fonts are in baselines, so they pass on Windows, macOS and Linux.

## What each test covers

| Test | Covers |
|---|---|
| t1, t2 | Test diagram renders on every page; fit to view |
| t3 | Core editing by mouse: add from palette, move with snapping, draw a line between connection points, edit text, resize, rotate, undo and redo, save and reopen identically |
| t4, t5, t6 | Text editing: typing, rich text, focus, which element receives clicks and double-clicks |
| t7 | Exports (SVG, PNG, PDF, Gliffy) and the Gliffy report |
| t8 | Auto arrange and layered layout reduce line crossings |
| t9 | Editing connection points |
| t10 | Whole test diagram compared with mxGraph (draw.io's engine): every shape and line, routes identical |
| t11, t12, t16 | Line routing compared with mxGraph: exit sides, random lines in every routing style, self loops |
| t13 | Moving a route's bends keeps the route |
| t14 | Performance budget: routing and redrawing 250 shapes and 250 lines |
| t15 | Opening real draw.io files: compressed pages, layers, groups, UserObject data, links, tooltips |
| t17 | Person and people stencils draw in mxGraph |
| t18 | Crow's foot cheat sheet |
| t19 | Line from a shape to empty canvas |
| t20, t21 | Every palette shape inserts; folder tabs fit their text |
| t22 | Dragging line segments adds bends the way draw.io does |
| t23 | Copy, paste and duplicate offsets, paste near the edge of the view |
| t24 | Auto arrange never adds extra bends |
| t25 | Connection points scale with shape size and zoom; small shapes can be dragged |
| t26 | Hovering offers the connection points of the shape under the pointer (a small shape next to a large one) |
| t27 | Canvas background saved; screenshot mode |
| t28 | Palette groups, search, Collections, remembered layout |
| t29 | Diagram styles: all 20 switches, WCAG text contrast, Undo, the agreed rules in docs/STYLES.md |
| t30 | Phosphor icons: faithful paths, draw.io stencils, Gliffy export |
| t31 | Right-drag panning; right-click menu |
| t32 | UI themes: contrast, remembered, Neumorphism default, page bar position |
| t33 | **Security**: 29 HTML attacks, CSS injection, prototype pollution, hostile page names, editing a hostile label, exports, no network, Content Security Policy |
| t34 | **Damaged and hostile files**: 30 files (loops, missing and duplicate ids, Infinity, decompression bomb, entity expansion, 600 shapes, 40 pages); each one is opened, edited, restyled, exported, saved and reopened |
| t35 | **Monkey test**: thousands of seeded random mouse, keyboard and menu actions with model checks (unique ids, finite geometry, valid parents and line ends, stable save) and Undo all the way back. More: `MONKEY_SEEDS=1,2,3,4,5,6,7,8 MONKEY_STEPS=400 node test/t35.mjs` |
| t36 | **File commands and Undo rules**: Open, Save, Save as, unsaved-changes prompt, file size limit, autosave and its failure message, 120-step history, redo cleared by an edit, pages |
| t37 | **Static checks**: ESLint on the shipped script (undefined names, unused code, duplicate keys, eval) |
| t38 | **Export files are valid**: PDF cross-reference table and Unicode title, well-formed SVG without script, PNG size, draw.io round trip |
| t39 | **Presets**: 8 filled, 8 outline, Subtle and Bold; a filled preset fills a no-fill shape in Sketch (fill style None); open containers stay unfilled; highlight follows clicks; one undo step each |
| t40 | **Agreed editing behaviour**: select all and selection box skip hidden layers, send to back inside containers, pasting a line label alone, delete keeps lines, cut and lock, duplicate and the clipboard, 1 px arrow nudges, containers (drop in, move together, drag out, palette drop, save), grouping, Escape cancels, grid size |
| t41 | **Contrast**: WCAG 2.2 maths and large text; 1,600 random colour combinations on 9 canvases pass after correction; OKLCH hue kept (under 2 degrees); fills never changed; smallest step; style and canvas switches; your own colours left until a bulk action; Fix text colours; the setting; unfixable fills flagged; report; save and reopen; no network |
| t42 | **Blueprint**: tokens by role, all 13 states and 6 line types (dash lengths in pixels), switches to and from every style with one Undo step, Outline to Blueprint to Outline to Blueprint round trip, contrast, SVG export (dots, crisp shadows, double outline, markers, icons, no blur), Harvey ball stencils and draw.io round trip, fixed dot spacing, hostile style values, checklist ticking and Enter |
| t43 | **Embed mode**: the editor in an iframe of `test/embed-host.html`: de:ready, normal until de:init, other senders ignored, Done and Cancel instead of file commands, no autosave, de:dirty, de:save (XML reopens identically, every SVG id prefixed and references matching, a new prefix each time, no fonts, role, aria-label and title, text kept as text, dot matrix), Cancel asks when there are changes, a new diagram in the requested style |
| t44 | **Text size while editing** (BUG-001): Size through the real input changes only the selected words, keeps the selection and editing, a caret sizes the whole label, Font and Bold still format the selection; standalone and in embed mode |

Screenshots and exported files from the last run are written to `test/out/` (ignored by git).
