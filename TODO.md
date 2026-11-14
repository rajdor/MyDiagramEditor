# TODO

Last updated 14 November 2026.

## Current status

- This folder is the git repo for `git@github.com:rajdor/MyDiagramEditor.git` (branch `main`).
- Three local commits are **not pushed yet**:
  - `ad73750` Version 1.0.0 (tag `v1.0.0`): consolidated source, diagram styles, Phosphor icons, UI themes, security hardening, full test suite
  - `228c810` Version 1.1.0 (tag `v1.1.0`): Blueprint style, drop shadows, new shapes (callout panel, question, annotation, checklist, Harvey balls, dot matrix), embed mode
  - Fix BUG-001 (on top of 1.1.0, not tagged): Text, Size while editing changes the selected words; test t44; CHANGELOG "Unreleased". Bug reports live in [bugs/](bugs/); BUG-001 is complete.
- What is in each version: [CHANGELOG.md](CHANGELOG.md). Style rules: [docs/STYLES.md](docs/STYLES.md). Embed protocol: [docs/EMBED.md](docs/EMBED.md). Security model: [docs/SECURITY.md](docs/SECURITY.md). Tests: [test/README.md](test/README.md).
- Tests: 44/44 pass on macOS (14 November 2026, with the BUG-001 fix). The baselines in `test/baseline/` were first approved on Linux; t7, t15 and t20 were updated on macOS for 1.1.0 (new Gliffy step, version string, ten new palette shapes).
- On this Mac, npm's cache folder (`~/.npm`) is owned by root, so `npm ci` fails there. Either fix it once with `sudo chown -R 501:20 ~/.npm`, or run `npm ci --cache /tmp/npm-cache`.

## Actions

1. **Decide on a release for the BUG-001 fix**: ship it as 1.1.1 (bump `APP_VERSION` in `src/core.js` and `package.json`, date the CHANGELOG "Unreleased" section, rebuild, tag `v1.1.1`) or let it wait for the next release.

2. **Push** (when ready):

   ```
   git push
   git push origin v1.0.0 v1.1.0
   ```

   If the push is rejected, the remote has history this repo does not know about. Do not force push. Run `git fetch` and `git log --oneline origin/main` to compare, then decide whether to merge or rebase.

3. **Check on Windows** (PowerShell, from this folder): `npm ci`, `npm run build`, `git diff --stat diagram-editor.html` (expect no change), `npm test` (expect 44/44). If a baseline test fails on Windows only, check `test/out/results.txt` shows a platform detail and not a bug, then `npm run test:update-baselines` and commit.

4. **Check in draw.io by hand** (not covered by the automated tests): load the test diagram (File, Load test diagram), save it, open the file in draw.io and look at the Test (Blueprint) page. Expected: colours, outline widths and dashes as in the editor; Harvey balls drawn from their stencils; no shadows, double outlines, icons before labels, markers or dots (these are editor-only, see docs/STYLES.md, Editor-only keys).

5. **Check embed mode in the real host** (the document editor): open the editor in an iframe overlay, send `de:init`, press Done and place the returned SVG inline next to a second diagram; confirm both render, text is searchable, and Architects Daughter comes from the host. Also try the editor bundled as `<iframe srcdoc>`.

6. **Gliffy register** (Help, Gliffy compatibility register): import the Gliffy compatible export of the test diagram into Gliffy and record whether the Harvey ball images and the Blueprint colours survive.

## Known gaps (decide whether to fix)

- Callout panel with a Blueprint state: the body text takes the state colour; the style guide has it navy.
- Switching away from Blueprint keeps the 22 px bold labels it set (documented as a loss in docs/STYLES.md, permutation 22).
- New editor-only keys need agreement first: see the reminder in docs/STYLES.md, Editor-only keys.
