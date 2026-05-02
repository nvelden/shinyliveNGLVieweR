# shinyliveNGLVieweR

Browser-based protein structure viewer powered by [NGLVieweR](https://github.com/nvelden/NGLVieweR) and [Shinylive](https://posit-dev.github.io/r-shinylive/) — runs entirely in the browser via WebAssembly, no R server required.

This is a Shinylive port of [shinyNGLVieweR](https://github.com/nvelden/shinyNGLVieweR), the full-featured Shiny app for loading, editing, and exporting Protein Database (PDB) files. The migration drops the `golem` package scaffolding and replaces it with a plain modular Shiny app structure compatible with WebR.

## Try it

> Live demo at `https://nvelden.github.io/shinyliveNGLVieweR/` will go live once
> GitHub Pages is enabled on this repo. Pages is currently blocked because the
> repo is private — see the [deploy status note in
> MIGRATION_LOG.md](MIGRATION_LOG.md#deploy-status) for options. Until then you
> can run the build locally (see below).

## Status

Migration is feature-complete on `main`. Stages 0 → 9 are committed:
golem stripped, all 15 modules on `moduleServer`, doc headers + reactive
contracts, responsive CSS rewrite, Shinylive build in `docs/`. Cross-engine
smoke passes on Chromium and WebKit; Firefox + Shinylive 0.3.0 has a known
runtime issue documented in [MIGRATION_LOG.md](MIGRATION_LOG.md). The
remaining work is enabling Pages and validating the production URL — see
[MIGRATION_LOG.md](MIGRATION_LOG.md) and [PERF_LOG.md](PERF_LOG.md). The
source spec lives in the original repo as
[SHINYLIVE_PLAN.md](https://github.com/nvelden/shinyNGLVieweR/blob/master/SHINYLIVE_PLAN.md).

## Local development

```bash
# Run the Shiny app locally (no Shinylive build, fastest iteration)
Rscript -e 'shiny::runApp(".")'

# Build the static Shinylive site
Rscript -e 'shinylive::export(appdir = ".", destdir = "site")'
Rscript -e 'httpuv::runStaticServer("site", port = 8080)'

# Build for GitHub Pages deployment
Rscript -e 'shinylive::export(appdir = ".", destdir = "docs")'
```

Required R packages: `shiny`, `shinydashboard`, `shinydashboardPlus`, `NGLVieweR`, `bsplus`, `colourpicker`, `shinyWidgets`, `shinyjs`, `r2d3`, `shinyjqui`, `uuid`, `readr`, `DT`, `shinylive` (for export only).

## Project layout

```
shinyliveNGLVieweR/
├── app.R                  # entry point: library() + shinyApp(app_ui, app_server)
├── R/                     # auto-sourced by Shiny
│   ├── 00_globals.R       # addResourcePath, JS snippets, shared constants
│   ├── 01_utils_ui.R
│   ├── 02_utils_server.R
│   ├── fct_*.R            # business logic helpers
│   ├── mod_*.R            # Shiny modules (one file per module)
│   ├── ui.R               # defines app_ui
│   └── server.R           # defines app_server
├── www/                   # static assets (.ngl/.pdb structure files, JS, CSS)
└── docs/                  # Shinylive build output (deployed to GitHub Pages)
```

## Credits

- [NGLVieweR](https://github.com/nvelden/NGLVieweR) — htmlwidget wrapper around NGL.js
- [NGL.js](http://nglviewer.org/ngl/api/) — the underlying WebGL rendering library
- [Shinylive](https://github.com/posit-dev/r-shinylive) — Posit's WebAssembly Shiny runtime
- Original app: [shinyNGLVieweR](https://github.com/nvelden/shinyNGLVieweR) by Niels van der Velden

## License

MIT
