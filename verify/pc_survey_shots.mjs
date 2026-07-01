// Capture screenshots of all 6 USER:PC survey pages.
// Uses sessionStorage seed pattern (project quirk — see CLAUDE.md).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../verify/screenshots/pc-survey');
mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'http://localhost:8501';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on('pageerror', (err) => errors.push(`PAGE_ERROR ${page.url()}: ${err}`));
page.on('console', (msg) => {
    if (msg.type() === 'error') {
        const t = msg.text();
        if (t.includes('Failed to load diagnosis') || t.includes('Failed to fetch user pins')) return;
        errors.push(`CONSOLE ${page.url()}: ${t}`);
    }
});

async function visit(viewName, fileName) {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
    await page.evaluate((v) => sessionStorage.setItem('current_view', v), viewName);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const out = resolve(OUT_DIR, `${fileName}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`OK  ${fileName} (${viewName})`);
}

await visit('pcSurveyList',    '01-survey-list');
await visit('pcSurveyDetail',  '02-survey-detail');
await visit('pcSurveyConsent', '03-survey-consent');
await visit('pcSurveyJoin',    '04-survey-join');
await visit('pcSurveyResults', '05-survey-results');
await visit('pcSurveyDone',    '06-survey-done');

await context.close();
await browser.close();

if (errors.length) {
    console.log('\n--- Page/console errors ---');
    for (const e of errors) console.log(e);
    process.exit(1);
} else {
    console.log('\nNo errors.');
}
