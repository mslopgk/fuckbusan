import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('verify/screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto('http://localhost:8501/', { waitUntil: 'networkidle', timeout: 20000 });
await page.evaluate(() => { sessionStorage.setItem('current_view', 'pcProposeForm'); });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Take base screenshot
await page.screenshot({ path: 'verify/screenshots/pc_propose_form.png', fullPage: false });

// Click 위치정보 button to open modal
await page.locator('button.pc-form-clickable').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(2000);

await page.screenshot({ path: 'verify/screenshots/pc_propose_map_modal.png', fullPage: false });
console.log('Screenshots saved');

await context.close();
await browser.close();
