import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES_PATH = resolve(__dirname, 'routes.json');

export async function runApi({ checks } = {}) {
  const cfg = JSON.parse(readFileSync(ROUTES_PATH, 'utf8'));
  const targets = checks?.length
    ? cfg.apiChecks.filter((c) => checks.includes(c.id))
    : cfg.apiChecks;

  const results = [];
  for (const c of targets) {
    const url = cfg.apiUrl + c.path;
    const start = Date.now();
    const result = { id: c.id, method: c.method, url, ok: false };
    try {
      const res = await fetch(url, {
        method: c.method,
        headers: c.headers || {},
        body: c.body ? JSON.stringify(c.body) : undefined,
      });
      result.status = res.status;
      result.durationMs = Date.now() - start;
      result.ok = c.expectStatus?.includes(res.status) ?? (res.status >= 200 && res.status < 400);
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) {
        try { result.body = await res.json(); } catch { /* ignore */ }
      }
    } catch (e) {
      result.error = String(e);
      result.ok = false;
    }
    results.push(result);
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const checksArg = args.find((a) => a.startsWith('--checks='));
  const checks = checksArg ? checksArg.split('=')[1].split(',') : null;

  runApi({ checks }).then((results) => {
    console.log(JSON.stringify(results, null, 2));
    const failed = results.filter((r) => !r.ok).length;
    process.exit(failed > 0 ? 1 : 0);
  });
}
