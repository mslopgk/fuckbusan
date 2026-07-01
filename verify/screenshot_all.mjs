import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(resolve(__dirname, 'routes.json'), 'utf8'));

const OUT_DIR = resolve(__dirname, '..', 'screenshots-all');
mkdirSync(OUT_DIR, { recursive: true });

const BASE = cfg.baseUrl;   // http://localhost:8501
const API  = cfg.apiUrl;    // http://localhost:8000

async function getToken() {
    try {
        const res = await fetch(`${API}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin1234' }),
        });
        if (res.ok) {
            const d = await res.json();
            return d.access_token ?? null;
        }
    } catch {}
    return null;
}

async function main() {
    console.log('토큰 발급 중...');
    const token = await getToken();
    console.log(token ? `✅ 토큰 발급 완료` : '⚠️  토큰 없음 (비인증 뷰만 캡처)');

    const browser = await chromium.launch({ headless: true });

    // 모바일 뷰포트 (390×844) / PC 뷰포트 (1440×900) 분리
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pcCtx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    const PC_VIEWS = new Set([
        'home','login','signup','report','reportList','proposalList','myPage','diagnosis',
        'pcSurveyList','pcDiagnosisMap','pcReportMap','pcProposeMap',
        'pcDiagnosisForm','pcDiagnosisDone','pcMyReportList','pcMyReportEdit',
        'adminLoginNew','adminMain','adminUserList','reportManagement','proposalManagement',
        'surveyManagement','surveyEditor','surveyResults','adminDashboardNew','expertManagement',
    ]);

    let pass = 0, fail = 0;

    for (const v of cfg.views) {
        const isPc  = PC_VIEWS.has(v.id);
        const isAdmin = String(v.view ?? v.id).startsWith('admin') || v.path === '/admin';
        const ctx   = isPc ? pcCtx : mobileCtx;
        const page  = await ctx.newPage();
        if (v.viewport) await page.setViewportSize(v.viewport);

        const url = BASE + (v.path || '/');

        try {
            // 1. 앱 초기 로드
            await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });

            // 2. sessionStorage / localStorage 시드
            await page.evaluate(({ view, tok, isAdmin }) => {
                sessionStorage.setItem('current_view', view);
                if (tok) {
                    localStorage.setItem('access_token', tok);
                    if (isAdmin) localStorage.setItem('admin_token', tok);
                }
            }, { view: v.view ?? v.id, tok: token, isAdmin });

            // 3. 목적지 URL로 이동
            await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
            if (v.waitFor) await page.waitForSelector(v.waitFor, { timeout: 8000 }).catch(() => {});
            await page.waitForTimeout(800);

            const shotPath = resolve(OUT_DIR, `${v.id}.png`);
            await page.screenshot({ path: shotPath, fullPage: true });

            const vp = isPc ? '1440×900' : '390×844';
            console.log(`  ✅ [${vp}] ${v.id} → ${shotPath.split('/').slice(-2).join('/')}`);
            pass++;
        } catch (e) {
            console.log(`  ❌ ${v.id}: ${e.message.split('\n')[0]}`);
            fail++;
        } finally {
            await page.close();
        }
    }

    await browser.close();

    console.log(`\n완료: ✅ ${pass}개 성공, ❌ ${fail}개 실패`);
    console.log(`저장 경로: ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
