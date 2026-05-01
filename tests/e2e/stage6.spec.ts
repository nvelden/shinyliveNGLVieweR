import { expect, test } from '@playwright/test';
import { waitForAppShell, waitForViewerReady } from './helpers';

test.describe('@stage6 responsive CSS', () => {
  test('no horizontal scroll on body', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForAppShell(page);
    await waitForViewerReady(page);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.body.clientWidth,
      windowWidth: window.innerWidth
    }));
    expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.windowWidth + 1);
  });

  test('viewer canvas height is at least 250px', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForAppShell(page);
    await waitForViewerReady(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box, 'canvas bounding box exists').not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(250);
  });

  test('touch targets meet 44px on tablet/mobile', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 768, 'Touch-target rule scoped to ≤768px viewports');

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForAppShell(page);

    const examplesItem = page.locator('.sidebar-menu > li > a').first();
    await expect(examplesItem).toBeVisible({ timeout: 30000 });
    const box = await examplesItem.boundingBox();
    expect(box, 'sidebar item bounding box exists').not.toBeNull();
    expect(box!.height, `sidebar item height: ${JSON.stringify(box)}`).toBeGreaterThanOrEqual(44);
  });
});
