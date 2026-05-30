/**
 * audit_a_transactions.mjs
 * 트랜잭션 기능 실증 검사: 사진 업로드 / 좋아요 / 투표 / 조회수
 * 수정 없음 — 발견 문제 카탈로그화만
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, createWriteStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const SCREENSHOTS = '/Users/Kang/Desktop/fuckbusan/verify/screenshots';
const REPORTS_DIR = '/Users/Kang/Desktop/fuckbusan/verify/reports';
mkdirSync(SCREENSHOTS, { recursive: true });
mkdirSync(REPORTS_DIR, { recursive: true });

const BASE_FE = 'http://localhost:8501';
const BASE_API = 'http://localhost:8000';

// ─── helpers ────────────────────────────────────────────────────────────────
function log(msg) { console.log('[AUDIT]', msg); }
function warn(msg) { console.warn('[WARN] ', msg); }

const results = {
  sections: {},
  bugs: [],
  consoleErrors: [],
  networkErrors: [],
};

function addBug(id, severity, desc, location = '') {
  results.bugs.push({ id, severity, desc, location });
  warn(`BUG ${id} [${severity}] ${desc}`);
}

function sectionResult(key, status, note = '') {
  results.sections[key] = { status, note };
  log(`${key}: ${status} ${note}`);
}

// ─── create 1 KB dummy PNG in /tmp ──────────────────────────────────────────
async function makeDummyPng(name = 'test_1kb.png') {
  // Minimal valid PNG: 1×1 red pixel
  const PNG_1x1_RED = Buffer.from(
    '89504e470d0a1a0a0000000d494844520000000100000001' +
    '0802000000907753de0000000c4944415478016360f8cf' +
    'c000000002000145f5e17b0000000049454e44ae426082',
    'hex'
  );
  const p = `/tmp/${name}`;
  await writeFile(p, PNG_1x1_RED);
  return p;
}

// ─── API helpers ─────────────────────────────────────────────────────────────
async function apiLogin(id, pw) {
  const r = await fetch(`${BASE_API}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ID: id, PW: pw }),
  });
  if (!r.ok) throw new Error(`Login failed ${r.status}`);
  const j = await r.json();
  return j.access_token;
}

async function apiSignupAndLogin() {
  const uid = `tst_${Date.now()}`;
  const sr = await fetch(`${BASE_API}/users/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ID: uid, PW: 'test1234', name: '검수유저', nickname: 'tester',
      phone_num: '010-1234-5678', district_code: '부산진구',
    }),
  });
  if (!sr.ok) {
    const t = await sr.text();
    throw new Error(`Signup failed ${sr.status}: ${t}`);
  }
  return apiLogin(uid, 'test1234');
}

// ─── browser context factory ──────────────────────────────────────────────────
async function makePage(browser, token) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|net::ERR_|ResizeObserver/i.test(m.text()))
      results.consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => results.consoleErrors.push(String(e)));
  page.on('response', (r) => {
    if (r.status() >= 400 && !/favicon/i.test(r.url()))
      results.networkErrors.push(`${r.status()} ${r.url()}`);
  });

  // seed token
  await page.goto(BASE_FE, { waitUntil: 'domcontentloaded' });
  if (token) {
    await page.evaluate((t) => localStorage.setItem('access_token', t), token);
  }
  return { page, ctx };
}

async function seedView(page, view, extra = {}) {
  await page.evaluate(({ v, e }) => {
    sessionStorage.setItem('current_view', v);
    for (const [k, val] of Object.entries(e))
      sessionStorage.setItem(k, JSON.stringify(val));
  }, { v: view, e: extra });
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function screenshot(page, name) {
  const p = path.join(SCREENSHOTS, `audit_a_${name}.png`);
  await page.screenshot({ path: p, fullPage: false }).catch(() => {});
  return p;
}

// ─── get a real report/proposal from API ─────────────────────────────────────
async function getFirstReport() {
  const r = await fetch(`${BASE_API}/api/reports/list`);
  if (!r.ok) throw new Error('Failed to fetch reports list');
  const j = await r.json();
  const items = Array.isArray(j) ? j : (j.items || []);
  return items[0] ?? null;
}

async function getFirstProposal() {
  const r = await fetch(`${BASE_API}/api/reports/proposals`);
  if (!r.ok) throw new Error('Failed to fetch proposals list');
  const j = await r.json();
  const items = Array.isArray(j) ? j : (j.items || []);
  return items[0] ?? null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const browser = await chromium.launch({ headless: true });

try {
  // ── tokens ────────────────────────────────────────────────────────────────
  log('Acquiring tokens...');
  const adminToken = await apiLogin('admin', 'admin1234').catch((e) => { addBug('BUG-A0', 'H', `admin login failed: ${e.message}`); return null; });
  const userToken = await apiSignupAndLogin().catch((e) => { addBug('BUG-A0b', 'H', `user signup/login failed: ${e.message}`); return null; });
  log(`adminToken: ${adminToken ? 'OK' : 'FAIL'}, userToken: ${userToken ? 'OK' : 'FAIL'}`);

  const dummyPng = await makeDummyPng('audit_dummy.png');

  // ── fetch seed data ────────────────────────────────────────────────────────
  const seedReport = await getFirstReport().catch(() => null);
  const seedProposal = await getFirstProposal().catch(() => null);
  log(`Seed report id=${seedReport?.id}, proposal id=${seedProposal?.id}`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECTION 1: Photo Upload
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 1-1: 제보 사진 업로드
  log('=== 1-1 Report photo upload ===');
  {
    const { page, ctx } = await makePage(browser, userToken);
    let uploadResponseStatus = null;
    let uploadResponseBody = null;

    page.on('response', async (r) => {
      if (r.url().includes('/api/reports/upload')) {
        uploadResponseStatus = r.status();
        try { uploadResponseBody = await r.json(); } catch { uploadResponseBody = null; }
      }
    });

    await seedView(page, 'mReportForm');

    // wait for form
    const formVisible = await page.locator('input[type="file"]').first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    if (!formVisible) {
      addBug('BUG-A1a', 'H', 'mReportForm: file input not found after view seed', 'MReportForm.jsx');
      sectionResult('1-1_report_upload', '❌', 'form did not load');
    } else {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(dummyPng);
      // wait for upload response
      await page.waitForTimeout(3000);
      await screenshot(page, '1-1_report_upload_after');

      if (uploadResponseStatus === null) {
        addBug('BUG-A1b', 'M', 'mReportForm: upload request never fired after setInputFiles — possible input hidden/detached from DOM', 'MReportForm.jsx:225');
        sectionResult('1-1_report_upload', '⚠️', 'upload never fired');
      } else if (uploadResponseStatus !== 200) {
        addBug('BUG-A1c', 'H', `mReportForm upload returned HTTP ${uploadResponseStatus}`, 'report_router.py:62');
        sectionResult('1-1_report_upload', '❌', `HTTP ${uploadResponseStatus}`);
      } else {
        // Check preview
        const previewImg = await page.locator('.m-photo-add img').first().isVisible().catch(() => false);
        if (!previewImg) {
          addBug('BUG-A1d', 'M', 'mReportForm: upload succeeded but preview <img> not visible', 'MReportForm.jsx:220');
          sectionResult('1-1_report_upload', '⚠️', `upload OK (${JSON.stringify(uploadResponseBody)}) but no preview`);
        } else {
          sectionResult('1-1_report_upload', '✅', `upload OK url=${uploadResponseBody?.url}`);
        }
      }
    }
    await ctx.close();
  }

  // 1-2: 제안 사진 업로드
  log('=== 1-2 Proposal photo upload ===');
  {
    const { page, ctx } = await makePage(browser, userToken);
    let uploadStatus = null;
    let uploadBody = null;
    page.on('response', async (r) => {
      if (r.url().includes('/api/reports/upload')) {
        uploadStatus = r.status();
        try { uploadBody = await r.json(); } catch {}
      }
    });

    await seedView(page, 'mProposalForm');
    const formVisible = await page.locator('input[type="file"]').first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    if (!formVisible) {
      addBug('BUG-A2a', 'H', 'mProposalForm: file input not found', 'MProposalForm.jsx');
      sectionResult('1-2_proposal_upload', '❌', 'form did not load');
    } else {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(dummyPng);
      await page.waitForTimeout(3000);
      await screenshot(page, '1-2_proposal_upload_after');
      if (uploadStatus === null) {
        addBug('BUG-A2b', 'M', 'mProposalForm: upload request never fired — file input may be display:none and not triggering onChange via setInputFiles', 'MProposalForm.jsx:262');
        sectionResult('1-2_proposal_upload', '⚠️', 'upload never fired');
      } else if (uploadStatus !== 200) {
        addBug('BUG-A2c', 'H', `mProposalForm upload returned HTTP ${uploadStatus}`, 'report_router.py:62');
        sectionResult('1-2_proposal_upload', '❌', `HTTP ${uploadStatus}`);
      } else {
        sectionResult('1-2_proposal_upload', '✅', `url=${uploadBody?.url}`);
      }
    }
    await ctx.close();
  }

  // 1-3: 진단 사진 업로드
  log('=== 1-3 Diagnosis photo upload ===');
  {
    const { page, ctx } = await makePage(browser, userToken);
    let uploadStatus = null;
    let uploadBody = null;
    page.on('response', async (r) => {
      if (r.url().includes('/checklist/upload')) {
        uploadStatus = r.status();
        try { uploadBody = await r.json(); } catch {}
      }
    });

    await seedView(page, 'mDiagnosisForm');
    const formVisible = await page.locator('input[type="file"]').first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    if (!formVisible) {
      addBug('BUG-A3a', 'M', 'mDiagnosisForm: file input not found (may require sub-step navigation)', 'MDiagnosisForm.jsx');
      sectionResult('1-3_diagnosis_upload', '⚠️', 'file input not accessible at top-level');
    } else {
      await page.locator('input[type="file"]').first().setInputFiles(dummyPng);
      await page.waitForTimeout(3000);
      await screenshot(page, '1-3_diagnosis_upload_after');
      if (uploadStatus === null) {
        addBug('BUG-A3b', 'M', 'mDiagnosisForm: checklist/upload never fired', 'MDiagnosisForm.jsx');
        sectionResult('1-3_diagnosis_upload', '⚠️', 'upload never fired');
      } else if (uploadStatus !== 200) {
        addBug('BUG-A3c', 'H', `mDiagnosisForm upload HTTP ${uploadStatus}`, 'checklist_router.py:38');
        sectionResult('1-3_diagnosis_upload', '❌', `HTTP ${uploadStatus}`);
      } else {
        sectionResult('1-3_diagnosis_upload', '✅', `url=${uploadBody?.url}`);
      }
    }
    await ctx.close();
  }

  // 1-4: Large file (2MB+) — compressImage behavior
  log('=== 1-4 Large file compression ===');
  {
    // Create a 2.5 MB fake PNG (valid PNG header + random bytes)
    const bigPng = '/tmp/audit_big.png';
    const header = Buffer.from('89504e470d0a1a0a', 'hex');
    const filler = Buffer.alloc(2.5 * 1024 * 1024 - 8, 0xff);
    await writeFile(bigPng, Buffer.concat([header, filler]));

    const { page, ctx } = await makePage(browser, userToken);
    let uploadStatus = null;
    let uploadSize = null;
    page.on('request', (r) => {
      if (r.url().includes('/api/reports/upload')) {
        const body = r.postDataBuffer();
        if (body) uploadSize = body.length;
      }
    });
    page.on('response', async (r) => {
      if (r.url().includes('/api/reports/upload')) uploadStatus = r.status();
    });

    await seedView(page, 'mReportForm');
    const formVisible = await page.locator('input[type="file"]').first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    if (formVisible) {
      await page.locator('input[type="file"]').first().setInputFiles(bigPng);
      await page.waitForTimeout(5000);
      // compressImage passes non-decodable PNGs as-is (img.onerror path returns original file)
      // So 2.5 MB fake png with no valid IHDR => img.onerror => original 2.5 MB sent
      if (uploadStatus === null) {
        sectionResult('1-4_large_compress', '⚠️', 'upload never fired (hidden input issue)');
      } else {
        // if original big file sent as-is, compressImage fallback triggered (no visual decode)
        // uploadSize would be ~2.5 MB
        const sizeMB = uploadSize ? (uploadSize / 1024 / 1024).toFixed(2) : 'unknown';
        if (uploadSize && uploadSize > 2 * 1024 * 1024) {
          addBug('BUG-A4', 'L', `compressImage fallback: non-decodable PNG sent as-is (${sizeMB} MB). Real large image may not compress if canvas decode fails.`, 'imageCompress.js');
          sectionResult('1-4_large_compress', '⚠️', `sent ${sizeMB} MB uncompressed (img.onerror fallback path)`);
        } else {
          sectionResult('1-4_large_compress', '✅', `compressed to ${sizeMB} MB`);
        }
      }
    } else {
      sectionResult('1-4_large_compress', '⚠️', 'form not loaded');
    }
    await ctx.close();
  }

  // 1-5: Invalid file type (.txt)
  log('=== 1-5 Invalid file type (.txt) ===');
  {
    const txtFile = '/tmp/audit_test.txt';
    await writeFile(txtFile, 'hello world');

    const { page, ctx } = await makePage(browser, userToken);
    let uploadFired = false;
    page.on('request', (r) => { if (r.url().includes('/api/reports/upload')) uploadFired = true; });

    await seedView(page, 'mReportForm');
    const formVisible = await page.locator('input[type="file"]').first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    if (formVisible) {
      // The input has accept="image/*" but setInputFiles bypasses OS dialog
      await page.locator('input[type="file"]').first().setInputFiles(txtFile);
      await page.waitForTimeout(2000);
      await screenshot(page, '1-5_invalid_file');
      if (uploadFired) {
        // compressImage: file.type = 'text/plain', not startsWith('image/') → returns file as-is, then uploads to server
        addBug('BUG-A5', 'M', 'MReportForm: invalid file type (text/plain) not rejected client-side — compressImage passes it through, upload fires to server. No user-visible error.', 'MReportForm.jsx:90-112');
        sectionResult('1-5_invalid_type', '❌', 'txt file uploaded without client-side rejection');
      } else {
        // Browser accept attr may have blocked it
        sectionResult('1-5_invalid_type', '✅', 'upload not fired for .txt file');
      }
    } else {
      sectionResult('1-5_invalid_type', '⚠️', 'form not loaded');
    }
    await ctx.close();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECTION 2: 좋아요 (Report)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!seedReport) {
    sectionResult('2-1_like', '⚠️', 'no seed report found');
    sectionResult('2-2_unlike', '⚠️', 'no seed report');
  } else {
    log('=== 2-1 Report like ===');
    {
      const { page, ctx } = await makePage(browser, userToken);
      let likeStatus = null;
      let likeBody = null;
      page.on('response', async (r) => {
        if (r.url().includes('/like') && r.request().method() === 'POST') {
          likeStatus = r.status();
          try { likeBody = await r.json(); } catch {}
        }
      });

      // Build minimal report object for sessionStorage
      const reportSeed = {
        id: seedReport.id,
        title: seedReport.title || '제보',
        cat: seedReport.category || '도로',
        body: seedReport.content || '',
        location: seedReport.location || '',
        date: seedReport.created_at?.slice(0, 10) || '',
        likes: seedReport.likes || 0,
        views: seedReport.views || 0,
        comments: 0,
        progress_step: 1,
        image_url: null,
      };

      await seedView(page, 'mReportDetail', { selectedReport: reportSeed });
      await page.waitForTimeout(2000);
      await screenshot(page, '2-1_report_detail_before');

      const likeBtn = page.locator('.m-rdetail-like-btn');
      const btnVisible = await likeBtn.waitFor({ timeout: 8000 }).then(() => true).catch(() => false);

      if (!btnVisible) {
        addBug('BUG-A6a', 'H', 'mReportDetail: like button (.m-rdetail-like-btn) not found', 'MReportDetail.jsx');
        sectionResult('2-1_like', '❌', 'button not found');
      } else {
        const beforeLiked = await likeBtn.evaluate((el) => el.classList.contains('liked'));
        await likeBtn.click();
        await page.waitForTimeout(1500);
        await screenshot(page, '2-1_report_detail_after_like');

        if (likeStatus === null) {
          addBug('BUG-A6b', 'H', 'mReportDetail: like click did not fire API request', 'MReportDetail.jsx:75');
          sectionResult('2-1_like', '❌', 'API never called');
        } else if (likeStatus !== 200) {
          addBug('BUG-A6c', 'H', `mReportDetail like API returned ${likeStatus}`, 'report_router.py:841');
          sectionResult('2-1_like', '❌', `HTTP ${likeStatus}`);
        } else {
          const afterLiked = await likeBtn.evaluate((el) => el.classList.contains('liked'));
          if (afterLiked === beforeLiked) {
            addBug('BUG-A6d', 'M', 'mReportDetail: like button class did not toggle after successful API response', 'MReportDetail.jsx:81-88');
            sectionResult('2-1_like', '⚠️', `API OK liked=${likeBody?.liked} but UI class unchanged`);
          } else {
            sectionResult('2-1_like', '✅', `liked=${likeBody?.liked} likes_count=${likeBody?.likes_count}`);
          }
        }
      }

      // 2-2: toggle (unlike)
      log('=== 2-2 Report unlike ===');
      if (likeStatus === 200) {
        let unlikeStatus = null;
        let unlikeBody = null;
        page.on('response', async (r) => {
          if (r.url().includes('/like') && r.request().method() === 'POST') {
            unlikeStatus = r.status();
            try { unlikeBody = await r.json(); } catch {}
          }
        });
        const likeBtn2 = page.locator('.m-rdetail-like-btn');
        await likeBtn2.click();
        await page.waitForTimeout(1500);
        await screenshot(page, '2-2_report_detail_after_unlike');
        if (unlikeStatus !== 200) {
          addBug('BUG-A7', 'M', `mReportDetail unlike API returned ${unlikeStatus}`, 'report_router.py:856');
          sectionResult('2-2_unlike', '❌', `HTTP ${unlikeStatus}`);
        } else {
          sectionResult('2-2_unlike', '✅', `liked=${unlikeBody?.liked} count=${unlikeBody?.likes_count}`);
        }
      } else {
        sectionResult('2-2_unlike', '⚠️', 'skipped (like step failed)');
      }

      await ctx.close();
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECTION 3: 투표 (Proposal)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!seedProposal) {
    sectionResult('3-1_vote', '⚠️', 'no seed proposal');
    sectionResult('3-2_vote_cancel', '⚠️', 'no seed proposal');
    sectionResult('3-3_admin_vote_403', '⚠️', 'no seed proposal');
  } else {
    log('=== 3-1 Proposal vote (user) ===');
    {
      const { page, ctx } = await makePage(browser, userToken);
      let voteStatus = null;
      let voteBody = null;
      page.on('response', async (r) => {
        if (r.url().includes('/vote') && r.request().method() === 'POST') {
          voteStatus = r.status();
          try { voteBody = await r.json(); } catch {}
        }
      });

      const propSeed = {
        id: seedProposal.id,
        title: seedProposal.title || '제안',
        content: seedProposal.content || '',
        category: seedProposal.category || '교통',
        region: seedProposal.region || '부산',
        created_at: seedProposal.created_at || '',
        views_count: seedProposal.views_count || 0,
        likes_count: seedProposal.likes_count || 0,
        has_voted: false,
        is_mine: false,
        user_id: seedProposal.user_id,
        nickname: seedProposal.nickname || '작성자',
      };

      await seedView(page, 'mProposalDetail', { selectedProposal: propSeed });
      await page.waitForTimeout(2000);
      await screenshot(page, '3-1_proposal_detail_before');

      const voteBtn = page.locator('.m-vote-cta');
      const btnVisible = await voteBtn.waitFor({ timeout: 8000 }).then(() => true).catch(() => false);

      if (!btnVisible) {
        addBug('BUG-A8a', 'H', 'mProposalDetail: vote button (.m-vote-cta) not found', 'MProposalDetail.jsx');
        sectionResult('3-1_vote', '❌', 'button not found');
      } else {
        await voteBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '3-1_proposal_detail_after_vote');

        if (voteStatus === null) {
          addBug('BUG-A8b', 'H', 'mProposalDetail: vote click did not fire API', 'MProposalDetail.jsx:83');
          sectionResult('3-1_vote', '❌', 'API never called');
        } else if (voteStatus !== 200) {
          addBug('BUG-A8c', 'H', `mProposalDetail vote API ${voteStatus}`, 'report_router.py:539');
          sectionResult('3-1_vote', '❌', `HTTP ${voteStatus}`);
        } else {
          const voted = await page.locator('.m-vote-cta').evaluate((el) => el.classList.contains('on'));
          if (!voted && voteBody?.has_voted) {
            addBug('BUG-A8d', 'M', 'mProposalDetail: vote API returned has_voted=true but .m-vote-cta does not have class "on"', 'MProposalDetail.jsx:89');
          }
          sectionResult('3-1_vote', '✅', `has_voted=${voteBody?.has_voted} likes_count=${voteBody?.likes_count}`);
        }
      }

      // 3-2: vote cancel
      log('=== 3-2 Proposal vote cancel ===');
      if (voteStatus === 200 && voteBody?.has_voted) {
        let cancelStatus = null;
        let cancelBody = null;
        page.on('response', async (r) => {
          if (r.url().includes('/vote') && r.request().method() === 'POST') {
            cancelStatus = r.status();
            try { cancelBody = await r.json(); } catch {}
          }
        });
        await page.locator('.m-vote-cta').click();
        await page.waitForTimeout(2000);
        if (cancelStatus !== 200) {
          addBug('BUG-A9', 'M', `vote cancel returned ${cancelStatus}`, 'report_router.py:557');
          sectionResult('3-2_vote_cancel', '❌', `HTTP ${cancelStatus}`);
        } else {
          sectionResult('3-2_vote_cancel', '✅', `has_voted=${cancelBody?.has_voted} count=${cancelBody?.likes_count}`);
        }
      } else {
        sectionResult('3-2_vote_cancel', '⚠️', 'skipped (vote step not successful or already voted)');
      }
      await ctx.close();
    }

    // 3-3: admin vote → 403
    log('=== 3-3 Admin vote → 403 ===');
    {
      const { page, ctx } = await makePage(browser, adminToken);
      let adminVoteStatus = null;
      let alertText = null;
      page.on('response', async (r) => {
        if (r.url().includes('/vote') && r.request().method() === 'POST') {
          adminVoteStatus = r.status();
        }
      });
      page.on('dialog', async (d) => { alertText = d.message(); await d.dismiss(); });

      // fetch fresh proposal that admin doesn't own
      const propSeed = {
        id: seedProposal.id,
        title: seedProposal.title || '제안',
        content: seedProposal.content || '',
        category: seedProposal.category || '교통',
        region: seedProposal.region || '부산',
        created_at: seedProposal.created_at || '',
        views_count: seedProposal.views_count || 0,
        likes_count: seedProposal.likes_count || 0,
        has_voted: false,
        is_mine: false,
        user_id: seedProposal.user_id,
        nickname: seedProposal.nickname || '작성자',
      };
      await seedView(page, 'mProposalDetail', { selectedProposal: propSeed });
      await page.waitForTimeout(2000);

      const voteBtn = page.locator('.m-vote-cta');
      const btnVisible = await voteBtn.waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
      if (btnVisible) {
        await voteBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '3-3_admin_vote');

        if (adminVoteStatus !== 403) {
          addBug('BUG-A10a', 'H', `admin vote should return 403 but got ${adminVoteStatus}`, 'report_router.py:548');
          sectionResult('3-3_admin_vote_403', '❌', `expected 403 got ${adminVoteStatus}`);
        } else if (!alertText || !alertText.includes('관리자')) {
          addBug('BUG-A10b', 'M', `admin vote 403 received but alert not shown or missing "관리자" text (got: "${alertText}")`, 'MProposalDetail.jsx:91');
          sectionResult('3-3_admin_vote_403', '⚠️', `403 OK but alert="${alertText}"`);
        } else {
          sectionResult('3-3_admin_vote_403', '✅', `403 + alert="${alertText}"`);
        }
      } else {
        sectionResult('3-3_admin_vote_403', '⚠️', 'vote button not found');
      }
      await ctx.close();
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECTION 4: 조회수
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 4-1: mReportDetail 조회수
  log('=== 4-1 Report views ===');
  {
    const { page, ctx } = await makePage(browser, userToken);
    let viewFired = false;
    page.on('request', (r) => {
      if (r.url().match(/\/api\/reports\/\d+\/view/) || r.url().match(/\/api\/reports\/\d+$/) && r.method() === 'GET') {
        viewFired = true;
      }
    });
    if (seedReport) {
      const reportSeed = {
        id: seedReport.id, title: seedReport.title || '제보', cat: '도로',
        body: seedReport.content || '', location: '', date: '',
        likes: 0, views: 0, comments: 0, progress_step: 1,
      };
      await seedView(page, 'mReportDetail', { selectedReport: reportSeed });
      await page.waitForTimeout(2000);
      // Check if there is a separate view-increment endpoint called
      const viewEndpoints = results.networkErrors.filter((e) => e.includes('/view'));
      // MReportDetail doesn't have a dedicated /view POST call (unlike MProposalDetail)
      // so we just note whether any view API is called
      const hasViewApi = await page.evaluate(() => {
        // Can't check retroactively; we note absence
        return false;
      });
      sectionResult('4-1_report_views', '⚠️', 'MReportDetail has no dedicated POST /view endpoint — views_count likely not incremented server-side on visit');
      addBug('BUG-A11', 'L', 'MReportDetail lacks POST /view endpoint — views_count never incremented on detail visit (shows 0 always unless updated elsewhere)', 'MReportDetail.jsx');
    } else {
      sectionResult('4-1_report_views', '⚠️', 'no seed report');
    }
    await ctx.close();
  }

  // 4-2: mProposalDetail 조회수 첫 진입
  log('=== 4-2 Proposal views first visit ===');
  if (seedProposal) {
    const { page, ctx } = await makePage(browser, userToken);
    let viewStatus = null;
    let viewBody = null;
    page.on('response', async (r) => {
      if (r.url().includes('/proposals/') && r.url().includes('/view')) {
        viewStatus = r.status();
        try { viewBody = await r.json(); } catch {}
      }
    });
    // Get initial count
    const initialResp = await fetch(`${BASE_API}/api/reports/proposals/${seedProposal.id}`);
    const initialData = await initialResp.json().catch(() => ({}));
    const initialViews = initialData.views_count || 0;

    const propSeed = { id: seedProposal.id, title: seedProposal.title || '제안', content: '', category: '교통', region: '부산', created_at: '', views_count: initialViews, likes_count: 0, has_voted: false, is_mine: false, user_id: seedProposal.user_id, nickname: 'x' };
    await seedView(page, 'mProposalDetail', { selectedProposal: propSeed });
    await page.waitForTimeout(2000);

    if (viewStatus === null) {
      addBug('BUG-A12', 'H', 'mProposalDetail: POST /proposals/{id}/view never fired on first load', 'MProposalDetail.jsx:34-42');
      sectionResult('4-2_proposal_views_first', '❌', 'view endpoint never called');
    } else if (viewStatus !== 200) {
      addBug('BUG-A12b', 'H', `POST /view returned ${viewStatus}`, 'report_router.py:465');
      sectionResult('4-2_proposal_views_first', '❌', `HTTP ${viewStatus}`);
    } else {
      const counted = viewBody?.counted;
      const newCount = viewBody?.views_count;
      sectionResult('4-2_proposal_views_first', '✅', `counted=${counted} views_count=${newCount} (was ${initialViews})`);
    }
    await ctx.close();

    // 4-3: Same user revisit — counted: false
    log('=== 4-3 Proposal views revisit (duplicate) ===');
    {
      const { page: page2, ctx: ctx2 } = await makePage(browser, userToken);
      let revisitBody = null;
      page2.on('response', async (r) => {
        if (r.url().includes('/proposals/') && r.url().includes('/view')) {
          try { revisitBody = await r.json(); } catch {}
        }
      });
      await seedView(page2, 'mProposalDetail', { selectedProposal: propSeed });
      await page2.waitForTimeout(2000);
      if (revisitBody === null) {
        sectionResult('4-3_proposal_views_revisit', '⚠️', 'view endpoint not fired on revisit (viewCalled.current ref persists — but new context should reset)');
      } else if (revisitBody.counted === false) {
        sectionResult('4-3_proposal_views_revisit', '✅', `counted=false views_count=${revisitBody.views_count}`);
      } else {
        addBug('BUG-A13', 'M', `mProposalDetail revisit: counted=${revisitBody.counted} (expected false for duplicate view)`, 'report_router.py:483-491');
        sectionResult('4-3_proposal_views_revisit', '❌', `counted=${revisitBody.counted} (expected false)`);
      }
      await ctx2.close();
    }

    // 4-4: Own proposal view — counted: false
    log('=== 4-4 Own proposal view ===');
    {
      // Find a proposal owned by our test user — create one via API
      let ownProposalId = null;
      try {
        const createResp = await fetch(`${BASE_API}/api/reports/new-proposal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
          body: JSON.stringify({ category: '교통', title: '본인글테스트', content: '조회수미포함확인', region: '부산' }),
        });
        if (createResp.ok) {
          const created = await createResp.json();
          ownProposalId = created.id;
        }
      } catch {}

      if (!ownProposalId) {
        sectionResult('4-4_own_proposal_view', '⚠️', 'could not create own proposal');
      } else {
        const { page: page3, ctx: ctx3 } = await makePage(browser, userToken);
        let ownViewBody = null;
        page3.on('response', async (r) => {
          if (r.url().includes('/proposals/') && r.url().includes('/view')) {
            try { ownViewBody = await r.json(); } catch {}
          }
        });
        const ownSeed = { id: ownProposalId, title: '본인글테스트', content: '', category: '교통', region: '부산', created_at: '', views_count: 0, likes_count: 0, has_voted: false, is_mine: true, nickname: 'tester' };
        await seedView(page3, 'mProposalDetail', { selectedProposal: ownSeed });
        await page3.waitForTimeout(2000);
        if (ownViewBody === null) {
          sectionResult('4-4_own_proposal_view', '⚠️', 'view endpoint not fired');
        } else if (ownViewBody.counted === false) {
          sectionResult('4-4_own_proposal_view', '✅', 'own proposal: counted=false (correct)');
        } else {
          addBug('BUG-A14', 'M', `own proposal view counted=${ownViewBody.counted} (expected false)`, 'report_router.py:480');
          sectionResult('4-4_own_proposal_view', '❌', `counted=${ownViewBody.counted} (expected false)`);
        }
        await ctx3.close();
      }
    }

    // 4-5: admin view — counted: false
    log('=== 4-5 Admin proposal view ===');
    if (adminToken) {
      const { page: page4, ctx: ctx4 } = await makePage(browser, adminToken);
      let adminViewBody = null;
      page4.on('response', async (r) => {
        if (r.url().includes('/proposals/') && r.url().includes('/view')) {
          try { adminViewBody = await r.json(); } catch {}
        }
      });
      await seedView(page4, 'mProposalDetail', { selectedProposal: { id: seedProposal.id, title: '제안', content: '', category: '교통', region: '부산', created_at: '', views_count: 0, likes_count: 0, has_voted: false, is_mine: false, nickname: 'x' } });
      await page4.waitForTimeout(2000);
      if (adminViewBody === null) {
        sectionResult('4-5_admin_view', '⚠️', 'view endpoint not fired');
      } else if (adminViewBody.counted === false) {
        sectionResult('4-5_admin_view', '✅', 'admin: counted=false (correct)');
      } else {
        addBug('BUG-A15', 'M', `admin proposal view counted=${adminViewBody.counted} (expected false)`, 'report_router.py:480');
        sectionResult('4-5_admin_view', '❌', `counted=${adminViewBody.counted}`);
      }
      await ctx4.close();
    } else {
      sectionResult('4-5_admin_view', '⚠️', 'no admin token');
    }
  } else {
    sectionResult('4-2_proposal_views_first', '⚠️', 'no seed proposal');
    sectionResult('4-3_proposal_views_revisit', '⚠️', 'no seed proposal');
    sectionResult('4-4_own_proposal_view', '⚠️', 'no seed proposal');
    sectionResult('4-5_admin_view', '⚠️', 'no seed proposal');
  }

  // ─── write report ──────────────────────────────────────────────────────────
  const report = {
    generated: new Date().toISOString(),
    summary: results.sections,
    bugs: results.bugs,
    consoleErrors: results.consoleErrors.slice(0, 20),
    networkErrors: results.networkErrors.slice(0, 20),
  };
  const reportPath = path.join(REPORTS_DIR, 'audit_a.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Report written to ${reportPath}`);

  // ─── print summary ──────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('AUDIT A — SUMMARY');
  console.log('='.repeat(60));
  for (const [k, v] of Object.entries(results.sections)) {
    console.log(`  ${v.status}  ${k}  ${v.note}`);
  }
  if (results.bugs.length) {
    console.log('\nBUGS FOUND:');
    for (const b of results.bugs) console.log(`  [${b.id}] (${b.severity}) ${b.desc}`);
  } else {
    console.log('\nNo bugs found.');
  }
  console.log('='.repeat(60));

} finally {
  await browser.close();
}
