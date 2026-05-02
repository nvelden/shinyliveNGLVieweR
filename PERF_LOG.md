# Performance Log

| Stage | Mode | Browser | Viewport | Run type | DOM ready ms | Load event ms | Viewer ready ms | Transfer MB | Build size | Notes |
| ----- | ---- | ------- | -------- | -------- | ------------ | ------------- | --------------- | ----------- | ---------- | ----- |
| 0.5 | Shinylive dependency probe | chromium | local | warm | n/a | n/a | passed | n/a | n/a | Export passed after installing local R package `S7`; Playwright probe passed. |
| 1 | Original server app | chromium | 1280x900 | baseline | 359 | 374 | 1959 | 1.05 | n/a | Default 7cid viewer ready. |
| 1 | Original server app | chromium | 768x1024 | baseline | 556 | 576 | 2417 | 1.05 | n/a | Default 7cid viewer ready. |
| 1 | Original server app | chromium | 390x844 | baseline | 790 | 815 | 3081 | 1.05 | n/a | Default 7cid viewer ready. |
| 3 | New app, golem stripped | chromium | 1280x900 | parity | 238 | 250 | 1595 | 1.05 | n/a | Default 7cid viewer ready; -19% vs Stage 1. |
| 3 | New app, golem stripped | chromium | 768x1024 | parity | 546 | 565 | 1930 | 1.05 | n/a | Default 7cid viewer ready; -20% vs Stage 1. |
| 3 | New app, golem stripped | chromium | 390x844 | parity | 386 | 404 | 2522 | 1.05 | n/a | Default 7cid viewer ready; -18% vs Stage 1. |
| 4 | All 15 modules on moduleServer | chromium | 1280x900 | parity | 288 | 304 | 1812 | 1.05 | n/a | Single-run; within budget vs Stage 3. |
| 4 | All 15 modules on moduleServer | chromium | 768x1024 | parity | 393 | 407 | 1340 | 1.05 | n/a | Median of 3 runs (3026/1098/1340); first run had cold-worker noise. |
| 4 | All 15 modules on moduleServer | chromium | 390x844 | parity | 374 | 391 | 1469 | 1.05 | n/a | Median of 3 runs (3217/1469/1368); first run had cold-worker noise. |
| 5 | Module headers + reactive contracts | chromium | 1280x900 | parity | 252 | 264 | 1069 | 1.05 | n/a | Single-worker run; doc-only changes, no behaviour change. |
| 5 | Module headers + reactive contracts | chromium | 768x1024 | parity | 251 | 268 | 1037 | 1.05 | n/a | Single-worker run. |
| 5 | Module headers + reactive contracts | chromium | 390x844 | parity | 253 | 269 | 1219 | 1.05 | n/a | Single-worker run. |
| 6 | Responsive CSS rewrite | chromium | 1280x900 | parity | 229 | 275 | 1265 | 1.05 | n/a | dvh-based heights; no !important; 2 media queries; 44px touch targets. |
| 6 | Responsive CSS rewrite | chromium | 768x1024 | parity | 238 | 255 | 874 | 1.05 | n/a | Tablet breakpoint engaged; touch-target check passes. |
| 6 | Responsive CSS rewrite | chromium | 390x844 | parity | 230 | 248 | 1126 | 1.05 | n/a | Mobile; viewer canvas ≥250px; no horizontal scroll. |
| 6 | Responsive CSS rewrite | firefox | 1280x900 | parity | 397 | 524 | 1060 | 1.05 | n/a | Cross-browser smoke. |
| 6 | Responsive CSS rewrite | webkit | 1280x900 | parity | 0 | 396 | 1226 | 1.05 | n/a | WebKit reports domContentLoadedEventEnd before startTime in this build → domReadyMs reads 0; loadEvent is the trustworthy figure. |
| 7 | First Shinylive export | chromium | 1280x900 | shinylive cold | n/a | n/a | 7927 | 23.76 | 139M / 115M / 112M | First run in fresh persistent context; build = site / site/shinylive / site/shinylive/webr. |
| 7 | First Shinylive export | chromium | 1280x900 | shinylive warm | n/a | n/a | 7880 | 23.76 | 139M / 115M / 112M | Same persistent context after reload; warm ≈ cold because WebR re-boots on every reload (DOM cache helps less than expected here). |
| 7 | First Shinylive export | chromium | 1280x900 | shinylive cold | n/a | n/a | 7721 | 23.76 | 139M / 115M / 112M | Second run for noise check; same magnitude. |
| 7 | First Shinylive export | chromium | 1280x900 | shinylive warm | n/a | n/a | 7637 | 23.76 | 139M / 115M / 112M | Second run reload; same magnitude. |
| 8 | Mobile + cross-engine smoke | chromium | 390x844 | shinylive default | n/a | n/a | <60s | 23.76 | 139M | @shinylive-smoke + @shinylive-mobile pass: default load, no horizontal scroll, viewer ≥250 px, one example reloads. |
| 8 | Mobile + cross-engine smoke | webkit | 1280x900 | shinylive default | n/a | n/a | <60s | 23.76 | 139M | All three @shinylive-smoke tests pass on Safari proxy. |
| 8 | Mobile + cross-engine smoke | firefox | 1280x900 | shinylive default | n/a | n/a | timeout | n/a | 139M | All 3 @shinylive-smoke tests fail. The Shinylive iframe never attaches (page navigates to "/" repeatedly). Documented as a Shinylive 0.3.0 / Firefox runtime limitation, not an app regression — chromium and webkit work. |
