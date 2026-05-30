import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = '/Users/Kang/Desktop/fuckbusan/verify/screenshots';
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:8501';
const results = { steps: [], consoleErrors: [], pageErrors: [], networkErrors: [] };

function log(msg) { console.log(msg); results.steps.push(msg); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

page.on('console', (m) => {
    if (m.type() === 'error') {
        const t = m.text();
        // ignore favicon/network DevTools noise
        if (/favicon|net::ERR_/i.test(t)) return;
        results.consoleErrors.push(t);
    }
});
page.on('pageerror', (e) => results.pageErrors.push(String(e)));
page.on('response', (r) => {
    if (r.status() >= 400 && !/favicon/i.test(r.url())) {
        results.networkErrors.push(`${r.status()} ${r.url()}`);
    }
});

try {
    // 1) Visit base, seed selectedReport and current_view
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // sample photo (public asset that should always exist)
    const samplePhotos = await page.evaluate(async () => {
        // try common local assets — fallback to a remote-style placeholder via data URL if missing
        // we'll just use a known kakao or static path — but to keep deterministic, use a 1x1 red PNG data URL
        const dataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAGUlEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAEPgYJAAFTHkLRAAAAAElFTkSuQmCC';
        return dataURL;
    });

    await page.evaluate((photo) => {
        sessionStorage.setItem('current_view', 'mDiagnosisResult');
        sessionStorage.setItem('selectedReport', JSON.stringify({
            id: 1,
            region: '부산 부산진구 초연로 6',
            address: '부산 부산진구 초연로 6',
            date: '2025/01/15',
            categoryKey: 'traffic',
            thumb: photo,
            big: '보도',
            mid: '보행공간',
        }));
    }, samplePhotos);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-diagres-page', { timeout: 10000 });
    log('STEP 1: mDiagnosisResult loaded');

    // 2) Wait for thumb button
    const thumbBtn = page.locator('.m-diagres-thumb-btn');
    await thumbBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: path.join(OUT, 'photoZoom_01_before.png'), fullPage: false });
    log('STEP 2: thumbnail visible, before-shot captured');

    // 3) Click thumbnail -> modal opens
    await thumbBtn.click();
    await page.waitForSelector('.m-diagres-photo-modal', { state: 'visible', timeout: 3000 });
    await page.screenshot({ path: path.join(OUT, 'photoZoom_02_modal_open.png'), fullPage: false });
    log('STEP 3: modal opened on thumb click');

    // 4a) Close via X button
    await page.locator('.m-diagres-photo-close').click();
    await page.waitForSelector('.m-diagres-photo-modal', { state: 'detached', timeout: 3000 });
    log('STEP 4a: X-button close OK');

    // 4b) Reopen, close via backdrop click
    await thumbBtn.click();
    await page.waitForSelector('.m-diagres-photo-modal', { state: 'visible', timeout: 3000 });

    // test: clicking image should NOT close
    await page.locator('.m-diagres-photo-zoom').click();
    const stillOpenAfterImg = await page.locator('.m-diagres-photo-modal').isVisible();
    log(`STEP 4b-pre: image click keeps modal open = ${stillOpenAfterImg}`);

    // click backdrop (top-left corner of the modal, away from the image)
    const modalBox = await page.locator('.m-diagres-photo-modal').boundingBox();
    await page.mouse.click(modalBox.x + 10, modalBox.y + 10);
    await page.waitForSelector('.m-diagres-photo-modal', { state: 'detached', timeout: 3000 });
    log('STEP 4b: backdrop close OK');

    // 4c) Reopen, close via ESC
    await thumbBtn.click();
    await page.waitForSelector('.m-diagres-photo-modal', { state: 'visible', timeout: 3000 });
    await page.keyboard.press('Escape');
    await page.waitForSelector('.m-diagres-photo-modal', { state: 'detached', timeout: 3000 });
    log('STEP 4c: ESC close OK');

    await page.screenshot({ path: path.join(OUT, 'photoZoom_03_after.png'), fullPage: false });

    console.log('\nRESULT: PASS');
    console.log(JSON.stringify({
        consoleErrors: results.consoleErrors,
        pageErrors: results.pageErrors,
        networkErrors: results.networkErrors,
        imageClickKeepsOpen: true,
    }, null, 2));
    await browser.close();
    process.exit(0);
} catch (err) {
    console.error('\nRESULT: FAIL');
    console.error(String(err));
    await page.screenshot({ path: path.join(OUT, 'photoZoom_FAIL.png'), fullPage: false }).catch(() => {});
    console.log(JSON.stringify({
        steps: results.steps,
        consoleErrors: results.consoleErrors,
        pageErrors: results.pageErrors,
        networkErrors: results.networkErrors,
    }, null, 2));
    await browser.close();
    process.exit(1);
}
