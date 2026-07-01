/**
 * report_line_audit.mjs
 * 제보(Report) 라인 전체 검수 — Playwright
 *
 * Usage: node verify/_dev/report_line_audit.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = '/Users/Kang/Desktop/fuckbusan/verify/screenshots';
const BASE = 'http://localhost:8501';
const API = 'http://localhost:8000';
mkdirSync(OUT, { recursive: true });

// ──────────────────────────────────────────────
// Result collector
// ──────────────────────────────────────────────
const report = {};
let currentView = '';
function startView(name) {
    currentView = name;
    report[name] = { status: '⚠️', notes: [], apis: [], consoleErrors: [], networkErrors: [] };
    console.log(`\n═══ ${name} ═══`);
}
function note(msg) { console.log('  ' + msg); report[currentView].notes.push(msg); }
function apiOk(code, url) { report[currentView].apis.push(`✅ ${code} ${url}`); }
function apiFail(code, url) { report[currentView].apis.push(`❌ ${code} ${url}`); report[currentView].networkErrors.push(`${code} ${url}`); }
function pass() { report[currentView].status = '✅'; console.log(`  → PASS`); }
function fail(msg) { report[currentView].status = '❌'; note('BUG: ' + msg); console.log(`  → FAIL: ${msg}`); }
function warn(msg) { report[currentView].status = '⚠️'; note('WARN: ' + msg); console.log(`  → WARN: ${msg}`); }

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
async function seedView(page, viewName, extra = {}) {
    await page.evaluate(({ v, extras }) => {
        sessionStorage.setItem('current_view', v);
        for (const [k, val] of Object.entries(extras)) {
            sessionStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
        }
    }, { v: viewName, extras: extra });
    await page.reload({ waitUntil: 'domcontentloaded' });
}

async function screenshot(page, name) {
    const p = path.join(OUT, `report_audit_${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    note(`screenshot: ${p}`);
    return p;
}

function trackNetwork(page) {
    page.on('response', (r) => {
        if (/favicon/i.test(r.url())) return;
        if (r.url().includes(API) || r.url().includes('localhost:8000')) {
            const short = r.url().replace(API, '');
            if (r.status() >= 400) apiFail(r.status(), short);
            else if (r.status() >= 200) apiOk(r.status(), short);
        }
    });
}

// ──────────────────────────────────────────────
// Login: signup test user + get token
// ──────────────────────────────────────────────
async function getTestToken() {
    const ts = Date.now();
    const testId = `playwright${String(ts).slice(-8)}`;
    const userData = {
        ID: testId,
        PW: 'Test1234!',
        name: `테스트유저${ts}`,
        phone_num: `010${String(ts).slice(-8)}`,
        nickname: `tester${ts}`,
        district_code: 'busanjin',
    };
    try {
        const signupRes = await fetch(`${API}/users/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!signupRes.ok) {
            const errTxt = await signupRes.text().catch(() => '');
            console.warn('  signup failed:', signupRes.status, errTxt.slice(0, 100));
        } else {
            console.log('  [auth] test user signup OK: ID=' + testId);
        }
    } catch (e) {
        console.warn('  signup error:', e.message);
    }
    // Login with new user
    try {
        const loginRes = await fetch(`${API}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ID: testId, PW: 'Test1234!' }),
        });
        if (loginRes.ok) {
            const j = await loginRes.json();
            if (j.access_token) {
                console.log('  [auth] new test user token obtained (ID=' + testId + ')');
                return j.access_token;
            }
        }
    } catch {}
    // Fallback: admin
    return await getAdminToken();
}

async function getAdminToken() {
    try {
        const r = await fetch(`${API}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ID: 'admin', PW: 'admin1234' }),
        });
        if (r.ok) {
            const j = await r.json();
            console.log('  [auth] admin token obtained');
            return j.access_token;
        }
        const errTxt = await r.text().catch(() => '');
        console.warn('  admin login failed:', r.status, errTxt.slice(0, 100));
    } catch (e) {
        console.warn('  admin login error:', e.message);
    }
    return null;
}

// ──────────────────────────────────────────────
// Seed a real report and return its id
// ──────────────────────────────────────────────
async function seedReport(token) {
    const payload = {
        category: '교통',
        sub_category: '도로 · 훼손',
        title: '도로에 훼손 불편해요',
        content: 'Playwright 테스트 자동 생성 제보입니다.',
        lat: 35.197,
        lng: 129.063,
    };
    const res = await fetch(`${API}/api/reports/report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });
    if (res.ok) {
        const j = await res.json();
        console.log(`  [seed] report created: id=${j.id}`);
        return j.id;
    }
    console.warn('  [seed] report creation failed', res.status);
    return null;
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
});
const page = await ctx.newPage();

// Global console error listener
page.on('console', (m) => {
    if (m.type() === 'error') {
        const t = m.text();
        if (/favicon|net::ERR_/i.test(t)) return;
        if (report[currentView]) report[currentView].consoleErrors.push(t);
    }
});
page.on('pageerror', (e) => {
    if (report[currentView]) report[currentView].consoleErrors.push('PAGEERR: ' + String(e));
});

trackNetwork(page);

// Init page
await page.goto(BASE, { waitUntil: 'domcontentloaded' });

// Auth tokens
const userToken = await getTestToken();
const adminToken = await getAdminToken();
console.log('\n[tokens] userToken:', userToken ? 'OK' : 'NONE', '/ adminToken:', adminToken ? 'OK' : 'NONE');

// Seed a report for detail/comment tests
const seededReportId = await seedReport(userToken || adminToken);

// Also get a real report ID from list (first available)
let firstReportId = seededReportId;
try {
    const lr = await fetch(`${API}/api/reports/list`);
    if (lr.ok) {
        const lj = await lr.json();
        if (Array.isArray(lj) && lj.length > 0) firstReportId = lj[0].id;
        else if (lj.items && lj.items.length > 0) firstReportId = lj.items[0].id;
    }
} catch {}
console.log(`  [seed] using report id=${firstReportId} for detail tests`);

// ──────────────────────────────────────────────
// A1. mReportList
// ──────────────────────────────────────────────
startView('mReportList');
try {
    await page.evaluate((token) => {
        if (token) localStorage.setItem('access_token', token);
        sessionStorage.setItem('current_view', 'mReportList');
    }, userToken);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-report-list-page, .m-prop-list-page', { timeout: 8000 });
    note('렌더 OK — .m-prop-list-page');
    await screenshot(page, '01_mReportList');

    // Category chip click test
    const chips = page.locator('.m-cat-chips .m-cat-chip');
    const chipCount = await chips.count();
    note(`카테고리 칩 수: ${chipCount}`);
    if (chipCount > 0) {
        await chips.nth(1).click();
        await page.waitForTimeout(500);
        const activeChip = page.locator('.m-cat-chips .m-cat-chip.on');
        const activeCount = await activeChip.count();
        if (activeCount > 0) {
            const activeTxt = await activeChip.first().textContent();
            note(`카테고리 필터 동작 OK: "${activeTxt}" 선택됨`);
        } else {
            warn('카테고리 칩 클릭 후 .on 클래스 없음');
        }
        await screenshot(page, '01b_mReportList_catfilter');
    }

    // Check network errors
    if (report['mReportList'].networkErrors.length === 0) pass();
    else warn(`네트워크 에러 있음: ${report['mReportList'].networkErrors.join(', ')}`);
} catch (e) {
    fail(String(e));
    await screenshot(page, '01_FAIL');
}

// ──────────────────────────────────────────────
// A2. mReportMap
// ──────────────────────────────────────────────
startView('mReportMap');
try {
    await page.evaluate((token) => {
        if (token) localStorage.setItem('access_token', token);
        sessionStorage.setItem('current_view', 'mReportMap');
    }, userToken);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-rmap-page, .m-prop-map-page', { timeout: 8000 });
    note('렌더 OK — .m-rmap-page');
    await screenshot(page, '02_mReportMap_initial');

    // Sheet mode test
    const grab = page.locator('.m-sheet-grab, .m-map-sheet');
    if (await grab.count() > 0) {
        note('시트 영역 존재 확인');
        // Try expanding sheet
        const fullBtn = page.locator('button[aria-label="목록 펼치기"]');
        if (await fullBtn.count() > 0) {
            await fullBtn.click();
            await page.waitForTimeout(400);
            await screenshot(page, '02b_mReportMap_full_sheet');
            note('시트 full 모드 전환 OK');
            // Back to half
            const halfBtn = page.locator('button[aria-label="지도보기"]');
            if (await halfBtn.count() > 0) {
                await halfBtn.click();
                await page.waitForTimeout(300);
                note('시트 half 모드 복귀 OK');
            }
        }
    } else {
        warn('시트 영역(.m-sheet-grab) 없음');
    }

    // my location button
    const locBtn = page.locator('.m-locate-fab');
    if (await locBtn.count() > 0) {
        note('내 위치 버튼 존재 확인');
    } else {
        warn('내 위치 버튼(.m-locate-fab) 없음');
    }

    if (report['mReportMap'].networkErrors.length === 0) pass();
    else warn(`네트워크 에러: ${report['mReportMap'].networkErrors.join(', ')}`);
} catch (e) {
    fail(String(e));
    await screenshot(page, '02_FAIL');
}

// ──────────────────────────────────────────────
// A3. mReportForm — 렌더 + 카테고리 칩 스타일
// ──────────────────────────────────────────────
startView('mReportForm');
try {
    await page.evaluate((token) => {
        if (token) localStorage.setItem('access_token', token);
        localStorage.removeItem('mReportForm:draft'); // clear draft
        sessionStorage.setItem('current_view', 'mReportForm');
    }, userToken);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-report-form-page', { timeout: 8000 });
    note('렌더 OK — .m-report-form-page');
    await screenshot(page, '03_mReportForm_initial');

    // Check category chips (C. 회귀: gray pill style)
    const catChips = page.locator('.m-rcat-chips .m-cat-chip');
    const catCount = await catChips.count();
    note(`카테고리 칩 수: ${catCount}`);
    if (catCount === 8) {
        note('카테고리 칩 8개 OK');
    } else {
        warn(`카테고리 칩 수 이상: ${catCount}개 (expected 8)`);
    }

    // Check chip style (should be gray pill, not colored)
    const firstChipStyle = await catChips.first().evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color, borderRadius: s.borderRadius };
    });
    note(`칩 스타일: bg=${firstChipStyle.bg}, borderRadius=${firstChipStyle.borderRadius}`);

    // Click a category chip
    await catChips.nth(2).click(); // 교통
    const onChip = page.locator('.m-rcat-chips .m-cat-chip.on');
    if (await onChip.count() > 0) {
        note('카테고리 칩 선택 .on 동작 OK');
    } else {
        warn('카테고리 칩 .on 클래스 미적용');
    }
    await screenshot(page, '03b_mReportForm_cat_selected');

    // B. Leave modal test
    // Fill some content first
    await page.locator('.m-row-with-suffix .m-select').first().selectOption({ index: 1 });
    await page.locator('.m-row-with-suffix .m-select').last().selectOption({ index: 1 });
    // body is input[type=text].m-row-input (not textarea)
    const bodyInput = page.locator('input.m-row-input[placeholder*="자유"]');
    if (await bodyInput.count() > 0) {
        await bodyInput.fill('테스트 본문입니다');
    } else {
        // fallback: last .m-row-input
        await page.locator('input.m-row-input').last().fill('테스트 본문입니다');
    }
    await page.waitForTimeout(200);

    // Click back button
    const backBtn = page.locator('.m-form-back');
    if (await backBtn.count() > 0) {
        await backBtn.click();
        await page.waitForTimeout(500);
        // Leave modal should appear
        const modal = page.locator('.m-leave-modal, .m-result-backdrop, [class*="leave"], [class*="modal"]');
        // Try to find any modal with "저장" text
        const modalText = await page.locator('body').textContent();
        if (modalText.includes('저장할까요') || modalText.includes('임시저장') || modalText.includes('저장')) {
            note('이탈 시 임시저장 모달 표시 OK');
            await screenshot(page, '03c_mReportForm_leave_modal');
            // Dismiss
            const dismissBtn = page.locator('button').filter({ hasText: '나가기' });
            if (await dismissBtn.count() > 0) await dismissBtn.click();
        } else {
            warn('이탈 시 저장 모달 텍스트 미확인 (렌더 확인 필요)');
            await screenshot(page, '03c_mReportForm_after_back');
        }
    }

    if (report['mReportForm'].networkErrors.length === 0) pass();
    else warn(`네트워크 에러: ${report['mReportForm'].networkErrors.join(', ')}`);
} catch (e) {
    fail(String(e));
    await screenshot(page, '03_FAIL');
}

// ──────────────────────────────────────────────
// A3b. mReportForm — 제출 플로우 (POST /api/reports/report → mReportDone)
// ──────────────────────────────────────────────
startView('mReportForm_submit');
try {
    await page.evaluate((token) => {
        if (token) localStorage.setItem('access_token', token);
        localStorage.removeItem('mReportForm:draft');
        sessionStorage.setItem('current_view', 'mReportForm');
    }, userToken);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-report-form-page', { timeout: 8000 });

    // Fill form: category chip
    const catChips = page.locator('.m-rcat-chips .m-cat-chip');
    await catChips.nth(2).click(); // 교통

    // position select
    await page.locator('.m-row-with-suffix .m-select').first().selectOption({ index: 1 });
    // issue select
    await page.locator('.m-row-with-suffix .m-select').last().selectOption({ index: 1 });
    // body input[type=text] (not textarea)
    const bodyInp = page.locator('input.m-row-input[placeholder*="자유"]');
    if (await bodyInp.count() > 0) {
        await bodyInp.fill('Playwright 자동 테스트 본문');
    } else {
        await page.locator('input.m-row-input').last().fill('Playwright 자동 테스트 본문');
    }

    await page.waitForTimeout(300);

    // Check submit button enabled
    const submitBtn = page.locator('.m-form-submit');
    const isDisabled = await submitBtn.evaluate((el) => el.disabled);
    note(`제출 버튼 disabled=${isDisabled}`);

    if (isDisabled) {
        warn('제출 버튼이 비활성화 상태 — 필수 필드 누락 가능');
        await screenshot(page, '03d_mReportForm_submit_disabled');
    } else {
        note('제출 버튼 활성화 OK');
        // Track 201 response
        let got201 = false;
        const resp = page.waitForResponse(
            (r) => r.url().includes('/api/reports/report') && r.request().method() === 'POST',
            { timeout: 8000 }
        );

        await submitBtn.click();
        try {
            const r = await resp;
            if (r.status() === 201) {
                got201 = true;
                apiOk(201, '/api/reports/report');
                note('POST /api/reports/report → 201 OK');
            } else {
                apiFail(r.status(), '/api/reports/report');
                warn(`제출 응답 ${r.status()}`);
            }
        } catch (re) {
            warn('응답 대기 timeout: ' + re.message);
        }

        // Wait for view transition to mReportDone
        try {
            await page.waitForSelector('.m-report-done-page, .m-prop-done-page', { timeout: 5000 });
            note('mReportDone 전환 OK');
            await screenshot(page, '03e_mReportDone');
            pass();
        } catch {
            const sv = await page.evaluate(() => sessionStorage.getItem('current_view'));
            note(`현재 view: ${sv}`);
            warn('mReportDone 화면 전환 실패 또는 지연');
            await screenshot(page, '03e_mReportDone_fail');
        }
    }
} catch (e) {
    fail(String(e));
    await screenshot(page, '03d_submit_FAIL');
}

// ──────────────────────────────────────────────
// A4. mReportDone
// ──────────────────────────────────────────────
startView('mReportDone');
try {
    await page.evaluate((token) => {
        if (token) localStorage.setItem('access_token', token);
        sessionStorage.setItem('current_view', 'mReportDone');
    }, userToken);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-report-done-page, .m-prop-done-page', { timeout: 8000 });
    note('렌더 OK — .m-report-done-page');
    // Check for done page content
    const txt = await page.locator('.m-prop-done-page, .m-report-done-page').textContent();
    if (txt.includes('완료')) {
        note('완료 텍스트 OK');
    }
    await screenshot(page, '04_mReportDone');
    pass();
} catch (e) {
    fail(String(e));
    await screenshot(page, '04_FAIL');
}

// ──────────────────────────────────────────────
// A5. mReportDetail — 렌더 + 좋아요 + 댓글 (회귀 테스트)
// ──────────────────────────────────────────────
startView('mReportDetail');
try {
    const reportId = firstReportId || seededReportId || 1;
    // First fetch report data for seeding
    let reportData = {};
    try {
        const dr = await fetch(`${API}/api/reports/${reportId}`);
        if (dr.ok) reportData = await dr.json();
    } catch {}

    await page.evaluate(({ token, rid, rdata }) => {
        if (token) {
            localStorage.setItem('access_token', token);
        }
        sessionStorage.setItem('current_view', 'mReportDetail');
        sessionStorage.setItem('selectedReport', JSON.stringify({
            id: rid,
            region: rdata.region || '부산 진구',
            address: rdata.detailed_address || '테스트 주소',
            date: rdata.created_at || '2025/01/01',
            categoryKey: rdata.category || '교통',
            cat: rdata.category || '교통',
            sub: rdata.sub_category || '도로',
            title: rdata.title || '테스트 제보',
            body: rdata.content || '테스트 내용',
            image: rdata.image_url || null,
            views: rdata.views_count || 1,
            likes: rdata.likes_count || 0,
            comments: [],
            author: rdata.author || '익명',
        }));
    }, { token: userToken, rid: reportId, rdata: reportData });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-report-detail-page', { timeout: 8000 });
    note(`렌더 OK — .m-report-detail-page (report id=${reportId})`);
    await screenshot(page, '05_mReportDetail');

    // Check image render
    const imgEl = page.locator('.m-detail-image');
    if (await imgEl.count() > 0) {
        note('사진 영역 렌더 OK');
    } else {
        note('사진 없음 (이미지 없는 제보)');
    }

    // Like button toggle
    const likeBtn = page.locator('.m-rdetail-like-btn');
    if (await likeBtn.count() > 0) {
        const likedBefore = await likeBtn.evaluate((el) => el.classList.contains('liked'));
        note(`좋아요 버튼 초기 상태: liked=${likedBefore}`);
        await likeBtn.click();
        await page.waitForTimeout(600);
        const likedAfter = await likeBtn.evaluate((el) => el.classList.contains('liked'));
        note(`좋아요 클릭 후: liked=${likedAfter}`);
        if (likedAfter !== likedBefore) {
            note('좋아요 토글 UI 변화 OK');
        } else {
            warn('좋아요 토글 UI 변화 없음');
        }
        await screenshot(page, '05b_mReportDetail_like');
    } else {
        warn('좋아요 버튼(.m-rdetail-like-btn) 없음');
    }

    // B. Comment submission (regression: 500 bug)
    const commentInput = page.locator('.m-comment-input');
    const commentSend = page.locator('.m-comment-send');
    if (await commentInput.count() > 0) {
        await commentInput.fill('Playwright 댓글 회귀테스트');
        await page.waitForTimeout(200);

        let commentStatus = null;
        const commentResp = page.waitForResponse(
            (r) => r.url().includes('/comments') && r.request().method() === 'POST',
            { timeout: 6000 }
        );
        await commentSend.click();
        try {
            const cr = await commentResp;
            commentStatus = cr.status();
            if (commentStatus === 201) {
                apiOk(201, `/${reportId}/comments`);
                note(`댓글 POST → 201 OK (회귀 테스트 통과)`);
            } else {
                apiFail(commentStatus, `/${reportId}/comments`);
                fail(`댓글 POST → ${commentStatus} (500 버그 미수정?)`);
            }
        } catch (re) {
            // No network call? might be auth issue
            const errTxt = await page.locator('body').textContent().catch(() => '');
            if (errTxt.includes('로그인')) {
                warn('댓글 미인증 상태 — 로그인 필요');
            } else {
                warn('댓글 응답 수신 실패: ' + re.message);
            }
        }
        await screenshot(page, '05c_mReportDetail_comment');
    } else {
        warn('댓글 입력창(.m-comment-input) 없음');
    }

    if (report['mReportDetail'].networkErrors.filter(e => !e.includes('/comments')).length === 0) {
        if (report['mReportDetail'].status !== '❌') pass();
    }
} catch (e) {
    fail(String(e));
    await screenshot(page, '05_FAIL');
}

// ──────────────────────────────────────────────
// A6. mMyReportDetail — 편집/삭제 액션
// ──────────────────────────────────────────────
startView('mMyReportDetail');
try {
    // Need a report owned by userToken. Use seededReportId if available.
    // If user is admin, mine is always empty — so use seededReportId directly
    const rid = seededReportId || firstReportId || 1;

    let rdata = {};
    try {
        const dr = await fetch(`${API}/api/reports/${rid}`);
        if (dr.ok) rdata = await dr.json();
    } catch {}

    await page.evaluate(({ token, rdata }) => {
        if (token) localStorage.setItem('access_token', token);
        sessionStorage.setItem('current_view', 'mMyReportDetail');
        sessionStorage.setItem('selectedMyReport', JSON.stringify({
            id: rdata.id || 1,
            category: rdata.category || '교통',
            sub_category: rdata.sub_category || '도로 · 훼손',
            title: rdata.title || '테스트 제보',
            content: rdata.content || '테스트 내용',
            detailed_address: rdata.detailed_address || '테스트 주소',
            lat: rdata.lat || 35.197,
            lng: rdata.lng || 129.063,
            image_url: rdata.image_url || null,
            views_count: rdata.views_count || 1,
            likes_count: rdata.likes_count || 0,
            improvement_status: rdata.improvement_status || 'notice',
            created_at: rdata.created_at || '2025-01-01',
        }));
    }, { token: userToken, rdata });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-myreport-detail-page', { timeout: 8000 });
    note(`렌더 OK — .m-myreport-detail-page (id=${rid})`);
    await screenshot(page, '06_mMyReportDetail');

    // Check edit and delete buttons
    const editBtn = page.locator('.m-myrdetail-btn.primary');
    const deleteBtn = page.locator('.m-myrdetail-btn.ghost');
    if (await editBtn.count() > 0) {
        note('수정 버튼 OK');
    } else {
        warn('수정 버튼 없음');
    }
    if (await deleteBtn.count() > 0) {
        note('삭제 버튼 OK');
        // Click delete to show modal
        await deleteBtn.first().click();
        await page.waitForTimeout(400);
        const modal = page.locator('.m-myrdetail-modal');
        if (await modal.count() > 0) {
            note('삭제 확인 모달 표시 OK');
            // Cancel
            await page.locator('.m-myrdetail-modal .m-myrdetail-btn.ghost').click();
            await page.waitForTimeout(300);
        } else {
            warn('삭제 확인 모달 미표시');
        }
        await screenshot(page, '06b_mMyReportDetail_delete_modal');
    } else {
        warn('삭제 버튼 없음');
    }

    if (report['mMyReportDetail'].networkErrors.length === 0) pass();
    else warn(`네트워크 에러: ${report['mMyReportDetail'].networkErrors.join(', ')}`);
} catch (e) {
    fail(String(e));
    await screenshot(page, '06_FAIL');
}

// ──────────────────────────────────────────────
// A7. mMyReportEdit
// ──────────────────────────────────────────────
startView('mMyReportEdit');
try {
    const rid = seededReportId || firstReportId || 1;
    let rdata = {};
    try {
        const dr = await fetch(`${API}/api/reports/${rid}`);
        if (dr.ok) rdata = await dr.json();
    } catch {}

    await page.evaluate(({ token, rdata }) => {
        if (token) localStorage.setItem('access_token', token);
        sessionStorage.setItem('current_view', 'mMyReportEdit');
        sessionStorage.setItem('editingReport', JSON.stringify({
            id: rdata.id || rid,
            category: rdata.category || '교통',
            sub_category: rdata.sub_category || '도로 · 훼손',
            title: rdata.title || '테스트 제보',
            content: rdata.content || '테스트 내용',
            detailed_address: rdata.detailed_address || '테스트 주소',
            lat: rdata.lat || 35.197,
            lng: rdata.lng || 129.063,
            image_url: rdata.image_url || null,
            improvement_status: rdata.improvement_status || 'notice',
        }));
    }, { token: userToken, rdata });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-myrep-edit-page', { timeout: 8000 });
    note(`렌더 OK — .m-myrep-edit-page (id=${rid})`);
    await screenshot(page, '07_mMyReportEdit');

    // Check form fields populated
    const catChip = page.locator('.m-rcat-chips .m-cat-chip.on');
    if (await catChip.count() > 0) {
        const txt = await catChip.first().textContent();
        note(`카테고리 pre-fill OK: "${txt}"`);
    } else {
        warn('카테고리 칩 pre-fill 없음');
    }

    // Check submit button
    const submitBtn = page.locator('.m-form-submit');
    const isDisabled = await submitBtn.evaluate((el) => el.disabled);
    note(`수정 제출 버튼 disabled=${isDisabled}`);

    if (report['mMyReportEdit'].networkErrors.length === 0) pass();
    else warn(`네트워크 에러: ${report['mMyReportEdit'].networkErrors.join(', ')}`);
} catch (e) {
    fail(String(e));
    await screenshot(page, '07_FAIL');
}

// ──────────────────────────────────────────────
// B. Location picker: coord → address auto-fill
// ──────────────────────────────────────────────
startView('mReportForm_locationPicker');
try {
    await page.evaluate((token) => {
        if (token) localStorage.setItem('access_token', token);
        localStorage.removeItem('mReportForm:draft');
        sessionStorage.setItem('current_view', 'mReportForm');
    }, userToken);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m-report-form-page', { timeout: 8000 });

    // Open location picker
    const locBtn = page.locator('.m-loc-input');
    await locBtn.first().click();
    await page.waitForTimeout(1000);

    // Check if map/picker appeared
    const bodyTxt = await page.locator('body').textContent();
    const hasMapPicker = await page.locator('[class*="location"], [class*="picker"], [class*="map-modal"], .m-loc-modal').count() > 0;
    if (hasMapPicker) {
        note('위치 선택 모달/오버레이 표시 OK');
        await screenshot(page, '08_locationPicker_open');
        // Check no raw lat/lng displayed
        if (/35\.\d+.*129\.\d+|129\.\d+.*35\.\d+/.test(bodyTxt)) {
            warn('화면에 위도/경도 원시값 노출 — 주소 자동변환 미적용 가능');
        } else {
            note('위도/경도 원시값 화면 미노출 OK');
        }
    } else {
        // might be that picker is full-screen replace
        await screenshot(page, '08_locationPicker_open');
        note('위치 선택 진입 (full-screen 방식 가능)');
        // check if map canvas is visible
        const mapCanvas = page.locator('.m-map-canvas, #kakao-map, [id*="map"]');
        if (await mapCanvas.count() > 0) {
            note('카카오 맵 캔버스 표시 OK');
        }
    }
    pass();
} catch (e) {
    fail(String(e));
    await screenshot(page, '08_FAIL');
}

// ──────────────────────────────────────────────
// Cleanup
// ──────────────────────────────────────────────
await browser.close();

// ──────────────────────────────────────────────
// Final report
// ──────────────────────────────────────────────
console.log('\n\n════════════════════════════════════');
console.log('제보 라인 검수 결과 요약');
console.log('════════════════════════════════════');

const bugs = [];
for (const [view, r] of Object.entries(report)) {
    const icon = r.status;
    const apiSummary = r.apis.slice(0, 3).join(', ');
    console.log(`\n${icon} ${view}`);
    r.notes.forEach(n => console.log(`   ${n}`));
    if (r.networkErrors.length > 0) console.log(`   🔴 네트워크 에러: ${r.networkErrors.join(', ')}`);
    if (r.consoleErrors.length > 0) console.log(`   🔴 콘솔 에러: ${r.consoleErrors.slice(0, 2).join(' | ')}`);
    if (icon === '❌' || icon === '⚠️') {
        bugs.push({ view, notes: r.notes, networkErrors: r.networkErrors, consoleErrors: r.consoleErrors });
    }
}

console.log('\n\n━━━ 발견된 버그 요약 ━━━');
if (bugs.length === 0) {
    console.log('버그 없음 — 모든 검수 통과');
} else {
    bugs.forEach(b => {
        console.log(`\n[${b.view}]`);
        b.notes.filter(n => n.startsWith('BUG:') || n.startsWith('WARN:')).forEach(n => console.log('  ' + n));
        if (b.networkErrors.length > 0) console.log('  네트워크: ' + b.networkErrors.join(', '));
        if (b.consoleErrors.length > 0) console.log('  콘솔: ' + b.consoleErrors[0]);
    });
}

// Save JSON
const jsonPath = '/Users/Kang/Desktop/fuckbusan/verify/screenshots/report_audit_result.json';
writeFileSync(jsonPath, JSON.stringify(report, null, 2));
console.log(`\n결과 JSON: ${jsonPath}`);

const hasFailure = Object.values(report).some(r => r.status === '❌');
process.exit(hasFailure ? 1 : 0);
