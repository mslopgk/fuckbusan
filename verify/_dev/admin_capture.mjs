import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

// admin login via UI
await page.goto('http://localhost:8501/admin');
await page.waitForSelector('input', { timeout: 10000 });
const inputs = await page.$$('input');
await inputs[0].fill('admin');
await inputs[1].fill('admin1234');
await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {}),
    page.click('button[type="submit"]'),
]);
await page.waitForTimeout(1500);

// Capture adminMain
await page.screenshot({ path: '/tmp/admin-main-current.png', fullPage: false });
console.log('1. adminMain captured');

// Navigate to survey editor by clicking the 설문 sidebar menu, then 설문목록 child
// Easier: programmatically push state via sessionStorage + reload? But that resets to login.
// Best: use the AdminLayout sidebar links. Look for survey link.
// Actually easiest: navigate via URL pushState through the React state machine — click on admin-card 설문
const surveyCard = await page.locator('.admin-card:has-text("설문")').first();
if (await surveyCard.count()) {
    await surveyCard.click();
    await page.waitForTimeout(1000);
    // Now on surveyManagement. We need to click "+ 설문 작성" or similar
    // Or just programmatically setView via sessionStorage + reload won't work
    // Try to find survey editor button
    const createBtn = page.locator('button:has-text("설문 작성"), button:has-text("+ 설문")').first();
    if (await createBtn.count()) {
        await createBtn.click();
        await page.waitForTimeout(1000);
    }
}

await page.screenshot({ path: '/tmp/admin-survey-editor-current.png', fullPage: true });
console.log('2. surveyEditor captured');

await browser.close();
