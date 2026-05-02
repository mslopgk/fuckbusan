// Test clicking 자세히 보기 from policy popup → check if detail renders
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (err) => errors.push(`PAGE_ERROR ${page.url()}: ${err}`));
page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE ${page.url()}: ${msg.text()}`);
});

// Open propose map
await page.goto('http://localhost:8501', { waitUntil: 'networkidle' });
await page.evaluate(() => sessionStorage.setItem('current_view', 'pcProposeMap'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

console.log('Before click — view in sessionStorage:', await page.evaluate(() => sessionStorage.getItem('current_view')));

// Click "자세히 보기"
const cta = page.locator('.pc-map3-policy-cta');
const visible = await cta.isVisible();
console.log('CTA visible:', visible);

if (visible) {
    await cta.click();
    await page.waitForTimeout(1500);
    console.log('After click — view in sessionStorage:', await page.evaluate(() => sessionStorage.getItem('current_view')));
    console.log('After click — pathname:', await page.evaluate(() => window.location.pathname));
    console.log('After click — body innerText (first 200 chars):', (await page.evaluate(() => document.body.innerText)).slice(0, 200));
    await page.screenshot({ path: 'verify/screenshots/_after_detail_click.png', fullPage: true });
}

if (errors.length) {
    console.log('\n--- ERRORS ---');
    for (const e of errors) console.log(e);
}

await browser.close();
