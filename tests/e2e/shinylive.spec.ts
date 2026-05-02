import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, expect, test } from '@playwright/test';

const SHINYLIVE_TIMEOUT = 180_000; // ~3 min — Shinylive cold load on cold cache

async function waitForShinyliveViewer(page: import('@playwright/test').Page) {
  // Shinylive renders the app inside an <iframe>. On slower engines the
  // initial navigation can churn for a while before the iframe is attached,
  // so we wait on attachment rather than visibility.
  const frameLocator = page.locator('iframe').first();
  await expect(frameLocator).toBeAttached({ timeout: SHINYLIVE_TIMEOUT });
  const frame = await frameLocator.elementHandle().then((h) => h?.contentFrame());
  if (!frame) throw new Error('app iframe has no content frame');

  await frame.waitForSelector('canvas', { timeout: SHINYLIVE_TIMEOUT });
  const box = await frame.locator('canvas').first().boundingBox();
  expect(box?.width || 0).toBeGreaterThan(100);
  expect(box?.height || 0).toBeGreaterThan(100);
  return frame;
}

function isBenignShinyliveError(text: string): boolean {
  // Shinylive emits chatty preload status messages while WebR boots; the
  // ones with "Error in"/"failed to load"/"there is no package" are real.
  if (
    text.startsWith('preload error:') &&
    !/Error in|there is no package|Execution halted|failed|cannot open/i.test(text)
  ) {
    return true;
  }
  // The pre-existing aa_clicked / "div is not defined" warning surfaced
  // through Shinylive — kept on the baseline list, not Stage 7's problem.
  if (/div is not defined/.test(text)) return true;
  return false;
}

test.describe('@shinylive static build', () => {
  test('cold + warm desktop load with the bundled 7cid example', async ({ browserName }, testInfo) => {
    test.skip(browserName !== 'chromium', 'Cold-load probe uses chromium.launchPersistentContext');
    test.setTimeout(SHINYLIVE_TIMEOUT * 2);

    const userDataDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'shinyngl-pw-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      viewport: { width: 1280, height: 900 }
    });
    const page = await context.newPage();

    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const text = m.text();
      if (!isBenignShinyliveError(text)) errors.push(text);
    });
    page.on('pageerror', (e) => {
      if (!isBenignShinyliveError(e.message)) errors.push(e.message);
    });
    page.on('response', (r) => {
      const status = r.status();
      if (status >= 400) errors.push(`${status} ${r.url()}`);
    });

    // ---- COLD ----
    const coldStart = Date.now();
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080/', {
      waitUntil: 'domcontentloaded',
      timeout: SHINYLIVE_TIMEOUT
    });
    await waitForShinyliveViewer(page);
    const coldMs = Date.now() - coldStart;

    // Capture transfer total before reload swaps the entries
    const coldTransferMb = await page.evaluate(() => {
      const total = performance
        .getEntriesByType('resource')
        .reduce((s, e) => s + ((e as PerformanceResourceTiming).transferSize || 0), 0);
      return Number((total / 1024 / 1024).toFixed(2));
    });

    // ---- WARM (reload in same persistent context) ----
    const warmStart = Date.now();
    await page.reload({ waitUntil: 'domcontentloaded', timeout: SHINYLIVE_TIMEOUT });
    await waitForShinyliveViewer(page);
    const warmMs = Date.now() - warmStart;

    await testInfo.attach('shinylive-perf.json', {
      body: JSON.stringify({ coldMs, warmMs, coldTransferMb }, null, 2),
      contentType: 'application/json'
    });
    fs.appendFileSync(
      path.join(process.cwd(), 'shinylive-perf.jsonl'),
      `${JSON.stringify({ coldMs, warmMs, coldTransferMb })}\n`
    );

    await page.screenshot({
      path: testInfo.outputPath('shinylive-desktop.png'),
      fullPage: true
    });

    // No real console / page / 4xx errors after the full load
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);

    await context.close();
    await fs.promises.rm(userDataDir, { recursive: true, force: true });
  });

  test('local .pdb upload renders in the viewer', async ({ page }) => {
    test.setTimeout(SHINYLIVE_TIMEOUT);

    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080/', {
      waitUntil: 'domcontentloaded',
      timeout: SHINYLIVE_TIMEOUT
    });
    const frame = await waitForShinyliveViewer(page);

    // Open the load panel (matches "load" exactly to avoid mod_fileOutput's "download")
    await frame.getByText('load', { exact: true }).first().click();

    const fileInput = frame.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve('www/7cid.pdb'));
    await frame.getByRole('button', { name: 'Load' }).nth(1).click();

    await frame.waitForTimeout(3000);
    const box = await frame.locator('canvas').first().boundingBox();
    expect(box, 'canvas after upload').not.toBeNull();
    expect(box!.height).toBeGreaterThan(100);
  });

  test('each bundled example structure renders', async ({ page }) => {
    test.setTimeout(SHINYLIVE_TIMEOUT);

    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080/', {
      waitUntil: 'domcontentloaded',
      timeout: SHINYLIVE_TIMEOUT
    });
    const frame = await waitForShinyliveViewer(page);

    await frame.getByText('examples', { exact: true }).first().click();
    for (const code of ['6xcn', '2pne', '7ahl', '6fp7', '6qzy']) {
      // IDs start with a digit, so query via attribute selector
      await frame.locator(`a[id="${code}"].example_link`).click();
      await frame.waitForTimeout(2000);
      const box = await frame.locator('canvas').first().boundingBox();
      expect(box, `canvas after loading ${code}`).not.toBeNull();
      expect(box!.height).toBeGreaterThan(100);
    }
  });
});

