# Diagram styles

Agreed 24 October 2026; Blueprint added 14 November 2026. This is the reference for how the six diagram styles behave and why.

## Styles

| Style | Look | In draw.io |
|---|---|---|
| Outline | Clean lines, the normal look | Identical |
| Filled | Solid or tinted colour shapes | Identical |
| Duotone | Two harmonising colours: strong outline, soft tinted fill | Identical, except two-colour icons show in one colour |
| Sketch | Hand-drawn whiteboard (Rough.js), handwriting font | Identical (draw.io's own sketch keys) |
| Neon | Glowing lines, best on a dark canvas | No glow; bright outlines only |
| Blueprint | Navy ink, pale fills, crisp offset shadows, handwriting font, with status colours (Fine Line Blueprint) | Colours, outline widths and dashes identical; no shadows, double outlines, icons before labels or markers (see [Editor-only keys](#editor-only-keys)) |

A style applies to the whole diagram, every page. New shapes, lines and icons take the current style.

## Principles

1. **No hidden extra state.** A style switch is a one-way recolour, like find and replace. The file stays plain draw.io. The agreed exceptions are listed under [Editor-only keys](#editor-only-keys).
2. **Warn, then rely on Undo.** Every switch shows a warning first and can be cancelled. The whole switch is one Undo step (Ctrl+Z). The undo history holds 120 steps and is cleared when the file is closed.
3. **Contrast is always checked.** After every style or canvas switch, the whole diagram is tested against WCAG 2.2 and failing text, outline, line and icon colours are corrected (see Contrast below). Colours you set by hand are left as they are until the next switch or until you press a Fix button.

## Warning (shown before every switch)

> **Switch to {Style}?**
> Shapes, icons and text will be recoloured. Undo (Ctrl+Z) reverses this. Switching back to a previous style later may not restore the original colours.
> [Cancel] [Switch to {Style}]

The options for the switch appear in the same dialog, under the warning.

## Contrast

Agreed 24 October 2026. Code: `src/contrast.js`. Tests: t41.

**When.** One pass over the whole diagram (every page) after a style switch or a Light or Dark canvas switch, when the setting **Auto-correct contrast** is on (the default; Style menu or the Diagram panel). **Fix text colours** and **Fix all** run the same pass on request, whatever the setting. Nothing is corrected while you edit: colours you set yourself stay exactly as set until one of those bulk actions. Every pass is one Undo step.

**Standard.** Pass or fail always uses the WCAG 2.2 contrast ratio (relative luminance).

| Item | Tested against | Minimum |
|---|---|---|
| Text in a shape with a fill | The fill, blended with what is behind it when partly transparent | 4.5:1 |
| Text in a transparent shape, text boxes, names under icons | What is directly behind: a filled shape (such as a container) or the canvas | 4.5:1 |
| Line labels | The label background, or what is behind the line | 4.5:1 |
| Large text (24 px, or 19 px bold) | As above | 3:1 |
| Shape outlines, lines and arrowheads, icons | What is directly behind them | 3:1 (WCAG 1.4.11) |
| A fill with no outline | What is directly behind it | 3:1, reported only (fills are never changed) |

Not checked: grid, guides, selection handles, and colours inside rich text.

**Correction.** A failing colour keeps its OKLCH hue and chroma; only its OKLCH lightness changes, by the smallest step that passes, away from the background first, then the other way. Chroma is reduced only to stay inside sRGB (and of the nearest hex values, the one closest in hue is used). If no lightness passes: white or near black (#111827), whichever contrasts more. On a dark canvas this makes colours lighter in the same hue. Text on a filled shape is kept if it passes; otherwise it gets the same-hue tone, or white or near black. The preset outline colours are tuned the same way so they pass on white.

**Report.** Style, Contrast report: what fails now, and every correction of the last pass (element, old and new colour, target, background tested against, ratio before and after), with an APCA Lc reading for information only (APCA is not a standard). Anything that could not be fixed is flagged.

**Files.** Corrected colours are ordinary draw.io keys (fontColor, strokeColor; fillColor for icons), so draw.io and Gliffy show the same result.

## Editor-only keys

Principle 1 says the file stays plain draw.io. These keys are the agreed exceptions: extra style keys or page attributes that only this editor reads. draw.io ignores unknown keys, so a file still opens there. Wherever a key changes the look, the editor also writes the closest standard draw.io keys (colours, `strokeWidth`, `dashed`, or a generated stencil), so the diagram is still recognisable in draw.io.

| Key | On | Meaning | What draw.io shows | Since |
|---|---|---|---|---|
| `deMode` | cell | Which diagram style the cell was converted to (`filled`, `duotone`, `neon`, `blueprint`); absent for Outline | The colours as converted | 1.0.0 |
| `deCont` | cell | Marks a shape recognised as a container, so it stays one after it gets a tint | The shape | 1.0.0 |
| `deGlow` | cell | Neon glow (`1` dark canvas, `2` light canvas) | No glow; bright outline only | 1.0.0 |
| `dePh`, `deW` | cell | Phosphor icon name and weight; the stencil is regenerated on save | The icon, from the stencil | 1.0.0 |
| `deC2` | cell | Second colour of a duotone icon | Icon in one colour | 1.0.0 |
| `deGridVisible`, `deGuides`, `deGuidesLocked`, `deGuidesVisible`, `deRulers` | page or diagram | Grid visibility, guides and rulers | Nothing (editor settings) | 1.0.0 |
| `deState` | cell | Blueprint state: `focus`, `external`, or one of the 11 semantic states | The state's colours, outline width and dash | 1.1.0 |
| `deIcon` | cell | Phosphor icon drawn before the label (state icons, callout panel) | Label without the icon | 1.1.0 |
| `deMarker` | cell | Blueprint marker: a state icon in a disc on the top-right corner | Nothing | 1.1.0 |
| `deLine` | edge | Blueprint line type: `planned`, `async`, `retire`, `annotation`, `association` | The colour, dash and arrowhead | 1.1.0 |
| `deDouble` | cell | Double outline (Blueprint Critical) | A single outline of the same total width | 1.1.0 |
| `deShadow`, `deShadowColor`, `deShadowOpacity`, `deShadowDx`, `deShadowDy` | cell | Crisp offset shadow, no blur (draw.io's own `shadow=1` is blurred, so it is not used) | No shadow | 1.1.0 |
| `deDots`, `deDotsColor` | cell | Dot matrix background shape: fixed 20 px dot spacing, whatever the shape's size | The shape's plain fill | 1.1.0 |
| `deHarvey` | cell | Harvey ball fill (0, 25, 50, 75 or 100%); the stencil is regenerated on save | The ball, from the stencil | 1.1.0 |
| `deChecklist` | cell | Checklist text box: click a ☐ or ☑ to tick it, Enter adds an item | The text with ☐ and ☑ characters | 1.1.0 |
| `deNote` | cell | Notes shapes that keep their redline look in Blueprint (`question`, `annotation`) | The text in its colours | 1.1.0 |

Every key here is validated when a file is opened, like any other style value (docs/SECURITY.md): colours must be real colours, numbers are limited, and names must be known values.

**Reminder for future changes:** before adding a new editor-only key or page attribute, check this table and **ask first**. Say what the key stores, why standard draw.io keys are not enough, and what draw.io will show without it. Add the key to this table in the same change, with the version.

## Terms

- **Existing fill:** any fill that is not white, near-white or none.
- **Reliable colour:** a colour with enough colour in it to have a meaningful hue. Near-white fills and grey outlines are not reliable.
- **Dominant colour:** the most common reliable colour hue among the diagram's shapes. Used when a shape has no reliable colour of its own. If the diagram has none, blue (Duotone) or cyan (Neon).
- **Containers:** containers, tabbed containers, data stores drawn as partial rectangles, and shapes with no fill.
- **Pick from list:** the existing colour presets (Slate, Blue, Green, Amber, Red, Purple, Teal, Pink), one preset applied to every shape being changed.

## From Outline

### 1. Outline to Filled

Options: **Override existing fills?** (default Yes); **Fill style:** Block (default), Auto, Pick from list. Icons separately: **Override icon colours?** (default Yes); **Icon style:** Block, Auto, Pick from list.

| Item | Result |
|---|---|
| Coloured shape, Block | Solid fill in the outline colour; outline a darker shade |
| Plain grey shape, Block | Light grey fill (not solid slate) |
| Any shape, Auto | Very light tint of the outline colour |
| Any shape, Pick from list | The preset's fill, outline and text colours |
| Containers | Always a light tint, even under Block |
| Sticky notes and other existing fills | Changed only if Override = Yes |
| Text boxes, lines | Unchanged |
| Icons | Block: Phosphor fill weight. Auto: Phosphor duotone weight. Pick from list: fill weight in the preset's strong colour |

### 2. Outline to Duotone

Options: **Override existing colours?** (default Yes); **Scheme:** Monochromatic, Analogous (default), Complementary, Split complementary, Triadic, Tetradic; **Rotate anticlockwise** (default off, so clockwise); **Tint:** Standard (default) or Lighter; **Apply:** Per shape (default) or Entire diagram. Entire diagram replaces per-shape colour coding with one colour pair.

- **Colour 1 (strong):** from the shape's existing fill if reliable, otherwise its outline if reliable, otherwise the dominant colour. Normalised to a strong version of the same hue. With Entire diagram, the dominant colour is used for every shape.
- **Colour 2 (soft):** Colour 1 rotated on the artist's (red, yellow, blue) colour wheel by the scheme, then shown as a tint.

| Scheme | Rotation (clockwise; Rotate flips the sign) |
|---|---|
| Monochromatic | 0° |
| Analogous | 30° |
| Complementary | 180° |
| Split complementary | 150° |
| Triadic | 120° |
| Tetradic (rectangle) | 60° |

| Item | Result |
|---|---|
| Shapes | Outline and text in Colour 1, fill in Colour 2 tint |
| Containers | Outline in Colour 1, very light Colour 2 tint |
| Sticky notes and other existing fills | Changed only if Override = Yes |
| Text boxes, lines | Unchanged |
| Icons | Phosphor duotone weight: line in Colour 1, back layer in Colour 2. draw.io shows the back layer in Colour 1 at 20% |

### 3. Outline to Sketch

Options: **Fill style:** Hachure (default), Transparent (outlines only; removes fills), Solid, Cross-hatch, Zigzag, Dots, Dashed; **Roughness:** Subtle, Normal (default, matched to the reference whiteboard image), Rough; **Override font?** (default Yes, Architects Daughter).

Colours are unchanged. Shapes, lines and icons are drawn by hand. Containers keep a solid fill (hatching a whole container is too busy). Very pale fills are hatched in a slightly deeper shade so the lines show; draw.io hatches in the fill colour as is. Loss: fonts are replaced when Override font = Yes.

### 4. Outline to Neon

Options: **Also switch the canvas to dark navy?** (default Yes when the canvas is light).

| Item | Result |
|---|---|
| Coloured shapes | Neon version of the colour, 2 px glowing outline, 10% wash of the same colour |
| Neon colour | Taken from the shape's OKLCH hue: a vivid light tone (dark canvas) or deep tone (light canvas), then the contrast correction until it meets 3:1 against the canvas. The same hue gives the same Neon colour whichever way you switch |
| Grey shapes | Dominant colour, or cyan if none |
| Containers | Glowing outline, 4% wash |
| Text | Light on a dark canvas, dark on a light one; text does not glow |
| Line labels | Background boxes removed |
| Lines | Bright colour, at least 2 px, glowing |
| Icons | Outline weight, bright colour, glowing |

### 21. Outline to Blueprint

Blueprint is based on the Fine Line Blueprint style guide. The tables below are its definitions as built; the code defines them once, in `src/blueprint.js` (`BP`, `BP_STATES`, `BP_EMPHASIS`, `BP_LINES`). Change both together.

| Token | Value | Use |
|---|---|---|
| Ink | `#12355B` | Outlines, lines, box text, icons |
| Soft ink | `#3D5A7A` | Container outlines and names, line labels |
| Redline | `#B23C0B` | The focus element's text, annotations, questions |
| Fill | `#EAF1F8` | Default box fill |
| Red fill | `#FDF1EA` | Focus box fill |
| Paper | `#FFFFFF` | Page, External boxes, Harvey ball rings, dot matrix sheet |
| Dots | `#CFDBE8` | Dot matrix: 1.2 px dots every 20 px |
| Shadow | Ink at 20%, 2 px right, 3 px down, no blur | Shapes (not containers, lines, text, icons or Retire) |
| Font | Architects Daughter (embedded) | All Blueprint text |
| Sizes | Box label 22 px bold; line and container label 17 px; question and annotation 21 px | With "Apply guide text sizes" |
| Shape | Outline 1.5 px, corner radius 3 px; lines 2.5 px with round caps and joins | |

| State | Ink (outline, text, icon) | Fill | Outline | Icon (Phosphor Regular) |
|---|---|---|---|---|
| Focus | `#B23C0B` text, `#12355B` outline | `#FDF1EA` | 1.5 px | none |
| External | `#12355B` | `#FFFFFF` | 1.5 px dashed | none |
| Note | `#1F5FA8` | `#E6F0FB` | 1.5 px | info |
| Good | `#1E6B45` | `#E3F4EA` | 1.5 px | check-circle |
| Bad | `#A1162B` | `#FBE4E7` | 1.5 px | x-circle |
| Warning | `#8A5300` | `#FFF1D1` | 1.5 px | warning |
| Alert | `#B54708` | `#FEEBDD` | 2.5 px; solid marker | bell-ringing |
| Critical | `#8E1027` | `#FBE4E7` | 4 px double; solid marker | warning-octagon |
| New | `#1E6B45` | `#E3F4EA` | 1.5 px | plus-circle |
| Changed | `#8A5300` | `#FFF1D1` | 1.5 px | pencil-simple |
| Retire | `#5F6B7A` | `#F1F3F5` | 1.5 px dashed, no shadow | archive |
| Comment | `#3A3A3A` text, `#D9C66A` outline | `#FFFDF0` | 1.5 px, 12 px corners; marker disc `#FFF6C2` | chat-circle-text |
| Neutral | `#5F6B7A` | `#F1F3F5` | 1.5 px | minus-circle |

Meaning: Note is worth knowing (no action); Good and Bad judge against a stated target; Warning is a risk to watch; Alert needs action soon; Critical is blocking (the severity ladder is Note, Warning, Alert, Critical); New, Changed and Retire are lifecycle from current to target state; Comment is a reviewer remark to remove before publishing; Neutral is out of scope or undecided. Every semantic state shows its icon as well as its colour, so it survives greyscale printing.


Options: **Apply guide text sizes** (default Yes); **Shadows** (default Yes); **Switch the canvas to white** (shown only when a page is not white; default Yes).

Blueprint has one ink. Existing colour coding is replaced; colour comes back only through states.

| Item | Result |
|---|---|
| Shapes | Fill `#EAF1F8`, outline navy `#12355B` 1.5 px, corner radius 3 px (rectangles; pills such as terminators keep their rounding), Architects Daughter, navy, bold, 22 px with sizes on. Shadow 2 px right, 3 px down, navy at 20%, no blur, with shadows on |
| Containers | No fill, dashed soft-ink outline `#3D5A7A`, label soft ink 17 px top left, no shadow |
| Lines | Navy 2.5 px, round caps and joins, filled triangle head. Straight lines without waypoints become elbows; curved and waypoint routes are kept. Crow's foot ends are kept, and a start arrow stays a (filled) start arrow |
| Line labels | Soft ink, 17 px, no background, moved 8 px clear of the line (above a horizontal line, right of a vertical one) unless you already moved them |
| Text | Architects Daughter, navy; size kept, but never below 17 px with sizes on |
| Icons | Phosphor Regular, navy |
| Harvey balls | Navy outline and wedge, white ring |
| Question, annotation | Keep their redline look (21 px) |
| Dot matrix backgrounds | Unchanged (in every style) |

**States** (Format panel, Blueprint, State; shapes only): None, Focus, External, then Note, Good, Bad, Warning, Alert, Critical, New, Changed, Retire, Comment and Neutral. A state sets the fill, outline, text colour and outline treatment from the guide; every semantic state also puts its Phosphor icon before the label, so it survives greyscale printing. Alert has a 2.5 px outline, Critical a 4 px double outline, Retire and External dashed outlines (Retire has no shadow). Focus is red text on a pale red fill with a navy outline, and carries no icon. None restores the plain Blueprint shape. There is no limit on Focus shapes.

**Markers** (Format panel, Blueprint, Marker): an extra 28 px disc with an 18 px state icon on the shape's top-right corner, for example an Alert marker on the Focus box. Alert and Critical markers are solid with a white icon. Markers move, resize and delete with their shape.

**Line types** (Format panel, Blueprint, Line): Existing (solid), Planned (dashed 8 6), Async (dotted 1 6), Retire (grey, dashed 8 6), Annotation (redline, dashed 6 6), Association (no head). Lengths are pixels at 2.5 px; they are stored divided by 2.5 because draw.io multiplies `dashPattern` by the line width.

**Contrast.** Every state's ink on its fill is at least 4.5:1. Shapes with a Blueprint state are not recoloured by the contrast pass (they are the guide's tested pairs), and count as passing.

## Back to Outline

### 5. Filled to Outline

Options: **Override existing fills?** (default Yes); **Fill style:** None, Auto (default, light tint of the current colour), Pick from list. Icons separately: **Override icon colours?** (default No); **Icon colour:** Keep or Pick from list.

| Item | Result |
|---|---|
| Outline colour | The current fill colour when the fill is strong; otherwise the current outline is kept |
| Text | WCAG check; white text from Filled becomes dark again |
| Icons | Outline weight, same colour (unless overridden) |
| Containers | Keep their light tint |
| Text boxes, lines | Unchanged |

Loss: the exact colours from before Filled do not come back.

### 22. Blueprint to Outline

Removes what only Blueprint adds: states and their icons, markers, double outlines, line types, and the Blueprint shadow (a shadow you set yourself with other settings is kept). Lines go back to 1.5 px with ordinary arrowheads, line labels get their white background back (they stay where they were moved), and the handwriting font is removed. Shape colours then follow permutation 5: a light tint of the navy outline. Loss: font sizes and bold labels stay as Blueprint set them.

## Everything else (6 to 20, 23 to 30)

Blueprint follows the same pattern: switching from another style to Blueprint (23 to 26) first converts to Outline silently, then applies 21; switching from Blueprint to Filled, Duotone, Sketch or Neon (27 to 30) first applies 22, then the target's rules. One warning, one Undo step.

**Pattern:** switching from style X to style Y (Y not Outline) first converts X to Outline with permutation 5's defaults, silently, then applies Y's rules and options. One warning, one Undo step.

| # | Switch | Rule |
|---|---|---|
| 6 | Filled to Duotone | Pattern |
| 7 | Filled to Sketch | Keep current colours, skip the Outline step; filled shapes drawn by hand |
| 8 | Filled to Neon | Pattern |
| 9 | Duotone to Outline | As 5; outline colour comes from the fill only when the fill is strong, so pale Duotone fills keep their strong outline |
| 10 | Duotone to Filled | Pattern |
| 11 | Duotone to Sketch | As 7 |
| 12 | Duotone to Neon | Pattern |
| 13 | Sketch to Outline | Remove the hand-drawn treatment only. Option: **Reset handwriting font?** (default Yes) |
| 14 | Sketch to Filled | Pattern; the Outline step removes Sketch and resets the font |
| 15 | Sketch to Duotone | As 14 |
| 16 | Sketch to Neon | As 14 |
| 17 | Neon to Outline | Remove the glow, reset lines to 1.5 px, restore white line-label backgrounds. Option: **Switch canvas back to white?** (default Yes) |
| 18 | Neon to Filled | Pattern plus 17's canvas option |
| 19 | Neon to Duotone | Pattern plus 17's canvas option |
| 20 | Neon to Sketch | Keep colours, remove the glow; canvas option default **No** (hand-drawn on dark gives the chalkboard look) |

## Shadows, backgrounds, Harvey balls and notes (any style)

- **Drop shadow** (Format panel, any shape): on or off, colour, opacity, size and direction (eight directions). Always a crisp offset copy of the outline, never blurred, drawn on screen and in SVG, PNG and PDF. Blueprint sets navy at 20%, 2 px right and 3 px down.
- **Dot matrix** (palette, Backgrounds): a white sheet with 1.2 px dots in `#CFDBE8` every 20 px. Resizing shows more or fewer dots; the spacing never changes. It is inserted at the back and keeps its look in every style.
- **Harvey balls** (palette, Harvey balls): 0, 25, 50, 75 and 100%, filled clockwise in the outline colour. Saved as a draw.io stencil, so they look the same in draw.io.
- **Notes** (palette, Notes): Callout panel (icon, bold title, text), Question (red text starting with an arrow), Annotation (red note with a dashed red arrow, drag its end onto the subject), Checklist (click a box to tick it; Enter adds an unticked item; the box grows to fit).

## Other behaviour

- **Remembered options:** each style's dialog opens with the options used last time in this session. New shapes, lines and icons are styled with those options.

- **Grid:** dims automatically on a dark canvas, in every style.
- **Changing the canvas:** the Style menu has **Light canvas** and **Dark canvas** (every page, one Undo step); View, Canvas background colour changes one page. Either way, Neon colours are re-tuned for the new background and all text is re-checked (WCAG). Neon works on a light canvas, with a softer glow; it looks best on dark.
- **Gliffy compatible export:** converts styles Gliffy cannot show, never removing shapes. Sketch and Neon go to Outline, Duotone to Filled, using the defaults above. Phosphor icons are embedded as SVG images. Every change is listed after export.
- **Icons in memory:** an icon keeps only its Phosphor name and weight while editing. The draw.io drawing data (stencil) is generated when the file is saved or exported, which keeps the undo history small.
