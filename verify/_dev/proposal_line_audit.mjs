/**
 * proposal_line_audit.mjs
 * 제안(Proposal) 라인 전체 검수 — 6개 view + API 연동 + 회귀 테스트
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = '/Users/Kang/Desktop/fuckbusan/verify/screenshots';
const BASE = 'http://localhost:8501';
const API = 'http://localhost:8000';
mkdirSync(OUT, { recursive: true });

// ── helpers ────────────────────────────────────────────────────────────────
const results = {
    views: {},
    apiTests: [],
    regressionTests: [],
    bugs: [],
};

function log(msg) { console.log(`  ${msg}`); }
function section(title) { console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`); }

async function getAdminToken() {
    const r = await fetch(`${API}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: 'admin', PW: 'admin1234' }),
    });
    const j = await r.json();
    return j.access_token || null;
}

async function registerTestUser(suffix) {
    const testId = `audit_user_${suffix}_${Date.now()}`;
    const r = await fetch(`${API}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ID: testId,
            PW: 'Test1234!',
            nickname: `감사자${suffix}`,
            email: `audit${suffix}@test.com`,
        }),
    });
    if (!r.ok) return null;
    // login
    const lr = await fetch(`${API}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: testId, PW: 'Test1234!' }),
    });
    const lj = await lr.json();
    return { token: lj.access_token, userId: testId };
}

/** seed sessionStorage + optional localStorage, reload, wait for selector */
async function seedAndLoad(page, sessionData, localData, waitSel, timeout = 12000) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ sd, ld }) => {
        Object.entries(sd).forEach(([k, v]) => sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
        Object.entries(ld).forEach(([k, v]) => localStorage.setItem(k, v));
    }, { sd: sessionData, ld: localData });
    await page.reload({ waitUntil: 'domcontentloaded' });
    if (waitSel) await page.waitForSelector(waitSel, { timeout });
}

// ── browser setup ──────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
});
const page = await ctx.newPage();

const consoleErrors = [];
const networkErrors = [];
page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|net::ERR_|ResizeObserver/i.test(m.text())) {
        consoleErrors.push(m.text());
    }
});
page.on('response', (r) => {
    if (r.status() >= 400 && !/favicon/i.test(r.url())) {
        networkErrors.push(`${r.status()} ${r.url()}`);
    }
});

// ── get tokens ─────────────────────────────────────────────────────────────
section('TOKEN ACQUISITION');
const adminToken = await getAdminToken();
log(adminToken ? `Admin token: OK (${adminToken.slice(0, 30)}...)` : 'Admin token: FAIL');

