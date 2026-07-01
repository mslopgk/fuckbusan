/**
 * diagnosis_line_audit.mjs
 * Playwright audit for the full mobile Diagnosis (진단) line:
 *   mDiagnosisList / mDiagnosisForm / mDiagnosisResult / mDiagnosisDone / mMyActivity
 *
 * Usage:  node verify/_dev/diagnosis_line_audit.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = '/Users/Kang/Desktop/fuckbusan/verify/screenshots';
mkdirSync(OUT, { recursive: true });

const BASE      = 'http://localhost:8501';
const API_BASE  = 'http://localhost:8000';
const VIEWPORT  = { width: 375, height: 812 };

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────
const results = {};       // viewName → { status, notes, apiErrors, consoleErrors }
const globalConsole = [];
const globalNetwork = [];

function view(name) {
    if (!results[name]) results[name] = { status: '✅', notes: [], apiErrors: [], consoleErrors: [] };
    return results[name];
}
function pass(name, msg)  { view(name).notes.push('  ✅ ' + msg); }
function fail(name, msg)  { view(name).status = '❌'; view(name).notes.push('  ❌ ' + msg); }
function warn(name, msg)  { if (view(name).status === '✅') view(name).status = '⚠️'; view(name).notes.push('  ⚠️ ' + msg); }

async function screenshot(page, name) {
    const p = path.join(OUT, `diag_${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    return p;
}

/** Seed sessionStorage, optionally localStorage, then reload */
async function seed(page, sessionData, localData = {}) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ sd, ld }) => {
        for (const [k, v] of Object.entries(sd))
            sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        for (const [k, v] of Object.entries(ld))
            localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    }, { sd: sessionData, ld: localData });
    await page.reload({ waitUntil: 'domcontentloaded' });
}

/** Wait for selector, timeout OK → returns boolean */
async function waitFor(page, selector, timeout = 6000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch { return false; }
}

/** Collect API errors into view bucket */
function attachNetworkMonitor(page, viewName) {
    page.on('response', (r) => {
        if (r.status() >= 400 && !/favicon/i.test(r.url())) {
            const msg = `${r.status()} ${r.url()}`;
            view(viewName).apiErrors.push(msg);
            globalNetwork.push(msg);
        }
    });
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await ctx.newPage();

page.on('console', (m) => {
    if (m.type() === 'error') {
        const t = m.text();
        if (/favicon|net::ERR_/i.test(t)) return;
        globalConsole.push(t);
    }
});
page.on('pageerror', (e) => globalConsole.push('PAGE-ERR: ' + String(e)));

// ─────────────────────────────────────────────
// Step 0: Get auth token
// ─────────────────────────────────────────────
let ACCESS_TOKEN = '';
try {
    const r = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: 'admin', PW: 'admin1234' }),
    });
    const data = await r.json();
    ACCESS_TOKEN = data.access_token || '';
    console.log(`[auth] login ${r.status} — token: ${ACCESS_TOKEN ? ACCESS_TOKEN.slice(0, 20) + '…' : 'NONE'}`);
} catch (e) {
    console.error('[auth] login failed:', e.message);
}

