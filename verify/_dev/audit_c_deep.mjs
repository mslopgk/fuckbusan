/**
 * Deep dive into specific overflow issues found in audit_c_ui.mjs
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:8501';
const VIEWPORT = { width: 375, height: 812 };

async function getToken() {
  try {
    const res = await fetch(`http://localhost:8000/users/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ID: 'admin', PW: 'admin1234' })
    });
    if (res.ok) { const d = await res.json(); return d.access_token || null; }
  } catch (e) {}
  return null;
}

async function seedAndLoad(page, view, token) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ v, t }) => {
    sessionStorage.setItem('current_view', v);
    if (t) localStorage.setItem('access_token', t);
  }, { v: view, t: token });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
}

async function findOverflowCulprits(page) {
  return await page.$$eval('*', els => {
    const vw = window.innerWidth;
    const found = [];
    for (const el of els) {
      try {
        const cs = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        // Check computed width vs vw
        const computedW = parseFloat(cs.width);
        if (computedW > vw + 2 && r.height > 0) {
          found.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className||'').toString().substring(0,80),
            id: el.id || '',
            computedWidth: Math.round(computedW),
            rectWidth: Math.round(r.width),
            rectRight: Math.round(r.right),
            display: cs.display,
            position: cs.position,
            overflow: cs.overflow
          });
          if (found.length >= 15) break;
        }
      } catch(e) {}
    }
    return found;
  });
}

async function findImgOverflow(page) {
  return await page.$$eval('img', imgs => {
    const vw = window.innerWidth;
    return imgs.map(img => {
      const r = img.getBoundingClientRect();
      const cs = window.getComputedStyle(img);
      return {
        src: img.src.substring(0,60),
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        rectRight: Math.round(r.right),
        rectWidth: Math.round(r.width),
        cls: (img.className||'').toString().substring(0,60),
        objectFit: cs.objectFit,
        maxWidth: cs.maxWidth,
        width: cs.width,
        overflow: r.right > vw + 2
      };
    }).filter(i => i.overflow || i.rectRight > vw);
  });
}

async function main() {
  const token = await getToken();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15 Mobile Safari/604.1'
  });

  // Overflow views: home, mReportForm, mMyReportEdit, myReportList, mMyActivity
  const overflowViews = ['home', 'mReportForm', 'mMyReportEdit', 'myReportList', 'mMyActivity'];
  const imgOverflowViews = ['mReportMap', 'mReportDetail', 'mMyReportDetail', 'mProposalMap', 'mProposalDetail'];

  console.log('=== Deep: Overflow 원인 분석 ===\n');
  for (const view of overflowViews) {
    const page = await context.newPage();
    await seedAndLoad(page, view, token);
    const culprits = await findOverflowCulprits(page);
    console.log(`[${view}] overflow 원인 요소:`);
    if (culprits.length === 0) {
      console.log('  (직접 원인 요소 없음 — 자식 누적 또는 margin/padding 문제)');
      // Try to find body/root level
      const rootInfo = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const cs = window.getComputedStyle(body);
        return {
          bodyScrollW: body.scrollWidth,
          bodyOffsetW: body.offsetWidth,
          htmlScrollW: html.scrollWidth,
          bodyMaxW: cs.maxWidth,
          bodyWidth: cs.width,
          bodyOverflow: cs.overflow,
          bodyPadding: cs.padding,
          bodyMargin: cs.margin
        };
      });
      console.log('  root:', JSON.stringify(rootInfo));
    } else {
      culprits.forEach(c => console.log(`  <${c.tag}${c.id ? '#'+c.id : ''} .${c.cls.split(' ')[0]}> w=${c.computedWidth}px pos=${c.position} overflow=${c.overflow}`));
    }
    await page.close();
  }

  console.log('\n=== Deep: img out-of-bounds 원인 ===\n');
  for (const view of imgOverflowViews) {
    const page = await context.newPage();
    await seedAndLoad(page, view, token);
    const imgs = await findImgOverflow(page);
    console.log(`[${view}] overflow img (${imgs.length}개):`);
    imgs.slice(0,5).forEach(i => console.log(`  right=${i.rectRight} w=${i.rectWidth} objectFit=${i.objectFit} maxW=${i.maxWidth} cssW=${i.width} cls=${i.cls.split(' ')[0]} src=${i.src.substring(0,50)}`));
    await page.close();
  }

  // mDiagnosisList cat chip overflow detail
  console.log('\n=== Deep: mDiagnosisList 카테고리 칩 ===\n');
  {
    const page = await context.newPage();
    await seedAndLoad(page, 'mDiagnosisList', token);
    const chipContainer = await page.$$eval('[class*="cat-chip"], [class*="chip"]', els => {
      return els.slice(0,5).map(e => {
        const r = e.getBoundingClientRect();
        const parent = e.parentElement;
        const pcs = parent ? window.getComputedStyle(parent) : {};
        return {
          cls: (e.className||'').toString().substring(0,60),
          right: Math.round(r.right),
          left: Math.round(r.left),
          text: e.textContent.trim().substring(0,20),
          parentCls: parent ? (parent.className||'').toString().substring(0,60) : '',
          parentOverflow: pcs.overflow||'',
          parentDisplay: pcs.display||''
        };
      });
    });
    console.log('[mDiagnosisList] chip details:');
    chipContainer.forEach(c => console.log(`  "${c.text}" left=${c.left} right=${c.right} parentOverflow=${c.parentOverflow} parentDisplay=${c.parentDisplay} parentCls=${c.parentCls.split(' ')[0]}`));
    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
