/**
 * audit_b_survey.mjs
 * 설문 기능 end-to-end 실증 검사 (수정 없음, 리스트업 전용)
 * node verify/_dev/audit_b_survey.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const FRONT = 'http://localhost:8501';
const API   = 'http://localhost:8000';
const SHOT  = '/Users/Kang/Desktop/fuckbusan/verify/screenshots';
const VP    = { width: 375, height: 812 };

const issues = [];
const log    = (...a) => console.log('[audit_b]', ...a);

function bug(id, severity, desc, location = '') {
    issues.push({ id, severity, desc, location });
    console.warn(`  ⚠ [${id}](${severity}) ${desc}${location ? ' — ' + location : ''}`);
}

async function shot(page, name) {
    const p = path.join(SHOT, `audit_b_${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    log(`  📷 ${name}`);
}

// ─── API probe ────────────────────────────────────────────────────────────────
async function probeAPI() {
    log('\n=== API 프로브 ===');
    const checks = [
        ['active',  `${API}/api/surveys/list?tab=active`],
        ['result',  `${API}/api/surveys/list?tab=result`],
        ['closed',  `${API}/api/surveys/list?tab=closed`],
    ];
    const results = {};
    for (const [tab, url] of checks) {
        try {
            const r = await fetch(url);
            const data = await r.json();
            log(`  tab=${tab}: status=${r.status} count=${Array.isArray(data) ? data.length : '?'}`);
            results[tab] = { status: r.status, data };
            if (!r.ok) bug('API-01', 'H', `GET /api/surveys/list?tab=${tab} → ${r.status}`, 'API');
        } catch (e) {
            bug('API-01', 'H', `GET /api/surveys/list?tab=${tab} 요청 실패: ${e.message}`, 'API');
            results[tab] = { status: 0, data: [] };
        }
    }
    return results;
}

// ─── 일반 유저 생성 ───────────────────────────────────────────────────────────
async function createUser() {
    const uid = `tst_${Date.now()}`;
    try {
        const r = await fetch(`${API}/users/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ID: uid, PW: 't1234', name: '검수', nickname: 't', phone_num: '010-0000-0000', district_code: '부산진구' }),
        });
        const d = await r.json();
        log(`  유저 생성: ${uid} → ${r.status}`);
        return { uid, ok: r.ok };
    } catch (e) {
        bug('AUTH-01', 'M', `유저 생성 실패: ${e.message}`, '/users/signup');
        return { uid, ok: false };
    }
}

async function loginUser(uid, pw) {
    try {
        const r = await fetch(`${API}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ID: uid, PW: pw }),
        });
        const d = await r.json();
        return d.access_token || null;
    } catch {
        return null;
    }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const apiResults = await probeAPI();
const { uid, ok: userOk } = await createUser();
const token = userOk ? await loginUser(uid, 't1234') : null;
log(`  토큰: ${token ? '획득' : '없음'}`);

const page = await browser.newPage({ viewport: VP });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGE_ERR: ' + e.message));

// ─── 1. 설문 목록 ─────────────────────────────────────────────────────────────
log('\n=== 1. mSurveyList ===');
await page.addInitScript(() => sessionStorage.setItem('current_view', 'mSurveyList'));
await page.goto(FRONT);
try {
    await page.waitForSelector('.m-survey-list-page', { timeout: 8000 });
    log('  .m-survey-list-page 존재 ✓');
} catch {
    bug('SL-01', 'H', '페이지 로드 실패: .m-survey-list-page 없음', 'mSurveyList');
}
await page.waitForTimeout(1000);
await shot(page, 'survey_list_active');

// 1-1. 탭 확인
const tabs = await page.$$('button.m-stab');
log(`  탭 수: ${tabs.length}`);
if (tabs.length < 2) {
    bug('SL-02', 'H', `탭이 ${tabs.length}개 (진행중/결과 2개 필요 — 마감 탭 없음)`, 'MSurveyList.jsx:36-44');
} else {
    log('  탭 텍스트:', await Promise.all(tabs.map(t => t.textContent())));
    // 탭이 2개뿐인지 확인 (Figma/스펙: 3개 탭)
    if (tabs.length === 2) {
        bug('SL-03', 'M', '탭이 진행중/결과 2개뿐 — 마감(closed) 탭 없음. API는 closed 지원하나 UI에 없음', 'MSurveyList.jsx:36-44');
    }
}

// 1-2. active 탭 카드 확인
const activeCards = await page.$$('.m-survey-card');
log(`  active 카드 수: ${activeCards.length}`);
if (activeCards.length === 0 && apiResults.active?.data?.length > 0) {
    bug('SL-04', 'H', '설문 카드 미렌더 (API는 데이터 있음)', 'mSurveyList');
}

// 1-3. 결과 탭 전환
await page.click('button.m-stab:has-text("설문결과")');
await page.waitForTimeout(800);
await shot(page, 'survey_list_result');
const resultCards = await page.$$('.m-survey-card');
log(`  result 카드 수: ${resultCards.length}`);

// 1-4. 빈 목록 처리 — closed 탭 없으므로 result 탭 빈 여부로 간접 확인
// (result API엔 데이터 있으므로 비어 있으면 버그)
if (resultCards.length === 0 && apiResults.result?.data?.length > 0) {
    bug('SL-05', 'H', '결과 탭 카드 미렌더 (API는 데이터 있음)', 'mSurveyList result tab');
}

// 1-4. 카드 클릭 → 상세 진입
if (resultCards.length > 0) {
    log('  결과 탭 카드 클릭 → mSurveyResults로 이동 테스트');
    await page.click('.m-survey-card');
    await page.waitForTimeout(1000);
    const inResults = await page.locator('.m-survey-results-page').count();
    log(`  .m-survey-results-page: ${inResults}`);
    if (!inResults) {
        bug('SL-06', 'H', '결과 탭 카드 클릭 → mSurveyResults 미진입', 'MSurveyList.jsx:59');
    }
    await shot(page, 'survey_results_from_list');
    await page.goBack().catch(() => {});
}

// active 탭으로 돌아가기 (reload + nav)
await page.evaluate(() => sessionStorage.setItem('current_view', 'mSurveyList'));
await page.reload();
await page.waitForSelector('.m-survey-list-page', { timeout: 6000 });
await page.waitForTimeout(600);
const activeCardsCurrent = await page.$$('.m-survey-card');
if (activeCardsCurrent.length > 0) {
    await page.click('.m-survey-card');
    await page.waitForTimeout(1000);
    const inDetail1 = await page.locator('.m-survey-detail-page').count();
    log(`  active 탭 카드 클릭 → .m-survey-detail-page: ${inDetail1}`);
    if (!inDetail1) {
        bug('SL-07', 'H', 'active 탭 카드 클릭 → mSurveyDetail1 미진입', 'MSurveyList.jsx:57');
    }
}

// ─── 2. 설문 상세 1 ────────────────────────────────────────────────────────────
log('\n=== 2. mSurveyDetail1 ===');
const inDetail1Now = await page.locator('.m-survey-detail-page').count();
if (!inDetail1Now) {
    // 강제 진입
    await page.evaluate(() => sessionStorage.setItem('current_view', 'mSurveyDetail1'));
    await page.reload();
    await page.waitForTimeout(600);
}

await shot(page, 'survey_detail1');

// 2-1. 기본 정보 표시
const heroTitle = await page.locator('.m-hero-title').first().textContent().catch(() => '');
const heroCard = await page.locator('.m-hero-card').count();
log(`  hero-title: "${heroTitle.trim()}" hero-card: ${heroCard}`);
if (!heroTitle.trim()) {
    bug('D1-01', 'M', '설문 조사명 미표시 (hero-title 비어있음) — survey prop 없이 접근 시 빈 화면', 'MSurveyDetail1.jsx:94');
}

// 2-2. 복사하기 버튼 존재
const copyBtn = await page.locator('.m-hero-copy').first();
const copyExists = await copyBtn.count();
log(`  복사 버튼: ${copyExists}`);
if (!copyExists) bug('D1-02', 'M', '복사하기 버튼 없음', 'MSurveyDetail1.jsx:108');

// 2-3. 이용약관 버튼 → 모달
const termsBtn = await page.locator('.m-policy-link').first();
const termsBtnCount = await termsBtn.count();
log(`  이용약관 버튼: ${termsBtnCount}`);
if (termsBtnCount) {
    await termsBtn.click();
    await page.waitForTimeout(400);
    const modal = await page.locator('.m-policy-modal').count();
    log(`  모달 열림: ${modal}`);
    if (!modal) {
        bug('D1-03', 'H', '이용약관 클릭 → .m-policy-modal 미노출', 'MSurveyDetail1.jsx:147-188');
    } else {
        await shot(page, 'policy_terms_modal');
        // 본문 텍스트 확인
        const bodyText = await page.locator('.m-policy-body').first().textContent().catch(() => '');
        if (bodyText.length < 50) {
            bug('D1-04', 'M', '이용약관 모달 본문 텍스트 짧음 (< 50자)', 'MSurveyDetail1.jsx:185');
        }
        // X 버튼 닫기
        await page.locator('.m-policy-close').click();
        await page.waitForTimeout(300);
        const modalAfter = await page.locator('.m-policy-modal').count();
        if (modalAfter) {
            bug('D1-05', 'M', 'X 버튼으로 모달 닫기 실패', 'MSurveyDetail1.jsx:174');
        }
        // 배경 body overflow 복원 확인
        const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
        log(`  body.overflow after close: "${bodyOverflow}"`);
        if (bodyOverflow === 'hidden') {
            bug('D1-06', 'M', '모달 닫힌 후에도 body.overflow=hidden 유지 (배경 스크롤 잠금 미해제)', 'MSurveyDetail1.jsx:68-74');
        }
    }
} else {
    bug('D1-03', 'H', '.m-policy-link 이용약관 버튼 없음', 'MSurveyDetail1.jsx:147');
}

// 2-4. 개인정보처리방침 모달
const policyBtns = await page.locator('.m-policy-link').all();
log(`  policy-link 버튼 수: ${policyBtns.length}`);
if (policyBtns.length >= 2) {
    await policyBtns[1].click();
    await page.waitForTimeout(400);
    const privModal = await page.locator('.m-policy-modal').count();
    if (!privModal) {
        bug('D1-07', 'H', '개인정보처리방침 클릭 → 모달 미노출', 'MSurveyDetail1.jsx:151');
    } else {
        await shot(page, 'policy_privacy_modal');
        // ESC 닫기
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const privAfter = await page.locator('.m-policy-modal').count();
        if (privAfter) {
            bug('D1-08', 'M', 'ESC 키로 개인정보처리방침 모달 닫기 실패', 'MSurveyDetail1.jsx:66');
        }
        // 배경 클릭 닫기 테스트
        await policyBtns[1].click();
        await page.waitForTimeout(300);
        const bgModal = await page.locator('.m-policy-modal').count();
        if (bgModal) {
            // click outside sheet
            await page.locator('.m-policy-modal').click({ position: { x: 20, y: 20 }, force: true });
            await page.waitForTimeout(300);
            const bgAfter = await page.locator('.m-policy-modal').count();
            if (bgAfter) {
                bug('D1-09', 'M', '모달 배경 클릭으로 닫기 실패', 'MSurveyDetail1.jsx:162');
            }
        }
    }
} else {
    bug('D1-07', 'M', '개인정보처리방침 .m-policy-link 버튼 부족 (< 2개)', 'MSurveyDetail1.jsx:151');
}

// 모달 열렸을 때 body overflow=hidden 확인
const policyBtnsAgain = await page.locator('.m-policy-link').first();
if (await policyBtnsAgain.count()) {
    await policyBtnsAgain.click();
    await page.waitForTimeout(300);
    const overflowWhileOpen = await page.evaluate(() => document.body.style.overflow);
    log(`  body.overflow while modal open: "${overflowWhileOpen}"`);
    if (overflowWhileOpen !== 'hidden') {
        bug('D1-10', 'M', '모달 열린 상태에서 body.overflow가 hidden이 아님 (배경 스크롤 잠금 미동작)', 'MSurveyDetail1.jsx:69');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
}

// 2-5. 참여하기 버튼 → mSurveyDetail2
const ctaBtn = await page.locator('.m-survey-cta').first();
if (await ctaBtn.count()) {
    await ctaBtn.click();
    await page.waitForTimeout(800);
    const inDetail2 = await page.locator('.m-survey-detail-page').count();
    log(`  참여하기 클릭 → .m-survey-detail-page: ${inDetail2}`);
    // detail2는 hero-shrunk로 구분
    const heroCls = await page.locator('.m-survey-hero').first().getAttribute('class').catch(() => '');
    log(`  hero class: "${heroCls}"`);
    if (!heroCls?.includes('hero-shrunk')) {
        bug('D1-11', 'M', '참여하기 → mSurveyDetail2 진입 불명확 (hero-shrunk 클래스 없음)', 'MSurveyDetail1.jsx:158');
    }
    await shot(page, 'survey_detail2');
} else {
    bug('D1-12', 'H', '.m-survey-cta 참여하기 버튼 없음', 'MSurveyDetail1.jsx:158');
}

// ─── 3. 설문 상세 2 ────────────────────────────────────────────────────────────
log('\n=== 3. mSurveyDetail2 ===');

// 3-1. 개인정보 동의 라디오
const agreeRadios = await page.locator('input[name="agree"]').all();
log(`  동의 라디오 수: ${agreeRadios.length}`);
if (agreeRadios.length < 2) {
    bug('D2-01', 'H', '개인정보 동의 라디오 버튼 부족', 'MSurveyDetail2.jsx:137');
} else {
    await agreeRadios[0].check(); // 동의함
    await page.waitForTimeout(200);
    const checked = await agreeRadios[0].isChecked();
    if (!checked) bug('D2-02', 'M', '동의함 라디오 체크 실패', 'MSurveyDetail2.jsx:137');
}

// 3-2. 로그인 유저 이름 자동 채움
if (token) {
    await page.evaluate((tk) => localStorage.setItem('access_token', tk), token);
    await page.reload();
    await page.waitForTimeout(1200);
    // navigate back to detail2
    const heroShrunkNow = await page.locator('.m-survey-hero.hero-shrunk').count();
    if (!heroShrunkNow) {
        // may have reloaded to list; navigate forward
        await page.evaluate(() => sessionStorage.setItem('current_view', 'mSurveyList'));
        await page.reload();
        await page.waitForSelector('.m-survey-list-page', { timeout: 5000 });
        if (await page.locator('.m-survey-card').count()) {
            await page.click('.m-survey-card');
            await page.waitForTimeout(600);
            await page.locator('.m-survey-cta').first().click();
            await page.waitForTimeout(800);
        }
    }
    const nameInput = await page.locator('input[placeholder="홍길동"]').first();
    if (await nameInput.count()) {
        const val = await nameInput.inputValue();
        log(`  이름 자동채움 값: "${val}"`);
        if (!val) {
            bug('D2-03', 'L', '로그인 후 이름 자동 채움 미작동 (name field 비어있음)', 'MSurveyDetail2.jsx:46-63');
        }
    } else {
        bug('D2-04', 'M', '성명 입력 필드 없음', 'MSurveyDetail2.jsx:182');
    }
}

// 3-3. 다음 단계 (mSurveyJoin) 진입: agree+name+phone 채워서 submit
const agreeR = await page.locator('input[name="agree"]').first();
if (await agreeR.count()) await agreeR.check();
const nameF = await page.locator('input[placeholder="홍길동"]').first();
if (await nameF.count()) { await nameF.fill(''); await nameF.type('검수인'); }
const phoneF = await page.locator('input[placeholder="010-0000-0000"]').first();
if (await phoneF.count()) { await phoneF.fill(''); await phoneF.type('01000000000'); }
await page.waitForTimeout(300);
await shot(page, 'survey_detail2_filled');

// canSubmit 판정
const ctaD2 = await page.locator('.m-survey-cta').first();
const disabledD2 = await ctaD2.isDisabled().catch(() => false);
log(`  참여하기 버튼 disabled: ${disabledD2}`);
if (!disabledD2) {
    await ctaD2.click();
    await page.waitForTimeout(1000);
    const inJoin = await page.locator('.m-survey-join-page').count();
    log(`  .m-survey-join-page: ${inJoin}`);
    if (!inJoin) {
        bug('D2-05', 'H', 'Detail2 참여하기 → mSurveyJoin 미진입', 'MSurveyDetail2.jsx:81');
    }
    await shot(page, 'survey_join');
} else {
    bug('D2-06', 'M', 'Detail2 참여하기 버튼 여전히 disabled (이름/전화 유효성 검사 문제 가능성)', 'MSurveyDetail2.jsx:74');
}

// ─── 4. 설문 참여 ─────────────────────────────────────────────────────────────
log('\n=== 4. mSurveyJoin ===');
const inJoinNow = await page.locator('.m-survey-join-page').count();
if (!inJoinNow) {
    bug('SJ-01', 'H', 'mSurveyJoin 페이지 진입 실패', 'MSurveyDetail2.jsx:81');
} else {
    // 4-1. 질문 블록 확인
    const qBlocks = await page.locator('.m-q-block').all();
    log(`  질문 블록 수: ${qBlocks.length}`);
    if (qBlocks.length === 0) {
        bug('SJ-02', 'H', '질문 블록 없음 (설문 문항 미렌더)', 'MSurveyJoin.jsx');
    }

    // 4-2. single/multi/text 타입 렌더 확인
    const singleOpts = await page.locator('.m-q-option').count();
    const textAreas  = await page.locator('.m-q-textarea').count();
    log(`  single/multi 옵션 수: ${singleOpts}, textarea: ${textAreas}`);
    if (singleOpts === 0 && textAreas === 0) {
        bug('SJ-03', 'H', '질문 선택지/textarea 없음 — 질문 타입 렌더 실패 가능', 'MSurveyJoin.jsx:136-210');
    }

    // 4-2. 옵션 선택
    const opts = await page.locator('.m-q-option').all();
    for (const opt of opts) {
        await opt.click().catch(() => {});
        await page.waitForTimeout(80);
    }
    // text area 채우기
    const tas = await page.locator('.m-q-textarea').all();
    for (const ta of tas) {
        await ta.fill('테스트 응답입니다.').catch(() => {});
    }
    await page.waitForTimeout(200);
    await shot(page, 'survey_join_filled');

    // 4-3. 제출
    const submitRes = [];
    page.on('response', (r) => {
        if (r.url().includes('/api/surveys/') && r.url().includes('/responses')) {
            submitRes.push({ url: r.url(), status: r.status() });
        }
    });
    const nextBtn = await page.locator('.m-join-next');
    if (await nextBtn.count()) {
        await nextBtn.click();
        await page.waitForTimeout(2000);
        log(`  제출 응답:`, JSON.stringify(submitRes));
        if (submitRes.length === 0) {
            bug('SJ-04', 'M', '제출 버튼 클릭했으나 POST /api/surveys/{id}/responses 요청 없음', 'MSurveyJoin.jsx:91');
        } else {
            const failRes = submitRes.filter(r => r.status >= 400);
            if (failRes.length) {
                bug('SJ-05', 'H', `제출 API 오류: ${failRes.map(r => r.status).join(',')}`, 'MSurveyJoin.jsx:91');
            } else {
                log(`  제출 성공: ${submitRes.map(r => r.status).join(',')}`);
            }
        }
        // 완료 페이지 or 리스트로 이동 확인
        const doneP = await page.locator('.m-survey-done-page, .m-survey-list-page').count();
        log(`  제출 후 페이지: done/list=${doneP}`);
        if (!doneP) {
            bug('SJ-06', 'M', '제출 후 mSurveyDone 또는 목록으로 미이동', 'MSurveyJoin.jsx:102');
        }
        await shot(page, 'survey_after_submit');
    } else {
        bug('SJ-07', 'H', '.m-join-next 제출 버튼 없음', 'MSurveyJoin.jsx:224');
    }
}

// ─── 5. 설문 결과 ─────────────────────────────────────────────────────────────
log('\n=== 5. mSurveyResults ===');
// result 탭에서 카드 있는 설문 클릭
await page.evaluate(() => sessionStorage.setItem('current_view', 'mSurveyList'));
await page.reload();
await page.waitForSelector('.m-survey-list-page', { timeout: 6000 });
await page.waitForTimeout(500);

await page.click('button.m-stab:has-text("설문결과")').catch(() => {});
await page.waitForTimeout(700);
const resCards = await page.locator('.m-survey-card').count();
log(`  result 탭 카드: ${resCards}`);

if (resCards > 0) {
    // 5-3. 흰화면 회귀: response_count > 0인 카드 찾기
    await page.click('.m-survey-card');
    await page.waitForTimeout(2000);

    const resultsPage = await page.locator('.m-survey-results-page').count();
    log(`  .m-survey-results-page: ${resultsPage}`);
    if (!resultsPage) {
        bug('SR-01', 'H', '설문 결과 페이지 미렌더 (흰화면 회귀 가능성)', 'MSurveyResults.jsx');
    } else {
        await shot(page, 'survey_results');

        // 5-1. 차트 섹션 확인
        const sections = await page.locator('.m-results-section').count();
        const spinner  = await page.locator('.m-results-spinner').count();
        log(`  결과 섹션: ${sections}, 스피너(로딩중): ${spinner}`);

        // 5-2. 응답수 확인
        const countEl = await page.locator('.m-results-count').textContent().catch(() => '');
        log(`  응답수 텍스트: "${countEl}"`);

        if (sections === 0) {
            bug('SR-02', 'H', '결과 차트 섹션 없음 (데이터 없거나 렌더 실패)', 'MSurveyResults.jsx:351');
        }

        // 5-3. 흰화면 회귀 — hero + content 모두 있는지
        const heroEl    = await page.locator('.m-results-hero').count();
        const contentEl = await page.locator('.m-results-content').count();
        if (!heroEl || !contentEl) {
            bug('SR-03', 'H', '흰화면 회귀: hero/content 중 하나 누락', 'MSurveyResults.jsx');
        } else {
            log('  흰화면 회귀 확인: hero + content 모두 존재 ✓');
        }

        // 빈 상태 메시지 (결과 데이터 없는 경우)
        const emptyMsg = await page.locator('.m-results-empty').count();
        if (emptyMsg) {
            log('  ⚠ 결과 없음 상태 노출 (데이터 부족 가능)');
        }

        // 5-3. 추가: response_count=0인 설문에서 빈 상태 표시 확인
        // id=5 (response_count=0) 로 직접 API 확인
        const emptyRes = await fetch(`${API}/api/surveys/5/results`);
        const emptyData = await emptyRes.json();
        log(`  survey id=5 results: response_count=${emptyData.response_count}`);
    }
} else {
    bug('SR-04', 'M', '결과 탭에 카드 없어 결과 화면 테스트 불가', 'mSurveyList result tab');
}

// ─── 6. 약관 모달 스크롤 및 overflow 깊은 검증 ─────────────────────────────────
log('\n=== 6. 약관 모달 깊은 검증 ===');
await page.evaluate(() => sessionStorage.setItem('current_view', 'mSurveyList'));
await page.reload();
await page.waitForSelector('.m-survey-list-page', { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(400);

// active 탭에서 카드 클릭 → detail1
const activeCardsNow = await page.locator('.m-survey-card').count();
if (activeCardsNow > 0) {
    await page.click('.m-survey-card');
    await page.waitForTimeout(800);
}

const policyLinkNow = await page.locator('.m-policy-link').first();
if (await policyLinkNow.count()) {
    // 모달 열기
    await policyLinkNow.click();
    await page.waitForTimeout(500);
    const mSheet = await page.locator('.m-policy-sheet').count();
    if (!mSheet) {
        bug('PM-01', 'H', '.m-policy-sheet 없음 — 모달 DOM 렌더 실패', 'MSurveyDetail.css');
    } else {
        // 6-1. 본문 스크롤 가능 여부
        const bodyScrollable = await page.evaluate(() => {
            const el = document.querySelector('.m-policy-body');
            return el ? el.scrollHeight > el.clientHeight : false;
        });
        log(`  .m-policy-body 스크롤 가능: ${bodyScrollable}`);
        if (!bodyScrollable) {
            bug('PM-02', 'L', '이용약관 모달 본문(.m-policy-body) 내용이 스크롤 없이 다 보임 (또는 overflow 미적용)', 'MSurveyDetail.css:234');
        }

        // 6-2. body overflow 잠금
        const ov1 = await page.evaluate(() => document.body.style.overflow);
        log(`  모달 열림 body.overflow: "${ov1}"`);
        if (ov1 !== 'hidden') {
            bug('PM-03', 'M', '모달 열렸을 때 body.overflow=hidden 아님 — 배경 스크롤 잠금 실패', 'MSurveyDetail1.jsx:69');
        }

        await shot(page, 'policy_modal_deep_check');

        // 6-3. 닫은 후 overflow 복원
        await page.locator('.m-policy-close').click();
        await page.waitForTimeout(400);
        const ov2 = await page.evaluate(() => document.body.style.overflow);
        log(`  모달 닫힘 body.overflow: "${ov2}"`);
        if (ov2 === 'hidden') {
            bug('PM-04', 'M', '모달 닫힌 후 body.overflow=hidden 미복원', 'MSurveyDetail1.jsx:70-73');
        }
    }
}

// ─── 콘솔 에러 집계 ────────────────────────────────────────────────────────────
if (consoleErrors.length > 0) {
    log('\n콘솔 에러:');
    consoleErrors.forEach(e => log(' ', e));
    bug('CON-01', 'L', `콘솔 오류 ${consoleErrors.length}건 (위 목록 참고)`, 'browser console');
}

await browser.close();

// ─── 최종 보고 ────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('## 실증B 설문 결과\n');

const views = {
    mSurveyList:             issues.filter(i => ['SL','API'].some(p => i.id.startsWith(p))),
    'mSurveyDetail1 (약관 모달 포함)': issues.filter(i => i.id.startsWith('D1') || i.id.startsWith('PM')),
    mSurveyDetail2:          issues.filter(i => i.id.startsWith('D2')),
    mSurveyJoin:             issues.filter(i => i.id.startsWith('SJ')),
    mSurveyResults:          issues.filter(i => i.id.startsWith('SR')),
};

console.log('### 각 view 결과');
for (const [view, bugs] of Object.entries(views)) {
    const highSev = bugs.filter(b => b.severity === 'H').length;
    const icon = bugs.length === 0 ? '✅' : highSev > 0 ? '❌' : '⚠️';
    console.log(`- ${view}: ${icon} (버그 ${bugs.length}건${highSev ? `, H=${highSev}` : ''})`);
}

console.log('\n### 발견된 문제 리스트 (수정 금지)');
if (issues.length === 0) {
    console.log('발견된 문제 없음');
} else {
    for (const i of issues) {
        console.log(`- [${i.id}] (${i.severity}) ${i.desc}${i.location ? ' — ' + i.location : ''}`);
    }
}

console.log(`\n총 이슈: ${issues.length}건 (H=${issues.filter(i=>i.severity==='H').length}, M=${issues.filter(i=>i.severity==='M').length}, L=${issues.filter(i=>i.severity==='L').length})`);
