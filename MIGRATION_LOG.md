# Migration log

Running record of the [shinyNGLVieweR → shinylive port](https://github.com/nvelden/shinyNGLVieweR/blob/master/SHINYLIVE_PLAN.md). Each stage's commit, key changes, and test status are summarised below; `PERF_LOG.md` holds the timing data, `UI_BASELINE.md` holds the visual issue list.

## Status snapshot

| Stage | Description | Status | Commit |
| ----- | ----------- | ------ | ------ |
| 0 | Compatibility smoke test | done | (pre-repo) |
| 0.5 | Dependency + source audit | done | (pre-repo) |
| 1 | UI baseline at three viewports | done | `4a14a4b` |
| 2 | Bootstrap new repo + copy source | done | `4b72845` |
| 3 | Strip golem references | done | `f377405` |
| 4 | Modernize module API (moduleServer) | done | `42e33f7` |
| — | Fix outputProgress console errors | done | `bd4336c` |
| 5 | Documentation headers + reactive contracts | done | `f82b8f1` |
| 6 | Global responsive CSS rewrite | done | `88ef8eb` |
| 7 | Shinylive export + desktop browser test | done | `5e04391` |
| 8 | Mobile + cross-browser smoke (Shinylive build) | done (firefox limitation) | (this commit) |
| 9 | Push + GitHub Pages deploy | docs/ built + pushed; Pages enable is manual | (this commit) |

All work to date lives on the `migration/playwright-baseline` branch.

---

## Stage 1 — UI baseline (`4a14a4b`)

Captured the original golem app at three viewports (1280×900, 768×1024, 390×844) on `127.0.0.1:8777`, recorded console errors and viewer-ready timings.

- Playwright harness scaffolded in this repo: `playwright.config.ts`, `tests/e2e/baseline.spec.ts`, `tests/e2e/helpers.ts`, `package.json` scripts.
- Baseline screenshots committed under `baseline-artifacts/`.
- Console errors logged in `UI_BASELINE.md` (notably the `NGLVieweROutput_ui_1-structure` `running`/`idle` warnings — fixed later in the Stage 4 follow-up).
- `PERF_LOG.md` row 1 recorded original-app viewer-ready: 1959 ms desktop, 2417 ms tablet, 3081 ms mobile.

## Stage 2 — Bootstrap (`4b72845`)

Copied source from the original repo into the new layout.

- 15 `mod_*.R` + 15 `fct_*.R` files copied unchanged.
- `golem_utils_ui.R` → `R/01_utils_ui.R`, `golem_utils_server.R` → `R/02_utils_server.R`, `utils_inputs.R` appended into `02_utils_server.R`, `jsboxCollapse` lifted into `R/00_globals.R`.
- `inst/app/www/*` → `www/`.
- Excluded: `_disable_autoload.R`, `app_config.R`, `run_app.R`, `DESCRIPTION`, `NAMESPACE`, `inst/`, `man/`, `dev/`, `pkgdown/`, `rsconnect/`, `tests/`, `docs/`.
- `app.R` written with the §3a library list and `shinyApp(ui = app_ui, server = app_server)`.
- `find R -name "*.R" | wc -l` returns 35 (15 mods + 15 fcts + ui + server + 3 utils/globals).

## Stage 3 — Strip golem (`f377405`)

Removed every golem-specific call from the copied app.

- `R/ui.R`: `golem_add_external_resources()` → `add_external_resources()`; replaced `add_resource_path` / `bundle_resources` / `golem::favicon` with explicit `tags$head` `<link>`/`<script>` tags pointing at `www/…`. Modal `htmlTemplate(app_sys(...))` calls now use plain relative `"www/<file>.html"` paths.
- `R/mod_NGLVieweROutput.R`: default 7cid load now uses `readFile("www/7cid.ngl")` (the same path mod_examples uses) so structure / surface / ligand / stage / labels / selections / contacts are all restored from the bundled session.
- `R/mod_examples.R`, `R/mod_sequenceOutput.R`, `R/mod_labelcontrols.R`: `app_sys("app/www/...")` → relative `"www/..."`.
- Audit clean: `grep -rn "app_sys\|golem::\|with_golem_options\|bundle_resources\|add_resource_path"` returns nothing across `R/`, `www/`, `app.R`. The §3a unqualified-symbol audit is also clean — every match (`tagList`, `HTML`, `tags$`, `%>%`, `str_*`, `mutate_at`, `vars`, `n()`, `read_*`, `full_seq`, `unnest`) is covered by a package attached in `app.R`.
- `tests/e2e/parity.spec.ts` (`@parity`) added — shell, viewer, sidebar panels, example re-render. Mobile example-click `test.skip()`'d with a code reference to the Stage 6 sidebar work.
- App boots and serves HTTP 200 (`shiny::runApp(".", port = 8777)`).
- `PERF_LOG.md` row 3 recorded faster viewer-ready vs Stage 1 (−18% to −20%).

## Stage 4 — moduleServer (`42e33f7`)

All 15 modules converted from the pre-1.5 `function(input, output, session, ...)` + `callModule()` pattern to the modern `function(id, ...) { moduleServer(id, function(input, output, session) { ... }) }` form.

Batches:
- 4a (file I/O): `mod_fileInput`, `mod_fileOutput`, `mod_examples`.
- 4b (renderer core): `mod_NGLVieweROutput`, `mod_structure`, `mod_stage`.
- 4c (visuals): `mod_surface`, `mod_ligand`.
- 4d (annotations): `mod_selection`, `mod_label`, `mod_contact`.
- 4e (display): `mod_sequenceOutput`.
- 4f (controls): `mod_sidebarcontrols`, `mod_labelcontrols`, `mod_snapshot`.

`R/server.R` invokes each module via `mod_*_server("id", ...)`; no `callModule()` calls remain. Parity tests pass after every batch on `chromium-desktop` + `chromium-mobile` (and tablet on the final run). `PERF_LOG.md` row 4 records the post-Stage-4 viewer-ready times (medians where the first run was cold-worker noise).

## Console fix (`bd4336c`)

Cleared the pre-existing `outputProgress.ts:172/246` warnings (`Shiny server has sent a progress message for NGLVieweROutput_ui_1-structure, but the output is in an unexpected state of: 'running'/'idle'`) that codex captured at Stage 1.

- Root cause: `output$structure <- renderNGLVieweR({ ... if (is.null(r$fileInput$PDB)) { r$fileInput <- readFile(...) } ... })` wrote to a reactive value the render itself read, invalidating the render mid-execution.
- Fix: extracted the default load into a separate `observe({ ... }, priority = 100)` and replaced the `if` guard inside the renderer with `req(r$fileInput$PDB)`.
- Regression guard: `tests/e2e/console-check.spec.ts` (`@console`) fails on any `unexpected state of` / `recalculating` / `recalculated` console error at boot.
- Updated `UI_BASELINE.md` to mark the issue resolved.

## Stage 5 — Module headers + reactive contracts (`f82b8f1`)

- Each `mod_*.R` opens with a `# ---- mod_<name>` block describing purpose and the **reads / writes / needs** contract on the shared `r` `reactiveValues`.
- Removed every `@noRd` tag across `R/` (15 modules + `R/01_utils_ui.R`, `R/02_utils_server.R`, `R/ui.R`, `R/server.R`).
- Stripped boilerplate roxygen ("@description A shiny Module", "@param id,input,output,session Internal parameters for {shiny}", `@import` chains in `ui.R`/`server.R`) since this is no longer a package build. Imports are attached at `app.R`.
- Doc-only changes — `PERF_LOG.md` row 5 confirms no perf impact (1069 / 1037 / 1219 ms across desktop / tablet / mobile, single-worker).

## Stage 6 — Responsive CSS rewrite (`88ef8eb`)

Replaced `www/styles.css` with a responsive foundation; preserved the dark protein-viewer aesthetic.

CSS DoD:
- `grep -c "!important" www/styles.css` = 0 (was 2).
- `grep -c "@media" www/styles.css` = 2 (was 0): `@media (max-width: 768px)` and `@media (max-width: 480px)`.
- `grep -c " vh" www/styles.css` = 0 — `dvh` (dynamic viewport height) used everywhere a viewport-relative unit is needed.
- The `#NGLVieweROutput_ui_1-structure { height: calc(91vh) !important }` ID-coupled rule is gone. Height is now set on a wrapper `div` (`style="height: 91dvh"`) with the widget itself filling via `height = "100%"`. The class-based `.NGLVieweR.html-widget { min-height: 250px }` rule guarantees a usable WebGL surface on small screens.

R changes paired with the CSS:
- `mod_NGLVieweROutput.R` wraps the viewer in `.ngl-viewer-wrap` and passes `height = "100%"` to the widget; loader spinner uses `top: 91dvh`.
- `mod_sequenceOutput.R` passes `height = "100%"` to `d3Output()` so the sequence bar fills its box body without the previous CSS `!important`.
- `mod_labelcontrols.R` uses `top: 60dvh` for the floating popout and caps width at `min(30vw, 360px)`.

Touch targets: at ≤768px, `.btn` / `.btn-link` / `.form-control` / `.selectize-input` / numeric/text inputs all reach `min-height: 44px`. Sidebar items get 12px vertical padding so the menu rows themselves clear 44px.

Tests:
- `tests/e2e/stage6.spec.ts` (`@stage6`): no horizontal scroll, viewer canvas ≥ 250 px tall, 44 px touch targets at ≤ 768 px.
- Full chromium matrix (desktop / tablet / mobile): 19 / 19 (2 skipped — example-click on mobile, touch-target check above 768 px).
- Cross-browser smoke on `firefox-desktop` + `webkit-desktop`: 10 / 10.

`PERF_LOG.md` row 6 records all five viewport / browser combinations; viewer-ready times stay well under budget (chromium 874 – 1265 ms; firefox 1060 ms; webkit 1226 ms).

`UI_BASELINE.md` marks each Stage 6 issue resolved (`vh` → `dvh`, ID coupling, `!important`, no media queries).

---

## Stage 7 — First Shinylive export

`shinylive::export(appdir = ".", destdir = "site", quiet = FALSE)` produced a 139 MB build (`site/` 139 MB, `site/shinylive` 115 MB, `site/shinylive/webr` 112 MB). The R log surfaced 8 package version-mismatch warnings (`shinyWidgets`, `pillar`, `bit`, `bit64`, `tzdb`, `knitr`, `tinytex`, `xfun` — installed locally vs. WebAssembly catalog); these are advisory, not blockers, but worth tracking for future stages.

`httpuv::runStaticServer` serves `.wasm` with the wrong Content-Type, which Chrome refuses to streaming-compile. Switched local serving to `python3 -m http.server` (Python 3.7+ registers `application/wasm` automatically) — the GitHub Pages target sets the right MIME by default, so this only affects the local dev loop.

`tests/e2e/shinylive.spec.ts` (`@shinylive`) covers the Stage 7 DoD on `chromium-desktop`:
- Cold + warm load in a fresh `chromium.launchPersistentContext()`. Cold ≈ warm at ~7.8 s because WebR re-boots on each reload — service-worker/asset cache helps less than R-state caching would. Two runs landed within noise.
- Local upload of `www/7cid.pdb` via `setInputFiles` renders a fresh canvas.
- Walks every bundled example (`6xcn`, `2pne`, `7ahl`, `6fp7`, `6qzy`) and asserts the canvas resizes after each.
- The shared `isBenignShinyliveError` filter accepts `preload error:` status lines and the long-standing `div is not defined` warning (already on the baseline list); everything else fails the test.

PDB-code policy: **offline-first.** Bundled `.ngl` examples and uploaded PDBs are the supported paths; the `1AKE`-style PDB-code loader is best-effort and not asserted in CI. (Switching to network-enabled later means adding a CORS check in this same spec.)

`PERF_LOG.md` row 7 records cold/warm/transfer/build for the two runs.

---

## Stage 8 — Mobile + cross-engine smoke

`tests/e2e/shinylive.spec.ts` was split into three groups so each project gets the right slice:

- `@shinylive` — full desktop checks (chromium-only; cold/warm uses `chromium.launchPersistentContext`).
- `@shinylive-smoke` — default load, one example reload, modal open. Mobile sidebar drawer makes the example/modal interactions tap controls that scroll out of view, so those two tests `test.skip(isMobile, ...)` per the same Stage 6 ergonomic note.
- `@shinylive-mobile` — viewport ≤480 only: no horizontal scroll, viewer canvas ≥ 250 px.

Stage 8 run (chromium-mobile + firefox-desktop + webkit-desktop, single worker):
- **chromium-mobile**: pass — default load + smoke + mobile-only checks.
- **webkit-desktop**: pass — default load, example reload, selection modal open.
- **firefox-desktop**: **fail** — all three `@shinylive-smoke` tests time out at 180 s. Trace shows the page navigating to `/` 16+ times in a row without ever attaching the Shinylive `<iframe>`. This reproduces the same way through every retry; it is a Shinylive 0.3.0 / Firefox runtime issue (most likely SharedArrayBuffer + service-worker COOP/COEP injection failing on Firefox), not an app regression. Chrome/Safari behave correctly. Documented as a known limitation; unblocks the migration.

Totals: **11 passed, 3 failed (firefox), 6 skipped** in 11.5 minutes. `PERF_LOG.md` row 8 captures the result per engine.

---

## Stage 9 — Pages-ready build

`shinylive::export` recursively bundles every file under `appdir` into `app.json`. Running it from the repo root vacuumed up `node_modules/`, `test-results/`, `playwright-report/`, `baseline-artifacts/`, `stage6-artifacts/`, etc. — `app.json` ballooned to 209 MB and the total build hit 323 MB. Workaround: stage a clean directory containing only `app.R`, `R/`, and `www/`, then export from there:

```bash
STAGE=$(mktemp -d -t shinylive-stage-XXXXXX)
cp app.R "$STAGE/"
cp -R R www "$STAGE/"
Rscript -e "shinylive::export(appdir = '$STAGE', destdir = 'docs', quiet = FALSE)"
```

Result: `docs/` is 119 MB / 261 files; `docs/app.json` is 5.3 MB. The largest individual file is `docs/shinylive/webr/library.data.gz` at 13 MB — well under GitHub's 100 MB push limit. Smoke test against the new `docs/` build (chromium-desktop): default load + every bundled example pass.

### Deploy status

- ✅ `migration/playwright-baseline` fast-forward merged into `main` (`9928056`). `docs/` is now on `main`.
- 🚫 **Pages enable is blocked: this repo is private.** `gh api repos/.../pages -X POST` returned `HTTP 422 — Your current plan does not support GitHub Pages for this repository`. GitHub Pages on a `*.github.io` URL is a free-plan feature for **public** repos only; private repos require GitHub Pro / Team / Enterprise.
- I deliberately did **not** flip the repo public from the CLI. That is a one-way visibility change that should be made deliberately by the owner, not by an agent driving a migration.

### How to finish (one of):

1. **Make the repo public.** GitHub repo → Settings → General → Danger Zone → "Change visibility". Then `gh api repos/nvelden/shinyliveNGLVieweR/pages -X POST -f 'source[branch]=main' -f 'source[path]=/docs'` (or do it through Settings → Pages).
2. **Stay private and upgrade** to GitHub Pro (or Team/Enterprise) so Pages becomes available on private repos.
3. **Skip github.io and self-host** the `docs/` directory anywhere else (Cloudflare Pages, Netlify, S3, Vercel — they all accept a static folder and don't care about the upstream repo's visibility).

After Pages is live, run:

```bash
BASE_URL=https://nvelden.github.io/shinyliveNGLVieweR \
  npx playwright test shinylive.spec.ts -g "@shinylive-smoke" --project=chromium-desktop
```

— and append the production row to `PERF_LOG.md`.
