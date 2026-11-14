# TODO: git actions for version 1.0.0 (run on the dev machine)

Last updated 24 October 2026.

## State of this folder

- This folder is the git repo for `git@github.com:rajdor/MyDiagramEditor.git` (branch `main`).
- Its last commit (16 Oct, "Update diagram editor") only tracks `diagram-editor.html`. Everything else is new and uncommitted.
- This is **version 1.0.0**. What is in it: [CHANGELOG.md](CHANGELOG.md). Security model: [docs/SECURITY.md](docs/SECURITY.md). Tests: [test/README.md](test/README.md).
- The old copies `MyDiagramEditor/` and `MyDiagramEditor 2/` are in the Recycle Bin. Their history (6 commits) is archived at `..\_archives\MyDiagramEditor-history-2026-10-16.zip`.

## Steps

1. Check Node.js is 22.12 or later (`node -v`). The test tools (Puppeteer 25) need it; the editor itself needs only a browser.

2. Build and test on Windows (PowerShell, from this folder):

   ```powershell
   npm ci
   npm run build
   git diff --stat diagram-editor.html   # no change expected after the rebuild
   npm test                             # expect 41/41 passed (about 5 minutes)
   ```

   If `npm test` cannot find a browser, set `$env:CHROME_PATH` to your Chrome or Edge executable.

   The baselines in `test/baseline/` were approved on Linux. If a baseline test fails on Windows only, open `test/out/results.txt`, check the difference is a platform detail and not a bug, then run `npm run test:update-baselines` and commit the updated files.

3. Try it: open `diagram-editor.html`, then File, Open, `samples/architecture-demo.drawio`. Try the Style button, the page tabs above the canvas, and File, UI theme.

4. Review what will be committed:

   ```powershell
   git status
   ```

   There should be no `node_modules/` or `test/out/` (both are ignored).

5. Commit, tag and push:

   ```powershell
   git add -A
   git add --renormalize .
   git commit -m "Version 1.0.0: consolidated source, diagram styles, Phosphor icons, UI themes, security hardening, full test suite"
   git tag -a v1.0.0 -m "Version 1.0.0"
   git push
   git push origin v1.0.0
   ```

6. If the push is rejected, the remote has history this repo does not know about. Do not force push. Run `git fetch` and `git log --oneline origin/main` to compare, then decide whether to merge or rebase.

7. When everything is pushed and working, empty the Recycle Bin of the two old folders if you like, and delete this TODO.md.
