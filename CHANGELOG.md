# Changelog

## Unreleased

### Features
- Entity card, in Containers: a solid header band with a white title, the outline in the header colour, a light tint of the same colour as the body (same hue, very light), rounded corners, and text under the title as a text shape inside the card. Saved as a draw.io swimlane (`swimlane`, `startSize`, `fillColor`, `swimlaneFillColor`), so it opens as the same card in draw.io. A new header colour carries the outline and the tint with it until either is set on its own; the Format panel has a Body colour with Match header. Resizing fits the text to the body. The card keeps its colours in every diagram style; its font follows the style
- draw.io swimlanes are drawn with their header band and body colour (they were plain boxes)
- Labels holding a table (as draw.io writes a data model entity: key, name and type columns) keep their column alignment and layout: inside a table, `text-align` and the attributes `align`, `valign`, `colspan`, `rowspan`, `width`, `bgcolor`, `cellpadding`, `cellspacing` and `border` are kept, each value checked. Alignment anywhere else in a label still gives way to the shape's own (the Position grid)
- Exported pictures (and the picture a host page such as the document editor shows) set out a label holding a table as the canvas does: each cell's fill and borders, and each line of words at its place, font and colour, as plain SVG shapes and text
- Exported pictures: normal weight inside a bold label is no longer drawn bold
- Embed mode: `de:init` takes an optional `notice`, shown as plain text in a bar between the page tabs and the canvas, covering nothing, until it is dismissed or the next `de:init`. A host uses it to say a diagram was converted from something else, so a different look is not taken for lost formatting
- Arrange, in the format panel: Distribute horizontally and vertically, and Match width, height, and width and height, next to the align buttons (the same commands as the toolbar and the Arrange menu). Two new quick actions, also on the Arrange menu under Match size: Same width and align left, and Same height and align top; the size comes from the first shape clicked and the shapes line up on the leftmost left edge or the topmost top, in one undo step.
- Match size, and the two quick actions, take the size from the first shape clicked. A selection made with a drag box or Select all has no first click, so there the widest (width), tallest (height) or largest (both) is used. Match size used to take the size from whichever shape came first in the selection, which after a drag box was the order the shapes were drawn in.
- Several shapes resized together, as in PowerPoint: with two or more shapes selected each shows its handles, and dragging one handle changes every selected shape by the same amount, each from its own opposite side or corner. Places and gaps stay, and shapes of one width stay one width. Shift keeps each shape's proportions. Locked shapes, lines and groups are left out. One undo step.
- Copy style and Paste style: the fonts, colours, fill, line, shadow, rounding, sketch settings and Blueprint state of one shape or line onto others, in one undo step. The text, size, place, rotation, connections and kind of shape stay as they are. From a shape to a line, or a line to a shape, only what both have (line and text) goes across; a text box takes the text only. Colours, fonts and sizes set on single words in a label are taken off, so the whole label takes the copied text style; bold and italic stay. Keys Alt+Shift+C and Alt+Shift+V (Option on a Mac); also on the Edit menu, the right-click menu and a Style section at the top of the format panel, with a painter: click once to paint the next shape clicked, double-click to keep painting until Esc. Locked shapes are left alone. The copied style lasts while the editor is open, so it can be pasted in another diagram.
- Colours in the format panel open a small colour panel: the palette's colours, a picker for any colour and its hex code, the colour before and after, and OK and Cancel. The chosen colour shows on the diagram at once; OK keeps it as one undo step, and Cancel, Esc or a click elsewhere puts it back. While a label is being edited, the text colour is applied to the selected words on OK. The browser's own colour picker used to apply the colour as soon as it closed, with no way to back out.

### Fixes
- Font and Size with mixed text: with shapes whose fonts or sizes differ, the Font list and Size box show Mixed, so any font or size chosen applies. While a label is edited they follow the selected words, showing Mixed when the words differ. They used to show the first shape's font, so choosing that font did nothing until another font was chosen first.
- Text alignment in labels: the Position grid's left, centre and right now always apply. Alignment that came inside the label's text (usually pasted in) used to override it, so centre and right did nothing for that text on the canvas, while the exported picture used the grid's setting. Diagrams that already hold such text follow the grid now.
- Line spacing in labels: lines are always 1.2 times their own text size. A label holding a fixed line height (usually pasted in from a web page, Word or an AI assistant) used to keep it when its text was made larger, so the lines overlapped on the canvas while the exported picture spaced them correctly. Diagrams that already hold such a line height are drawn correctly now, with nothing to redo.
- Text pasted into a label takes the label's own font, size and colour. The font, size, colour, background and line spacing that came with it are dropped; bold, italic, underline, lists and line breaks stay, and a pasted heading becomes a bold line. Ctrl+Shift+V still pastes plain text.
- Ctrl+C, Ctrl+X and Ctrl+V use the browser's own copy, cut and paste. Copied shapes go to the system clipboard as draw.io XML with no permission asked, so they paste into another diagram in another document or tab, or into draw.io; draw.io XML copied anywhere else pastes in as shapes. What was last copied here still pastes from the editor's own copy, with every detail and stepped aside each time. Ctrl+V used to paste only shapes copied in the same editor, and the system clipboard was written only when the browser allowed it. In a text box the keys copy and paste text as before.
- BUG-001: while editing a label, Text, Size now changes the selected words. Clicking the Size box used to take the selection out of the label, so nothing changed. The label keeps its selection and stays in editing, so Size can be changed again; with only a caret (nothing selected), Size applies to the whole label
- BUG-002: the points shown by Edit points are now the points a line can attach to. A shape with its default points used to show its stored points in Edit points but offer a different, size-based set on hover, so some points could not be used until one was edited. Edit points now starts from the points offered; a point too crowded to offer at the current zoom is shown faded; other shapes stay connectable while one is being edited

