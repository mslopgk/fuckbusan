import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

// Capture console errors
const errors = [];
page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
});
page.on('pageerror', (err) => errors.push('PAGE: ' + err.message));

// 1) Navigate to mSurveyList via sessionStorage
await page.addInitScript(() => sessionStorage.setItem('current_view', 'mSurveyList'));
await page.goto('http://localhost:8501/');
await page.waitForSelector('.m-survey-list-page', { timeout: 8000 });
await page.waitForTimeout(800);

// 2) Click 설문결과 tab
await page.click('button.m-stab:has-text("설문결과")');
await page.waitForTimeout(800);

// 3) Take screenshot of result tab
await page.screenshot({ path: '/tmp/m-survey-list-result.png' });

// 4) Click first card (or detect if any cards exist)
const cardCount = await page.locator('.m-survey-card').count();
console.log('Result tab card count:', cardCount);

if (cardCount > 0) {
    await page.click('.m-survey-card');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/m-survey-results-after-click.png' });
    const html = await page.content();
    console.log('HTML body length after click:', html.length);
    const has = await page.locator('.m-survey-results-page').count();
    console.log('.m-survey-results-page count:', has);
} else {
    console.log('No result-tab cards available');
}

console.log('---Errors---');
errors.forEach((e) => console.log(e));

await browser.close();
