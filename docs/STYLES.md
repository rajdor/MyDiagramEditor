# Diagram styles

Agreed 24 October 2026. This is the reference for how the five diagram styles behave and why.

## Styles

| Style | Look | In draw.io |
|---|---|---|
| Outline | Clean lines, the normal look | Identical |
| Filled | Solid or tinted colour shapes | Identical |
| Duotone | Two harmonising colours: strong outline, soft tinted fill | Identical, except two-colour icons show in one colour |
| Sketch | Hand-drawn whiteboard (Rough.js), handwriting font | Identical (draw.io's own sketch keys) |
| Neon | Glowing lines, best on a dark canvas | No glow; bright outlines only |

A style applies to the whole diagram, every page. New shapes, lines and icons take the current style.

## Principles

1. **No hidden extra state.** A style switch is a one-way recolour, like find and replace. The file stays plain draw.io.
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

## Everything else (6 to 20)

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

## Other behaviour

- **Remembered options:** each style's dialog opens with the options used last time in this session. New shapes, lines and icons are styled with those options.

- **Grid:** dims automatically on a dark canvas, in every style.
- **Changing the canvas:** the Style menu has **Light canvas** and **Dark canvas** (every page, one Undo step); View, Canvas background colour changes one page. Either way, Neon colours are re-tuned for the new background and all text is re-checked (WCAG). Neon works on a light canvas, with a softer glow; it looks best on dark.
- **Gliffy compatible export:** converts styles Gliffy cannot show, never removing shapes. Sketch and Neon go to Outline, Duotone to Filled, using the defaults above. Phosphor icons are embedded as SVG images. Every change is listed after export.
- **Icons in memory:** an icon keeps only its Phosphor name and weight while editing. The draw.io drawing data (stencil) is generated when the file is saved or exported, which keeps the undo history small.
