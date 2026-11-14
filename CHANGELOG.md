# Changelog

## Unreleased

### Fixes
- BUG-001: while editing a label, Text, Size now changes the selected words. Clicking the Size box used to take the selection out of the label, so nothing changed. The label keeps its selection and stays in editing, so Size can be changed again; with only a caret (nothing selected), Size applies to the whole label

### Tests
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
