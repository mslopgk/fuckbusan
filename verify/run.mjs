import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES_PATH = resolve(__dirname, 'routes.json');
const SCREENSHOTS_DIR = resolve(__dirname, 'screenshots');

export async function runFrontend({ views, headless = true, token = null, adminToken = null } = {}) {
  const cfg = JSON.parse(readFileSync(ROUTES_PATH, 'utf8'));
  const targets = views?.length
    ? cfg.views.filter((v) => views.includes(v.id))
    : cfg.views;

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: cfg.viewport });
  const results = [];

  try {
    for (const v of targets) {
      const consoleErrors = [];
      const pageErrors = [];
      const networkFailures = [];

      const page = await context.newPage();
      if (v.viewport) await page.setViewportSize(v.viewport);
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => pageErrors.push(String(err)));
      page.on('response', (res) => {
        if (res.status() >= 400) {
          networkFailures.push({ url: res.url(), status: res.status() });
        }
      });

      const url = cfg.baseUrl + v.path;
      const result = { id: v.id, view: v.view, url, ok: false };

      try {
        await page.goto(cfg.baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        await page.evaluate(
          ({ view, token, adminToken, sessionSeed }) => {
            sessionStorage.setItem('current_view', view);
            if (token) localStorage.setItem('access_token', token);
            if (adminToken) localStorage.setItem('admin_token', adminToken);
            if (sessionSeed) {
              for (const [k, v] of Object.entries(sessionSeed)) {
                sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
              }
            }
          },
          { view: v.view, token: v.auth ? token : null, adminToken: v.auth === 'admin' ? adminToken : null, sessionSeed: v.sessionSeed || null }
        );

        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        if (v.waitFor) {
          await page.waitForSelector(v.waitFor, { timeout: 10000 }).catch(() => {});
        }
        await page.waitForTimeout(500);

        mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        const shotPath = resolve(SCREENSHOTS_DIR, `${v.id}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
        result.screenshot = shotPath;

        const assertionResults = [];
        for (const a of v.assertions || []) {
          try {
            if (a.type === 'textContains') {
              const ok = (await page.content()).includes(a.value);
              assertionResults.push({ ...a, pass: ok });
            } else if (a.type === 'selectorVisible') {
              const ok = await page.isVisible(a.value).catch(() => false);
              assertionResults.push({ ...a, pass: ok });
            } else if (a.type === 'selectorCount') {
              const count = await page.locator(a.value).count();
              assertionResults.push({ ...a, count, pass: count === a.value });
            } else {
              assertionResults.push({ ...a, pass: false, error: 'unknown assertion type' });
            }
          } catch (e) {
            assertionResults.push({ ...a, pass: false, error: String(e) });
          }
        }
        result.assertions = assertionResults;

        const assertionsPass = assertionResults.every((a) => a.pass);
        result.consoleErrors = consoleErrors;
        result.pageErrors = pageErrors;
        result.networkFailures = networkFailures;
        result.ok = pageErrors.length === 0 && assertionsPass;
      } catch (e) {
        result.error = String(e);
        result.ok = false;
      } finally {
        await page.close();
      }

      results.push(result);
    }
  } finally {
    await context.close();
    await browser.close();
  }

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const viewsArg = args.find((a) => a.startsWith('--views='));
  const views = viewsArg ? viewsArg.split('=')[1].split(',') : null;
  const headless = !args.includes('--headed');

  runFrontend({ views, headless }).then((results) => {
    console.log(JSON.stringify(results, null, 2));
    const failed = results.filter((r) => !r.ok).length;
    process.exit(failed > 0 ? 1 : 0);
  });
}
