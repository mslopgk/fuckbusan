import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const c = await b.newContext({ viewport: { width: 1920, height: 1100 } });
const p = await c.newPage();
await p.goto('http://localhost:8501', { waitUntil: 'networkidle' });
await p.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
await p.goto('http://localhost:8501/admin', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.locator('input[type="text"]').first().fill('admin');
await p.locator('input[type="password"]').first().fill('admin1234');
await p.click('button[type="submit"]');
await p.waitForTimeout(1500);
// expand 설문관리 in sidebar
await p.locator('.menu-item-new:has-text("설문관리")').first().click({ timeout: 5000 }).catch(() => {});
await p.waitForTimeout(400);
await p.locator('.submenu-item-new:has-text("설문목록")').first().click({ timeout: 5000 }).catch(() => {});
await p.waitForTimeout(800);
// click first 결과 button
await p.locator('button:has-text("결과")').first().click({ timeout: 5000 }).catch(() => {});
await p.waitForTimeout(1000);
await p.screenshot({ path: 'verify/screenshots/admin_results_current.png', fullPage: true });
await b.close();
console.log('done');
