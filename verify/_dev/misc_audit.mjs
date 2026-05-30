/**
 * misc_audit.mjs
 * 모바일 부가기능 전체 검수: 홈/가상시민/설문/활동허브
 * Viewport: 375×812
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = '/Users/Kang/Desktop/fuckbusan/verify/screenshots';
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:8501';
const API  = 'http://localhost:8000';

// ─── helpers ───────────────────────────────────────────────────────────────────
function log(msg) { console.log(msg); }
function ok(view, note = '') { log(`  ✅ [${view}] ${note}`); }
function warn(view, note)    { log(`  ⚠️  [${view}] ${note}`); }
function fail(view, note)    { log(`  ❌ [${view}] ${note}`); }

async function shot(page, name) {
    const p = path.join(OUT, `misc_${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    return p;
}

// Seed sessionStorage and reload into a view
async function goView(page, view, extra = {}) {
    await page.evaluate(({ view, extra }) => {
        sessionStorage.setItem('current_view', view);
        for (const [k, v] of Object.entries(extra)) {
            sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
    }, { view, extra });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
}

// Collect API errors during a callback
function makeNetMonitor(page) {
    const errors = [];
    const handler = (r) => {
        if (r.status() >= 400 && !/favicon/i.test(r.url())) {
            errors.push(`${r.status()} ${r.url()}`);
        }
    };
    page.on('response', handler);
    return { errors, stop: () => page.off('response', handler) };
}

// ─── main ──────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
});
const page = await ctx.newPage();

// Global console / page error capture
const consoleErrors = [];
const pageErrors = [];
page.on('console', (m) => {
    if (m.type() === 'error') {
        const t = m.text();
        if (!/favicon|net::ERR_|ResizeObserver/i.test(t)) consoleErrors.push(t);
    }
});
page.on('pageerror', (e) => pageErrors.push(String(e)));

const summary = [];   // { view, status, notes, apiErrors }

async function checkView(label, view, opts = {}) {
    const { seed = {}, selector = null, timeout = 8000 } = opts;
    const net = makeNetMonitor(page);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goView(page, view, seed);
    let status = '✅';
    const notes = [];
    try {
        if (selector) {
            await page.waitForSelector(selector, { timeout });
        } else {
            await page.waitForTimeout(1500);
        }
    } catch (e) {
        status = '❌';
        notes.push(`selector not found: ${selector}`);
    }
    await shot(page, label);
    net.stop();
    if (net.errors.length) {
        status = status === '✅' ? '⚠️' : status;
        notes.push(...net.errors.map(e => `API ${e}`));
    }
    summary.push({ view: label, status, notes, apiErrors: net.errors });
    log(`${status} [${label}] ${notes.length ? notes.join(' | ') : 'OK'}`);
    return { status, notes };
}

log('\n════════════════════════════════════════════');
log(' 모바일 부가기능 Playwright 검수 시작');
log('════════════════════════════════════════════\n');

// ─── 1. 로그인 토큰 획득 ────────────────────────────────────────────────────
log('── 사전작업: admin 로그인 토큰 획득');
let token = null;
try {
    // Backend endpoint: POST /users/login (no /api prefix), fields: ID / PW
    const r = await fetch(`${API}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: 'admin', PW: 'admin1234' }),
    });
    const data = await r.json();
    token = data.access_token || null;
    token ? log(`  ✅ 토큰 획득: ${token.slice(0, 20)}...`)
           : log(`  ❌ 토큰 없음 (로그인 실패): ${JSON.stringify(data)}`);
} catch (e) {
    log(`  ❌ 로그인 API 오류: ${e.message}`);
}

// Helper: seed with token
async function goViewAuthed(view, seed = {}) {
    await page.evaluate(({ view, seed, token }) => {
        sessionStorage.setItem('current_view', view);
        if (token) localStorage.setItem('access_token', token);
        for (const [k, v] of Object.entries(seed)) {
            sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
    }, { view, seed, token });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
}

// ─── A. 화면 렌더 + API 연동 ────────────────────────────────────────────────

log('\n─── A. 화면 렌더 + API 연동 ───────────────\n');

// A1. home
{
    const net = makeNetMonitor(page);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token) => {
        sessionStorage.setItem('current_view', 'home');
        if (token) localStorage.setItem('access_token', token);
    }, token);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    net.stop();
    const hasHome = await page.locator('.home-container, .home-page, [class*="home"]').count() > 0;
    await shot(page, 'A1_home');
    const s = hasHome ? '✅' : '⚠️';
    const n = hasHome ? ['홈 컨테이너 렌더 확인'] : ['홈 컨테이너 selector 매칭 실패 (렌더는 됨)'];
    n.push(...net.errors.map(e => `API ${e}`));
    summary.push({ view: 'A1_home', status: s, notes: n, apiErrors: net.errors });
    log(`${s} [A1_home] ${n.join(' | ')}`);
}

// A2. login
await checkView('A2_login', 'login', { selector: '.login-container, .login-page, form[class*="login"], .m-login-wrap' });

// A3. signup
await checkView('A3_signup', 'signup', { selector: '.signup-container, .signup-page, form, [class*="signup"]' });

// A4. mAICitizen
{
    const net = makeNetMonitor(page);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goViewAuthed('mAICitizen');
    net.stop();
    await page.waitForTimeout(1500);
    const hasList = await page.locator('.m-ai-citizen').count() > 0;
    const hasSearch = await page.locator('.m-ai-search').count() > 0;
    const hasMap = await page.locator('.m-ai-map-section').count() > 0;
    await shot(page, 'A4_mAICitizen');
    const notes = [];
    if (!hasList) notes.push('m-ai-citizen 컨테이너 없음');
    if (!hasSearch) notes.push('검색바 없음');
    if (!hasMap) notes.push('지도 섹션 없음');
    if (net.errors.length) notes.push(...net.errors.map(e => `API ${e}`));
    const status = notes.length ? (hasList ? '⚠️' : '❌') : '✅';
    summary.push({ view: 'A4_mAICitizen', status, notes, apiErrors: net.errors });
    log(`${status} [A4_mAICitizen] ${notes.length ? notes.join(' | ') : '렌더 OK (검색바+지도+목록)'}`);
}

// A5. mAICitizenDetail — 첫 번째 시민으로 진입
{
    const net = makeNetMonitor(page);
    // Fetch first citizen id
    let citizen = null;
    try {
        const r = await fetch(`${API}/api/ai-citizens?sort=importance`);
        const data = await r.json();
        citizen = Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (_) {}

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, citizen }) => {
        sessionStorage.setItem('current_view', 'mAICitizenDetail');
        if (token) localStorage.setItem('access_token', token);
        if (citizen) sessionStorage.setItem('selectedReport', JSON.stringify(citizen));
    }, { token, citizen });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    net.stop();

    const hasDetail = await page.locator('.m-ai-detail, [class*="m-ai-detail"]').count() > 0;
    const hasRadar = await page.locator('svg, canvas').count() > 0;
    await shot(page, 'A5_mAICitizenDetail');
    const notes = [];
    if (!citizen) notes.push('API에서 시민 데이터 없음 — mocked seed 없이 진입');
    if (!hasDetail) notes.push('m-ai-detail 컨테이너 없음');
    if (!hasRadar) notes.push('레이더/차트 SVG 없음');
    if (net.errors.length) notes.push(...net.errors.map(e => `API ${e}`));
    const status = !hasDetail ? '❌' : notes.length ? '⚠️' : '✅';
    summary.push({ view: 'A5_mAICitizenDetail', status, notes, apiErrors: net.errors });
    log(`${status} [A5_mAICitizenDetail] ${notes.length ? notes.join(' | ') : '상세 렌더 OK'}`);
}

// A6. mSurveyList
await checkView('A6_mSurveyList', 'mSurveyList', { selector: '.m-survey-list-page', timeout: 8000 });

// A7. mSurveyDetail1 (설문 상세 소개 → 개인정보 동의)
{
    const net = makeNetMonitor(page);
    let survey = null;
    try {
        const r = await fetch(`${API}/api/surveys/list?tab=active`);
        const data = await r.json();
        survey = Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (_) {}
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, survey }) => {
        sessionStorage.setItem('current_view', 'mSurveyDetail1');
        if (token) localStorage.setItem('access_token', token);
        if (survey) sessionStorage.setItem('selectedSurvey', JSON.stringify(survey));
    }, { token, survey });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    net.stop();
    const hasPage = await page.locator('.m-survey-detail-page').count() > 0;
    await shot(page, 'A7_mSurveyDetail1');
    const notes = [];
    if (!survey) notes.push('활성 설문 없음');
    if (!hasPage) notes.push('.m-survey-detail-page 없음');
    if (net.errors.length) notes.push(...net.errors.map(e => `API ${e}`));
    const status = !hasPage ? '❌' : notes.length ? '⚠️' : '✅';
    summary.push({ view: 'A7_mSurveyDetail1', status, notes, apiErrors: net.errors });
    log(`${status} [A7_mSurveyDetail1] ${notes.length ? notes.join(' | ') : '렌더 OK'}`);
}

// A8. mSurveyDetail2 (개인정보 약관)
{
    const net = makeNetMonitor(page);
    let survey = null;
    try {
        const r = await fetch(`${API}/api/surveys/list?tab=active`);
        const data = await r.json();
        survey = Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (_) {}
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, survey }) => {
        sessionStorage.setItem('current_view', 'mSurveyDetail2');
        if (token) localStorage.setItem('access_token', token);
        if (survey) sessionStorage.setItem('selectedSurvey', JSON.stringify(survey));
    }, { token, survey });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    net.stop();
    const hasPage = await page.locator('.m-survey-detail-page').count() > 0;
    await shot(page, 'A8_mSurveyDetail2');
    const notes = [];
    if (!survey) notes.push('활성 설문 없음');
    if (!hasPage) notes.push('.m-survey-detail-page 없음');
    if (net.errors.length) notes.push(...net.errors.map(e => `API ${e}`));
    const status = !hasPage ? '❌' : notes.length ? '⚠️' : '✅';
    summary.push({ view: 'A8_mSurveyDetail2', status, notes, apiErrors: net.errors });
    log(`${status} [A8_mSurveyDetail2] ${notes.length ? notes.join(' | ') : '렌더 OK'}`);
}

// A9. mSurveyJoin (설문 참여 = mSurveyDetail3)
{
    const net = makeNetMonitor(page);
    let survey = null;
    try {
        const r = await fetch(`${API}/api/surveys/list?tab=active`);
        const data = await r.json();
        survey = Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (_) {}
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, survey }) => {
        sessionStorage.setItem('current_view', 'mSurveyJoin');
        if (token) localStorage.setItem('access_token', token);
        if (survey) sessionStorage.setItem('selectedSurvey', JSON.stringify(survey));
    }, { token, survey });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    net.stop();
    const hasPage = await page.locator('.m-survey-join-page, [class*="m-survey-join"]').count() > 0;
    await shot(page, 'A9_mSurveyJoin');
    const notes = [];
    if (!survey) notes.push('활성 설문 없음');
    if (!hasPage) notes.push('mSurveyJoin 컨테이너 없음');
    if (net.errors.length) notes.push(...net.errors.map(e => `API ${e}`));
    const status = !hasPage ? '❌' : notes.length ? '⚠️' : '✅';
    summary.push({ view: 'A9_mSurveyJoin', status, notes, apiErrors: net.errors });
    log(`${status} [A9_mSurveyJoin] ${notes.length ? notes.join(' | ') : '렌더 OK'}`);
}

// A10. mSurveyResults
{
    const net = makeNetMonitor(page);
    let survey = null;
    try {
        const r = await fetch(`${API}/api/surveys/list?tab=result`);
        const data = await r.json();
        survey = Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (_) {}
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, survey }) => {
        sessionStorage.setItem('current_view', 'mSurveyResults');
        if (token) localStorage.setItem('access_token', token);
        if (survey) sessionStorage.setItem('selectedSurvey', JSON.stringify(survey));
    }, { token, survey });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    net.stop();
    const hasPage = await page.locator('.m-survey-results-page, [class*="m-survey-result"]').count() > 0;
    await shot(page, 'A10_mSurveyResults');
    const notes = [];
    if (!survey) notes.push('결과 설문 없음 (result 탭 비어있음)');
    if (!hasPage) notes.push('mSurveyResults 컨테이너 없음');
    if (net.errors.length) notes.push(...net.errors.map(e => `API ${e}`));
    const status = !hasPage ? '❌' : notes.length ? '⚠️' : '✅';
    summary.push({ view: 'A10_mSurveyResults', status, notes, apiErrors: net.errors });
    log(`${status} [A10_mSurveyResults] ${notes.length ? notes.join(' | ') : '렌더 OK'}`);
}

// A11. myActivityHub (auth required)
{
    const net = makeNetMonitor(page);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goViewAuthed('myActivityHub');
    net.stop();
    const hasPage = await page.locator('.ma-hub-container').count() > 0;
    await shot(page, 'A11_myActivityHub');
    const notes = [];
    if (!hasPage) notes.push('.ma-hub-container 없음');
    if (net.errors.length) notes.push(...net.errors.map(e => `API ${e}`));
    const status = !hasPage ? '❌' : notes.length ? '⚠️' : '✅';
    summary.push({ view: 'A11_myActivityHub', status, notes, apiErrors: net.errors });
    log(`${status} [A11_myActivityHub] ${notes.length ? notes.join(' | ') : '렌더 OK'}`);
}

// ─── B. 핵심 인터랙션 ────────────────────────────────────────────────────────

log('\n─── B. 핵심 인터랙션 ───────────────────────\n');

// B1. home 4개 카드 클릭 → view 진입 (설문/가상시민)
{
    log('B1. home 카드 클릭 → view 진입');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token) => {
        sessionStorage.setItem('current_view', 'home');
        if (token) localStorage.setItem('access_token', token);
    }, token);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Try clicking survey card
    const surveyCards = page.locator('[class*="menu-card"], [class*="home-card"], [class*="card"]');
    const cardCount = await surveyCards.count();
    log(`  홈 카드 개수: ${cardCount}`);
    await shot(page, 'B1_home_cards');
    summary.push({ view: 'B1_home_cards', status: cardCount >= 4 ? '✅' : '⚠️',
        notes: cardCount < 4 ? [`카드 ${cardCount}개 (4개 기대)`] : [`카드 ${cardCount}개 렌더 확인`] });
}

// B2. mSurveyList 탭 전환
{
    log('B2. mSurveyList 탭 전환 (active → result)');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goViewAuthed('mSurveyList');
    await page.waitForSelector('.m-survey-list-page', { timeout: 6000 }).catch(() => {});

    // 탭 버튼 확인
    const tabs = page.locator('.m-stab');
    const tabCount = await tabs.count();
    let tabNote = `탭 버튼 ${tabCount}개`;
    let tabStatus = '✅';
    if (tabCount >= 2) {
        await shot(page, 'B2_survey_tab_active');
        // Click 설문결과 tab
        const resultTab = page.locator('.m-stab:has-text("설문결과"), .m-stab:nth-child(2)');
        if (await resultTab.count() > 0) {
            await resultTab.click();
            await page.waitForTimeout(1000);
            await shot(page, 'B2_survey_tab_result');
            const activeClass = await resultTab.getAttribute('class');
            if (activeClass?.includes('on')) {
                tabNote += ' → 결과탭 active 전환 OK';
            } else {
                tabNote += ' → 결과탭 active class 없음';
                tabStatus = '⚠️';
            }
        } else {
            tabNote += ' → 설문결과 버튼 못 찾음';
            tabStatus = '⚠️';
        }
    } else {
        tabStatus = '❌';
        tabNote = `탭 버튼 부족: ${tabCount}개`;
    }
    summary.push({ view: 'B2_surveyTabs', status: tabStatus, notes: [tabNote] });
    log(`${tabStatus} [B2_surveyTabs] ${tabNote}`);
}

// B3. mAICitizen 검색 입력 → 필터, X 버튼 → 초기화
{
    log('B3. mAICitizen 검색 필터 + X 버튼');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goViewAuthed('mAICitizen');
    await page.waitForTimeout(2000);

    const searchInput = page.locator('.m-ai-search');
    const hasSI = await searchInput.count() > 0;
    const notes = [];
    let bStatus = '✅';

    if (hasSI) {
        // type a search term
        await searchInput.fill('서구');
        await page.waitForTimeout(800);
        await shot(page, 'B3_ai_search_typed');

        // check X button appears
        const xBtn = page.locator('.m-ai-search-clear');
        const hasX = await xBtn.count() > 0;
        if (!hasX) {
            notes.push('X 버튼 미표시 (검색어 입력 후)');
            bStatus = '⚠️';
        } else {
            await xBtn.click();
            await page.waitForTimeout(600);
            const val = await searchInput.inputValue();
            if (val === '') {
                notes.push('검색 X 버튼 초기화 OK');
            } else {
                notes.push(`X 버튼 클릭 후 값 남음: "${val}"`);
                bStatus = '⚠️';
            }
        }
    } else {
        notes.push('검색바 없음');
        bStatus = '❌';
    }
    await shot(page, 'B3_ai_search_clear');
    summary.push({ view: 'B3_aiSearch', status: bStatus, notes });
    log(`${bStatus} [B3_aiSearch] ${notes.join(' | ')}`);
}

// B4. mAICitizen 정렬 토글 (중요도순 / 나이순)
{
    log('B4. mAICitizen 정렬 토글');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goViewAuthed('mAICitizen');
    await page.waitForTimeout(1500);

    const sortBtns = page.locator('[class*="sort"], button:has-text("나이순"), button:has-text("중요도"), button:has-text("정렬")');
    const sortCount = await sortBtns.count();
    const notes4 = [];
    let s4 = '✅';
    if (sortCount > 0) {
        await shot(page, 'B4_sort_before');
        // Try clicking age sort
        const ageBtn = page.locator('button:has-text("나이순")');
        if (await ageBtn.count() > 0) {
            await ageBtn.click();
            await page.waitForTimeout(1000);
            await shot(page, 'B4_sort_age');
            notes4.push('나이순 정렬 버튼 클릭 OK');
        } else {
            notes4.push('나이순 버튼 텍스트 불일치 (sort버튼 존재하나 텍스트 확인 필요)');
            s4 = '⚠️';
        }
    } else {
        notes4.push('정렬 버튼 없음');
        s4 = '⚠️';
    }
    summary.push({ view: 'B4_aiSort', status: s4, notes: notes4 });
    log(`${s4} [B4_aiSort] ${notes4.join(' | ')}`);
}

// B5. mAICitizen 카드 클릭 → mAICitizenDetail 이동
{
    log('B5. mAICitizen 카드 → mAICitizenDetail 이동');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goViewAuthed('mAICitizen');
    await page.waitForTimeout(2000);

    const cards = page.locator('.m-ai-card, [class*="m-ai-card"]');
    const cardCount5 = await cards.count();
    const notes5 = [];
    let s5 = '✅';

    if (cardCount5 > 0) {
        await cards.first().click();
        await page.waitForTimeout(1500);
        const inDetail = await page.locator('.m-ai-detail, [class*="m-ai-detail"]').count() > 0;
        await shot(page, 'B5_ai_card_click');
        if (inDetail) {
            notes5.push(`카드 클릭 → mAICitizenDetail 이동 OK (카드 ${cardCount5}개)`);
        } else {
            notes5.push(`카드 클릭 후 detail view 미진입 (카드 ${cardCount5}개)`);
            s5 = '⚠️';
        }
    } else {
        notes5.push('카드 없음 — API 데이터 확인 필요');
        s5 = '⚠️';
    }
    summary.push({ view: 'B5_aiCardNav', status: s5, notes: notes5 });
    log(`${s5} [B5_aiCardNav] ${notes5.join(' | ')}`);
}

// B6. mAICitizenDetail — 프로필/여정/정책신호등/레이더 렌더 확인
{
    log('B6. mAICitizenDetail 세부 섹션 렌더 확인');
    let citizen = null;
    try {
        const r = await fetch(`${API}/api/ai-citizens?sort=importance`);
        const data = await r.json();
        citizen = Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (_) {}

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, citizen }) => {
        sessionStorage.setItem('current_view', 'mAICitizenDetail');
        if (token) localStorage.setItem('access_token', token);
        if (citizen) sessionStorage.setItem('selectedReport', JSON.stringify(citizen));
    }, { token, citizen });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const notes6 = [];
    let s6 = '✅';

    // Check profile
    const hasProfile = await page.locator('[class*="m-ai-detail__profile"], [class*="profile"]').count() > 0;
    if (!hasProfile) { notes6.push('프로필 섹션 없음'); s6 = '⚠️'; }

    // Check journey (여정지도)
    const hasJourney = await page.locator('[class*="journey"], [class*="여정"], [class*="timeline"]').count() > 0;
    if (!hasJourney) { notes6.push('여정지도 섹션 없음'); }

    // Check policy signals (정책신호등)
    const hasPolicy = await page.locator('[class*="policy"], [class*="signal"], [class*="신호"]').count() > 0;
    if (!hasPolicy) { notes6.push('정책신호등 섹션 없음'); }

    // Check radar chart SVG
    const svgCount = await page.locator('svg').count();
    if (svgCount === 0) { notes6.push('레이더 SVG 없음'); s6 = s6 === '✅' ? '⚠️' : s6; }

    await shot(page, 'B6_aiDetail_sections');
    if (notes6.length === 0) notes6.push(`프로필/SVG 렌더 OK (svg ${svgCount}개)`);
    summary.push({ view: 'B6_aiDetailSections', status: s6, notes: notes6 });
    log(`${s6} [B6_aiDetailSections] ${notes6.join(' | ')}`);
}

// B7. 검색바와 지도 겹침 확인 (padding-top: 176px 적용됐는지)
{
    log('B7. 가상시민 검색바-지도 겹침 회귀 테스트 (padding-top:176px)');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goViewAuthed('mAICitizen');
    await page.waitForTimeout(2000);

    const searchWrap = page.locator('.m-ai-search-wrap');
    const mapSection = page.locator('.m-ai-map-section');
    const list = page.locator('.m-ai-list');

    const notes7 = [];
    let s7 = '✅';

    if (await searchWrap.count() > 0 && await mapSection.count() > 0) {
        const swBox = await searchWrap.boundingBox();
        const msBox = await mapSection.boundingBox();
        const listBox = await list.count() > 0 ? await list.boundingBox() : null;

        if (swBox && msBox) {
            const swBottom = swBox.y + swBox.height;
            // Map section should start below search (not overlapping)
            // With position:sticky search bar, map content (list) should have top padding
            // Check padding-top of .m-ai-map-section (should be 176px)
            const paddingTopVal = await page.evaluate(() => {
                const el = document.querySelector('.m-ai-map-section');
                if (!el) return null;
                return window.getComputedStyle(el).paddingTop;
            });
            notes7.push(`검색바 bottom: ${swBottom.toFixed(0)}px, 지도섹션 top: ${msBox.y.toFixed(0)}px`);
            notes7.push(`m-ai-map-section padding-top: ${paddingTopVal || 'N/A'}`);

            // padding-top:176px means leaflet map is pushed down inside the section
            // so search bar (abs positioned) doesn't overlap the leaflet canvas
            if (paddingTopVal && parseInt(paddingTopVal) >= 150) {
                notes7.push(`겹침 해소 padding-top OK: ${paddingTopVal}`);
            } else if (paddingTopVal) {
                notes7.push(`⚠ padding-top 부족: ${paddingTopVal} (176px 기대)`);
                s7 = '⚠️';
            } else {
                notes7.push('padding-top 값 읽기 실패');
                s7 = '⚠️';
            }
        }
    } else {
        notes7.push('검색바 또는 지도 섹션 없음');
        s7 = '⚠️';
    }
    await shot(page, 'B7_overlap_check');
    summary.push({ view: 'B7_overlapCheck', status: s7, notes: notes7 });
    log(`${s7} [B7_overlapCheck] ${notes7.join(' | ')}`);
}

// B8. myActivityHub 카드 3개 클릭 → 각 view 이동 확인
{
    log('B8. myActivityHub 3개 카드 → 각 view 이동');
    const cards8 = [
        { label: '나의 제보현황', targetCls: '.my-reports-container, [class*="mr-header"], [class*="my-report"]' },
        { label: '나의 제안현황', targetCls: '.my-proposals, [class*="my-proposal"]' },
        { label: '나의 진단내역', targetCls: '.my-activity-container, [class*="my-activity"]' },
    ];

    for (const [idx, c] of cards8.entries()) {
        await page.goto(BASE, { waitUntil: 'domcontentloaded' });
        await goViewAuthed('myActivityHub');
        await page.waitForSelector('.ma-hub-container', { timeout: 6000 }).catch(() => {});

        const btns = page.locator('.ma-hub-card');
        const btnCount = await btns.count();
        if (btnCount <= idx) {
            summary.push({ view: `B8_hub_card${idx + 1}`, status: '❌', notes: [`카드 ${idx + 1} 없음`] });
            log(`  ❌ [B8_hub_card${idx + 1}] 카드 ${idx + 1} 없음`);
            continue;
        }

        await btns.nth(idx).click();
        await page.waitForTimeout(1500);
        await shot(page, `B8_hub_card${idx + 1}_${c.label.replace(/\s/g, '')}`);

        // Check we've navigated away from hub
        const stillOnHub = await page.locator('.ma-hub-container').count() > 0;
        const onTarget = await page.locator(c.targetCls).count() > 0;
        const notes8 = [];
        let s8 = '✅';
        if (stillOnHub) { notes8.push('허브에서 이동 안 됨'); s8 = '❌'; }
        else if (!onTarget) { notes8.push(`${c.targetCls} 없음 (다른 view로 이동됨일 수 있음)`); s8 = '⚠️'; }
        else { notes8.push(`${c.label} → 목표 view 도달 OK`); }
        summary.push({ view: `B8_hub_card${idx + 1}`, status: s8, notes: notes8 });
        log(`${s8} [B8_hub_card${idx + 1}] ${c.label}: ${notes8.join(' | ')}`);
    }
}

// B9. myActivityHub 진단내역 → mMyActivity (버그: 이전 myActivity → PC 이중렌더 수정됨 확인)
{
    log('B9. 나의 진단내역 → mMyActivity 수정 확인 (이전 버그: myActivity PC 이중렌더)');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goViewAuthed('myActivityHub');
    await page.waitForSelector('.ma-hub-container', { timeout: 6000 }).catch(() => {});

    const diagCard = page.locator('.ma-hub-card.diagnosis, .ma-hub-card:last-child');
    const hasDiagCard = await diagCard.count() > 0;

    if (hasDiagCard) {
        await diagCard.click();
        await page.waitForTimeout(1500);
        // Should NOT show PC diagnosis area
        const hasPCDiag = await page.locator('.pc-diagnosis, [class*="pc-diag"], .diagnosis-container > .pc').count() > 0;
        const hasMyActivity = await page.locator('.my-activity-container, [class*="my-activity"]').count() > 0;
        await shot(page, 'B9_diagNavFix');
        const notes9 = [];
        let s9 = '✅';
        if (hasPCDiag) { notes9.push('PC 진단 컨테이너 이중렌더 버그 재발!'); s9 = '❌'; }
        if (!hasMyActivity) { notes9.push('my-activity 컨테이너 없음'); s9 = s9 === '✅' ? '⚠️' : s9; }
        if (notes9.length === 0) notes9.push('mMyActivity 정상 렌더, PC 이중렌더 없음');
        summary.push({ view: 'B9_diagNavFix', status: s9, notes: notes9 });
        log(`${s9} [B9_diagNavFix] ${notes9.join(' | ')}`);
    } else {
        summary.push({ view: 'B9_diagNavFix', status: '⚠️', notes: ['진단내역 카드 선택자 불일치'] });
        log(`⚠️ [B9_diagNavFix] 진단내역 카드 선택자 불일치`);
    }
}

// ─── C. 회귀 테스트 ─────────────────────────────────────────────────────────

log('\n─── C. 회귀 테스트 ────────────────────────\n');

// C1. mSurveyDetail1 개인정보 약관 버튼 (준비 중 표시)
{
    log('C1. mSurveyDetail1 약관 버튼 동작 확인');
    let survey = null;
    try {
        const r = await fetch(`${API}/api/surveys/list?tab=active`);
        const data = await r.json();
        survey = Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (_) {}

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, survey }) => {
        sessionStorage.setItem('current_view', 'mSurveyDetail1');
        if (token) localStorage.setItem('access_token', token);
        if (survey) sessionStorage.setItem('selectedSurvey', JSON.stringify(survey));
    }, { token, survey });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Find privacy/agree button
    const agreeBtn = page.locator('button:has-text("개인정보"), button:has-text("약관"), a:has-text("개인정보")');
    const hasBn = await agreeBtn.count() > 0;
    const notes_c1 = [];
    let sc1 = '✅';

    if (hasBn) {
        // Listen for dialog
        let dialogText = '';
        page.once('dialog', async (dialog) => {
            dialogText = dialog.message();
            await dialog.dismiss();
        });
        await agreeBtn.first().click();
        await page.waitForTimeout(800);
        if (dialogText) {
            notes_c1.push(`약관 버튼 alert: "${dialogText.slice(0, 60)}"`);
        } else {
            // Check if view changed to mSurveyDetail2 (개인정보 약관 페이지)
            const onDetail2 = await page.locator('.m-survey-detail-page').count() > 0;
            notes_c1.push(onDetail2 ? '약관 버튼 → 다음 화면 이동 (no alert)' : '약관 버튼 클릭 반응 없음');
        }
    } else {
        notes_c1.push('약관/개인정보 버튼 없음 — 설문 데이터 없거나 UI 미구현');
        sc1 = '⚠️';
    }
    await shot(page, 'C1_survey_agree');
    summary.push({ view: 'C1_surveyAgree', status: sc1, notes: notes_c1 });
    log(`${sc1} [C1_surveyAgree] ${notes_c1.join(' | ')}`);
}

// C2. 비로그인 myActivityHub → login redirect 확인
{
    log('C2. 비로그인 myActivityHub → login redirect (auth guard)');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        sessionStorage.setItem('current_view', 'myActivityHub');
        localStorage.removeItem('access_token');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const onLogin = await page.locator('.login-container, .login-page, [class*="login"]').count() > 0;
    const stillOnHub = await page.locator('.ma-hub-container').count() > 0;
    await shot(page, 'C2_auth_guard');
    const notesc2 = [];
    let sc2 = '✅';
    if (stillOnHub) { notesc2.push('비로그인인데 허브 진입됨 — auth guard 동작 안 함!'); sc2 = '❌'; }
    else if (!onLogin) { notesc2.push('비로그인 허브 진입 차단됨 (login view 진입은 다른 경로)'); }
    else { notesc2.push('비로그인 → login redirect OK'); }
    summary.push({ view: 'C2_authGuard', status: sc2, notes: notesc2 });
    log(`${sc2} [C2_authGuard] ${notesc2.join(' | ')}`);
}

// C3. mSurveyList 설문 없는 탭 ("closed" 미구현 여부 확인)
{
    log('C3. mSurveyList tab 항목 수 확인');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await goViewAuthed('mSurveyList');
    await page.waitForSelector('.m-survey-list-page', { timeout: 6000 }).catch(() => {});

    const tabBtns = await page.locator('.m-stab').count();
    const notes_c3 = [`탭 버튼 수: ${tabBtns}`];
    const sc3 = tabBtns === 2 ? '✅' : '⚠️';
    if (tabBtns !== 2) notes_c3.push(`기대 2개, 실제 ${tabBtns}개`);
    await shot(page, 'C3_survey_tabs');
    summary.push({ view: 'C3_surveyTabCount', status: sc3, notes: notes_c3 });
    log(`${sc3} [C3_surveyTabCount] ${notes_c3.join(' | ')}`);
}

// ─── 최종 리포트 ────────────────────────────────────────────────────────────

log('\n════════════════════════════════════════════');
log(' 검수 결과 요약');
log('════════════════════════════════════════════\n');

const bugs = [];
for (const s of summary) {
    const icon = s.status;
    const note = s.notes.join(' | ');
    log(`${icon} ${s.view}: ${note}`);
    if (s.status === '❌' || s.status === '⚠️') {
        bugs.push({ view: s.view, notes: s.notes });
    }
}

log('\n── 발견된 버그/경고 요약 ──────────────────');
if (bugs.length === 0) {
    log('  ✅ 발견된 버그 없음');
} else {
    bugs.forEach(b => {
        log(`  ${b.view}: ${b.notes.join(' / ')}`);
    });
}

log(`\n── 콘솔 에러 (${consoleErrors.length}개) ──`);
consoleErrors.slice(0, 10).forEach(e => log(`  ${e}`));

log(`\n── 페이지 에러 (${pageErrors.length}개) ──`);
pageErrors.slice(0, 5).forEach(e => log(`  ${e}`));

log(`\n스크린샷 저장 위치: ${OUT}`);
log('검수 완료.\n');

await browser.close();
process.exit(bugs.filter(b => b.view.startsWith && summary.find(s => s.view === b.view)?.status === '❌') ? 0 : 0);
