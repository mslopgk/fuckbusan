/**
 * audit_d_auth_nav.mjs
 * 인증·네비게이션·허브 라우팅 실증 검사 (수정 금지 — 발견된 문제 리스트업만)
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
const bugs = [];
function log(msg)  { console.log(msg); }
function ok(id, note)   { log(`  ✅ [${id}] ${note}`); }
function fail(id, note) { log(`  ❌ [${id}] ${note}`); bugs.push({ id, note }); }
function warn(id, note) { log(`  ⚠️  [${id}] ${note}`); }

async function shot(page, name) {
    const p = path.join(OUT, `audit_d_${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    return p;
}

async function goView(page, view, extra = {}) {
    await page.evaluate(({ view, extra }) => {
        sessionStorage.setItem('current_view', view);
        for (const [k, v] of Object.entries(extra)) {
            sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
    }, { view, extra });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
}

async function setToken(page, token) {
    await page.evaluate((t) => { localStorage.setItem('access_token', t); }, token);
}

async function clearAuth(page) {
    await page.evaluate(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        localStorage.removeItem('user_name');
        localStorage.removeItem('district_code');
        sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
}

function currentView(page) {
    return page.evaluate(() => sessionStorage.getItem('current_view'));
}

// ─── browser setup ─────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
});
const page = await ctx.newPage();

// suppress Kakao map noise
page.on('console', () => {});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

// ─── 0. API 직접 확인: 회원가입용 계정 준비 ────────────────────────────────────
log('\n=== 0. 테스트 계정 생성 ===');
const testUser = { ID: `audituser_${Date.now()}`, PW: 'Audit1234!', name: '감사자', phone_num: '01099998888', district_code: 'general' };
let userToken = null;
let adminToken = null;

// admin 로그인
try {
    const r = await fetch(`${API}/users/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: 'admin', PW: 'admin1234' })
    });
    if (r.ok) {
        const d = await r.json();
        adminToken = d.access_token;
        ok('admin-login-api', `admin 토큰 획득 OK`);
    } else {
        fail('admin-login-api', `admin 로그인 실패 ${r.status}`);
    }
} catch (e) { fail('admin-login-api', `요청 오류: ${e.message}`); }

// ─── 1. 회원가입 ───────────────────────────────────────────────────────────────
log('\n=== 1. 회원가입 ===');

// 1-1. 신규 유저 signup API + 자동 로그인 여부
try {
    const r = await fetch(`${API}/users/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });
    if (r.status === 201 || r.ok) {
        ok('1-1-signup-api', `201 응답 OK`);
        // 자동 로그인: access_token 반환 여부
        const d = await r.json();
        if (d.access_token) {
            userToken = d.access_token;
            ok('1-1-autologin', `signup 응답에 access_token 포함 → 자동 로그인 가능`);
        } else {
            warn('1-1-autologin', `signup 응답에 access_token 없음 — signupDone 화면으로 이동 후 수동 로그인 필요`);
        }
    } else {
        fail('1-1-signup-api', `예상 201, 실제 ${r.status}`);
    }
} catch (e) { fail('1-1-signup-api', `요청 오류: ${e.message}`); }

// 1-1. UI 회원가입 흐름: signupDone 이동 + 자동 로그인 여부
await clearAuth(page);
await goView(page, 'signup');
const signupViewAfterLoad = await currentView(page);
if (signupViewAfterLoad === 'signup') {
    // signupDone 진입 후 access_token 확인
    await goView(page, 'signupDone');
    const tokenAfterDone = await page.evaluate(() => localStorage.getItem('access_token'));
    if (tokenAfterDone) {
        ok('1-1-ui-autologin', `signupDone 직후 access_token 존재`);
    } else {
        warn('1-1-ui-autologin', `signupDone 직후 access_token 없음 — UI 자동 로그인 미구현`);
    }
} else {
    warn('1-1-ui', `signup view seeding 불안정 (got ${signupViewAfterLoad})`);
}
await shot(page, '1_signupDone');

// 1-2. 중복 ID 회원가입
try {
    const r = await fetch(`${API}/users/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser) // 동일 ID 재시도
    });
    if (r.status === 409 || r.status === 400 || r.status === 422) {
        ok('1-2-dup-id', `중복 ID → ${r.status} 응답 OK`);
    } else if (!r.ok) {
        ok('1-2-dup-id', `중복 ID → ${r.status} 에러 응답 (non-2xx)`);
    } else {
        fail('1-2-dup-id', `중복 ID인데 ${r.status} 성공 응답 — 서버 중복 검사 없음`);
    }
} catch (e) { fail('1-2-dup-id', `요청 오류: ${e.message}`); }

// 1-3. 비밀번호 일치 검사 (UI)
await goView(page, 'signup');
await page.waitForTimeout(800);
// 비밀번호 입력 필드 확인
const pwField = page.locator('input[name="password"], input[type="password"]').first();
const pwConfirmField = page.locator('input[name="passwordConfirm"], input[placeholder*="확인"], input[placeholder*="비밀번호 확인"]').first();
const hasPwConfirm = await pwConfirmField.count() > 0;
if (hasPwConfirm) {
    ok('1-3-pw-confirm', `비밀번호 확인 필드 존재`);
} else {
    fail('1-3-pw-confirm', `비밀번호 확인 필드 없음`);
}
await shot(page, '1_signupForm');

// 1-4. 필수 필드 누락 시 버튼 비활성 여부 확인
const submitBtn = page.locator('button[type="submit"], button:has-text("가입"), button:has-text("회원가입")').first();
const isDisabled = await submitBtn.getAttribute('disabled') !== null ||
    await submitBtn.evaluate(el => el.disabled || el.classList.contains('disabled') || el.style.opacity === '0.5');
if (isDisabled) {
    ok('1-4-required-fields', `필수 필드 미입력 시 버튼 비활성화 확인`);
} else {
    warn('1-4-required-fields', `버튼 비활성화 상태 불명확 — 클릭 시 검증 로직 의존`);
}

// ─── 2. 로그인 ─────────────────────────────────────────────────────────────────
log('\n=== 2. 로그인 ===');

// 일반 유저 토큰 획득 (아직 없으면 로그인)
if (!userToken) {
    try {
        const r = await fetch(`${API}/users/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ID: testUser.ID, PW: testUser.PW })
        });
        if (r.ok) {
            const d = await r.json();
            userToken = d.access_token;
        }
    } catch {}
}

// 2-1. 일반 유저 로그인 → access_token localStorage + home 이동
await clearAuth(page);
await goView(page, 'login');
await page.waitForTimeout(500);
const idInput = page.locator('input[name="id"], input[placeholder*="아이디"]').first();
const pwInput = page.locator('input[name="password"], input[type="password"]').first();
try {
    await idInput.fill(testUser.ID);
    await pwInput.fill(testUser.PW);
    await page.locator('button:has-text("로그인")').first().click();
    await page.waitForTimeout(1500);
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const cv = await currentView(page);
    if (token) {
        ok('2-1-login-token', `access_token localStorage 저장 OK`);
    } else {
        fail('2-1-login-token', `로그인 후 access_token 없음`);
    }
    if (cv === 'home') {
        ok('2-1-login-home', `로그인 후 home 이동 OK`);
    } else {
        fail('2-1-login-home', `로그인 후 view=${cv} (home 아님)`);
    }
} catch (e) {
    fail('2-1-login-ui', `UI 로그인 오류: ${e.message}`);
}
await shot(page, '2_afterLogin');

// 2-2. admin 로그인 → adminMain 이동
await clearAuth(page);
await goView(page, 'login');
await page.waitForTimeout(500);
try {
    await page.locator('input[name="id"], input[placeholder*="아이디"]').first().fill('admin');
    await page.locator('input[name="password"], input[type="password"]').first().fill('admin1234');
    await page.locator('button:has-text("로그인")').first().click();
    await page.waitForTimeout(2000);
    const cv = await currentView(page);
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    if (token) ok('2-2-admin-token', `admin access_token 저장`);
    else fail('2-2-admin-token', `admin 로그인 후 토큰 없음`);
    // admin은 onBack() → home, 혹은 adminMain?
    if (cv === 'adminMain' || cv === 'adminLoginNew' || cv === 'home') {
        ok('2-2-admin-redirect', `admin 로그인 후 view=${cv}`);
        if (cv === 'home') warn('2-2-admin-redirect', `admin 로그인 후 home으로 이동 — adminMain 리다이렉트 없음 (Login.onBack=home)`);
    } else {
        warn('2-2-admin-redirect', `admin 로그인 후 view=${cv}`);
    }
} catch (e) { fail('2-2-admin-login', `오류: ${e.message}`); }
await shot(page, '2_adminLogin');

// 2-3. 잘못된 비밀번호 → 에러 메시지
await clearAuth(page);
await goView(page, 'login');
await page.waitForTimeout(500);

// Intercept alert
let alertMsg = null;
page.once('dialog', async d => { alertMsg = d.message(); await d.dismiss(); });
try {
    await page.locator('input[name="id"], input[placeholder*="아이디"]').first().fill(testUser.ID);
    await page.locator('input[name="password"], input[type="password"]').first().fill('WrongPass999!');
    await page.locator('button:has-text("로그인")').first().click();
    await page.waitForTimeout(1500);
    if (alertMsg) {
        ok('2-3-wrong-pw', `잘못된 비밀번호 → alert: "${alertMsg.substring(0, 50)}"`);
    } else {
        const errVisible = await page.locator('.error, .error-msg, [class*="error"]').first().isVisible().catch(() => false);
        if (errVisible) ok('2-3-wrong-pw', `잘못된 비밀번호 → 인라인 에러 표시`);
        else fail('2-3-wrong-pw', `잘못된 비밀번호인데 에러 피드백 없음`);
    }
} catch (e) { fail('2-3-wrong-pw', `오류: ${e.message}`); }

// 2-4. 빈 입력 → 버튼 비활성화/검증
await goView(page, 'login');
await page.waitForTimeout(500);
const loginBtn = page.locator('button:has-text("로그인")').first();
const loginBtnDisabled = await loginBtn.getAttribute('disabled') !== null ||
    await loginBtn.evaluate(el => el.disabled).catch(() => false);
if (loginBtnDisabled) {
    ok('2-4-empty-input', `빈 입력 시 로그인 버튼 비활성화`);
} else {
    warn('2-4-empty-input', `빈 입력 시 버튼 비활성 처리 여부 불명확 (isFormValid 로직 확인 필요)`);
}

// ─── 3. 로그아웃 + 비로그인 가드 ──────────────────────────────────────────────
log('\n=== 3. 로그아웃 + 비로그인 가드 ===');

// 3-1. 로그아웃 후 access_token 제거 확인
// 로그아웃 버튼은 Home.jsx 헤더 영역에 있음 (모바일 로그인 상태)
if (userToken) {
    await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
    await goView(page, 'home');
    await page.waitForTimeout(800);
    const logoutBtns = page.locator('button:has-text("로그아웃")');
    const count = await logoutBtns.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
        const btn = logoutBtns.nth(i);
        const vis = await btn.isVisible().catch(() => false);
        if (vis) {
            alertMsg = null;
            page.once('dialog', async d => { alertMsg = d.message(); await d.accept(); });
            await btn.click({ timeout: 5000 });
            await page.waitForTimeout(1000);
            clicked = true;
            break;
        }
    }
    if (clicked) {
        const tokenAfter = await page.evaluate(() => localStorage.getItem('access_token'));
        if (!tokenAfter) {
            ok('3-1-logout', `로그아웃 후 access_token 제거 OK`);
        } else {
            fail('3-1-logout', `로그아웃 후에도 access_token 잔존`);
        }
    } else {
        warn('3-1-logout', `모바일 뷰 홈에서 visible한 로그아웃 버튼 없음 (로그인 상태 감지 안 됨?)`);
        await page.evaluate(() => localStorage.removeItem('access_token'));
    }
    await shot(page, '3_logout');
}

// 3-2 & 3-3. 비로그인 + sessionStorage 시드로 보호 view 진입 시도
const PROTECTED_VIEWS = [
    'mDiagnosisForm', 'myActivityHub', 'myReportList', 'myProposals',
    'mMyActivity', 'mMyReportDetail', 'mMyReportEdit', 'mProposalForm', 'mReportForm'
];
await clearAuth(page);
for (const v of PROTECTED_VIEWS) {
    await page.evaluate((view) => {
        localStorage.removeItem('access_token');
        sessionStorage.setItem('current_view', view);
    }, v);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const cv = await currentView(page);
    if (cv === 'home' || cv === 'login') {
        ok(`3-guard-${v}`, `비로그인 시드 → ${cv} 리다이렉트 OK`);
    } else {
        fail(`3-guard-${v}`, `비로그인인데 ${cv}로 진입 허용 — 인증 가드 누락`);
    }
}
await shot(page, '3_authGuard');

// 3-4. 비로그인 mReportDetail / mProposalDetail 진입 → 정상 표시
const PUBLIC_VIEWS = ['mReportDetail', 'mProposalDetail'];
for (const v of PUBLIC_VIEWS) {
    await page.evaluate((view) => {
        localStorage.removeItem('access_token');
        sessionStorage.setItem('current_view', view);
    }, v);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const cv = await currentView(page);
    if (cv === v) {
        ok(`3-4-public-${v}`, `비로그인 공개 뷰 정상 진입`);
    } else if (cv === 'home' || cv === 'login') {
        fail(`3-4-public-${v}`, `비로그인 공개 뷰인데 ${cv}로 차단 — 과도한 가드`);
    } else {
        warn(`3-4-public-${v}`, `view=${cv}`);
    }
}
await shot(page, '3_publicViews');

// ─── 4. 네비게이션 흐름 ────────────────────────────────────────────────────────
log('\n=== 4. 네비게이션 흐름 ===');

// 로그인 상태 세팅
if (userToken) {
    await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
}
await goView(page, 'home');
await page.waitForTimeout(800);

// 4-1. home 메뉴 카드 4개 클릭 (제보/제안/진단/나의활동)
// Home.jsx 실제 class: report / diagnose (x2) / activity
// 제안 카드는 별도 class 없이 텍스트로 구분
const reportCard = page.locator('.action-item.card.report').first();
// 제안 카드: class="action-item card survey" or text 포함
const proposeCard = page.locator('.action-item:has-text("제안")').first();
// 진단 카드: 두 번째 .action-item.card.diagnose (첫 번째는 구버전 survey-type)
const diagCards = page.locator('.action-item.card.diagnose');
const diagCard    = diagCards.last(); // 마지막 diagnose 카드가 goDiagnose
const actCard     = page.locator('.action-item.card.activity').first();

// 제보 카드
if (await reportCard.count() > 0) {
    await reportCard.click();
    await page.waitForTimeout(1000);
    const cv = await currentView(page);
    if (cv === 'mReportMap' || cv === 'mReportList') ok('4-1-report', `홈 제보 카드 → ${cv}`);
    else fail('4-1-report', `홈 제보 카드 → ${cv} (예상: mReportMap)`);
} else {
    warn('4-1-report', `제보 카드 미발견`);
}
await shot(page, '4_home_report');
// 돌아오기
await page.evaluate((t) => { localStorage.setItem('access_token', t || ''); }, userToken || '');
await goView(page, 'home');
await page.waitForTimeout(600);

// 제안 카드
if (await proposeCard.count() > 0) {
    await proposeCard.click();
    await page.waitForTimeout(1000);
    const cv = await currentView(page);
    if (cv === 'mProposalMap' || cv === 'mProposalList') ok('4-1-propose', `홈 제안 카드 → ${cv}`);
    else fail('4-1-propose', `홈 제안 카드 → ${cv} (예상: mProposalMap)`);
} else {
    warn('4-1-propose', `제안 카드 미발견`);
}
await goView(page, 'home');
await page.waitForTimeout(600);

// 진단 카드
if (await diagCard.count() > 0) {
    await diagCard.click();
    await page.waitForTimeout(1000);
    const cv = await currentView(page);
    if (cv === 'mDiagnosisList' || cv === 'mDiagnosisForm') ok('4-1-diag', `홈 진단 카드 → ${cv}`);
    else fail('4-1-diag', `홈 진단 카드 → ${cv} (예상: mDiagnosisList)`);
} else {
    warn('4-1-diag', `진단 카드 미발견`);
}
await goView(page, 'home');
await page.waitForTimeout(600);
if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);

// 나의 활동 카드
if (await actCard.count() > 0) {
    await actCard.click();
    await page.waitForTimeout(1200);
    const cv = await currentView(page);
    if (cv === 'myActivityHub' || cv === 'login') {
        if (cv === 'myActivityHub') ok('4-1-activity', `홈 나의활동 카드 → myActivityHub`);
        else warn('4-1-activity', `나의활동 카드 → login (토큰 불인식?)`);
    } else {
        fail('4-1-activity', `홈 나의활동 카드 → ${cv} (예상: myActivityHub)`);
    }
} else {
    warn('4-1-activity', `나의활동 카드 미발견`);
}
await shot(page, '4_home_activity');

// 4-2. MobileBottomNav 5탭 클릭
if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
await goView(page, 'home');
await page.waitForTimeout(800);

const bnav = page.locator('.m-bnav, [class*="bottom-nav"], [class*="bnav"]').first();
const bnavExists = await bnav.count() > 0;
if (!bnavExists) {
    warn('4-2-bnav', `MobileBottomNav 엘리먼트 미발견 — 셀렉터 불일치 가능`);
} else {
    // 홈 탭
    const homeTab = page.locator('.m-bnav-item[data-key="home"], [class*="bnav-item"]:has-text("홈")').first();
    const surveyTab = page.locator('.m-bnav-item[data-key="survey"], [class*="bnav-item"]:has-text("설문")').first();
    const reportTab = page.locator('.m-bnav-item[data-key="report"], [class*="bnav-item"]:has-text("제보")').first();
    const diagTab   = page.locator('.m-bnav-item[data-key="diagnosis"], [class*="bnav-item"]:has-text("진단")').first();
    const actTab    = page.locator('.m-bnav-item[data-key="activity"], [class*="bnav-item"]:has-text("나의")').first();

    for (const [tabName, tab, expected] of [
        ['홈', homeTab, ['home']],
        ['설문', surveyTab, ['mSurveyList']],
        ['진단', diagTab, ['mDiagnosisList']],
        ['나의활동', actTab, ['myActivityHub']],
    ]) {
        if (await tab.count() > 0) {
            if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
            await goView(page, 'home');
            await page.waitForTimeout(600);
            await tab.click();
            await page.waitForTimeout(1000);
            const cv = await currentView(page);
            if (expected.includes(cv)) ok(`4-2-bnav-${tabName}`, `BottomNav ${tabName} → ${cv} OK`);
            else fail(`4-2-bnav-${tabName}`, `BottomNav ${tabName} → ${cv} (예상: ${expected})`);
        } else {
            warn(`4-2-bnav-${tabName}`, `${tabName} 탭 미발견`);
        }
    }
}
await shot(page, '4_bnav');

// 4-3. 제보·제안 chooser dropdown
if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
await goView(page, 'home');
await page.waitForTimeout(800);

const reportProposalTab = page.locator('.m-bnav-item[data-key="report"], [class*="bnav-item"]:has-text("제보")').first();
if (await reportProposalTab.count() > 0) {
    await reportProposalTab.click();
    await page.waitForTimeout(800);
    // chooser sheet should appear
    const chooser = page.locator('.m-bnav-chooser-sheet, [class*="chooser"]').first();
    if (await chooser.isVisible().catch(() => false)) {
        ok('4-3-chooser', `제보·제안 chooser 팝업 표시`);
        // 제보하기 클릭
        const reportBtn = page.locator('.m-bnav-chooser-card:first-child, [class*="chooser-card"]:has-text("제보")').first();
        if (await reportBtn.count() > 0) {
            await reportBtn.click();
            await page.waitForTimeout(1000);
            const cv = await currentView(page);
            if (cv === 'mReportMap') ok('4-3-chooser-report', `제보하기 → mReportMap OK`);
            else fail('4-3-chooser-report', `제보하기 → ${cv} (예상: mReportMap)`);
        }
        // 제안하기 클릭
        await goView(page, 'home');
        await page.waitForTimeout(600);
        await reportProposalTab.click();
        await page.waitForTimeout(800);
        const proposeBtn = page.locator('[class*="chooser-card"]:has-text("제안")').first();
        if (await proposeBtn.count() > 0) {
            await proposeBtn.click();
            await page.waitForTimeout(1000);
            const cv = await currentView(page);
            if (cv === 'mProposalMap') ok('4-3-chooser-propose', `제안하기 → mProposalMap OK`);
            else fail('4-3-chooser-propose', `제안하기 → ${cv} (예상: mProposalMap)`);
        }
    } else {
        fail('4-3-chooser', `제보·제안 탭 클릭 후 chooser 미표시`);
    }
} else {
    warn('4-3-chooser', `제보·제안 탭 미발견`);
}
await shot(page, '4_chooser');

// 4-4. mReportDone 버튼 분기
if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
await goView(page, 'mReportDone');
await page.waitForTimeout(800);
const myReportBtn  = page.locator('button:has-text("나의 제보"), button:has-text("나의 제보 보기")').first();
const otherReportBtn = page.locator('button:has-text("다른 제보"), button:has-text("다른 제보 보기")').first();
if (await myReportBtn.count() > 0) {
    await myReportBtn.click();
    await page.waitForTimeout(1000);
    const cv = await currentView(page);
    if (cv === 'myReportList' || cv === 'myReports') ok('4-4-report-done-my', `나의 제보 → ${cv}`);
    else fail('4-4-report-done-my', `나의 제보 → ${cv} (예상: myReportList)`);
} else {
    warn('4-4-report-done-my', `나의 제보 버튼 미발견`);
}
await goView(page, 'mReportDone');
await page.waitForTimeout(800);
if (await otherReportBtn.count() > 0) {
    await otherReportBtn.click();
    await page.waitForTimeout(1000);
    const cv = await currentView(page);
    if (cv === 'mReportList') ok('4-4-report-done-other', `다른 제보 → mReportList`);
    else fail('4-4-report-done-other', `다른 제보 → ${cv} (예상: mReportList)`);
} else {
    warn('4-4-report-done-other', `다른 제보 버튼 미발견`);
}
await shot(page, '4_reportDone');

// 4-5. mProposalDone 버튼 분기
if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
await goView(page, 'mProposalDone');
await page.waitForTimeout(800);
const myProposalBtn  = page.locator('button:has-text("나의 제안"), button:has-text("나의 제안 보기")').first();
const otherPropBtn   = page.locator('button:has-text("다른 제안"), button:has-text("다른 제안 보기")').first();
if (await myProposalBtn.count() > 0) {
    await myProposalBtn.click();
    await page.waitForTimeout(1000);
    const cv = await currentView(page);
    if (cv === 'myProposals') ok('4-5-proposal-done-my', `나의 제안 → myProposals`);
    else fail('4-5-proposal-done-my', `나의 제안 → ${cv} (예상: myProposals)`);
} else {
    warn('4-5-proposal-done-my', `나의 제안 버튼 미발견`);
}
await goView(page, 'mProposalDone');
await page.waitForTimeout(800);
if (await otherPropBtn.count() > 0) {
    await otherPropBtn.click();
    await page.waitForTimeout(1000);
    const cv = await currentView(page);
    if (cv === 'mProposalList') ok('4-5-proposal-done-other', `다른 제안 → mProposalList`);
    else fail('4-5-proposal-done-other', `다른 제안 → ${cv} (예상: mProposalList)`);
} else {
    warn('4-5-proposal-done-other', `다른 제안 버튼 미발견`);
}
await shot(page, '4_proposalDone');

// 4-6. myActivityHub 카드 3개
if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
await goView(page, 'myActivityHub');
await page.waitForTimeout(800);
// MyActivityHub.jsx: button.ma-hub-card.report / .proposal / .diagnosis
const hubMyReport   = page.locator('button.ma-hub-card.report, .ma-hub-card.report').first();
const hubMyProposal = page.locator('button.ma-hub-card.proposal, .ma-hub-card.proposal').first();
const hubActivity   = page.locator('button.ma-hub-card.diagnosis, .ma-hub-card.diagnosis').first();

for (const [name, btn, expected] of [
    ['나의제보', hubMyReport, ['myReportList']],
    ['나의제안', hubMyProposal, ['myProposals']],
    ['진단', hubActivity, ['mMyActivity']],
]) {
    if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
    await goView(page, 'myActivityHub');
    await page.waitForTimeout(600);
    if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(1000);
        const cv = await currentView(page);
        if (expected.includes(cv)) ok(`4-6-hub-${name}`, `허브 ${name} → ${cv} OK`);
        else fail(`4-6-hub-${name}`, `허브 ${name} → ${cv} (예상: ${expected})`);
    } else {
        warn(`4-6-hub-${name}`, `${name} 카드 버튼 미발견`);
    }
}
await shot(page, '4_activityHub');

// ─── 5. 뒤로가기 (popstate) ────────────────────────────────────────────────────
log('\n=== 5. 뒤로가기 ===');

// 5-1. mReportForm에서 내용 입력 후 뒤로가기 → leaveOpen 모달
// MReportForm은 pushState(null,'')로 popstate 트랩을 설치.
// Playwright page.goBack()은 실제 URL 레벨 이동이라 SPA 트랩과 충돌.
// evaluate로 history.back()을 호출해 popstate 이벤트를 발생시킨다.
if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
await goView(page, 'mReportForm');
await page.waitForTimeout(1000);
const bodyInput = page.locator('input.m-row-input').first();
if (await bodyInput.count() > 0) {
    await bodyInput.fill('테스트 뒤로가기 감사');
    await page.waitForTimeout(300);
    // history.back() 호출 (SPA popstate 핸들러 트리거)
    await page.evaluate(() => window.history.back());
    await page.waitForTimeout(1000);
    const leaveModal = page.locator('.m-draft-backdrop').first();
    const leaveVisible = await leaveModal.isVisible().catch(() => false);
    if (leaveVisible) {
        ok('5-1-back-modal', `내용 입력 후 history.back() → leaveOpen 모달 표시 OK`);
    } else {
        fail('5-1-back-modal', `내용 입력 후 history.back() → leaveOpen 모달 미표시 (formStateRef body 값 미반영 or pushState 타이밍 문제)`);
    }
} else {
    warn('5-1-back-modal', `MReportForm body input(.m-row-input) 미발견`);
}
await shot(page, '5_reportFormBack');

// 5-2. mReportDetail → 뒤로 → mReportList
if (userToken) await page.evaluate((t) => { localStorage.setItem('access_token', t); }, userToken);
await goView(page, 'mReportList');
await page.waitForTimeout(1200);
// 첫 번째 제보 항목 클릭
// MReportList 아이템 class: .m-prop-card
const reportItem = page.locator('.m-prop-card').first();
if (await reportItem.count() > 0) {
    await reportItem.click();
    await page.waitForTimeout(1000);
    const cv = await currentView(page);
    if (cv === 'mReportDetail') {
        await page.goBack();
        await page.waitForTimeout(1000);
        const cv2 = await currentView(page);
        if (cv2 === 'mReportList') ok('5-2-detail-back', `mReportDetail → 뒤로 → mReportList OK`);
        else fail('5-2-detail-back', `mReportDetail → 뒤로 → ${cv2} (예상: mReportList)`);
    } else {
        warn('5-2-detail-back', `리스트 클릭 → view=${cv} (mReportDetail 아님)`);
    }
} else {
    warn('5-2-detail-back', `제보 목록 항목 미발견`);
}
await shot(page, '5_reportDetailBack');

// 5-3. mAICitizenDetail → 뒤로 → mAICitizen
await goView(page, 'mAICitizen');
await page.waitForTimeout(1200);
const aiItem = page.locator('[class*="citizen-card"], [class*="ai-card"]').first();
if (await aiItem.count() > 0) {
    await aiItem.click();
    await page.waitForTimeout(1000);
    const cv = await currentView(page);
    if (cv === 'mAICitizenDetail') {
        await page.goBack();
        await page.waitForTimeout(1000);
        const cv2 = await currentView(page);
        if (cv2 === 'mAICitizen') ok('5-3-ai-back', `mAICitizenDetail → 뒤로 → mAICitizen OK`);
        else fail('5-3-ai-back', `mAICitizenDetail → 뒤로 → ${cv2} (예상: mAICitizen)`);
    } else {
        warn('5-3-ai-back', `AI 목록 클릭 → view=${cv}`);
    }
} else {
    warn('5-3-ai-back', `AI 시민 목록 항목 미발견`);
}

// ─── 6. useState initializer 화이트리스트 회귀 ────────────────────────────────
log('\n=== 6. useState initializer 화이트리스트 회귀 ===');

const AUTH_REQUIRED = [
    'mDiagnosisForm', 'myActivityHub', 'myReportList', 'myProposals',
    'mMyActivity', 'mMyReportDetail', 'mMyReportEdit', 'mProposalForm', 'mReportForm'
];

// 비로그인 시드 → home 리다이렉트
for (const v of AUTH_REQUIRED) {
    await page.evaluate((view) => {
        localStorage.removeItem('access_token');
        sessionStorage.setItem('current_view', view);
    }, v);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const cv = await currentView(page);
    if (cv === 'home') {
        ok(`6-noauth-${v}`, `비로그인 → home 리다이렉트 OK`);
    } else {
        fail(`6-noauth-${v}`, `비로그인인데 ${cv} 진입 허용 (화이트리스트 누락)`);
    }
}

// 로그인 상태 → 정상 진입
if (userToken) {
    for (const v of ['myActivityHub', 'myReportList', 'myProposals', 'mMyActivity', 'mReportForm', 'mProposalForm']) {
        await page.evaluate(({ view, token }) => {
            localStorage.setItem('access_token', token);
            sessionStorage.setItem('current_view', view);
        }, { view: v, token: userToken });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1200);
        const cv = await currentView(page);
        if (cv === v) {
            ok(`6-auth-${v}`, `로그인 후 ${v} 정상 진입`);
        } else {
            fail(`6-auth-${v}`, `로그인인데 ${cv}로 리다이렉트 (${v} 진입 실패)`);
        }
    }
}
await shot(page, '6_authGuardRegression');

// ─── 7. 어드민 분리 ────────────────────────────────────────────────────────────
log('\n=== 7. 어드민 분리 ===');

if (adminToken) {
    // admin 토큰으로 일반 모바일 view 진입
    for (const v of ['home', 'mReportMap']) {
        await page.evaluate(({ view, token }) => {
            localStorage.setItem('access_token', token);
            sessionStorage.setItem('current_view', view);
        }, { view: v, token: adminToken });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1200);
        const cv = await currentView(page);
        if (cv === v) ok(`7-admin-${v}`, `admin 토큰으로 ${v} 진입 OK`);
        else warn(`7-admin-${v}`, `admin 토큰으로 ${v} 진입 → ${cv}`);
    }
    await shot(page, '7_adminMobileView');

    // admin 좋아요 시도 → 403 확인
    try {
        const r = await fetch(`${API}/api/reports/1/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
        });
        if (r.status === 403) {
            ok('7-admin-like-403', `admin 좋아요 → 403 응답`);
        } else if (r.status === 404) {
            warn('7-admin-like-403', `admin 좋아요 → 404 (리소스 없음, 403 테스트 불가)`);
        } else {
            fail('7-admin-like-403', `admin 좋아요 → ${r.status} (403 예상)`);
        }
    } catch (e) { warn('7-admin-like-403', `요청 오류: ${e.message}`); }
}
await shot(page, '7_adminSeparation');

// ─── 결과 요약 ─────────────────────────────────────────────────────────────────
log('\n' + '='.repeat(60));
log('## 실증D 인증/네비 결과 — 발견된 문제 리스트');
if (bugs.length === 0) {
    log('✅ 발견된 버그 없음');
} else {
    bugs.forEach((b, i) => {
        log(`- [BUG-D${i+1}] ${b.id}: ${b.note}`);
    });
}
log('='.repeat(60));

await browser.close();
