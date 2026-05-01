import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, type TestInfo } from '@playwright/test';

export function attachDiagnostics(page: Page) {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      const isBenignShinyliveStartup =
        text.startsWith('preload error:') &&
        !/Error in|there is no package|Execution halted|failed|cannot open/i.test(text);

      if (!isBenignShinyliveStartup) {
        errors.push(text);
      }
    }
  });

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      errors.push(`${status} ${response.url()}`);
    }
  });

  return errors;
}

export async function waitForAppShell(page: Page) {
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('header, .main-header, .navbar').first()).toBeVisible({ timeout: 60000 });
  await expect(page.locator('header, .main-header, .navbar').getByText(/NGLVieweR/i).first()).toBeVisible({ timeout: 60000 });
  await expect(page.locator('.main-sidebar, aside, nav').first()).toBeVisible({ timeout: 60000 });
}

export async function waitForViewerReady(page: Page) {
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 90000 });
  const box = await page.locator('canvas').first().boundingBox();
  expect(box?.width || 0).toBeGreaterThan(100);
  expect(box?.height || 0).toBeGreaterThan(100);
}

export async function collectPerf(page: Page, viewerStartMs: number, testInfo: TestInfo) {
  const nav = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const transferBytes = performance
      .getEntriesByType('resource')
      .reduce((sum, item) => sum + ((item as PerformanceResourceTiming).transferSize || 0), 0);

    return {
      domReadyMs: Math.round(entry.domContentLoadedEventEnd - entry.startTime),
      loadEventMs: Math.round(entry.loadEventEnd - entry.startTime),
      transferMb: Number((transferBytes / 1024 / 1024).toFixed(2))
    };
  });

  const row = {
    project: testInfo.project.name,
    title: testInfo.title,
    viewerReadyMs: Math.round(Date.now() - viewerStartMs),
    ...nav
  };

  await testInfo.attach('perf.json', {
    body: JSON.stringify(row, null, 2),
    contentType: 'application/json'
  });
  fs.appendFileSync(
    path.join(process.cwd(), 'perf-results.jsonl'),
    `${JSON.stringify(row)}\n`
  );

  return row;
}
