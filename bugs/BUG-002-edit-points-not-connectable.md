# BUG-002: Points shown by Edit points cannot be connected to

| | |
|---|---|
| Status | **Complete**: fixed and tested 17 November 2026 (see Fix below) |
| Version | 1.1.0 (`c2d530d`) |
| Found | 17 November 2026, in embed mode inside the document editor; also happens standalone |
| Severity | Medium: Edit points shows points that a line cannot start from or end on, with no message; touching any point makes them work, which looks like the point had to be "activated" |
| Area | Connection points (`src/ui1.js`: `offeredPoints`, `getHandles`, pointer handlers; `src/ui2.js`: `formatPoints`) |

## Summary

For a shape that still has its default connection points, **Edit points** shows the shape's stored points, but hovering offers a different set, worked out from the shape's size on screen. A default 120 by 60 rectangle at 100% stores 12 points and offers 8, so Edit points shows four points that a line cannot use. As soon as any point is added, moved or removed, the shape counts as customised and all its stored points are offered. To the user this looks as if a point must be edited to switch the others on.

While Edit points is on for one shape, no other shape offers its points either, so a line cannot be started anywhere until Done is pressed.

## Steps to reproduce

1. Add a Rectangle (120 by 60) at 100% zoom.
2. Hover over it: 8 connection points show (three on each long side, one on each short side).
3. Select it and press **Edit points**: 12 points show (three on every side).
4. Press **Done** and hover again: the points at one quarter and three quarters of the short sides are not offered. A line cannot be dragged from them, and a line end dragged to them does not attach there.
5. Press **Edit points**, add or move any point, press **Done**: all the stored points are now offered.

## Expected

The points shown by Edit points are the points a line can attach to, before and after any change.

## Actual

Measured with puppeteer against the 1.1.0 build, rectangle 120 by 60 at 100%:

```
new shape:                         stored 12, offered on hover 8, shown by Edit points 12
after adding one point and Done:   stored 13, offered on hover 13
hover over a point while any shape is in Edit points:   no point offered, on any shape
```

## Cause

`offeredPoints` used the stored points only when they differed from the shape's defaults; otherwise it used `densityPoints`, which works the points out from the shape's size on screen. `getHandles` (Edit points) and the add, move and remove code always used the stored points. So the two sets differed for every shape that had not been customised.

`S.hoverPoint` was cleared whenever `S.editPoints` was set, for every shape, and a new line was only started when `S.editPoints` was empty.

## Fix

- `src/ui1.js`: `workingPoints(c)` is the one set both sides use: the stored points once they differ from the defaults, otherwise the size-based points. `offeredPoints` thins that set for crowding as before; `getHandles`, adding, moving and removing a point all work on it. The first change to a shape with default points stores the set that was shown, with the change made.
- Hovering is unchanged for shapes with default points (same points, same counts), so `test/baseline/t25.txt` is unchanged.
- A point too close to its neighbours to be offered at the current zoom is drawn faded with a dashed outline in Edit points, and the panel says how many there are and to zoom in.
- While one shape is in Edit points, other shapes still offer their points. Dragging a line from one of them ends the editing and draws the line. The shape being edited shows its edit handles only.
- `src/ui2.js`, `formatPoints`: the count is of the points shown, and the hint says they are the points a line can attach to.
- Stored default points are unchanged in saved files, and automatic arranging still uses them.
- Test: `test/t45.mjs`. `test/t9.mjs` now drags a point that is offered at its zoom; its baseline is updated.