test.describe('@shinylive-smoke static build cross-engine', () => {
  test('default load + viewer ready', async ({ page }, testInfo) => {
    test.setTimeout(SHINYLIVE_TIMEOUT);

    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080/', {
      waitUntil: 'domcontentloaded',
      timeout: SHINYLIVE_TIMEOUT
    });
    const frame = await waitForShinyliveViewer(page);

    await page.screenshot({
      path: testInfo.outputPath(`shinylive-smoke-${testInfo.project.name}.png`),
      fullPage: true
    });

    // sanity: the iframe content has the sidebar / NGLVieweR header text.
    // Use locator('header') to avoid matching the page <title>.
    await expect(frame.locator('header').getByText(/NGLVieweR/i).first()).toBeVisible({ timeout: 60_000 });
  });

  test('one bundled example reloads the viewer', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mobile sidebar ergonomics tracked for Stage 6 (UI_BASELINE.md)');
    test.setTimeout(SHINYLIVE_TIMEOUT);

    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080/', {
      waitUntil: 'domcontentloaded',
      timeout: SHINYLIVE_TIMEOUT
    });
    const frame = await waitForShinyliveViewer(page);

    await frame.getByText('examples', { exact: true }).first().click();
    await frame.locator('a[id="2pne"].example_link').click();
    await frame.waitForTimeout(3000);

    const box = await frame.locator('canvas').first().boundingBox();
    expect(box, 'canvas after example load').not.toBeNull();
    expect(box!.height).toBeGreaterThan(100);
  });

  test('selection modal opens', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mobile sidebar ergonomics tracked for Stage 6 (UI_BASELINE.md)');
    test.setTimeout(SHINYLIVE_TIMEOUT);

    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080/', {
      waitUntil: 'domcontentloaded',
      timeout: SHINYLIVE_TIMEOUT
    });
    const frame = await waitForShinyliveViewer(page);

    // Open structure panel which has a bs_textInput → modal trigger
    await frame.getByText('structure', { exact: true }).first().click();

    // The bs_input_modal renders #select_modal in the iframe
    await expect(frame.locator('#select_modal')).toBeAttached({ timeout: 30_000 });
  });
});

test.describe('@shinylive-mobile responsive', () => {
  test('no horizontal scroll and viewer ≥250px', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 480, 'Mobile-only check');
    test.setTimeout(SHINYLIVE_TIMEOUT);

    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080/', {
      waitUntil: 'domcontentloaded',
      timeout: SHINYLIVE_TIMEOUT
    });
    const frame = await waitForShinyliveViewer(page);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.body.scrollWidth,
      windowWidth: window.innerWidth
    }));
    expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.windowWidth + 1);

    const box = await frame.locator('canvas').first().boundingBox();
    expect(box?.height || 0).toBeGreaterThanOrEqual(250);
  });
});
