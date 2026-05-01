# Shinylive Migration Plan

Build a Shinylive version of the app in a **new repo**
([nvelden/shinyliveNGLVieweR](https://github.com/nvelden/shinyliveNGLVieweR)),
leaving the current `golem` package fully intact. The migration is **not** a
mechanical port — UI code is reviewed and optimized as we go, with browser
testing on desktop **and** mobile after every stage.

Source-of-truth code is **copied** from this repo, not moved.

## Progress checklist

- [x] **Stage 0** — Compatibility smoke test completed; temporary `shinylive-test/` artifact removed
- [x] **Stage 0.5** — Dependency + source audit
- [x] **Stage 1** — UI baseline (screenshot original at 3 viewports, document issues)
- [x] **Stage 2** — Bootstrap new repo + copy source
- [x] **Stage 3** — Strip golem references
- [x] **Stage 4** — Modernize module API + per-module UI review (batched)
- [x] **Stage 5** — Documentation headers + reactive contracts
- [x] **Stage 6** — Global CSS rewrite (responsive, dynamic viewport, cross-browser)
- [ ] **Stage 7** — Shinylive export + desktop browser test
- [ ] **Stage 8** — Mobile browser test + cross-browser smoke
- [ ] **Stage 9** — Push to GitHub + deploy via Pages

Each stage has explicit **Definition of Done (DoD)**. Do not advance without
all DoD items green.

---

## Critical review additions

Treat these as blockers, not optional polish:

- The copied app will no longer have `DESCRIPTION` / `NAMESPACE` imports.
  Every unqualified function/operator must be attached in `app.R` or converted
  to `pkg::fun`. Current examples include `%>%`, `mutate_at()`, `vars()`,
  `n()`, `str_split()`, `str_replace()`, `str_count()`, `HTML()`, `tags`, and
  `tagList()`.
- The source inventory is 15 `mod_*.R` files and 15 `fct_*.R` files, so the
  target R file-count DoD is 35, not 33.
- The smoke test proves a minimal `NGLVieweR` app can render in Shinylive, but
  it does not prove the full app dependency set can load under WebR. Add a
  dependency-only export gate before copy/rewrite work.
- Do not mechanically replace every `app_sys("app/www/*.ngl")` with a literal
  path. Bundled `.ngl` sessions should still go through `readFile("www/*.ngl")`
  so saved structure, surface, ligand, stage, labels, selections, and contacts
  are restored.
- PDB-code loading is a separate capability from bundled examples and uploaded
  files. Decide whether the static app is offline-first or network-enabled, and
  test that decision explicitly in Stage 7 and production.
- Initial app loading must be measured from Stage 1 onward. If a later stage
  materially increases load time, stop and investigate before continuing.
- Playwright should be the primary automated harness for UI, console-error,
  screenshot, and load-time checks. Manual browser testing is reserved for
  real Safari behavior, touch gestures, downloads, and WebGL cases where
  headless rendering is inconclusive.
- Since the new repo is public/static, keep provenance clear: README should say
  this is the Shinylive build of the original app, and LICENSE should be present.

---

## Performance budget

Create `PERF_LOG.md` in the new repo during Stage 1 and append to it after
every stage that changes code, CSS, assets, dependencies, or Shinylive export
output.

Track these metrics at desktop `1280x900` and mobile `390x844`:

- `server_side_dom_ready_ms`: regular `shiny::runApp()` time to DOM ready.
- `server_side_load_event_ms`: regular `shiny::runApp()` browser load event.
- `server_side_viewer_ready_ms`: time until the loading indicator is gone and
  the NGL canvas is visible.
- `shinylive_cold_dom_ready_ms`: first uncached Shinylive load DOM ready.
- `shinylive_cold_viewer_ready_ms`: first uncached Shinylive viewer ready.
- `shinylive_warm_viewer_ready_ms`: reload after browser cache/service worker.
- `transfer_mb`: total transferred bytes from the browser Network panel.
- `build_size_mb`: `du -sh site site/shinylive site/shinylive/webr`.

Regression thresholds:

- For regular server-side stages, investigate if `viewer_ready_ms` worsens by
  more than **20% or 2 seconds**, whichever is larger, versus the Stage 1
  baseline.
- For Shinylive stages, investigate if cold `viewer_ready_ms` worsens by more
  than **25% or 5 seconds**, whichever is larger, versus the first full
  Shinylive export baseline.
- Investigate any stage that adds more than **10 MB** to `build_size_mb` or
  `transfer_mb` unless the reason is explicit and accepted.

Likely optimization levers:

- Remove unused package imports before export.
- Avoid loading `DT`, `r2d3`, or `shinyjqui` if a feature no longer uses them.
- Keep bundled structure examples only if they are needed; compress or remove
  redundant `.ngl`/`.pdb` assets.
- Defer non-critical JavaScript/CSS where possible.
- Keep the default example small enough to render quickly; do not make a large
  structure the default without accepting the performance cost.

Do not advance if a regression crosses a threshold and the cause is unknown.

---

## Start preflight

Before Stage 0.5, verify the working assumptions so we do not discover a
basic environment issue halfway through the port:

- Current source repo is clean except for intentional planning files.
- Target repo path exists and is the intended GitHub repo:
  `/Users/nielsvandervelden/Documents/2023 github/shinyliveNGLVieweR/`.
- Record tool versions in the new repo README or `PERF_LOG.md`:
  `R --version`, `Rscript -e 'packageVersion("shiny")'`,
  `Rscript -e 'packageVersion("shinylive")'`, `node --version`,
  `npm --version`, and `npx playwright --version`.
- Confirm whether GitHub Pages will serve from `/docs` on `main`.
- Confirm whether the static app should be **offline-first** or
  **network-enabled** for arbitrary PDB-code loading.

Do not start copying source files until the target path and deployment target
are confirmed.

---

## 1. Target layout (new repo)

Path: `/Users/nielsvandervelden/Documents/2023 github/shinyliveNGLVieweR/`
(already initialized with README, LICENSE, `.gitignore`).

```
shinyliveNGLVieweR/
├── app.R                  # ~15 lines: library() + shinyApp(app_ui, app_server)
├── R/                     # auto-sourced by Shiny since 1.5
│   ├── 00_globals.R       # addResourcePath, jsboxCollapse, shared constants
│   ├── 01_utils_ui.R      # ex-golem_utils_ui.R
│   ├── 02_utils_server.R  # ex-golem_utils_server.R + utils_inputs.R (excl. jsboxCollapse)
│   ├── fct_*.R            # 15 helper files, copied unchanged
│   ├── mod_*.R            # 15 modules
│   ├── ui.R               # defines app_ui
│   └── server.R           # defines app_server
├── www/                   # ex-inst/app/www, css/js reviewed and rewritten
├── tests/
│   └── e2e/               # Playwright UI/performance tests
├── docs/                  # Shinylive build output (Stage 9)
├── playwright.config.ts
├── package.json, package-lock.json
├── README.md, LICENSE, .gitignore   # already in place
```

---

## 2. Known UI issues (initial CSS audit)

Inspecting [inst/app/www/styles.css](inst/app/www/styles.css) (57 lines, **0
media queries**) surfaced these already:

| Issue                                                                                  | Location                          | Fix direction                                                    |
| -------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| `.sidebar { height: 90vh }` — `vh` excludes mobile browser chrome → cut content        | styles.css:3                      | use `dvh` (or `svh` for predictable static height)               |
| `#NGLVieweROutput_ui_1-structure { height: calc(91vh) !important }` — same `vh` issue  | styles.css:46                     | flex/container-based sizing; remove `!important`; remove the `_ui_1` ID coupling |
| Zero `@media` queries — no responsive rules at all                                     | whole file                        | add breakpoints at ≤768px (tablet) and ≤480px (phone)            |
| `.box { margin: 0; border: 0; box-shadow: 0 0 0 }` — kills visual separators           | styles.css:25                     | reconsider; touch targets need clear boundaries on mobile        |
| Hardcoded black backgrounds throughout                                                 | styles.css:30, 41, 50             | scope to a `.theme-dark` class, allow override                   |
| `!important` flags                                                                     | styles.css:46                     | remove; use specificity instead                                  |

Stage 1 below will produce the full list at three viewports — these are just
the obvious smells from reading the CSS. The plan assumes Stage 1 finds more.

---

## 3. Code changes (golem → plain shiny)

| Current (golem)                                               | Replacement                                                          | Files                                                                                                                                                                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `with_golem_options(shinyApp(...))`                           | plain `shinyApp(ui = app_ui, server = app_server)` in `app.R`        | [R/run_app.R:11](R/run_app.R#L11)                                                                                                                                                                             |
| `app_sys("app/www")` for resource path                        | `addResourcePath("www", "www")` in `R/00_globals.R`                  | [R/app_ui.R:75](R/app_ui.R#L75), [R/app_ui.R:84](R/app_ui.R#L84)                                                                                                                                              |
| `app_sys("app/www/<file>")` for **reading** files server-side | plain relative path `"www/<file>"`                                   | [R/mod_examples.R:56](R/mod_examples.R#L56), [R/mod_NGLVieweROutput.R:31](R/mod_NGLVieweROutput.R#L31), [R/mod_labelcontrols.R:103](R/mod_labelcontrols.R#L103), [R/mod_sequenceOutput.R:41](R/mod_sequenceOutput.R#L41) |
| `bundle_resources(path, app_title)`                           | explicit `tags$link` / `tags$script` in `tags$head`                  | [R/app_ui.R:83-86](R/app_ui.R#L83-L86)                                                                                                                                                                        |
| `golem::favicon(ext = 'ico')`                                 | `tags$link(rel = "icon", href = "www/favicon.ico")`                  | [R/app_ui.R:80](R/app_ui.R#L80)                                                                                                                                                                               |
| `htmlTemplate(app_sys("app/www/<file>.html"))`                | `htmlTemplate("www/<file>.html")`                                    | [R/app_ui.R:92-93](R/app_ui.R#L92-L93)                                                                                                                                                                        |
| `pkgload::load_all()`                                         | not needed — Shiny auto-sources `R/`                                 | [app.R:5](app.R#L5)                                                                                                                                                                                           |

For the default structure in `mod_NGLVieweROutput`, prefer this semantic
replacement over a literal path replacement:

```r
if (is.null(r$fileInput$PDB)) {
  r$fileInput <- readFile("www/7cid.ngl")
  r$fileInput$name <- "7cid"
}
```

That keeps default-load behavior aligned with the example-link path in
`mod_examples`.

**Files NOT to copy:** `_disable_autoload.R`, `app_config.R`, `run_app.R`,
`DESCRIPTION`, `NAMESPACE`, `inst/`, `man/`, `dev/`, `pkgdown/`, `rsconnect/`,
`tests/`, `docs/`.

No `system()` / `system2()` / `pipe()` / `processx::*` calls anywhere — verified.

### 3a. Dependency policy for the plain app

Because the new repo is not an R package, it cannot rely on `NAMESPACE`.
Start conservative by attaching the packages that currently supply unqualified
symbols, then tighten later by adding `pkg::fun` qualifiers where useful.

Recommended initial `app.R`:

```r
library(shiny)
library(htmltools)
library(shinydashboard)
library(shinydashboardPlus)
library(NGLVieweR)
library(bsplus)
library(colourpicker)
library(shinyWidgets)
library(shinyjs)
library(r2d3)
library(shinyjqui)
library(readr)
library(dplyr)
library(stringr)
library(tidyr)
library(uuid)
library(DT)

shinyApp(ui = app_ui, server = app_server)
```

Preflight audit command:

```bash
rg --pcre2 -n "(?<!::)\b(str_|read_|full_seq|complete\(|replace_na\(|unnest\(|HTML\(|tags\$|tagList\(|mutate_at\(|vars\(|\bn\(\)|%>%)" R
```

Every match must be covered by an attached package or converted to `pkg::fun`.

---

## 4. Module conventions (applied during copy)

### 4a. Modernize the API

```r
# Before (pre-1.5 pattern, what golem generates)
mod_x_server <- function(input, output, session, ...) { ... }
callModule(mod_x_server, "id", ...)

# After
mod_x_server <- function(id, ...) {
  moduleServer(id, function(input, output, session) {
    # body unchanged
  })
}
mod_x_server("id", ...)
```

### 4b. Documentation header

```r
# ---- mod_structure ---------------------------------------------------------
# Sidebar panel: cartoon / surface / ball+stick controls.
#
# Reactive contract:
#   reads  : r$fileInput, r$rendering
#   writes : r$structure$<param>
#   needs  : globalSession (to send custom messages to the NGLVieweR widget)
```

### 4c. UI review checklist (apply to every module's UI function)

- [ ] No fixed pixel widths that break at <480px.
- [ ] Touch targets ≥40px on interactive controls (buttons, links, sliders).
- [ ] Labels readable at 1× — no `font-size: 11px` for primary text.
- [ ] No nested scrollable regions (mobile browsers handle these badly).
- [ ] No reliance on hover-only states (no hover on touch).
- [ ] Modal/popover content fits within 360×640.
- [ ] Form controls use semantic input types (`type="number"`, `inputmode="numeric"`) where applicable.

### 4d. Naming

- `golem_utils_ui.R` → `01_utils_ui.R`
- `golem_utils_server.R` → `02_utils_server.R`
- `utils_inputs.R` → append into `02_utils_server.R` (move `jsboxCollapse` to `00_globals.R`)

### 4e. Playwright test harness

Use Playwright as the default UI and performance harness. Keep tests small and
purposeful:

- `tests/e2e/baseline.spec.ts`: server-side app screenshots at desktop,
  tablet, and mobile viewports; fail on console/page errors.
- `tests/e2e/parity.spec.ts`: default 7cid load, sidebar panels, bundled
  examples, local upload path where feasible.
- `tests/e2e/performance.spec.ts`: collect navigation timing, viewer-ready
  timing, transfer size, and screenshot evidence; append or emit data for
  `PERF_LOG.md`.
- `tests/e2e/shinylive.spec.ts`: cold/warm Shinylive loads using separate
  browser profiles, service-worker behavior, asset 404 checks, GitHub Pages
  subpath check.

Recommended setup in the new repo:

```bash
npm init -y
npm install -D @playwright/test
npx playwright install chromium firefox webkit
```

Recommended `package.json` scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:update": "playwright test --update-snapshots"
  }
}
```

Playwright should record traces/screenshots/videos on failure. Baseline
screenshots are intentional artifacts; update them only when a UI change is
accepted.

---

## 5. Development stages

### Stage 0.5 — Dependency + source audit

**Goal:** prove that the full dependency set is plausible in Shinylive/WebR
before rewriting the app.

**Tasks:**
1. Create a temporary Shinylive probe app that only loads the full library list
   from §3a and renders a tiny text UI.
2. Export it with `shinylive::export()`.
3. Load it with Playwright using a minimal `@dependency-probe` spec that fails
   on console errors, page errors, failed package loads, and missing probe text.
4. Record any packages that fail to resolve or load under WebR.
5. Confirm asset inventory from the current app:
    ```bash
    find R -maxdepth 1 -name "mod_*.R" | wc -l
    find R -maxdepth 1 -name "fct_*.R" | wc -l
    find inst/app/www -maxdepth 1 -type f | sort
    ```
6. Check static asset sizes before copying:
    ```bash
    find inst/app/www -maxdepth 1 -type f -exec du -h {} \; | sort -h
    ```
7. Decide the PDB-code policy:
   - **Offline-first:** bundled `.ngl` examples and uploaded files are required;
     arbitrary PDB-code loading is best effort or disabled with clear UI.
   - **Network-enabled:** PDB-code loading remains supported, but Stage 7 and
     production must verify remote PDB loading without CORS errors.

**DoD:**
- [ ] The probe app exports and passes the Playwright `@dependency-probe` test
      with all packages required by `app.R`.
- [ ] Any unavailable WebR package has a mitigation plan before Stage 2.
- [ ] Confirmed inventory: 15 modules, 15 helpers, 14 `www/` assets.
- [ ] Large static assets are identified and either accepted, compressed, or removed.
- [ ] PDB-code behavior is explicitly classified as offline-first or network-enabled.

### Stage 1 — UI baseline (capture before changing anything)

**Goal:** screenshot the original app running server-side at three viewports
and document every visual / functional issue. This becomes the spec for what
to preserve and what to fix.

**Tasks:**
1. Run the original app: `Rscript -e 'shinyNGLVieweR::run_app()'` (or `shiny::runApp("app.R")`) on port 8765.
2. Install and configure Playwright in the new repo using §4e.
3. With Playwright, capture three viewports:
    ```bash
    npm run test:e2e -- --grep @baseline
    ```
4. Use Playwright to exercise each viewport — load 7cid, switch a
   representation, open the selection modal, change background, and capture
   screenshots/traces for visibly broken states.
5. Fail the test on `console.error`, `pageerror`, missing canvas, missing
   sidebar controls, or viewer-ready timeout.
6. Write findings to `UI_BASELINE.md` in the new repo:
    - List of viewport-specific issues (mobile sidebar always open, modal overflows, etc.)
    - Cross-browser issues (Safari quirks, Firefox-specific layout)
    - Console errors
    - Per-module UI smells
7. Create `PERF_LOG.md` with Stage 1 server-side desktop/mobile timing
   baselines using the protocol in §6.

**DoD:**
- [ ] Playwright is configured with Chromium, Firefox, WebKit, desktop/tablet/mobile projects, and failure artifacts.
- [ ] `npm run test:e2e -- --grep @baseline` passes or documented baseline issues are recorded with screenshots/traces.
- [ ] `UI_BASELINE.md` exists with screenshots referenced and a numbered issue list.
- [ ] Every issue has a viewport (D/T/M) tag and a suggested fix.
- [ ] `PERF_LOG.md` contains Stage 1 desktop and mobile load metrics.

### Stage 2 — Bootstrap new repo + copy source

**Tasks:**
1. From this repo, copy into the new repo (`$NEW`):
   - `inst/app/www/*` → `$NEW/www/`
   - `R/app_ui.R` → `$NEW/R/ui.R`
   - `R/app_server.R` → `$NEW/R/server.R`
   - `R/fct_*.R`, `R/mod_*.R` → `$NEW/R/` (unchanged)
   - `R/golem_utils_ui.R` → `$NEW/R/01_utils_ui.R`
   - `R/golem_utils_server.R` → `$NEW/R/02_utils_server.R`
   - **append** `R/utils_inputs.R` content into `$NEW/R/02_utils_server.R`
   - **do not copy** `_disable_autoload.R`, `app_config.R`, `run_app.R`
2. Create `$NEW/R/00_globals.R` with `addResourcePath("www", "www")` and the `jsboxCollapse` JS string.
3. Create `$NEW/app.R` with the §3a library list + `shinyApp(ui = app_ui, server = app_server)`.
4. Copy or initialize the Playwright harness from Stage 1 (`package.json`,
   `playwright.config.ts`, `tests/e2e/`).
5. Copy `SHINYLIVE_PLAN.md`, `UI_BASELINE.md`, and `PERF_LOG.md` into the new
   repo so the migration record travels with the static app.
6. Commit a local checkpoint on a migration branch. Do not push to `main` or
   enable Pages from this checkpoint; the app may still contain golem
   references until Stage 3.

**DoD:**
- [ ] `find "$NEW/R" -name "*.R" | wc -l` returns 35 (15 mods + 15 fcts + ui + server + 3 utils/globals).
- [ ] All 14 static assets present in `$NEW/www/`.
- [ ] Playwright files are present in the new repo.
- [ ] `SHINYLIVE_PLAN.md`, `UI_BASELINE.md`, and `PERF_LOG.md` are present in the new repo.
- [ ] `Rscript -e 'shiny::runApp("$NEW", launch.browser = FALSE, port = 8765)'` boots without syntax errors (will error at first `app_sys` call — expected; Stage 3 fixes).
- [ ] Checkpoint commit exists locally on the migration branch.
- [ ] If the app gets far enough to render, append load metrics to `PERF_LOG.md`; otherwise note why timing is deferred to Stage 3.

### Stage 3 — Strip golem references

**Tasks:** apply every find/replace from §3 in `R/ui.R` and the four module
files referencing `app_sys`. Rewrite `golem_add_external_resources()` to
`add_external_resources()`:

```r
add_external_resources <- function() {
  tags$head(
    tags$link(rel = "icon",       href = "www/favicon.ico"),
    tags$link(rel = "stylesheet", href = "www/styles.css"),
    tags$script(src = "www/handlers.js"),
    tags$script(src = "www/sequenceOutput.js"),
    useShinyjs(),
    extendShinyjs(text = jsboxCollapse, functions = c("collapse")),
    bsplus::use_bs_tooltip(),
    bsplus::use_bs_popover(),
    bs_input_modal("select_modal",  "Selection Language", htmlTemplate("www/selectionModal.html"), "medium"),
    bs_input_modal("contact_modal", "Contact Selection",  htmlTemplate("www/contactModal.html"),  "medium")
  )
}
```

**DoD:**
- [ ] `grep -rn "app_sys\|golem::\|with_golem_options\|bundle_resources\|add_resource_path" "$NEW"` returns nothing.
- [ ] Default 7cid load uses `readFile("www/7cid.ngl")`, not a raw `.ngl` path passed directly to `NGLVieweR()`.
- [ ] The §3a audit has no uncovered unqualified symbols.
- [ ] `Rscript -e 'shiny::runApp("$NEW", launch.browser = FALSE, port = 8765)'` boots and serves HTTP 200.
- [ ] `npm run test:e2e -- --grep @parity` passes for Chromium desktop and mobile projects.
- [ ] **Functional parity check** — load 7cid, walk through each sidebar panel, exercise each control, compare output to baseline screenshots from Stage 1. **Behavior must match the original.**
- [ ] `PERF_LOG.md` has Stage 3 server-side desktop/mobile metrics, and any
      regression over the performance budget is explained or fixed.

### Stage 4 — Modernize module API + per-module UI review

Convert `callModule(...)` → `moduleServer(...)` **and** review each module's
UI function against the §4c checklist. Touch every file once. Apply targeted
fixes from the Stage 1 baseline that are scoped to one module.

Batches:

| Batch | Modules                                                              | Likely UI focus                              |
| ----- | -------------------------------------------------------------------- | -------------------------------------------- |
| 4a    | File I/O: `mod_fileInput`, `mod_fileOutput`, `mod_examples`          | upload control on mobile, example link list |
| 4b    | Renderer core: `mod_NGLVieweROutput`, `mod_structure`, `mod_stage`   | viewer height, control panel sizing         |
| 4c    | Visuals: `mod_surface`, `mod_ligand`                                 | sliders / color pickers on mobile            |
| 4d    | Annotations: `mod_selection`, `mod_label`, `mod_contact`             | modals, dynamic UI insertion                 |
| 4e    | Display: `mod_sequenceOutput`                                        | horizontal scroll, narrow widths             |
| 4f    | Controls: `mod_sidebarcontrols`, `mod_labelcontrols`, `mod_snapshot` | sidebar collapse, snapshot trigger           |

After each batch, update the corresponding `callModule()` lines in `R/server.R`.

**DoD per batch:**
- [ ] Modules in this batch use `moduleServer()`.
- [ ] §4c UI checklist applied; baseline issues for these modules addressed or deferred to Stage 6 with a note.
- [ ] Desktop functional parity preserved.
- [ ] Mobile (390×844) screenshot captured and compared to baseline; any regressions logged.
- [ ] No new console warnings.
- [ ] Relevant Playwright parity tests pass for the touched modules.
- [ ] Batch timing appended to `PERF_LOG.md`; regressions over budget are fixed
      before the next batch.

### Stage 5 — Documentation headers + reactive contracts

Add §4b header to each of the 15 `mod_*.R` files. Audit reactive contracts:

```bash
for f in "$NEW/R"/mod_*.R; do
  echo "=== $f ==="
  grep -nE "r\\\$[a-zA-Z]" "$f"
done
```

**DoD:**
- [ ] Every `mod_*.R` opens with a `# ---- mod_<name>` block listing reads/writes/needs.
- [ ] No `@noRd` tags remain.
- [ ] `PERF_LOG.md` confirms documentation-only changes did not alter load time
      beyond noise; any unexpected change is investigated.

### Stage 6 — Global CSS rewrite

**Goal:** replace [styles.css](inst/app/www/styles.css) with a responsive
foundation. Keep the dark-themed protein-viewer aesthetic; fix the layout
underneath.

**Tasks:**
1. Replace `vh` with `dvh` (or `svh` where stable height is desired) in viewer + sidebar heights.
2. Remove the hard-coded `#NGLVieweROutput_ui_1-structure` ID rule; size via flex from the parent layout.
3. Add breakpoints:
    ```css
    @media (max-width: 768px) {
      .main-sidebar { /* drawer behavior, swipe-friendly */ }
      .content-wrapper { padding: 8px 0 0 0; }
      /* viewer takes full width when sidebar collapsed */
    }
    @media (max-width: 480px) {
      /* tighter padding, larger touch targets */
    }
    ```
4. Tighten touch targets — `min-height: 44px` on buttons, links inside menu items, sliders.
5. Drop every `!important` (use specificity).
6. Verify in Playwright Firefox/WebKit projects — flex on `.content-wrapper`
   behaves differently across engines.

**DoD:**
- [ ] `grep -c "@media" www/styles.css` ≥ 2.
- [ ] `grep -c "!important" www/styles.css` returns 0.
- [ ] `grep -c " vh" www/styles.css` returns 0 (only `dvh` / `svh`).
- [ ] **Comparison test** — Playwright screenshots at 1920×1080, 768×1024,
      390×844 against baseline. Each issue from `UI_BASELINE.md` is fixed or
      documented as out-of-scope.
- [ ] Playwright mobile tests confirm no horizontal scroll and viewer height ≥250px.
- [ ] `PERF_LOG.md` has Stage 6 server-side desktop/mobile metrics; CSS changes
      must not delay viewer readiness beyond the performance budget.

### Stage 7 — Shinylive export + desktop browser test

```bash
cd "$NEW"
Rscript -e 'shinylive::export(appdir = ".", destdir = "site", quiet = FALSE)'
Rscript -e 'httpuv::runStaticServer("site", port = 8080, browse = FALSE)' &
```

Run the [Playwright browser test protocol](#6-playwright-browser-test-protocol)
— desktop section.
Allow ~30s on first load.

**DoD:**
- [ ] Playwright Shinylive desktop tests in §6 pass.
- [ ] Comparison vs Stage 6 server-side screenshots: no Shinylive-specific regressions.
- [ ] Playwright reports no console errors, page errors, or failed asset responses after full load.
- [ ] Each bundled example structure renders.
- [ ] File upload of a local `.pdb` renders.
- [ ] If PDB-code loading is network-enabled, loading `1AKE` succeeds without
      CORS errors; if offline-first, the UI behavior is intentional and clear.
- [ ] Build size is recorded:
      `du -sh site site/shinylive site/shinylive/webr 2>/dev/null`.
- [ ] `PERF_LOG.md` has Shinylive cold and warm desktop load metrics.
- [ ] Any cold-load, warm-load, transfer-size, or build-size regression over
      budget is investigated and optimized before mobile testing.

### Stage 8 — Mobile browser test + cross-browser smoke

Same Shinylive build, mobile + Safari + Firefox.

**DoD:**
- [ ] Playwright Shinylive mobile tests in §6 pass.
- [ ] App functional in Safari (iOS UA) — first load, default render, one example, one modal.
- [ ] App functional in Firefox — same checklist.
- [ ] No horizontal scroll at 390×844; structure viewer ≥250px tall and visible.
- [ ] `PERF_LOG.md` has Shinylive cold and warm mobile load metrics.

### Stage 9 — Push to GitHub + deploy via Pages

```bash
cd "$NEW"
Rscript -e 'shinylive::export(appdir = ".", destdir = "docs")'
git add -A
git commit -m "Deploy Shinylive build"
git push
```

GitHub repo → Settings → Pages → Source: `main` branch, `/docs`.

**DoD:**
- [ ] `https://nvelden.github.io/shinyliveNGLVieweR/` loads.
- [ ] Production URL passes Playwright desktop + mobile smoke runs.
- [ ] Playwright response checks show no 404s for `shinylive-sw.js`, `shinylive/`,
      `www/`, modal HTML files, or custom JavaScript/CSS assets under the
      GitHub Pages subpath.
- [ ] Hard refresh after service-worker install still loads the app.
- [ ] Production cold and warm load metrics are recorded in `PERF_LOG.md` and
      compared against local Stage 7/8 Shinylive metrics.
- [ ] Temporary `shinylive-test/` artifact is absent from this repo.

---

## 6. Playwright browser test protocol

Playwright is the default automated harness. Run the app server separately,
then point Playwright at it with `BASE_URL`.

```bash
# server-side app
BASE_URL=http://127.0.0.1:8765 npm run test:e2e

# local Shinylive export
BASE_URL=http://127.0.0.1:8080 npm run test:e2e -- --grep @shinylive

# production Pages URL
BASE_URL=https://nvelden.github.io/shinyliveNGLVieweR npm run test:e2e -- --grep @production
```

### Projects

Configure these Playwright projects:

- `chromium-desktop`: `1280x900`
- `chromium-tablet`: `768x1024`
- `chromium-mobile`: `390x844`, mobile emulation
- `firefox-desktop`: smoke only
- `webkit-desktop`: smoke only, useful Safari proxy

Use Chromium for the full matrix because it is the most stable for automated
WebGL and performance runs. Use Firefox/WebKit for smoke coverage and layout
regression signals.

### Required automated checks

Every main Playwright spec should:

- Fail on `console.error`, unhandled `pageerror`, failed asset responses, and
  unexpected 404s.
- Wait for the app shell, sidebar, default 7cid viewer, sequence output, and
  NGL `<canvas>`.
- Confirm the viewer has non-zero dimensions and is visible.
- Capture screenshots for desktop, tablet, and mobile.
- Record trace/screenshot/video on failure.
- Export timing data that can be copied into `PERF_LOG.md`.

Desktop parity checks:

- [ ] Sidebar shows all 12 menu items with icons.
- [ ] Default structure (7cid) renders in the main viewer with cartoon representation.
- [ ] Sequence output bar visible above the viewer.
- [ ] Each example link in `>examples` panel changes/rerenders the structure.
- [ ] `>load` panel — paste `1AKE`, click Load; expected result depends on the PDB-code policy.
- [ ] `>structure` — toggle each representation.
- [ ] `>surface` — add surface, change opacity slider.
- [ ] `>ligand` — select ligand, change color.
- [ ] `>selection` — open selection modal and add a residue selection.
- [ ] `>label` — add a label.
- [ ] `>contact` — add a contact.
- [ ] `>stage` — change background color.

Mobile checks:

- [ ] No horizontal scroll on the body.
- [ ] Sidebar is collapsible; structure viewer fills the width when sidebar is closed.
- [ ] Structure viewer height is at least 250px and the canvas is visible.
- [ ] Sidebar panel controls are tappable with ≥44px hit targets.
- [ ] Modals (`select_modal`, `contact_modal`) fit within the viewport.
- [ ] Sequence output bar is readable at narrow widths.

### Load-time measurement

Measure load time with Playwright at each stage and append the median of three
runs to `PERF_LOG.md`. Use the same machine, browser, viewport, and default
structure for every run.

Collect these in `performance.spec.ts`:

```ts
const nav = await page.evaluate(() => {
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
  const transferBytes = performance
    .getEntriesByType("resource")
    .reduce((sum, item) => sum + ((item as PerformanceResourceTiming).transferSize || 0), 0);

  return {
    domReadyMs: Math.round(entry.domContentLoadedEventEnd - entry.startTime),
    loadEventMs: Math.round(entry.loadEventEnd - entry.startTime),
    transferBytes
  };
});
```

Also record `viewerReadyMs`: elapsed time from `page.goto()` start until the
loader is hidden and the NGL canvas is visible. Prefer a helper such as
`waitForViewerReady(page)` so every spec uses the same definition.

For Shinylive cold-load measurements, use a fresh persistent context:

```ts
const userDataDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "shinyngl-pw-"));
const context = await chromium.launchPersistentContext(userDataDir, {
  viewport: { width: 1280, height: 900 }
});
```

For warm-load measurements, reload inside the same persistent context after the
service worker and WebR/package cache have been installed.

Suggested `PERF_LOG.md` row format:

```markdown
| Stage | Mode | Browser | Viewport | Run type | DOM ready ms | Load event ms | Viewer ready ms | Transfer MB | Build size | Notes |
| ----- | ---- | ------- | -------- | -------- | ------------ | ------------- | --------------- | ----------- | ---------- | ----- |
```

### Screenshot comparison

Use Playwright screenshots for baseline comparisons. Store accepted baselines
under `tests/e2e/__screenshots__/` or Playwright's default snapshot directory.

```bash
npm run test:e2e -- --grep @baseline
npm run test:e2e:update -- --grep @baseline
```

Update snapshots only when a UI change is intended and documented in
`UI_BASELINE.md` or the stage notes.

### Manual confirmations

Keep manual checks only for behavior that automation cannot prove reliably:

- Real Safari desktop or iOS behavior after WebKit smoke passes.
- Pinch-zoom/touch manipulation of the NGL viewer.
- Snapshot/download file creation.
- WebGL visual correctness if Playwright sees a canvas but screenshots are
  blank or software-rendered incorrectly.

---

## 7. Caveats specific to Shinylive

- **First load ~50–80 MB** (cached after) — expect ~30s wait in browser tests.
- **Track load time from the start.** A slower stage is a bug until measured
  and explained; do not wait until deployment to profile initial load.
- **`fileInput` works** in webR's virtual FS; no code changes needed.
- **Cross-origin fetches are a product decision.** Bundled examples and uploads should work offline after first load; PDB-code loading must either be explicitly network-enabled and tested for CORS, or disabled/marked best-effort.
- **`r2d3` and `shinyjqui` use custom JS bridges** — confirm in the exported build (Stage 7), not just locally.
- **Stage 0.5 only proves dependencies.** Stage 7 is still the first full-app Shinylive export; Stages 2–6 pass with regular `shiny::runApp()` first.
- **Mobile debugging** — use Playwright mobile emulation for repeatable checks;
  keep one real iOS Safari pass before production if touch/WebGL behavior is
  uncertain.
- **Static-host path sensitivity matters.** Treat `www/foo.js` and `www/Foo.js`
  as different files even if local macOS development does not.
- **Downloads and snapshots need real-browser confirmation.** Playwright can
  assert a download event, but final PNG/session download behavior should be
  checked manually once in Chrome or Safari.
