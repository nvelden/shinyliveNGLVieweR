import { expect, test } from '@playwright/test';
import { attachDiagnostics, collectPerf, waitForAppShell, waitForViewerReady } from './helpers';

test.describe('@baseline original app', () => {
  test('loads default app shell and viewer', async ({ page }, testInfo) => {
    const errors = attachDiagnostics(page);
    const startMs = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForAppShell(page);
    await waitForViewerReady(page);

    await page.screenshot({
      path: testInfo.outputPath(`baseline-${testInfo.project.name}.png`),
      fullPage: true
    });
    await collectPerf(page, startMs, testInfo);
    await testInfo.attach('console-errors.json', {
      body: JSON.stringify(errors, null, 2),
      contentType: 'application/json'
    });
  });

  test('basic sidebar interactions remain available', async ({ page }) => {
    const errors = attachDiagnostics(page);

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForAppShell(page);

    for (const label of ['load', 'examples', 'structure', 'surface', 'ligand', 'selection', 'label', 'contact', 'stage']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 30000 });
    }

    await test.info().attach('console-errors.json', {
      body: JSON.stringify(errors, null, 2),
      contentType: 'application/json'
    });
  });
});
