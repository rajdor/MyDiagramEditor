# Tests

Version 1.1.0: 53 test files. Run them all from the repository root:

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
| t32 | App themes: contrast, remembered, Material default, white canvas in every theme, page bar position, panel modes |
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
| t45 | **Edit points and hover agree** (BUG-002): Edit points shows exactly the points offered on hover; a point added, moved or removed is offered at once; a line can be drawn from and to an added point; other shapes stay connectable while one is edited, and dragging from one ends the editing; crowded points are faded; Reset to defaults |
| t46 | **New line labels have a background**: a label added by the Add label command or by double-clicking a line starts with the canvas colour in all six styles; labels restyled with the diagram keep the style's rule; the Transparent box still removes it |
| t47 | **Render for the host, and hatch colour**: `de:render` answers with an SVG holding the labels and title, the size and the source, each answer with its id and its own ids, an error for bad XML, nothing from other senders, and the editor unchanged; pale fills are hatched a little deeper, white clearly deeper, mid fills as they are |
| t48 | **Paste from draw.io XML**: a whole file, a model, a bare root, a run of cells and a fenced answer are read; a compressed page; lines stay attached under new ids; a second paste adds; one undo; refusals say why and add nothing; hostile labels are cleaned; the command reads the clipboard or opens a box to paste into; it works in embed mode and Done returns the shapes |
| t49 | **Clipboard keys**: Ctrl+V adds draw.io XML from the system clipboard in one undo step; Ctrl+C and Ctrl+X put the shapes there as draw.io XML; a paste after a copy here uses the editor's own copy, stepped aside; other words on the clipboard paste the shapes last copied; in a text box the keys copy text |
| t50 | **Copy and paste style, and the colour panel**: fonts, colours, fill, line, shadow go across while text, size, place and kind of shape stay; word colours in the label come off; shape to line; locked shapes; one undo; Alt+Shift+C and Alt+Shift+V; the painter once, kept and Esc; colour panel preview, Cancel, Esc, click elsewhere, hex, OK as one undo, OK on selected words while editing |
| t51 | **Arrange**: the panel's align, distribute and match size buttons; Same width and align left, Same height and align top; the first shape clicked sets the size, the widest, tallest or largest after a drag box or Select all; several shapes resized together by the same amount from one shape's handle, locked shapes left alone, one undo |
| t52 | **Label spacing, alignment and paste** (also tables in labels: column alignment and layout attributes kept, bad values dropped, the same layout in the exported picture; normal weight inside bold): a fixed line height or alignment in a label's text is ignored so larger words get 1.2 of their own size; text pasted into a label loses its own font, size, colour and line height, keeps bold and italic, and a pasted heading becomes a bold line |
| t53 | **Mixed fonts and sizes**: shapes whose fonts or sizes differ show Mixed and any font chosen applies; while editing, the list follows the selected words, Mixed when they differ, and choosing the shape's own font applies it |
| t54 | **Embed notice**: a notice sent with `de:init` shows as plain text in a bar above the canvas without covering it, is dismissed with its button, and is gone at the next `de:init` without one; a notice that is not text is ignored |
| t55 | **Entity card**: in Containers, a draw.io swimlane with a navy header band and white title, outline in the header colour, a light tint of it as the body, rounded, text as a text shape inside; outline and tint follow a new header colour unless set on their own; resizing fits the text; saved and reopened as a swimlane; exported picture; keeps its colours in Blueprint, including a card added in Blueprint |

Screenshots and exported files from the last run are written to `test/out/` (ignored by git).
