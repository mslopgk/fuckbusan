import { chromium } from 'playwright';
const BASE = 'http://localhost:8501/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(BASE);
await page.evaluate(() => sessionStorage.setItem('current_view', 'mDiagnosisMap'));
await page.goto(BASE);
await page.waitForTimeout(4000); // kakao load + auto-center
const pinCount = await page.locator('.m-diag-pin').count();
const pinText = await page.locator('.m-diag-pin-count').allInnerTexts().catch(() => []);
console.log('m-diag-pin count =', pinCount, 'labels =', JSON.stringify(pinText));
await page.screenshot({ path: 'verify/screenshots/diag_map_live.png', fullPage: false });
await ctx.close();
await browser.close();
