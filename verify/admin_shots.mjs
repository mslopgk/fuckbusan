// Capture desktop screenshots of every admin view by actually logging in and clicking through.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../verify/screenshots/admin');
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
        // Filter out known irrelevant errors from home view
        if (t.includes('Failed to load diagnosis') || t.includes('Failed to fetch user pins')) return;
        // Filter pre-login 401s on /admin (auth-check before user logs in)
        if (t.includes('status of 401') && page.url().includes('/admin')) return;
        errors.push(`CONSOLE ${page.url()}: ${t}`);
    }
});

async function shot(name) {
    await page.waitForTimeout(700);
    const out = resolve(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`OK  ${name}`);
}

// 1. Login screen
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 20000 });
await shot('01-login');

// 2. Submit login -> AdminMain
await page.fill('input[type="text"]', 'admin');
await page.fill('input[type="password"]', 'admin1234');
await page.click('button[type="submit"]');
await page.waitForTimeout(1200);
await shot('02-main');

// 3. Click 회원관리 card -> citizen list (DashboardNew)
await page.locator('text=회원관리').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(800);
await shot('03-citizen');

// Helper: click a sidebar submenu by exact text
async function clickSubmenu(text) {
    // Submenu items use class submenu-item-new
    await page.locator(`.submenu-item-new:has-text("${text}")`).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(700);
}

// Helper: click a sidebar top-level menu by text (to expand)
async function expandMenu(text) {
    await page.locator(`.menu-item-new:has-text("${text}")`).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
}

// 4. 회원 관리 > 전문가
await clickSubmenu('전문가');
await shot('04-expert');

// 5. 회원 관리 > 관리자
await clickSubmenu('관리자');
await shot('05-admin-list');

// 6. 제안/제보 관리 > 제보
await expandMenu('제안/제보 관리');
await clickSubmenu('제보');
await shot('06-reports');

// 7. 제안/제보 관리 > 제안
await clickSubmenu('제안');
await shot('07-proposals');

// 8. 설문관리 > 설문목록
await expandMenu('설문관리');
await clickSubmenu('설문목록');
await shot('08-survey');

// 9. Click into a report's "상세" → ReportDetail
await expandMenu('제안/제보 관리');
await clickSubmenu('제보');
await page.locator('text=상세').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(800);
await shot('09-report-detail');

// 10. Click into a citizen's "수정" → MemberEdit (now with 회원아이디/승인상태)
await expandMenu('회원 관리');
await clickSubmenu('시민');
await page.locator('text=수정').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(800);
await shot('10-member-edit');

// 11. Proposal detail
await expandMenu('제안/제보 관리');
await clickSubmenu('제안');
// no rows in DB → directly navigate via card click would not work; use direct view set
// (proposal table is empty in the seeded DB so we just snapshot the empty list)
await shot('11-proposal-detail-empty');

// 12. Survey editor (편집 탭)
await expandMenu('설문관리');
await clickSubmenu('설문목록');
await page.locator('text=+ 설문 생성').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(800);
await shot('12-survey-editor-edit');

// 13. Survey editor (설정 탭)
await page.locator('.survey-tab:has-text("설정")').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(500);
await shot('13-survey-editor-settings');

// 14. Survey created — fill title then click 저장 (we're already in survey editor 설정 tab; switch to 편집 first)
await page.locator('.survey-tab:has-text("편집")').first().click({ timeout: 3000 }).catch(() => {});
await page.waitForTimeout(300);
await page.fill('.se-field-input', '학생의 학교 외 생활활동 조사').catch(() => {});
await page.waitForTimeout(200);
// Settings tab has the 저장 button (.se-save-btn)
await page.locator('.survey-tab:has-text("설정")').first().click({ timeout: 3000 }).catch(() => {});
await page.waitForTimeout(300);
await page.locator('.se-save-btn').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(900);
await shot('14-survey-created');

// 15. Click 목록으로 → SurveyManagement (now non-empty), click 결과 on first row → SurveyResults
await page.locator('text=목록으로').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(800);
await page.locator('button:has-text("결과")').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(900);
await shot('15-survey-results');

await context.close();
await browser.close();

if (errors.length) {
    console.log('\n--- Page/console errors ---');
    for (const e of errors) console.log(e);
} else {
    console.log('\nNo errors.');
}