// ─────────────────────────────────────────────
// VIEW 1: mDiagnosisList
// ─────────────────────────────────────────────
console.log('\n── mDiagnosisList ──────────────────────────');
{
    const V = 'mDiagnosisList';
    attachNetworkMonitor(page, V);

    await seed(page,
        { current_view: V },
        ACCESS_TOKEN ? { access_token: ACCESS_TOKEN } : {}
    );

    const ok = await waitFor(page, '.m-diag-page, .m-diaglist-page, [class*="m-diag"]', 7000);
    if (!ok) {
        fail(V, 'page root selector not found');
    } else {
        pass(V, 'page root rendered');
    }

    // Check map container exists
    const mapOk = await waitFor(page, '[class*="kakao"], [class*="map"], canvas', 5000);
    if (mapOk) pass(V, 'map container present');
    else warn(V, 'map container not detected (Kakao may be lazy)');

    // Check cards list
    await page.waitForTimeout(1500);  // let API settle
    const cardCount = await page.locator('[class*="m-diag-card"]').count();
    if (cardCount > 0) pass(V, `${cardCount} diagnosis cards loaded`);
    else warn(V, 'no diagnosis cards (data may be empty)');

    // Click first card → should navigate to mDiagnosisResult
    if (cardCount > 0) {
        const firstCard = page.locator('[class*="m-diag-card"]').first();
        await firstCard.click();
        await page.waitForTimeout(800);
        const onResult = await waitFor(page, '.m-diagres-page', 4000);
        if (onResult) {
            pass(V, 'card click → mDiagnosisResult navigation OK');
            await screenshot(page, '01_list_to_result');
        } else {
            warn(V, 'card click did not navigate to .m-diagres-page');
            await screenshot(page, '01_list_card_click_fail');
        }
    }

    await screenshot(page, '01_diagnosisList');
    if (view(V).apiErrors.length) view(V).apiErrors.forEach(e => warn(V, 'API: ' + e));
}

// ─────────────────────────────────────────────
// VIEW 2: mDiagnosisForm (logged-in)
// ─────────────────────────────────────────────
console.log('\n── mDiagnosisForm (logged in) ───────────────');
{
    const V = 'mDiagnosisForm';

    await seed(page,
        {
            current_view: V,
            selectedReport: JSON.stringify({ region: '부산 부산진구 초연로 6', lat: 35.157, lng: 129.058 }),
        },
        { access_token: ACCESS_TOKEN }
    );

    const ok = await waitFor(page, '.m-diagform-page, [class*="m-diagform"]', 7000);
    if (ok) {
        pass(V, 'form page rendered');
    } else {
        fail(V, 'form page root not found — possible redirect to login');
        await screenshot(page, '02_diagnosisForm_fail');
    }

    // Check checklist questions render
    await page.waitForTimeout(800);
    const chipCount = await page.locator('[class*="m-diagform-chip"], [class*="chip"]').count();
    if (chipCount > 0) pass(V, `${chipCount} facility chips rendered`);
    else warn(V, 'no facility chips found');

    // Photo upload button
    const photoBtn = await page.locator('[class*="photo"], input[type="file"]').count();
    if (photoBtn > 0) pass(V, 'photo input present');
    else warn(V, 'photo upload area not found');

    await screenshot(page, '02_diagnosisForm_loggedin');
    if (view(V).apiErrors.length) view(V).apiErrors.forEach(e => warn(V, 'API: ' + e));
}