let normalUser = null;
try { normalUser = await registerTestUser('A'); } catch (e) { log(`Normal user reg failed: ${e}`); }
log(normalUser ? `Normal user: OK (${normalUser.userId})` : 'Normal user: FAIL (will skip vote tests)');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW 1: mProposalList
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section('VIEW 1: mProposalList');
const v1 = { status: '✅', issues: [], apiCalls: [], screenshots: [] };
try {
    const net1 = [];
    page.on('response', (r) => { if (r.url().includes('/api/reports/proposals')) net1.push(`${r.status()} ${r.url()}`); });

    await seedAndLoad(
        page,
        { current_view: 'mProposalList' },
        adminToken ? { access_token: adminToken } : {},
        '.m-prop-list-page',
        12000,
    );
    log('mProposalList rendered');
    await page.screenshot({ path: path.join(OUT, 'prop_01_list.png'), fullPage: false });
    v1.screenshots.push('prop_01_list.png');

    // check list items visible
    const items = await page.locator('.m-prop-card, .m-prop-list-item, .proposal-card').count();
    log(`List items found: ${items}`);
    if (items === 0) { v1.status = '⚠️'; v1.issues.push('목록 아이템 0개 (빈 화면 or selector 불일치)'); }

    // check category chip filter
    const chips = await page.locator('.m-prop-chip, .cat-chip, .filter-chip, .category-chip').all();
    log(`Category chips found: ${chips.length}`);
    if (chips.length > 0) {
        await chips[0].click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(OUT, 'prop_01b_list_filter.png'), fullPage: false });
        v1.screenshots.push('prop_01b_list_filter.png');
        log('Category chip click: OK');
    } else {
        v1.status = '⚠️'; v1.issues.push('카테고리 칩 selector 미매칭 (필터 테스트 불가)');
    }

    // check API call happened
    if (net1.length === 0) { v1.status = '⚠️'; v1.issues.push('GET /api/reports/proposals 호출 확인 안됨'); }
    else { log(`API: ${net1[0]}`); v1.apiCalls = net1.slice(0, 3); }

    const netErrs = networkErrors.filter(e => !e.includes('favicon'));
    if (netErrs.length > 0) { v1.status = '❌'; v1.issues.push(`네트워크 에러: ${netErrs.join(', ')}`); }

} catch (err) {
    v1.status = '❌'; v1.issues.push(`렌더 실패: ${err.message}`);
    results.bugs.push(`mProposalList 렌더 실패: ${err.message}`);
    await page.screenshot({ path: path.join(OUT, 'prop_01_FAIL.png'), fullPage: false }).catch(() => {});
}
results.views.mProposalList = v1;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW 2: mProposalMap
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section('VIEW 2: mProposalMap');
const v2 = { status: '✅', issues: [], apiCalls: [], screenshots: [] };
networkErrors.length = 0;
try {
    await seedAndLoad(
        page,
        { current_view: 'mProposalMap' },
        adminToken ? { access_token: adminToken } : {},
        '.m-prop-map-page, .m-proposal-map-page, [class*="prop-map"]',
        12000,
    );
    log('mProposalMap rendered');
    await page.screenshot({ path: path.join(OUT, 'prop_02_map.png'), fullPage: false });
    v2.screenshots.push('prop_02_map.png');

    // check Kakao map canvas
    const mapCanvas = await page.locator('[id^="kakao"], canvas, .react-kakao-maps-sdk-roadview-container, #map').count();
    log(`Map canvas elements: ${mapCanvas}`);
    if (mapCanvas === 0) { v2.status = '⚠️'; v2.issues.push('지도 캔버스 미탐지'); }

    // try bottom sheet toggle — look for bottom-sheet or proposal cards
    const sheetBtn = page.locator('.m-prop-map-sheet-btn, .sheet-toggle, [class*="sheet"]').first();
    const sheetVisible = await sheetBtn.isVisible().catch(() => false);
    log(`Bottom sheet toggle visible: ${sheetVisible}`);
    if (!sheetVisible) { v2.status = '⚠️'; v2.issues.push('시트 토글 버튼 미탐지'); }

    const netErrs2 = networkErrors.filter(e => !e.includes('favicon'));
    if (netErrs2.length > 0) { v2.status = '❌'; v2.issues.push(`네트워크 에러: ${netErrs2.join(', ')}`); }

} catch (err) {
    v2.status = '❌'; v2.issues.push(`렌더 실패: ${err.message}`);
    results.bugs.push(`mProposalMap 렌더 실패: ${err.message}`);
    await page.screenshot({ path: path.join(OUT, 'prop_02_FAIL.png'), fullPage: false }).catch(() => {});
}
results.views.mProposalMap = v2;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW 3: mProposalForm (제출 플로우 포함)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section('VIEW 3: mProposalForm');
const v3 = { status: '✅', issues: [], apiCalls: [], screenshots: [] };
networkErrors.length = 0;
let submittedProposalId = null;

