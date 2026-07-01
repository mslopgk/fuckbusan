/**
 * PC 진단(diagnosis) 화면을 데스크톱 뷰포트(1440x900)에서 캡처.
 * cli.mjs의 verify는 모바일(390x844) 기준이라 PC 페이지가 좁게 렌더되므로 별도 스크립트 사용.
 *
 * 사용: node verify/pc_diagnosis_shots.mjs
 */
import { chromium } from 'playwright';

const VIEWS = [
    { id: 'pcDiagnosisMap',    waitFor: '.pc-diag-right-list' },
    { id: 'pcDiagnosisForm',   waitFor: '.pc-diag-right-form' },
    { id: 'pcDiagnosisDetail', waitFor: '.pc-diag-right-detail' },
    { id: 'pcDiagnosisDone',   waitFor: '.pc-diag-right-done' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (err) => errors.push(`PAGE_ERROR ${page.url()}: ${err.message}`));
page.on('console', (msg) => {
    if (msg.type() === 'error') {
        const t = msg.text();
        if (t.includes('Failed to load diagnosis') || t.includes('Failed to fetch')) return;
        errors.push(`CONSOLE ${page.url()}: ${t}`);
    }
});

let pass = 0;
let fail = 0;

for (const v of VIEWS) {
    await page.goto('http://localhost:8501/');
    await page.evaluate((view) => sessionStorage.setItem('current_view', view), v.id);
    await page.reload();
    try {
        await page.waitForSelector(v.waitFor, { timeout: 15000 });
        await page.waitForTimeout(800); // map / chart render
        await page.screenshot({ path: `/Users/Kang/Desktop/fuckbusan/verify/screenshots/${v.id}.png`, fullPage: false });
        console.log(`PASS ${v.id}`);
        pass += 1;
    } catch (e) {
        console.log(`FAIL ${v.id}: ${e.message.split('\n')[0]}`);
        fail += 1;
    }
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (errors.length) {
    console.log('\n--- Page/console errors ---');
    for (const e of errors) console.log(e);
}
process.exit(fail === 0 && errors.length === 0 ? 0 : 1);
