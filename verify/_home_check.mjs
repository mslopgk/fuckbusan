import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await c.newPage();
await p.goto('http://localhost:8501', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.screenshot({ path: 'verify/screenshots/home_current.png' });
await b.close();
