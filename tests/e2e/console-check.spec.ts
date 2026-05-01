import { test, expect } from '@playwright/test';
import { waitForAppShell, waitForViewerReady } from './helpers';

test('@console no outputProgress errors at boot', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForAppShell(page);
  await waitForViewerReady(page);
  await page.waitForTimeout(2000);

  const outputProgressErrors = errors.filter((e) =>
    /unexpected state of|recalculating|has been recalculated/.test(e)
  );

  await test.info().attach('all-console-errors.json', {
    body: JSON.stringify(errors, null, 2),
    contentType: 'application/json'
  });

  expect(outputProgressErrors, JSON.stringify(outputProgressErrors, null, 2)).toEqual([]);
});