### Changes
- Paste from draw.io XML (clipboard), on the Edit menu and the canvas right-click menu. Shapes written as draw.io XML somewhere else (draw.io's own Copy, the text of a file, an answer from an AI assistant) are added to the page and selected. The text is read from the clipboard when the browser allows it; when it does not, or the clipboard holds something else, a box opens to paste into, and it says why text could not be read as a diagram. A whole file (compressed pages included), one `mxGraphModel`, a bare `root` or a run of `mxCell` elements is accepted, and a Markdown code fence or words around the XML are ignored. On an empty page the shapes stay where the XML put them and the view is fitted; otherwise they land in view like any paste. One undo removes them. It is available in embed mode, where Open is not. The text goes through the same reading and cleaning as Open.
- Sketch style: hatching is lighter. Hatch lines in a pale fill used to be drawn 45 percent of the way toward the outline colour, which made hatched shapes look heavy. They are now deepened only as much as the fill is pale: not at all below a luminance of 0.7, and about a quarter of the way for white. Mid and dark fills are unchanged.
- Embed mode: a new `de:render` message. The host sends a diagram and gets back its picture (`de:rendered`, with the same SVG a Done gives) without the editor opening it; the diagram on screen, its undo history and embed mode are untouched. See [docs/EMBED.md](docs/EMBED.md).
- A label added to a line by hand (Add label, or a double-click on the line) now starts with a background in the canvas colour in every style, including Blueprint and Neon, so the line does not run through its words. Text, Transparent removes it. Labels restyled with a whole diagram keep the style's own rule

### Tests
- t53: Font and Size show Mixed for shapes and for selected words that differ, and the font shown can be chosen
- t52: line spacing with a fixed line height, alignment carried in a label's text, and text pasted into a label
- t51: Arrange: panel buttons, Same width and align left, Same height and align top, the shape that sets the size, several shapes resized together
- t50: Copy and paste style (what goes across and what stays, word colours, shape to line, locked shapes, one undo, keys, the painter, menus) and the colour panel (preview, Cancel, Esc, click elsewhere, hex, OK as one undo, selected words while editing); t41 picks a colour through the panel
- t49: Clipboard keys: XML from the system clipboard in one undo step, copy and cut to the system clipboard, a paste after a copy uses the editor's own copy stepped aside, other words on the clipboard, text boxes unaffected
- t48: Paste from draw.io XML: what is read out of the text (file, model, root, cells, code fence), a compressed page, lines stay attached under new ids, a second paste adds, undo, refusals with their reasons, hostile labels, the clipboard path and the box, embed mode with Done
- t46: a label added to a line has a canvas-coloured background in all six styles, by command and by double-click; restyled labels unchanged; Transparent still works
- t45: Edit points shows the points offered on hover; added, moved and removed points are offered at once; lines from and to an added point; other shapes connectable while editing; crowded points faded; Reset to defaults
- t44: Size on selected words through the real input, standalone and in embed mode; a second change, Font and Bold on the selection, caret sizes the whole label, saved label, Size when not editing

## 1.1.0 (14 November 2026)

### Features
- Blueprint diagram style, from the Fine Line Blueprint style guide: navy ink, pale fills, crisp offset shadows, Architects Daughter; one Undo step, warnings and contrast checks like the other styles. Rules: docs/STYLES.md (permutations 21 to 30)
- Blueprint states for shapes (Focus, External, Note, Good, Bad, Warning, Alert, Critical, New, Changed, Retire, Comment, Neutral) with the state icon before the label; markers on the top-right corner; line types (Existing, Planned, Async, Retire, Annotation, Association)
- Drop shadow on any shape, in any style: crisp offset with colour, opacity, size and direction
- New shapes: Callout panel, Question, Annotation (with its dashed arrow) and Checklist (click to tick, Enter adds an item) under Notes; Harvey balls (0 to 100%); Backgrounds, Dot matrix (dots stay 20 px apart when resized)
- Gliffy compatible export: Harvey balls embedded as images; Blueprint extras Gliffy cannot show are listed in the report
- Embed mode: inside an iframe, after a `de:init` message from its parent, the editor shows Done and Cancel instead of the file commands and returns draw.io XML plus an SVG with unique ids, no embedded fonts and accessibility attributes (docs/EMBED.md). Standalone use is unchanged

### Documentation
- docs/STYLES.md lists every editor-only key (the agreed exceptions to "the file stays plain draw.io"), and asks for agreement before adding new ones

### Tests
- t43: embed mode with a stand-in host page: ready, init, dirty, Done (XML round trip, prefixed ids, no fonts, accessibility), Cancel, blocked file commands, no autosave, messages from other sources ignored
- t42: Blueprint tokens, every state and line type, switching in and out (round trip), contrast, exports (dots, shadows, double outline, markers, icons, no blur), draw.io round trip, dot spacing, hostile values, checklist clicks and Enter

## 1.0.0 (24 October 2026)

First release with a full test suite.

### Features
- Five diagram styles (Outline, Filled, Duotone, Sketch, Neon) with warnings, one Undo step per switch and WCAG text checks
- Phosphor Icons under Collections, grouped by theme, searchable, following the diagram style
- UI themes: Neumorphism (default), Classic, Flat / Minimal, Material Design
- Page tabs above the canvas, between the side panels; cursor coordinates on the same bar
- Collapsible palette groups with search; Presets group: 8 filled colours, the same 8 as outlines (border only), Subtle and Bold. Presets override the diagram style like a manual change
- Right-drag panning; Light and Dark canvas; Gliffy compatible export that never drops shapes
- Containers hold shapes: drag a shape (or a palette shape) onto a container and it moves with the container; drag it off to take it out. Containers are saved with draw.io's own `container=1`, so draw.io treats them the same way
- Lock means fixed in place: a locked shape can't be moved, resized, rotated, cut or deleted, but its text and colours can still be changed
- "None" for fills and label backgrounds is now called Transparent (Subtle and the outline presets use a transparent fill)
- Arrow keys nudge 1 px; Shift+arrow nudges one grid cell
- Escape cancels text editing (a new text box or label is removed); Ctrl+Enter or clicking elsewhere keeps the text

### Contrast
- WCAG 2.2 contrast checking and correction for text (4.5:1, large text 3:1), outlines, lines and icons (3:1), each tested against what is directly behind it
- Correction keeps the colour's OKLCH hue and only changes its lightness (the tonal method of Material Design HCT and Adobe Leonardo); white or near black only as a last resort; fills are never changed
- Runs over the whole diagram after a style or canvas switch (setting "Auto-correct contrast", on by default) and on request with Fix text colours or Fix all; your own colour changes are left alone until then
- Contrast report with old and new colours, target, background, ratios, an advisory APCA reading, and anything that could not be fixed
- Neon colours and the Green, Amber, Teal and Subtle preset outlines now use the same method (the outlines are a little darker so they pass on white)

### Security
- Label sanitiser: safe link schemes only (including disguised `javascript:` links), safe inline CSS, repeated until stable
- Style values checked before they reach CSS (colours, font names, alignment); style keys cannot reach the object prototype
- Content Security Policy that blocks all network access
- Limits: 64 MB per compressed page, 100 MB per file

### Fixes
- Files with parent loops no longer fail to open
- Missing or duplicate cell ids, missing parents and line ends joined to missing shapes are repaired on open
- `Infinity`, `NaN` and huge numbers in a file no longer break drawing or the Sketch style
- Malformed guide data in a file no longer breaks drawing
- Damaged compressed pages are refused with a message instead of half-opening
- Grid size from a file is limited to 1 to 1000
- Edits made while the Save dialog is open stay marked as unsaved
- Autosave failures (full or blocked browser storage) are reported once instead of failing silently
- PDF title keeps any file name (Unicode, brackets, backslashes)
- Strict mode now applies to the whole app script (it was ignored before because it was not the first statement)
- Removed unused code
- Ctrl+A and the selection box no longer select shapes on hidden layers (Ctrl+A then Delete removed shapes you couldn't see)
- Send to back on a shape inside a container keeps it in front of the container (it used to disappear behind the fill)
- A line label copied on its own pastes as a text box beside the original (it used to paste invisibly on top of it)
- Deleting a shape leaves its connected lines in place, with that end unconnected (it used to delete them, even locked ones)
- Cut skips locked shapes; copy and paste of a locked shape keeps the original
- Duplicate (Ctrl+D) no longer replaces what you copied with Ctrl+C
- Grouping only groups shapes that share a container, as draw.io does, and says when some were left out
- Grid size is 1 to 1000 in the panel and in files
- A filled preset now fills a shape that has no fill (for example in Sketch with fill style Transparent); the current preset highlight now follows clicks

### Tests
- New: security (t33), damaged and hostile files (t34), seeded monkey test with model checks and full Undo/Redo (t35), file commands and Undo rules (t36), static checks with ESLint (t37), export file validity (t38), presets (t39), agreed editing behaviour (t40)
- Tests t1 to t27 now compare their output with approved baselines in `test/baseline/`, so any change in behaviour fails
- Font-dependent checks use rules instead of exact pixels, so the suite passes on Windows, macOS and Linux
- Performance budget for routing and drawing 250 shapes and 250 lines
- Test tooling updated to Puppeteer 25 and ESLint 9.39 (clears the `npm audit` advisories in test tooling); needs Node.js 22.12 or later
