# BUG-001: Text size does not change selected text while editing

| | |
|---|---|
| Status | **Complete**: fixed and tested 14 November 2026 (see Fix below) |
| Version | 1.1.0 (`228c810`) |
| Found | 14 November 2026, in embed mode inside the document editor; also happens standalone |
| Severity | Medium: the Size control does nothing while a label is being edited, with no error or message |
| Area | Format panel, Text section, Size (`src/ui2.js`, `formatText`, line 893) |

## Summary

While editing a label, selecting some of its text and changing **Size** in the Text section leaves the text unchanged. Clicking the Size box moves focus and the text selection into the number input, so when the new size is applied there is no selection in the label to apply it to.

## Steps to reproduce

1. Add a shape with the label `Hello world`, font size 12.
2. Double-click the shape to edit its label.
3. Select the word `world`.
4. In the format panel, Text section, click the **Size** box, type `24` and press Enter (or use the arrows).

## Expected

`world` becomes 24 px; `Hello` stays 12 px. The label stays in editing with the selection kept.

## Actual

Nothing changes. The label is still `Hello world` at 12 px, and the selection is gone.

Measured with puppeteer against the 1.1.0 build:

```
selection before clicking Size:   "world"
after clicking Size:              selection "" , focus on INPUT
after typing 24 and Enter:        label html "Hello world", cell fontSize "12", still editing
```

## Cause

The Size control is an `<input type="number">` (`mkNum`). Clicking or typing in it takes focus and the document selection away from the contenteditable label. Its handler then runs `document.execCommand('fontSize', 7)`, which acts on the current selection; that selection is now inside the number input, not the label, so the command changes nothing and no `font[size="7"]` element is created for the handler to rewrite.

The other Text controls do not have this problem:

- B, I, U, lists and Clear are `mkBtn` buttons with `onmousedown = preventDefault`, so the label keeps focus.
- The Font list and the colour picker are not text fields, so they leave the selection in place. Tested: choosing Georgia with `world` selected gives `Hello <span style="font-family: Georgia;">world</span>`.

## Suggested fix

Keep the label's last selection while editing, and put it back before running the command:

1. In `startEdit`, record the selection whenever it changes inside the label, for example on `selectionchange` while `S.editing` is set: if the selection is inside `S.editing.ed`, store a clone of its range on `S.editing.range`.
2. In the Size handler (and, for safety, in `exec` used by the Text section), before `execCommand`: focus `S.editing.ed` and restore `S.editing.range`.
3. After applying the size, keep the label in editing and the range selected, so the user can change the size again.

If nothing in the label was selected, two reasonable behaviours; pick one and document it:

- apply the size to the whole label (select all, then apply), or
- set the cell's `fontSize` style, as the Size control already does when not editing.

## Test to add

A test along the lines of the reproduction above: edit a label, select one word, set Size to 24 through the real input (click, type, Enter), then check that only that word has `font-size: 24px`, the rest is unchanged, the label is still being edited and the selection is kept. Also run the same steps in embed mode (`test/embed-host.html`).

## Fix

- `src/ui1.js`: a `selectionchange` listener stores the label's last range on `S.editing.range` while editing; `restoreEditSel(wholeIfEmpty)` focuses the label and puts that range back.
- `src/ui2.js`, `formatText`: `exec` calls `restoreEditSel` before every `execCommand`, so Size, Font, colour, Bold and the rest all act on the label's selection. Size passes `wholeIfEmpty`.
- Nothing selected (only a caret): Size applies to the whole label, as inline formatting; the cell's `fontSize` stays as it was. When not editing, Size sets the cell's `fontSize` as before.
- After a change the label stays in editing with the selection shown, so Size can be changed again.
- Test: `test/t44.mjs`, standalone and in embed mode. It fails 12 checks on the 1.1.0 code and passes with the fix; full suite 44/44.