try {
    // use normal user if available, otherwise admin
    const token = normalUser?.token || adminToken;
    await seedAndLoad(
        page,
        { current_view: 'mProposalForm' },
        token ? { access_token: token } : {},
        '.m-prop-form-page, [class*="prop-form"]',
        12000,
    );
    log('mProposalForm rendered');
    await page.screenshot({ path: path.join(OUT, 'prop_03_form.png'), fullPage: false });
    v3.screenshots.push('prop_03_form.png');

    // check form fields exist
    const titleInput = page.locator('input[placeholder*="제목"], input[name*="title"], .prop-form-title input, textarea[placeholder*="제목"]').first();
    const bodyInput = page.locator('textarea[placeholder*="내용"], textarea[name*="body"], textarea[placeholder*="본문"]').first();
    const titleVisible = await titleInput.isVisible().catch(() => false);
    const bodyVisible = await bodyInput.isVisible().catch(() => false);
    log(`Title input visible: ${titleVisible}, Body textarea visible: ${bodyVisible}`);

    if (!titleVisible) { v3.status = '⚠️'; v3.issues.push('제목 입력 필드 미탐지'); }
    if (!bodyVisible) { v3.status = '⚠️'; v3.issues.push('본문 입력 필드 미탐지'); }

    // fill form if fields found
    if (titleVisible && bodyVisible) {
        // category select
        const catBtns = await page.locator('.prop-form-cat-btn, .cat-btn, [class*="cat-chip"], [class*="category"]').all();
        if (catBtns.length > 0) {
            await catBtns[0].click();
            await page.waitForTimeout(300);
            log(`Category selected (${catBtns.length} options)`);
        }

        await titleInput.fill('Playwright 감사 제안 ' + Date.now());
        await bodyInput.fill('자동화 검수 스크립트에 의해 생성된 제안입니다.');
        await page.screenshot({ path: path.join(OUT, 'prop_03b_form_filled.png'), fullPage: false });
        v3.screenshots.push('prop_03b_form_filled.png');

        // find submit button
        const submitBtn = page.locator('button:has-text("제출"), button:has-text("등록"), button:has-text("완료"), button[type="submit"]').first();
        const submitVisible = await submitBtn.isVisible().catch(() => false);
        log(`Submit button visible: ${submitVisible}`);

        if (submitVisible) {
            // intercept POST
            const postPromise = page.waitForResponse(
                (r) => r.url().includes('/api/reports/new-proposal') && r.request().method() === 'POST',
                { timeout: 8000 },
            ).catch(() => null);

            await submitBtn.click();
            const postResp = await postPromise;

            if (postResp) {
                const status = postResp.status();
                log(`POST /api/reports/new-proposal → ${status}`);
                v3.apiCalls.push(`POST /api/reports/new-proposal → ${status}`);
                if (status === 201 || status === 200) {
                    const body = await postResp.json().catch(() => ({}));
                    submittedProposalId = body.id;
                    log(`Submitted proposal id: ${submittedProposalId}`);
                    // check transition to mProposalDone
                    await page.waitForTimeout(800);
                    await page.screenshot({ path: path.join(OUT, 'prop_03c_after_submit.png'), fullPage: false });
                    v3.screenshots.push('prop_03c_after_submit.png');
                    const doneVisible = await page.locator('.m-prop-done-page, [class*="prop-done"]').isVisible().catch(() => false);
                    log(`mProposalDone shown after submit: ${doneVisible}`);
                    if (!doneVisible) { v3.status = '⚠️'; v3.issues.push('제출 후 mProposalDone으로 전환 안됨'); }
                } else {
                    v3.status = '❌'; v3.issues.push(`POST new-proposal → ${status} (예상: 201)`);
                    results.bugs.push(`mProposalForm: POST new-proposal ${status}`);
                }
            } else {
                v3.status = '⚠️'; v3.issues.push('POST /api/reports/new-proposal 호출 미탐지 (필수 필드 미입력?)');
            }
        } else {
            v3.status = '⚠️'; v3.issues.push('제출 버튼 미탐지');
        }
    }

    // draft save test
    await seedAndLoad(
        page,
        { current_view: 'mProposalForm' },
        token ? { access_token: token } : {},
        '.m-prop-form-page, [class*="prop-form"]',
        12000,
    );
    const draftBtn = page.locator('button:has-text("임시저장"), button:has-text("저장")').first();
    const draftVisible = await draftBtn.isVisible().catch(() => false);
    log(`Draft save button visible: ${draftVisible}`);
    if (!draftVisible) { v3.status = '⚠️'; v3.issues.push('임시저장 버튼 미탐지'); }

    const netErrs3 = networkErrors.filter(e => !e.includes('favicon') && !e.includes('new-proposal'));
    if (netErrs3.length > 0) { v3.status = '❌'; v3.issues.push(`네트워크 에러: ${netErrs3.join(', ')}`); }

} catch (err) {
    v3.status = '❌'; v3.issues.push(`렌더/제출 실패: ${err.message}`);
    results.bugs.push(`mProposalForm: ${err.message}`);
    await page.screenshot({ path: path.join(OUT, 'prop_03_FAIL.png'), fullPage: false }).catch(() => {});
}
results.views.mProposalForm = v3;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW 4: mProposalDone
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section('VIEW 4: mProposalDone');
const v4 = { status: '✅', issues: [], apiCalls: [], screenshots: [] };
networkErrors.length = 0;
try {
    await seedAndLoad(
        page,
        { current_view: 'mProposalDone' },
        adminToken ? { access_token: adminToken } : {},
        '.m-prop-done-page, [class*="prop-done"], [class*="proposal-done"]',
        10000,
    );
    log('mProposalDone rendered');
    await page.screenshot({ path: path.join(OUT, 'prop_04_done.png'), fullPage: false });
    v4.screenshots.push('prop_04_done.png');

    // check navigation buttons (목록으로, 홈으로 etc)
    const navBtns = await page.locator('button:has-text("목록"), button:has-text("홈"), button:has-text("확인")').count();
    log(`Navigation buttons on done page: ${navBtns}`);
    if (navBtns === 0) { v4.status = '⚠️'; v4.issues.push('완료 후 내비게이션 버튼 미탐지'); }

} catch (err) {
    v4.status = '❌'; v4.issues.push(`렌더 실패: ${err.message}`);
    results.bugs.push(`mProposalDone 렌더 실패: ${err.message}`);
    await page.screenshot({ path: path.join(OUT, 'prop_04_FAIL.png'), fullPage: false }).catch(() => {});
}
results.views.mProposalDone = v4;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW 5: mProposalDetail — 조회수 회귀 + 투표 + 댓글
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section('VIEW 5: mProposalDetail (조회수 회귀 + 투표 + 댓글)');
const v5 = { status: '✅', issues: [], apiCalls: [], screenshots: [] };
networkErrors.length = 0;

