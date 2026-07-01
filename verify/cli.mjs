import { runFrontend } from './run.mjs';
import { runApi } from './api.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, 'reports');

function parseArgs(argv) {
  const out = { task: null, views: null, apiChecks: null, headed: false, only: null, token: null, adminToken: null };
  for (const a of argv) {
    if (a.startsWith('--task=')) out.task = a.split('=')[1];
    else if (a.startsWith('--views=')) out.views = a.split('=')[1].split(',');
    else if (a.startsWith('--api=')) out.apiChecks = a.split('=')[1].split(',');
    else if (a === '--headed') out.headed = true;
    else if (a.startsWith('--only=')) out.only = a.split('=')[1];
    else if (a.startsWith('--token=')) out.token = a.split('=')[1];
    else if (a.startsWith('--admin-token=')) out.adminToken = a.split('=')[1];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let task = {};
  if (args.task) task = JSON.parse(readFileSync(args.task, 'utf8'));

  const views = args.views ?? task.views ?? null;
  const apiChecks = args.apiChecks ?? task.apiChecks ?? null;
  const only = args.only ?? task.only ?? null;
  const token = args.token ?? task.token ?? null;
  const adminToken = args.adminToken ?? task.adminToken ?? null;

  const report = { startedAt: new Date().toISOString(), frontend: null, api: null, summary: {} };

  if (only !== 'api') {
    report.frontend = await runFrontend({ views, headless: !args.headed, token, adminToken });
  }
  if (only !== 'frontend') {
    report.api = await runApi({ checks: apiChecks });
  }

  const fePass = (report.frontend ?? []).filter((r) => r.ok).length;
  const feFail = (report.frontend ?? []).filter((r) => !r.ok).length;
  const apiPass = (report.api ?? []).filter((r) => r.ok).length;
  const apiFail = (report.api ?? []).filter((r) => !r.ok).length;
  report.summary = { fePass, feFail, apiPass, apiFail, ok: feFail === 0 && apiFail === 0 };
  report.finishedAt = new Date().toISOString();

  mkdirSync(REPORTS_DIR, { recursive: true });
  const stamp = report.startedAt.replace(/[:.]/g, '-');
  const reportPath = resolve(REPORTS_DIR, `${stamp}.json`);
  const latestPath = resolve(REPORTS_DIR, 'latest.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  writeFileSync(latestPath, JSON.stringify(report, null, 2));

  console.log(JSON.stringify({ reportPath, summary: report.summary }, null, 2));
  process.exit(report.summary.ok ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
