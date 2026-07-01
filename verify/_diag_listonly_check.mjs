import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto('http://localhost:8501/');
await page.evaluate(() => sessionStorage.setItem('current_view', 'mDiagnosisList'));
await page.reload();
await page.waitForSelector('.m-diag-list-page');
// click sheet handle to hide map (지도 숨김 모드 = 목록3)
await page.click('.m-diag-sheet-handle');
await page.waitForTimeout(300);
await page.screenshot({ path: '/Users/Kang/Desktop/fuckbusan/verify/screenshots/mDiagnosisList_listonly.png', fullPage: false });
console.log('list-only mode captured');
await browser.close();
