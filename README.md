# Diagram Editor

A lightweight, Gliffy-style diagram editor in a single, self-contained HTML file. It runs offline in Chrome, Edge and Safari and saves in the draw.io (`.drawio`) file format.

**Use it:** open `diagram-editor.html` in a browser. Nothing to install.

## Features

- Shapes: basic primitives and arrows, standard flowchart (ISO 5807 / ANSI) shapes, data flow (Yourdon and Gane-Sarson) symbols, callouts, callout panels, sticky notes, questions, annotations and clickable checklists, Harvey balls, a dot matrix background, containers (including a tabbed container whose tab fits its text), non-gendered person and people shapes
- Rich text, nine inside positions plus above, below, left and right of a shape; rotation that rotates text
- Lines: arrowheads and crow's foot ends (with a cheat sheet), straight, elbow, soft elbow and curved routing, line hops, waypoints, segment dragging, reset path, multiple attached rich text labels
- Connection points: at least three per side (eight on circles); add, move along the outline, remove, reset
- UI themes for the editor itself (File, UI theme): Neumorphism (default), Classic, Flat / Minimal and Material Design, remembered in this browser. Separate from the diagram style
- Pan by right-dragging (a right-click without dragging still opens the menu), Space+drag, middle-drag or scrolling
- Grid, snapping, smart guides, rulers and any number of guides
- Align, distribute, match size, group and ungroup (nested), lock (fixed in place; text and colours stay editable)
- Containers that hold shapes: drop a shape on a container and it moves with it; drag it off to take it out
- Auto arrange: grid, row, column, circular, pyramid; fewer line crossings; layered layout of shapes and lines
- Six diagram styles for the whole diagram: Outline, Filled, Duotone (colour-harmony schemes on the artist's wheel), Sketch (hand-drawn, with fill style and roughness), Neon (glow) and Blueprint (navy ink with status states, markers and line types, from the Fine Line Blueprint style guide). Every switch warns first, is one Undo step, and checks all text against WCAG contrast. Rules: [docs/STYLES.md](docs/STYLES.md)
- Contrast: after a style or canvas switch, or on request (Fix text colours), every text, outline, line and icon is checked against WCAG 2.2 and failing colours are made lighter or darker in the same hue; a contrast report lists every change. Rules: [docs/STYLES.md](docs/STYLES.md#contrast)
- Drop shadows on any shape: crisp offsets with colour, opacity, size and direction
- Phosphor Icons (1,512 icons, MIT) under Collections in the palette, grouped by theme, searchable, following the diagram style; saved as draw.io stencils
- Shape palette in groups that expand and collapse (Alt+click a group to show only that group; the layout is remembered), with search across shapes and icons
- Save and open `.drawio`, Save as, autosave recovery, recent files
- Export: PNG, SVG, PDF (one page), and a Gliffy compatible `.drawio`
- Embed mode: a host page can open the editor in an iframe, pass it a diagram and get back draw.io XML and an inline-ready SVG (`postMessage`, no network). The same file works standalone. Details: [docs/EMBED.md](docs/EMBED.md)

## Compatibility notes

- Files use draw.io's own structure and style keys. Elbow, soft elbow and curved lines are routed by a port of draw.io's routing code, so they take the same paths in both apps.
- Guides are stored as diagram-level data, invisible in draw.io.
- The Gliffy compatible export re-points line ends to supported connection points, converts Sketch and Neon to Outline and Duotone to Filled, embeds Phosphor icons as images, and reports every change. Further Gliffy fixes will be added as testing finds them (Help, Gliffy compatibility register).

## Security

Diagram files are treated as untrusted. Opening one cannot run script, load anything from the network or change the editor: label HTML is sanitised (allowed tags, safe links and inline CSS only), style values are checked before they reach CSS, damaged files are repaired or refused with a message, and a Content Security Policy blocks all network access. Details: [docs/SECURITY.md](docs/SECURITY.md). Changes by version: [CHANGELOG.md](CHANGELOG.md).

## Build

`diagram-editor.html` is generated from `src/`. Do not edit it by hand.

```
npm ci               # installs the exact versions in package-lock.json (Node.js 22.12 or later)
npm run build        # writes diagram-editor.html
npm test             # all 43 test files (about 5 minutes); results in test/out/results.txt
npm run lint         # static checks only (ESLint on the built script)
```

- `build.js` inlines Rough.js, the Architects Daughter font and the app code into one HTML file. With the locked dependencies the build is byte-for-byte reproducible.
- `.gitattributes` keeps line endings as LF on every platform, so a build on Windows matches a build on macOS or Linux.
- Tests use `CHROME_PATH` if set, otherwise a locally installed Chrome or Edge. What each test covers, and how regression baselines work: [test/README.md](test/README.md).

```
src/        app source (core, diagram styles, contrast, icons, routing, rendering, UI, CSS, page template)
docs/       design rules (STYLES.md), the security model (SECURITY.md) and embed mode (EMBED.md)
samples/    example diagrams (architecture-demo.drawio shows every diagram style and Phosphor icons)
test/       headless-browser checks, including route comparisons against mxGraph
build.js    single-file build
```

## Ideas not yet built

### Your own icons, built in

The editor deliberately keeps no saved state of its own, so icons can't be imported at run time. Instead, custom icons would be added the same way Phosphor is: at build time.

- **How it would work:** put SVG files in an `icons/` folder in this repository. `npm run build` packs them into `diagram-editor.html` as a **Custom** group under Collections, next to Phosphor. They then behave like Phosphor icons: they follow the diagram style, save as draw.io stencils and appear in search.
- **Designing an icon to match Phosphor:** draw on a 256 x 256 canvas with about 16 px of padding, using 16 px strokes with round ends and round corners. Convert the strokes to filled outlines ("Outline stroke" in Figma, "Stroke to path" in Inkscape), merge everything into one single-colour path, and export as SVG with paths only (no text, gradients or images). Optionally add a solid version (used in Filled) and a duotone version with a background shape (shown at 20% in Duotone).
- **Trade-off:** only someone who can rebuild the file can add icons, and every icon added makes the HTML file larger.

## Third-party components

See `THIRD_PARTY_NOTICES.md`. draw.io is a trademark of JGraph Ltd; this project is independent and not affiliated with JGraph.
