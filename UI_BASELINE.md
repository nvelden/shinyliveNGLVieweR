# UI Baseline

Stage 1 baseline captured against the original `shinyNGLVieweR` server app on
`http://127.0.0.1:8777`.

## Screenshots

- Desktop 1280x900: `baseline-artifacts/baseline-chromium-desktop.png`
- Tablet 768x1024: `baseline-artifacts/baseline-chromium-tablet.png`
- Mobile 390x844: `baseline-artifacts/baseline-chromium-mobile.png`

## Console Baseline

The original app renders, but emits existing browser console errors:

- `div is not defined`
- ~~Shiny output-state messages for `NGLVieweROutput_ui_1-structure`, including
  unexpected `running` and `idle` transitions during initial render.~~
  **Fixed in Stage 4 follow-up:** the default-load (`readFile("www/7cid.ngl")`)
  was happening *inside* `renderNGLVieweR`, mutating `r$fileInput` while the
  render was reading it. Moved into a separate `observe({...})` so the render
  no longer invalidates itself. Verified by `tests/e2e/console-check.spec.ts`.

Treat these as known baseline issues for Stage 1. Later stages should avoid
introducing new console errors, and the migration should remove these if
practical.

## Known Issues From Plan

- `inst/app/www/styles.css` has no media queries.
- Several layout heights use `vh`, which can fail on mobile browser chrome.
- The viewer height is coupled to `#NGLVieweROutput_ui_1-structure`.
- Some global box styling removes visual separation.
- CSS contains `!important`.
- Mobile viewport needs deeper review during Stage 6 for sidebar ergonomics and
  touch sizing.