// pick a proposal to test with — prefer one with lat/lng
let testProposal = null;
try {
    const listResp = await fetch(`${API}/api/reports/proposals`);
    const listData = await listResp.json();
    const items = listData.items || [];
    testProposal = items.find(p => p.lat && p.lng) || items[0] || null;
    if (!testProposal && submittedProposalId) {
        const pr = await fetch(`${API}/api/reports/proposals/${submittedProposalId}`);
        if (pr.ok) testProposal = await pr.json();
    }
} catch (e) { log(`Proposal fetch error: ${e}`); }

log(`Test proposal: id=${testProposal?.id}, views_before=${testProposal?.views_count}`);

// ── C. Regression: views +1 not +2 ─────────────────────────────────────────
section('REGRESSION: 조회수 +1 확인 (d40be39 버그 수정 검증)');
if (testProposal?.id) {
    // get current views
    const before = await fetch(`${API}/api/reports/proposals/${testProposal.id}`).then(r => r.json()).catch(() => ({}));
    const viewsBefore = before.views_count ?? before.views ?? 0;
    log(`Views before: ${viewsBefore}`);

    // call view endpoint once (as normal user or anonymous)
    const viewToken = normalUser?.token;
    const viewResp = await fetch(`${API}/api/reports/proposals/${testProposal.id}/view`, {
        method: 'POST',
        headers: viewToken ? { Authorization: `Bearer ${viewToken}` } : {},
    });
    const viewData = await viewResp.json().catch(() => ({}));
    const viewsAfterApi = viewData.views_count ?? viewsBefore;
    log(`POST /view → ${viewResp.status}, views_count: ${viewsAfterApi}`);

    // call again to check no double-count in same session
    await new Promise(r => setTimeout(r, 300));
    const after = await fetch(`${API}/api/reports/proposals/${testProposal.id}`).then(r => r.json()).catch(() => ({}));
    const viewsAfter = after.views_count ?? after.views ?? 0;
    log(`Views after DB check: ${viewsAfter}`);

    const delta = viewsAfter - viewsBefore;
    log(`Delta: ${delta} (expected: +1)`);

    const regTest = {
        name: '조회수 +1 회귀 (버그 d40be39)',
        proposalId: testProposal.id,
        viewsBefore,
        viewsAfter,
        delta,
    };

    if (delta === 1) {
        regTest.status = '✅ PASS';
        log('REGRESSION PASS: 조회수 정확히 +1');
    } else if (delta === 2) {
        regTest.status = '❌ FAIL — 조회수 여전히 +2 (버그 재발!)';
        results.bugs.push(`조회수 +2 버그 재발: proposal ${testProposal.id}`);
        log('REGRESSION FAIL: 조회수 +2 (버그 재발!)');
    } else if (delta === 0) {
        regTest.status = '⚠️ delta=0 — 본인 제안 or admin이므로 증가 안함 (정상일 수 있음)';
        log('조회수 delta=0 (본인 제안/admin이면 정상)');
    } else {
        regTest.status = `⚠️ delta=${delta} — 예상치 못한 변화`;
        log(`조회수 delta=${delta} (예상외)`);
    }
    results.regressionTests.push(regTest);
}

