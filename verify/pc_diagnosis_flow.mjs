/**
 * PC 진단 통합 셸의 인터랙션 플로우 테스트.
 * 지도 → 카드 클릭 → detail panel → + 진단하기 → form → 작성완료 → done → 지도로 돌아가기 → list
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (err) => errors.push(`PAGE_ERROR: ${err.message}`));
page.on('console', (msg) => {
    if (msg.type() === 'error') {
        const t = msg.text();
        if (t.includes('Failed to fetch')) return;
        errors.push(`CONSOLE: ${t}`);
    }
});

const SHOT_DIR = '/Users/Kang/Desktop/fuckbusan/verify/screenshots/pc-diagnosis-flow';
async function shot(name) {
    const { mkdirSync } = await import('node:fs');
    mkdirSync(SHOT_DIR, { recursive: true });
    await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: false });
}

await page.goto('http://localhost:8501/');
await page.evaluate(() => sessionStorage.setItem('current_view', 'pcDiagnosisMap'));
await page.reload();
await page.waitForSelector('.pc-diag-right-list', { timeout: 15000 });
await page.waitForTimeout(800);
console.log('[1] list panel visible');
await shot('01-list');

// 첫 카드 클릭 → detail panel
await page.locator('.pc-diag-card').first().click();
await page.waitForSelector('.pc-diag-right-detail', { timeout: 5000 });
await page.waitForTimeout(500);
console.log('[2] detail panel after card click');
await shot('02-detail');

// detail 안의 + 진단하기 버튼 클릭 → form panel
await page.locator('.pc-diag-panel-cta').click();
await page.waitForSelector('.pc-diag-right-form', { timeout: 5000 });
await page.waitForTimeout(500);
console.log('[3] form panel after + 진단하기');
await shot('03-form');

// 폼 필드 채우기 (가능한 만큼)
// 사진은 file input — 스킵
// 카테고리는 이미 '주거' 디폴트
// sub chip 첫 번째 클릭
await page.locator('.pc-diagform-sub-chip').first().click();
// 모든 질문 평가 dot 첫 번째 클릭 (각 질문마다)
const questions = await page.locator('.pc-diagform-question').count();
for (let i = 0; i < questions; i++) {
    await page.locator('.pc-diagform-question').nth(i).locator('.pc-diagform-scale-dot').first().click();
}
await page.waitForTimeout(300);
console.log(`[4] filled ${questions} ratings`);

// 작성완료 — 사진 미입력이라 disabled. 그 상태 캡처
await shot('04-form-filled');

// 강제로 done으로 이동시키기 (라우팅 통해)
await page.evaluate(() => sessionStorage.setItem('current_view', 'pcDiagnosisDone'));
await page.reload();
await page.waitForSelector('.pc-diag-right-done', { timeout: 5000 });
await page.waitForTimeout(500);
console.log('[5] done panel');
await shot('05-done');

// done의 "지도로 돌아가기" 클릭 → list panel
await page.locator('.pc-diag-done-close').click();
await page.waitForSelector('.pc-diag-right-list', { timeout: 5000 });
await page.waitForTimeout(500);
console.log('[6] back to list after close');
await shot('06-list-after-close');

await browser.close();

if (errors.length) {
    console.log('\n--- ERRORS ---');
    for (const e of errors) console.log(e);
    process.exit(1);
}
console.log('\nFlow test passed.');
