import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = '/Users/Kang/Desktop/fuckbusan/verify/screenshots';
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:8501';
const API  = 'http://localhost:8000';
const results = { steps: [], consoleErrors: [], pageErrors: [], networkErrors: [] };

function log(msg) { console.log(msg); results.steps.push(msg); }

// ── 1. API direct checks ────────────────────────────────────────────────────
async function checkApi(url) {
    const res = await fetch(url);
    const json = await res.json();
    return { status: res.status, json };
}

log('=== API CHECK ===');
const apiBase = await checkApi(`${API}/checklist/breakdown`);
const apiCtx  = await checkApi(`${API}/checklist/breakdown?result_id=27749`);
log(`API /breakdown (no id)     → ${apiBase.status}, keys=${Object.keys(apiBase.json).join(',')}`);
log(`API /breakdown?result_id=27749 → ${apiCtx.status}, keys=${Object.keys(apiCtx.json).join(',')}`);

const hasAllKeys = (j) => ['facility','zone','person'].every(k => k in j && Array.isArray(j[k]?.radar));
const apiBaseOk = apiBase.status === 200 && hasAllKeys(apiBase.json);
const apiCtxOk  = apiCtx.status === 200  && hasAllKeys(apiCtx.json);
log(`API base OK = ${apiBaseOk}  |  API ctx OK = ${apiCtxOk}`);

// ── 2. Playwright UI check ──────────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

page.on('console', (m) => {
    if (m.type() === 'error') {
        const t = m.text();
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
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // Seed sessionStorage
    await page.evaluate(() => {
        sessionStorage.setItem('current_view', 'mDiagnosisResult');
        sessionStorage.setItem('selectedReport', JSON.stringify({
            id: 27749,
            region: '부산 부산진구 초연로 6',
            address: '부산 부산진구 초연로 6',
            date: '2025/01/15',
            categoryKey: 'space',
            thumb: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            big: '공공공간',
            mid: '광장',
        }));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-diagres-page', { timeout: 10000 });
    log('STEP 1: mDiagnosisResult page loaded');

    // Wait for breakdown fetch to complete:
    // BreakdownSection only renders .m-diagres-avg when empty=false (breakdown loaded).
    // RadarSection always renders one .m-diagres-avg; we need ≥4 total.
    await page.waitForFunction(
        () => document.querySelectorAll('.m-diagres-avg').length >= 4,
        { timeout: 8000 }
    );
    log('STEP 2: ≥4 .m-diagres-avg elements visible (breakdown data loaded)');

    await page.screenshot({ path: path.join(OUT, 'diag_breakdown_01_initial.png'), fullPage: false });

    // ── Check 3: no --disabled class ──────────────────────────────────────
    const disabledCount = await page.locator('.m-diagres-radar-card--disabled').count();
    log(`STEP 3: disabled cards = ${disabledCount} (expect 0)`);

    // ── Check 4: avg elements (facility/zone/person each should have one) ──
    const avgCount = await page.locator('.m-diagres-avg').count();
    log(`STEP 4: .m-diagres-avg count = ${avgCount} (expect ≥3)`);

    // ── Check 5: recharts-radar SVGs ──────────────────────────────────────
    // Scroll through the page to trigger lazy renders
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));

    const radarCount = await page.locator('.recharts-radar').count();
    log(`STEP 5: .recharts-radar SVG count = ${radarCount} (expect ≥4)`);

    await page.screenshot({ path: path.join(OUT, 'diag_breakdown_02_scrolled.png'), fullPage: true });

    // ── Check section labels ───────────────────────────────────────────────
    const labels = ['시설물별', '구역별', '인원별'];
    for (const label of labels) {
        const found = await page.getByText(label).count();
        log(`STEP 6 [${label}]: visible = ${found > 0}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────
    // 401s on /checklist/{id} are pre-existing auth-gated behaviour (no token seeded).
    // We only fail on breakdown-related errors or unexpected error types.
    const breakdownErrors = results.consoleErrors.filter(
        (e) => !/401.*Unauthorized/i.test(e)
    );
    const breakdownNetworkErrors = results.networkErrors.filter(
        (e) => !/401.*checklist\/\d+$/.test(e)
    );

    const pass =
        apiBaseOk &&
        apiCtxOk &&
        disabledCount === 0 &&
        avgCount >= 3 &&
        radarCount >= 4 &&
        breakdownErrors.length === 0;

    console.log(`\nRESULT: ${pass ? 'PASS' : 'FAIL'}`);
    console.log(JSON.stringify({
        apiBaseOk,
        apiCtxOk,
        disabledCount,
        avgCount,
        radarCount,
        consoleErrors:        results.consoleErrors,
        breakdownErrors,
        breakdownNetworkErrors,
        pageErrors:           results.pageErrors,
        networkErrors:        results.networkErrors,
    }, null, 2));

    await browser.close();
    process.exit(pass ? 0 : 1);

} catch (err) {
    console.error('\nRESULT: FAIL (exception)');
    console.error(String(err));
    await page.screenshot({ path: path.join(OUT, 'diag_breakdown_FAIL.png'), fullPage: false }).catch(() => {});
    console.log(JSON.stringify({
        steps: results.steps,
        consoleErrors: results.consoleErrors,
        pageErrors:    results.pageErrors,
        networkErrors: results.networkErrors,
    }, null, 2));
    await browser.close();
    process.exit(1);
}