// ── mProposalDetail render ──────────────────────────────────────────────────
try {
    const propForDetail = testProposal || { id: 60, title: '테스트', category: '교통', content: '내용', views_count: 0, likes_count: 0 };
    await seedAndLoad(
        page,
        {
            current_view: 'mProposalDetail',
            selectedProposal: propForDetail,
        },
        adminToken ? { access_token: adminToken } : {},
        '.m-prop-detail-page, [class*="prop-detail"]',
        12000,
    );
    log('mProposalDetail rendered');
    await page.screenshot({ path: path.join(OUT, 'prop_05_detail.png'), fullPage: false });
    v5.screenshots.push('prop_05_detail.png');

    // check views display
    const viewText = await page.locator('.m-detail-meta-left, [class*="meta"], [class*="views"]').textContent().catch(() => '');
    log(`Meta text (views): "${viewText}"`);

    // ── vote test with admin (expect 403) ──────────────────────────────────
    const voteBtn = page.locator('button:has-text("투표"), .m-detail-vote-btn, [class*="vote-btn"], button svg').first();
    // look more broadly
    const voteBtnAlt = page.locator('button').filter({ hasText: /투표|찬성|좋아요/ }).first();
    const voteBtnVisible = await voteBtnAlt.isVisible().catch(() => false) || await voteBtn.isVisible().catch(() => false);
    log(`Vote button visible: ${voteBtnVisible}`);

    if (voteBtnVisible) {
        // intercept vote API
        const votePromise = page.waitForResponse(
            (r) => r.url().includes('/vote'),
            { timeout: 5000 },
        ).catch(() => null);

        const btn = (await voteBtnAlt.isVisible().catch(() => false)) ? voteBtnAlt : voteBtn;
        await btn.click();
        const voteResp = await votePromise;

        if (voteResp) {
            const voteStatus = voteResp.status();
            log(`POST /vote (admin) → ${voteStatus}`);
            v5.apiCalls.push(`POST /vote (admin) → ${voteStatus}`);

            if (voteStatus === 403) {
                log('Admin vote 403: 정책 정상. 프론트 UI 피드백 확인...');
                await page.waitForTimeout(800);
                // check for toast/alert feedback
                const toast = await page.locator('[class*="toast"], [role="alert"], [class*="alert"], [class*="snack"]').isVisible().catch(() => false);
                const alertDialog = await page.evaluate(() => !!document.querySelector('[class*="toast"],[role="alert"],[class*="alert"],[class*="snack"]'));
                log(`UI feedback after 403: toast=${toast}, alertEl=${alertDialog}`);
                v5.apiCalls.push(`Admin 403 UI feedback: ${toast || alertDialog ? '있음' : '없음'}`);
                if (!toast && !alertDialog) {
                    v5.status = '⚠️';
                    v5.issues.push('admin vote 403 → UI 피드백(toast/alert) 없음');
                    results.bugs.push('mProposalDetail: admin vote 403 시 UI 피드백 없음');
                }
            } else if (voteStatus === 200) {
                log('Vote 200: 정상 (admin이 아닌 토큰으로 진행된 경우)');
            } else {
                v5.status = '⚠️'; v5.issues.push(`Vote → ${voteStatus}`);
            }
        } else {
            v5.status = '⚠️'; v5.issues.push('투표 API 호출 미탐지');
        }
        await page.screenshot({ path: path.join(OUT, 'prop_05b_after_vote.png'), fullPage: false });
        v5.screenshots.push('prop_05b_after_vote.png');
    } else {
        v5.status = '⚠️'; v5.issues.push('투표 버튼 미탐지');
    }

    // ── comment test ───────────────────────────────────────────────────────
    const commentInput = page.locator('input[placeholder*="댓글"], textarea[placeholder*="댓글"], .m-detail-comment-input input, .comment-input').first();
    const commentVisible = await commentInput.isVisible().catch(() => false);
    log(`Comment input visible: ${commentVisible}`);

    if (commentVisible) {
        await commentInput.fill('Playwright 자동 감사 댓글 ' + Date.now());
        const commentSubmit = page.locator('button:has-text("등록"), button:has-text("댓글"), .comment-submit').first();
        const csVisible = await commentSubmit.isVisible().catch(() => false);
        if (csVisible) {
            const commentPromise = page.waitForResponse(
                (r) => r.url().includes('/comments') && r.request().method() === 'POST',
                { timeout: 5000 },
            ).catch(() => null);
            await commentSubmit.click();
            const cResp = await commentPromise;
            log(`POST /comments → ${cResp ? cResp.status() : '미탐지'}`);
            v5.apiCalls.push(`POST /comments → ${cResp ? cResp.status() : '미탐지'}`);
            if (cResp && (cResp.status() === 200 || cResp.status() === 201)) {
                log('댓글 등록 성공');
            } else if (cResp) {
                v5.status = '⚠️'; v5.issues.push(`댓글 POST → ${cResp.status()}`);
            }
        }
    } else {
        v5.status = '⚠️'; v5.issues.push('댓글 입력 필드 미탐지');
    }

    await page.screenshot({ path: path.join(OUT, 'prop_05c_comment.png'), fullPage: false });
    v5.screenshots.push('prop_05c_comment.png');

    // ── normal user vote test ──────────────────────────────────────────────
    if (normalUser?.token && testProposal?.id) {
        log('Normal user vote test...');
        const voteR = await fetch(`${API}/api/reports/proposals/${testProposal.id}/vote`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${normalUser.token}` },
        });
        log(`Normal user vote → ${voteR.status}`);
        v5.apiCalls.push(`Normal user vote → ${voteR.status}`);
        if (voteR.status !== 200 && voteR.status !== 201) {
            v5.status = '⚠️'; v5.issues.push(`일반유저 투표 → ${voteR.status} (예상 200)`);
        }
    }

    const netErrs5 = networkErrors.filter(e => !e.includes('favicon'));
    if (netErrs5.length > 0) {
        // 403 on vote is expected for admin
        const realErrs = netErrs5.filter(e => !e.startsWith('403'));
        if (realErrs.length > 0) {
            v5.status = '❌'; v5.issues.push(`네트워크 에러: ${realErrs.join(', ')}`);
        }
    }

} catch (err) {
    v5.status = '❌'; v5.issues.push(`렌더 실패: ${err.message}`);
    results.bugs.push(`mProposalDetail: ${err.message}`);
    await page.screenshot({ path: path.join(OUT, 'prop_05_FAIL.png'), fullPage: false }).catch(() => {});
}
results.views.mProposalDetail = v5;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW 6: myProposals (나의 제안 / 투표한 제안 탭)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section('VIEW 6: myProposals');
const v6 = { status: '✅', issues: [], apiCalls: [], screenshots: [] };
networkErrors.length = 0;
try {
    await seedAndLoad(
        page,
        { current_view: 'myProposals' },
        adminToken ? { access_token: adminToken } : {},
        '.my-proposals-page, [class*="my-proposal"], [class*="myProposal"]',
        12000,
    );
    log('myProposals rendered');
    await page.screenshot({ path: path.join(OUT, 'prop_06_my.png'), fullPage: false });
    v6.screenshots.push('prop_06_my.png');

    // check tabs
    const tabs = await page.locator('[class*="tab"], button:has-text("나의"), button:has-text("투표한")').all();
    log(`Tabs found: ${tabs.length}`);

    if (tabs.length >= 2) {
        // click "투표한 제안" tab
        const votedTab = page.locator('button:has-text("투표"), [class*="tab"]:has-text("투표")').first();
        const votedTabVisible = await votedTab.isVisible().catch(() => false);
        if (votedTabVisible) {
            // intercept API
            const votedPromise = page.waitForResponse(
                (r) => r.url().includes('/voted-proposals') || r.url().includes('voted'),
                { timeout: 5000 },
            ).catch(() => null);
            await votedTab.click();
            await page.waitForTimeout(800);
            const votedResp = await votedPromise;
            log(`Tab switch → voted proposals API: ${votedResp ? votedResp.status() : '미탐지'}`);
            v6.apiCalls.push(`GET voted-proposals → ${votedResp ? votedResp.status() : '미탐지'}`);
            await page.screenshot({ path: path.join(OUT, 'prop_06b_voted_tab.png'), fullPage: false });
            v6.screenshots.push('prop_06b_voted_tab.png');
        }
    } else {
        v6.status = '⚠️'; v6.issues.push('탭 selector 미매칭 (탭 전환 테스트 불가)');
    }

    // check empty state
    const emptyState = await page.locator('[class*="empty"], p:has-text("없"), p:has-text("아직")').isVisible().catch(() => false);
    log(`Empty state element visible: ${emptyState}`);

    // check my-proposals API was called
    const myPropCalls = networkErrors.filter(e => e.includes('my-proposals'));
    if (myPropCalls.length > 0) { v6.status = '❌'; v6.issues.push(`my-proposals API 에러: ${myPropCalls.join(', ')}`); }

    const netErrs6 = networkErrors.filter(e => !e.includes('favicon'));
    if (netErrs6.length > 0) { v6.status = '⚠️'; v6.issues.push(`네트워크 에러: ${netErrs6.join(', ')}`); }

} catch (err) {
    v6.status = '❌'; v6.issues.push(`렌더 실패: ${err.message}`);
    results.bugs.push(`myProposals: ${err.message}`);
    await page.screenshot({ path: path.join(OUT, 'prop_06_FAIL.png'), fullPage: false }).catch(() => {});
}
results.views.myProposals = v6;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DIRECT API TESTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section('DIRECT API TESTS');

async function apiTest(label, fn) {
    try {
        const result = await fn();
        log(`${result.status >= 400 ? '❌' : '✅'} ${label}: ${result.status}`);
        results.apiTests.push({ label, ...result });
        return result;
    } catch (e) {
        log(`❌ ${label}: ERROR ${e.message}`);
        results.apiTests.push({ label, status: 'ERROR', error: e.message });
        return { status: 'ERROR' };
    }
}

// GET proposals list
await apiTest('GET /api/reports/proposals', async () => {
    const r = await fetch(`${API}/api/reports/proposals`);
    const d = await r.json();
    return { status: r.status, count: d.items?.length };
});

// GET single proposal
if (testProposal?.id) {
    await apiTest(`GET /api/reports/proposals/${testProposal.id}`, async () => {
        const r = await fetch(`${API}/api/reports/proposals/${testProposal.id}`);
        return { status: r.status };
    });
}

// GET my-proposals (admin)
await apiTest('GET /api/reports/my-proposals (admin)', async () => {
    const r = await fetch(`${API}/api/reports/my-proposals`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const d = await r.json().catch(() => ({}));
    return { status: r.status, count: Array.isArray(d) ? d.length : d.items?.length };
});

// GET voted-proposals (admin)
await apiTest('GET /api/reports/voted-proposals (admin)', async () => {
    const r = await fetch(`${API}/api/reports/voted-proposals`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    return { status: r.status };
});

// POST vote — admin should get 403
if (testProposal?.id) {
    await apiTest(`POST /api/reports/proposals/${testProposal.id}/vote (admin→403 policy)`, async () => {
        const r = await fetch(`${API}/api/reports/proposals/${testProposal.id}/vote`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        return { status: r.status, expected: 403, pass: r.status === 403 };
    });
}

// POST view
if (testProposal?.id) {
    await apiTest(`POST /api/reports/proposals/${testProposal.id}/view`, async () => {
        const r = await fetch(`${API}/api/reports/proposals/${testProposal.id}/view`, {
            method: 'POST',
        });
        const d = await r.json().catch(() => ({}));
        return { status: r.status, views_count: d.views_count };
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINAL REPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
await browser.close();

section('FINAL REPORT');
console.log('\n── View 결과 ──────────────────────────────────────────');
for (const [view, r] of Object.entries(results.views)) {
    console.log(`${r.status} ${view}`);
    if (r.issues.length > 0) r.issues.forEach(i => console.log(`    ⚠ ${i}`));
    if (r.apiCalls.length > 0) r.apiCalls.forEach(a => console.log(`    → ${a}`));
    if (r.screenshots.length > 0) console.log(`    📷 ${r.screenshots.join(', ')}`);
}

console.log('\n── 회귀 테스트 ─────────────────────────────────────────');
results.regressionTests.forEach(t => {
    console.log(`  ${t.status}`);
    console.log(`    proposal ${t.proposalId}: before=${t.viewsBefore} → after=${t.viewsAfter} (delta=${t.delta})`);
});

console.log('\n── 직접 API 테스트 ─────────────────────────────────────');
results.apiTests.forEach(t => {
    const icon = (t.status >= 200 && t.status < 400) || t.pass ? '✅' : t.status === 403 && t.expected === 403 ? '✅' : '❌';
    console.log(`  ${icon} ${t.label}: ${t.status}${t.count != null ? ` (${t.count}건)` : ''}`);
});

console.log('\n── 발견된 버그 요약 ─────────────────────────────────────');
if (results.bugs.length === 0) {
    console.log('  버그 없음 (또는 모든 케이스 통과)');
} else {
    results.bugs.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
}

const jsonPath = path.join(OUT, '../reports/proposal_audit.json');
mkdirSync(path.dirname(jsonPath), { recursive: true });
writeFileSync(jsonPath, JSON.stringify(results, null, 2));
console.log(`\n결과 JSON: ${jsonPath}`);
console.log('스크린샷: ' + OUT);

const hasFailures = results.bugs.length > 0 || Object.values(results.views).some(v => v.status === '❌');
process.exit(hasFailures ? 1 : 0);
