import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const JS_KEY = process.env.VITE_KAKAO_MAP_KEY || '75d889cc77c68f74665169640b1f1c50';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = resolve(__dirname, 'screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>kakao-map-test</title>
<style>html,body,#map{margin:0;padding:0;height:100vh;width:100vw}</style>
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false&libraries=clusterer,services"></script>
</head><body>
<div id="map"></div>
<script>
window.__mapStatus = 'pending';
function init(){
  try{
    if (!window.kakao || !window.kakao.maps) { window.__mapStatus = 'sdk-not-loaded'; return; }
    kakao.maps.load(function(){
      try{
        const c = document.getElementById('map');
        const map = new kakao.maps.Map(c, { center: new kakao.maps.LatLng(35.1796, 129.0756), level: 7 });
        new kakao.maps.Marker({ position: new kakao.maps.LatLng(35.1796, 129.0756), map }).setTitle('부산시청');
        window.__mapStatus = 'ok';
        window.__mapCenter = map.getCenter().toString();
      } catch(e){ window.__mapStatus = 'init-error: ' + e.message; }
    });
  } catch(e){ window.__mapStatus = 'outer-error: ' + e.message; }
}
if (window.kakao && window.kakao.maps) init();
else {
  const s = document.querySelector('script[src*="dapi.kakao.com"]');
  if (s) s.addEventListener('load', init);
  setTimeout(()=>{ if (window.__mapStatus==='pending') window.__mapStatus='timeout-loading-sdk'; }, 8000);
}
</script>
</body></html>`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();

const consoleMsgs = [];
const requests = [];
const failures = [];
page.on('console', m => consoleMsgs.push({ type: m.type(), text: m.text() }));
page.on('pageerror', e => failures.push('pageerror: ' + e.message));
page.on('requestfailed', r => failures.push('reqfail: ' + r.url() + ' :: ' + r.failure()?.errorText));
page.on('response', r => {
  if (r.url().includes('dapi.kakao.com') || r.url().includes('t1.daumcdn.net')) {
    requests.push({ url: r.url(), status: r.status() });
  }
});

await page.goto('http://localhost:8501/', { waitUntil: 'domcontentloaded' });
await page.setContent(html, { waitUntil: 'networkidle', timeout: 15000 });

await page.waitForFunction(() => window.__mapStatus && window.__mapStatus !== 'pending', { timeout: 15000 }).catch(() => {});

const status = await page.evaluate(() => ({ status: window.__mapStatus, center: window.__mapCenter }));
const shot = resolve(SHOT_DIR, 'kakao-test.png');
await page.screenshot({ path: shot, fullPage: false });

console.log(JSON.stringify({
  status,
  screenshot: shot,
  kakaoRequests: requests,
  failures,
  consoleErrors: consoleMsgs.filter(m => m.type === 'error'),
}, null, 2));

await browser.close();
process.exit(status.status === 'ok' ? 0 : 1);
