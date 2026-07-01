/**
 * audit_c_ui.mjs — 모바일 UI 시각 점검 (수정 없음, 발견된 문제 리스트업만)
 * 실행: node verify/_dev/audit_c_ui.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:8501';
const VIEWPORT = { width: 375, height: 812 };
const SCREENSHOTS_DIR = '/Users/Kang/Desktop/fuckbusan/verify/screenshots';
const REPORTS_DIR = '/Users/Kang/Desktop/fuckbusan/verify/reports';

// Get auth token
async function getToken() {
  try {
    const res = await fetch(`http://localhost:8000/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ID: 'admin', PW: 'admin1234' })
    });
    if (res.ok) {
      const data = await res.json();
      return data.access_token || data.token || null;
    }
  } catch (e) {
    console.warn('Token fetch failed:', e.message);
  }
  return null;
}

const VIEWS = [
  'home', 'login', 'signup',
  'mReportList', 'mReportMap', 'mReportForm', 'mReportDetail', 'mReportDone',
  'mMyReportDetail', 'mMyReportEdit',
  'mProposalList', 'mProposalMap', 'mProposalForm', 'mProposalDetail', 'mProposalDone',
  'mDiagnosisList', 'mDiagnosisForm', 'mDiagnosisResult', 'mDiagnosisDone',
  'mAICitizen', 'mAICitizenDetail',
  'mSurveyList', 'mSurveyDetail1', 'mSurveyDetail2', 'mSurveyJoin', 'mSurveyResults',
  'myActivityHub', 'myReportList', 'myProposals', 'mMyActivity'
];

async function seedViewAndLoad(page, view, token) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ v, t }) => {
    sessionStorage.setItem('current_view', v);
    if (t) localStorage.setItem('access_token', t);
  }, { v: view, t: token });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
}

async function runChecks(page, view) {
  const issues = [];

  // 1. Horizontal overflow
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    overflows: document.documentElement.scrollWidth > window.innerWidth + 2
  }));
  if (overflow.overflows) {
    issues.push({
      id: 'overflow',
      severity: 'H',
      desc: `horizontal overflow: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
    });
  }

  // 2. Elements sticking out right
  const outOfBounds = await page.$$eval('*', els => {
    const vw = window.innerWidth;
    const found = [];
    for (const el of els) {
      try {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 4 && r.width > 0 && r.height > 0 && r.left >= 0) {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className || '').toString().substring(0, 60);
          const id = el.id ? `#${el.id}` : '';
          found.push({ tag, cls, id, right: Math.round(r.right), width: Math.round(r.width) });
          if (found.length >= 10) break;
        }
      } catch (e) {}
    }
    return found;
  });
  if (outOfBounds.length > 0) {
    issues.push({
      id: 'out-of-bounds',
      severity: 'M',
      desc: `요소 화면 밖 비어져 나옴 (${outOfBounds.length}개): ${outOfBounds.slice(0,3).map(e => `<${e.tag}${e.id} .${e.cls.split(' ')[0]}> right=${e.right}`).join(', ')}`
    });
  }

  // 3. Broken images
  const brokenImgs = await page.$$eval('img', imgs =>
    imgs
      .filter(i => i.naturalWidth === 0 && i.src && !i.src.startsWith('data:') && i.src !== '')
      .map(i => ({ src: i.src.substring(0, 80), alt: i.alt || '' }))
  );
  if (brokenImgs.length > 0) {
    issues.push({
      id: 'broken-img',
      severity: 'M',
      desc: `broken image (${brokenImgs.length}개): ${brokenImgs.slice(0,3).map(i => i.src).join(', ')}`
    });
  }

  // 4. Bottom nav overlap — check if last meaningful content is hidden behind 76px nav
  const navExists = await page.$('.mobile-bottom-nav, [class*="bottom-nav"], nav');
  if (navExists) {
    const lastContentBottom = await page.$$eval('main, .page-content, .scroll-area, [class*="list"], [class*="content"]', els => {
      let maxBottom = 0;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.bottom > maxBottom) maxBottom = r.bottom;
      }
      return maxBottom;
    });
    if (lastContentBottom > VIEWPORT.height - 76) {
      // Only flag if the element actually gets cut off by nav (bottom near viewport bottom)
      const cut = await page.$$eval('[class*="card"]:last-child, [class*="item"]:last-child, [class*="row"]:last-child', els => {
        const vh = window.innerHeight;
        return els.filter(e => {
          const r = e.getBoundingClientRect();
          return r.bottom > vh - 76 && r.bottom < vh + 100;
        }).length;
      });
      if (cut > 0) {
        issues.push({
          id: 'nav-overlap',
          severity: 'M',
          desc: `하단 네비와 컨텐츠 겹침 가능성: 마지막 항목이 bottom nav(76px) 아래 숨겨짐`
        });
      }
    }
  }

  // 5. Color consistency check (quick heuristic on CTA buttons)
  const colorIssues = await page.$$eval(
    'button[class*="primary"], button[class*="cta"], .fab, [class*="fab"]',
    (els, view) => {
      const issues = [];
      for (const el of els) {
        const bg = window.getComputedStyle(el).backgroundColor;
        const cls = (el.className || '').toString();
        // Check diagnosis views use green, not pink
        if (view.includes('Diagnosis') || view.includes('diagnosis')) {
          if (bg.includes('230, 35, 90') || bg.includes('E6235A')) {
            issues.push(`진단 뷰에 핑크 CTA: ${cls.substring(0, 40)}`);
          }
        }
        // Check proposal/report views use pink, not green
        if (view.includes('Proposal') || view.includes('Report') || view.includes('proposal') || view.includes('report')) {
          if (bg.includes('6, 171, 105') || bg.includes('06AB69')) {
            issues.push(`제보/제안 뷰에 녹색 CTA: ${cls.substring(0, 40)}`);
          }
        }
      }
      return issues;
    },
    view
  );
  if (colorIssues.length > 0) {
    issues.push({
      id: 'color-mismatch',
      severity: 'M',
      desc: `색상 불일치: ${colorIssues.join(' / ')}`
    });
  }

  // 6. Console errors (JS errors collected separately)
  const consoleErrors = [];
  page.once('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 100));
  });

  // 7. Viewport check — scrollable area
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  if (bodyScrollWidth > VIEWPORT.width + 2) {
    issues.push({
      id: 'body-overflow',
      severity: 'H',
      desc: `body scrollWidth=${bodyScrollWidth} > viewport ${VIEWPORT.width}`
    });
  }

  return issues;
}

async function checkInteractions(page, view, issues) {
  // Category chip clicks
  if (['mReportList', 'mProposalList'].includes(view)) {
    try {
      const chip = await page.$('[class*="cat-chip"], [class*="category-chip"], [class*="chip"]');
      if (chip) {
        await chip.click();
        await page.waitForTimeout(300);
        const overflowAfter = await page.evaluate(() =>
          document.documentElement.scrollWidth > window.innerWidth + 2
        );
        if (overflowAfter) {
          issues.push({ id: 'chip-overflow', severity: 'M', desc: '카테고리 칩 클릭 후 overflow 발생' });
        }
      }
    } catch (e) {}
  }

  // Survey terms modal
  if (view === 'mSurveyDetail1') {
    try {
      const termsBtn = await page.$('[class*="terms"], [class*="약관"]');
      if (termsBtn) {
        await termsBtn.click();
        await page.waitForTimeout(400);
        const modal = await page.$('[class*="modal"], [class*="sheet"], [role="dialog"]');
        if (modal) {
          const r = await modal.boundingBox();
          if (r && r.x + r.width > VIEWPORT.width + 5) {
            issues.push({ id: 'modal-overflow', severity: 'H', desc: '약관 모달 화면 밖 비어져 나옴' });
          }
        }
      }
    } catch (e) {}
  }

  // Sheet mode transitions
  if (['mReportMap', 'mProposalMap'].includes(view)) {
    try {
      const sheet = await page.$('[class*="bottom-sheet"], [class*="sheet"]');
      if (sheet) {
        const overflowSheet = await page.evaluate(() =>
          document.documentElement.scrollWidth > window.innerWidth + 2
        );
        if (overflowSheet) {
          issues.push({ id: 'sheet-overflow', severity: 'M', desc: '지도 바텀시트 overflow' });
        }
      }
    } catch (e) {}
  }

  // Photo zoom modal
  if (view === 'mDiagnosisResult') {
    try {
      const photo = await page.$('[class*="photo"], [class*="image"], img');
      if (photo) {
        await photo.click();
        await page.waitForTimeout(400);
        const modal = await page.$('[class*="photo-modal"], [class*="zoom"], [class*="lightbox"]');
        if (modal) {
          const closeBtn = await page.$('[class*="close"], [aria-label="닫기"]');
          if (!closeBtn) {
            issues.push({ id: 'modal-no-close', severity: 'H', desc: '사진 확대 모달 닫기 버튼 없음/보이지 않음' });
          }
        }
      }
    } catch (e) {}
  }
}

async function main() {
  console.log('=== 모바일 UI 시각 점검 시작 ===');
  console.log(`대상 view: ${VIEWS.length}개`);

  const token = await getToken();
  console.log(`인증 토큰: ${token ? '획득 성공' : '획득 실패 (공개 뷰만 진행)'}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });

  const consoleErrors = {};
  const results = {};

  for (const view of VIEWS) {
    console.log(`\n[${view}] 점검 중...`);
    const page = await context.newPage();

    // Collect console errors
    const errList = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errList.push(msg.text().substring(0, 120));
    });
    page.on('pageerror', err => errList.push(`[JS ERROR] ${err.message.substring(0, 120)}`));

    try {
      await seedViewAndLoad(page, view, token);

      // Wait a bit more for dynamic content
      await page.waitForTimeout(500);

      const issues = await runChecks(page, view);
      await checkInteractions(page, view, issues);

      if (errList.length > 0) {
        issues.push({
          id: 'js-error',
          severity: 'M',
          desc: `JS 콘솔 에러 (${errList.length}개): ${errList.slice(0, 2).join(' | ')}`
        });
      }

      // Screenshot
      const screenshotPath = path.join(SCREENSHOTS_DIR, `audit_c_${view}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  스크린샷 저장: ${screenshotPath}`);

      // Current view after load (check if navigation actually worked)
      const actualView = await page.evaluate(() => sessionStorage.getItem('current_view') || 'unknown');

      results[view] = {
        actualView,
        issues,
        consoleErrors: errList.slice(0, 5)
      };

      if (issues.length === 0) {
        console.log(`  ✓ 이상 없음`);
      } else {
        console.log(`  ✗ 문제 ${issues.length}건:`);
        issues.forEach(i => console.log(`    [${i.severity}] ${i.id}: ${i.desc}`));
      }

    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
      results[view] = { error: e.message, issues: [] };
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Save JSON report
  const reportPath = path.join(REPORTS_DIR, 'audit_c.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n리포트 저장: ${reportPath}`);

  // Summary
  console.log('\n=== 요약 ===');
  const viewsWithIssues = Object.entries(results).filter(([, r]) => r.issues && r.issues.length > 0);
  if (viewsWithIssues.length === 0) {
    console.log('UI 시각 점검 모두 통과');
  } else {
    console.log(`문제 있는 view: ${viewsWithIssues.length}/${VIEWS.length}`);
    viewsWithIssues.forEach(([v, r]) => {
      console.log(`  ${v}: ${r.issues.length}건`);
      r.issues.forEach(i => console.log(`    [${i.severity}] ${i.desc}`));
    });
  }

  return results;
}

main().catch(console.error);