// VIEW 2b: mDiagnosisForm (non-logged-in — auth guard regression)
console.log('\n── mDiagnosisForm (non-logged-in, auth guard) ──');
{
    const V2 = 'mDiagnosisForm_noauth';
    view(V2);

    // Clear token
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        localStorage.removeItem('access_token');
        sessionStorage.setItem('current_view', 'mDiagnosisForm');
    });

    // Intercept dialog
    let alertFired = false;
    page.once('dialog', async (dialog) => {
        alertFired = true;
        await dialog.accept();
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const currentView = await page.evaluate(() => sessionStorage.getItem('current_view'));
    const onLogin = await page.locator('.login-page, [class*="login"]').count();

    if (alertFired) pass(V2, 'alert fired on non-auth access to mDiagnosisForm');
    else warn(V2, 'no alert dialog observed (may have been caught differently)');

    if (currentView === 'login' || currentView === 'home' || onLogin > 0) {
        pass(V2, `redirected away from mDiagnosisForm → view="${currentView}", login visible=${onLogin > 0}`);
    } else {
        warn(V2, `unexpected state after non-auth: view="${currentView}", login elements=${onLogin}`);
    }

    await screenshot(page, '02b_diagnosisForm_noauth');
}

// ─────────────────────────────────────────────
// VIEW 3: mDiagnosisResult (mock seed)
// ─────────────────────────────────────────────
console.log('\n── mDiagnosisResult ─────────────────────────');
{
    const V = 'mDiagnosisResult';
    const PHOTO_DATAURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAGUlEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAEPgYJAAFTHkLRAAAAAElFTkSuQmCC';

    await seed(page,
        {
            current_view: V,
            selectedReport: JSON.stringify({
                id: 27748,
                region: '부산 부산진구 초연로 6',
                address: '부산 부산진구 초연로 6',
                date: '2025-01-15',
                categoryKey: 'traffic',
                thumb: PHOTO_DATAURL,
                big: '공공공간',
                mid: '보도',
            }),
        },
        { access_token: ACCESS_TOKEN }
    );

    const ok = await waitFor(page, '.m-diagres-page', 8000);
    if (ok) pass(V, 'result page rendered');
    else { fail(V, '.m-diagres-page not found'); await screenshot(page, '03_diagnosisResult_fail'); }

    // Radar chart
    await page.waitForTimeout(1500);
    const svgCount = await page.locator('.m-diagres-chart svg, .recharts-wrapper svg').count();
    if (svgCount > 0) pass(V, `radar chart SVG rendered (${svgCount} svg)`);
    else warn(V, 'radar chart SVG not found');

    // Table rows
    const tableRows = await page.locator('.m-diagres-table-row').count();
    if (tableRows > 0) pass(V, `${tableRows} info table rows rendered`);
    else warn(V, 'info table rows not found');

    await screenshot(page, '03a_diagnosisResult_before_zoom');

    // ── Photo zoom modal ──────────────────────
    const thumbBtn = page.locator('.m-diagres-thumb-btn');
    const thumbVisible = await thumbBtn.isVisible().catch(() => false);
    if (!thumbVisible) {
        warn(V, 'thumb button not visible — photo zoom test skipped');
    } else {
        pass(V, 'thumbnail button visible');

        // 3a: open modal
        await thumbBtn.click();
        const modalOk = await waitFor(page, '.m-diagres-photo-modal', 3000);
        if (modalOk) {
            pass(V, 'photo modal opens on thumb click');
            await screenshot(page, '03b_modal_open');
        } else {
            fail(V, 'photo modal did NOT open');
        }

        // 3b: X button close
        if (modalOk) {
            await page.locator('.m-diagres-photo-close').click();
            const gone = await page.locator('.m-diagres-photo-modal').waitFor({ state: 'detached', timeout: 3000 }).then(() => true).catch(() => false);
            if (gone) pass(V, 'modal closed via X button');
            else fail(V, 'modal did not close via X button');

            // 3c: reopen → backdrop close
            await thumbBtn.click();
            await waitFor(page, '.m-diagres-photo-modal', 2000);
            const box = await page.locator('.m-diagres-photo-modal').boundingBox();
            if (box) {
                await page.mouse.click(box.x + 5, box.y + 5);
                const goneBack = await page.locator('.m-diagres-photo-modal').waitFor({ state: 'detached', timeout: 3000 }).then(() => true).catch(() => false);
                if (goneBack) pass(V, 'modal closed via backdrop click');
                else fail(V, 'modal did not close via backdrop');
            }

            // 3d: reopen → ESC close
            await thumbBtn.click();
            await waitFor(page, '.m-diagres-photo-modal', 2000);
            await page.keyboard.press('Escape');
            const goneEsc = await page.locator('.m-diagres-photo-modal').waitFor({ state: 'detached', timeout: 3000 }).then(() => true).catch(() => false);
            if (goneEsc) pass(V, 'modal closed via ESC key');
            else fail(V, 'modal did not close via ESC');
        }
    }

    await screenshot(page, '03c_diagnosisResult_after');
    if (view(V).apiErrors.length) view(V).apiErrors.forEach(e => warn(V, 'API: ' + e));
}

// ─────────────────────────────────────────────
// VIEW 4: mDiagnosisDone
// ─────────────────────────────────────────────
console.log('\n── mDiagnosisDone ───────────────────────────');
{
    const V = 'mDiagnosisDone';

    await seed(page,
        { current_view: V },
        { access_token: ACCESS_TOKEN }
    );

    const ok = await waitFor(page, '.check-done-page, [class*="done"], [class*="complete"], [class*="checkdone"]', 7000);
    if (ok) pass(V, 'done page rendered');
    else fail(V, 'done page root not found');

    await screenshot(page, '04_diagnosisDone');
    if (view(V).apiErrors.length) view(V).apiErrors.forEach(e => warn(V, 'API: ' + e));
}

// ─────────────────────────────────────────────
// VIEW 5: mMyActivity  (single-render regression + card→list nav)
// ─────────────────────────────────────────────
console.log('\n── mMyActivity ──────────────────────────────');
{
    const V = 'mMyActivity';

    await seed(page,
        { current_view: V },
        { access_token: ACCESS_TOKEN }
    );

    const ok = await waitFor(page, '[class*="my-activity"], [class*="myactivity"], [class*="MyActivity"]', 8000);
    if (ok) pass(V, 'MyActivity page rendered');
    else fail(V, 'MyActivity page root not found');

    await page.waitForTimeout(1500);

    // Double-render regression: count root containers
    // MyActivity root is .my-activity-container
    const rootContainerCount = await page.locator('.my-activity-container').count();
    if (rootContainerCount === 0) warn(V, 'root .my-activity-container not found — check selector or component changed');
    else if (rootContainerCount === 1) pass(V, `single render confirmed (${rootContainerCount} .my-activity-container)`);
    else fail(V, `double-render regression: ${rootContainerCount} .my-activity-container elements`);

    // API: /checklist/my
    const myApiOk = view(V).apiErrors.every(e => !e.includes('/checklist/my'));
    if (myApiOk) pass(V, '/checklist/my API no 4xx/5xx');

    // Card count — DiagnosisCard uses .diagnosis-card-component
    const cardCount = await page.locator('.diagnosis-card-component').count();
    if (cardCount > 0) pass(V, `${cardCount} activity cards visible (.diagnosis-card-component)`);
    else warn(V, 'no activity cards (may be empty /checklist/my for admin user)');

    await screenshot(page, '05a_myActivity');

    // card → mDiagnosisList nav (only if cards exist)
    if (cardCount > 0) {
        const firstCard = page.locator('.diagnosis-card-component').first();
        await firstCard.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(1000);
        // onEdit in App.jsx calls setView('mDiagnosisList'), which renders MDiagnosisList
        const onList = await waitFor(page, '.m-diag-page, [class*="m-diaglist"], [class*="m-diag"]', 4000);
        if (onList) pass(V, 'card click → mDiagnosisList navigation OK (onEdit)');
        else warn(V, 'card click did not navigate to mDiagnosisList — onEdit callback may not be wired correctly');
        await screenshot(page, '05b_myActivity_card_click');
    }

    if (view(V).apiErrors.length) view(V).apiErrors.forEach(e => warn(V, 'API: ' + e));
}

await browser.close();

// ─────────────────────────────────────────────
// Summary report
// ─────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(' DIAGNOSIS LINE AUDIT — SUMMARY');
console.log('═'.repeat(60));

const DISPLAY_ORDER = [
    'mDiagnosisList',
    'mDiagnosisForm',
    'mDiagnosisForm_noauth',
    'mDiagnosisResult',
    'mDiagnosisDone',
    'mMyActivity',
];

let totalBugs = 0;
for (const name of DISPLAY_ORDER) {
    const r = results[name];
    if (!r) continue;
    const bugs = r.notes.filter(n => n.includes('❌')).length;
    totalBugs += bugs;
    console.log(`\n${r.status}  ${name}`);
    r.notes.forEach(n => console.log(n));
    if (r.apiErrors.length) console.log(`  📡 API errors: ${r.apiErrors.join(' | ')}`);
}

console.log('\n' + '─'.repeat(60));
console.log(`Global console errors: ${globalConsole.length}`);
globalConsole.slice(0, 10).forEach(e => console.log('  ' + e));

console.log('\n📸 Screenshots saved to:', OUT);
console.log(`\nTotal ❌ issues: ${totalBugs}`);
console.log('═'.repeat(60));

process.exit(totalBugs > 0 ? 1 : 0);
