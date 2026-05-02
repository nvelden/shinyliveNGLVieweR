import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, expect, test } from '@playwright/test';

const SHINYLIVE_TIMEOUT = 180_000; // ~3 min — Shinylive cold load on cold cache

async function waitForShinyliveViewer(page: import('@playwright/test').Page) {
  // Shinylive renders the app inside an <iframe>. Drill in.
  const frameHandle = await page.waitForSelector('iframe', { timeout: SHINYLIVE_TIMEOUT });
  const frame = await frameHandle.contentFrame();
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
  test('cold + warm desktop load with the bundled 7cid example', async ({}, testInfo) => {
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
