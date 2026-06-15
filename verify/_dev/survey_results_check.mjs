import { chromium } from 'playwright';
const BASE = 'http://localhost:8501/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(BASE);
await page.evaluate(() => {
    sessionStorage.setItem('current_view', 'mSurveyResults');
    sessionStorage.setItem('selectedSurvey', JSON.stringify({ id: 4, title: '야간 보행환경 안전도 조사' }));
});
await page.goto(BASE);
await page.waitForTimeout(2000);
// scroll through whole page so every IntersectionObserver fires (charts animate in)
const total = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y <= total; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(250);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.screenshot({ path: 'verify/screenshots/survey_results_live.png', fullPage: true });
console.log('captured');
await ctx.close();
await browser.close();
