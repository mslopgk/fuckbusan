import { chromium } from 'playwright';

const TOKEN = process.env.QA_TOKEN;
const BASE = 'http://localhost:8501/';
const OUT = 'verify/screenshots';

const cases = [
    { view: 'mProposalForm', wait: '.m-prop-form-page', btn: '.m-form-submit', vp: { width: 390, height: 844 } },
    { view: 'mReportForm', wait: '.m-report-form-page', btn: '.m-form-submit', vp: { width: 390, height: 844 } },
    { view: 'pcProposeForm', wait: '.pc-btn-pink', btn: '.pc-btn-pink', vp: { width: 1280, height: 900 } },
    { view: 'pcReportForm', wait: '.pc-btn-pink', btn: '.pc-btn-pink', vp: { width: 1280, height: 900 } },
];

const browser = await chromium.launch();
for (const c of cases) {
    const ctx = await browser.newContext({ viewport: c.vp });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(([t, v]) => {
        localStorage.setItem('access_token', t);
        sessionStorage.setItem('current_view', v);
    }, [TOKEN, c.view]);
    await page.goto(BASE);
    try {
        await page.waitForSelector(c.wait, { timeout: 8000 });
        // click 작성완료 (disabled-style but clickable) on empty form
        await page.locator(c.btn).last().click({ force: true }).catch(() => {});
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${OUT}/validate_${c.view}.png`, fullPage: true });
        console.log(`OK ${c.view}`);
    } catch (e) {
        await page.screenshot({ path: `${OUT}/validate_${c.view}.png`, fullPage: true });
        console.log(`WARN ${c.view}: ${e.message.split('\n')[0]}`);
    }
    await ctx.close();
}
await browser.close();
