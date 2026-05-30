/**
 * Find the exact 450px SVG causing overflow in home/mReportForm/myReportList
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

async function main() {
  const token = await getToken();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });

  for (const view of ['home', 'mReportForm', 'myReportList']) {
    const page = await context.newPage();
    await seedAndLoad(page, view, token);

    // Find the SVG with width ~450
    const svgInfo = await page.$$eval('svg', svgs => {
      return svgs.map(svg => {
        const r = svg.getBoundingClientRect();
        const w = parseFloat(svg.getAttribute('width') || '0');
        const cs = window.getComputedStyle(svg);
        // Get ancestors chain
        const ancestors = [];
        let el = svg.parentElement;
        let depth = 0;
        while (el && depth < 5) {
          ancestors.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className||'').toString().substring(0,60),
            id: el.id
          });
          el = el.parentElement;
          depth++;
        }
        return {
          attrW: w,
          rectW: Math.round(r.width),
          rectRight: Math.round(r.right),
          rectLeft: Math.round(r.left),
          position: cs.position,
          viewBox: svg.getAttribute('viewBox') || '',
          ancestors: ancestors.slice(0, 3)
        };
      }).filter(s => s.attrW > 400 || s.rectW > 400 || s.rectRight > 380);
    });

    console.log(`\n[${view}] 450px 이상 SVG:`);
    svgInfo.forEach(s => {
      console.log(`  attrW=${s.attrW} rectW=${s.rectW} rectRight=${s.rectRight} left=${s.rectLeft} pos=${s.position}`);
      console.log(`  viewBox="${s.viewBox}"`);
      s.ancestors.forEach(a => console.log(`    parent: <${a.tag}${a.id ? '#'+a.id : ''} class="${a.cls}">`));
    });

    await page.close();
  }

  // Also check mMyReportEdit and mMyActivity which had bodyScrollW=375 but reported overflow
  // These were false positives — check again
  for (const view of ['mMyReportEdit', 'mMyActivity']) {
    const page = await context.newPage();
    await seedAndLoad(page, view, token);

    const info = await page.evaluate(() => ({
      docScrollW: document.documentElement.scrollWidth,
      bodyScrollW: document.body.scrollWidth,
      bodyOffsetW: document.body.offsetWidth,
      innerW: window.innerWidth
    }));
    console.log(`\n[${view}] scroll check: docScrollW=${info.docScrollW} bodyScrollW=${info.bodyScrollW} innerW=${info.innerW}`);

    // Find any element with right > viewport
    const badEls = await page.$$eval('*', els => {
      const vw = window.innerWidth;
      return els.filter(e => {
        try {
          const r = e.getBoundingClientRect();
          return r.right > vw + 2 && r.width > 5 && r.height > 5;
        } catch(e) { return false; }
      }).slice(0,10).map(e => ({
        tag: e.tagName.toLowerCase(),
        cls: (e.className||'').toString().substring(0,60),
        right: Math.round(e.getBoundingClientRect().right),
        width: Math.round(e.getBoundingClientRect().width),
        left: Math.round(e.getBoundingClientRect().left)
      }));
    });
    console.log(`  bad elements (right > 375+2): ${badEls.length}`);
    badEls.forEach(e => console.log(`    <${e.tag} .${e.cls.split(' ')[0]}> left=${e.left} right=${e.right} w=${e.width}`));

    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
