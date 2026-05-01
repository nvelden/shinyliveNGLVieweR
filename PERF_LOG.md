# Performance Log

| Stage | Mode | Browser | Viewport | Run type | DOM ready ms | Load event ms | Viewer ready ms | Transfer MB | Build size | Notes |
| ----- | ---- | ------- | -------- | -------- | ------------ | ------------- | --------------- | ----------- | ---------- | ----- |
| 0.5 | Shinylive dependency probe | chromium | local | warm | n/a | n/a | passed | n/a | n/a | Export passed after installing local R package `S7`; Playwright probe passed. |
| 1 | Original server app | chromium | 1280x900 | baseline | 359 | 374 | 1959 | 1.05 | n/a | Default 7cid viewer ready. |
| 1 | Original server app | chromium | 768x1024 | baseline | 556 | 576 | 2417 | 1.05 | n/a | Default 7cid viewer ready. |
| 1 | Original server app | chromium | 390x844 | baseline | 790 | 815 | 3081 | 1.05 | n/a | Default 7cid viewer ready. |
