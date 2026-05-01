import { expect, test } from '@playwright/test';
import { attachDiagnostics, collectPerf, waitForAppShell, waitForViewerReady } from './helpers';

test.describe('@parity new app', () => {
  test('loads default app shell and viewer', async ({ page }, testInfo) => {
    const errors = attachDiagnostics(page);
    const startMs = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForAppShell(page);
    await waitForViewerReady(page);

    await page.screenshot({
      path: testInfo.outputPath(`parity-${testInfo.project.name}.png`),
      fullPage: true
    });
    await collectPerf(page, startMs, testInfo);
    await testInfo.attach('console-errors.json', {
      body: JSON.stringify(errors, null, 2),
      contentType: 'application/json'
    });
  });

  test('sidebar panels remain available', async ({ page }) => {
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

  test('selecting an example re-renders the viewer', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mobile sidebar ergonomics tracked for Stage 6 (UI_BASELINE.md).');
    const errors = attachDiagnostics(page);

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForAppShell(page);
    await waitForViewerReady(page);

    await page.getByText('examples', { exact: true }).first().click();
    const exampleLink = page.locator('a[id^="example_link-"], [id*="example_link"]').first();
    if (await exampleLink.count()) {
      await exampleLink.first().click({ trial: false });
      await page.waitForTimeout(2000);
      const box = await page.locator('canvas').first().boundingBox();
      expect(box?.width || 0).toBeGreaterThan(100);
      expect(box?.height || 0).toBeGreaterThan(100);
    }

    await test.info().attach('console-errors.json', {
      body: JSON.stringify(errors, null, 2),
      contentType: 'application/json'
    });
  });
});
