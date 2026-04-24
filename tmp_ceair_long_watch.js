const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('/home/alantong/.npm-global/lib/node_modules/playwright');

const BASE = '/home/alantong/ai-work';
const STATE = path.join(BASE, 'memory', 'ceair-captcha-state.json');
const CAPTURE = path.join(BASE, 'captcha-current.png');
const WATCH_RE = /^live_cap_(\d{6})\.png$/;
const START_TS = Date.now();
const TELEGRAM_TARGET = process.env.TELEGRAM_TARGET || '8707204748';

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
ensureDir(path.join(BASE, 'memory'));

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); }
  catch { return {}; }
}
function saveState(patch) {
  const prev = loadState();
  const st = { ...prev, ...patch, updated_at: new Date().toISOString() };
  fs.writeFileSync(STATE, JSON.stringify(st, null, 2));
  return st;
}

function sendCaptchaToTelegram(note) {
  try {
    execFileSync(
      'openclaw',
      [
        'message', 'send',
        '--channel', 'telegram',
        '--target', TELEGRAM_TARGET,
        '--message', note,
        '--media', CAPTURE,
      ],
      { stdio: 'pipe', encoding: 'utf8' },
    );
    saveState({ last_telegram_send_ok_at: new Date().toISOString(), last_telegram_target: TELEGRAM_TARGET });
    return true;
  } catch (err) {
    saveState({
      last_telegram_send_error_at: new Date().toISOString(),
      last_telegram_target: TELEGRAM_TARGET,
      last_telegram_send_error: String(err && err.message ? err.message : err),
    });
    return false;
  }
}

(async()=>{
  saveState({ status:'running', attempts:0, last_ok_step:'none', current_step:'launch_browser', note:'Launching same-page session', seenFiles:[], startTs: START_TS });
  const browser = await chromium.launch({ headless:true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2600 } });
  let lastApiText = '';
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('eos/awb')) {
      let body = '';
      try { body = await res.text(); } catch {}
      lastApiText = body;
      fs.writeFileSync(path.join(BASE, 'tmp_ceair_last_api.json.txt'), body);
      console.log('API', body);
    }
  });
  await page.goto('https://www.eal-ceair.com/cargo-tracking.html?waybillNum=112-04511312', { waitUntil:'domcontentloaded', timeout:60000 });
  saveState({ last_ok_step:'page_loaded', current_step:'capture_captcha', note:'Page loaded, capturing captcha' });
  await page.locator('#img-verify').screenshot({ path: CAPTURE });
  const firstCaption = 'CEAIR 驗證碼，請回傳 6 碼答案檔名，例如 live_cap_123456.png';
  const firstSendOk = sendCaptchaToTelegram(firstCaption);
  saveState({ last_ok_step:'captcha_captured', current_step:'wait_for_human_file', note:'Waiting for NEW live_cap_######.png answer file', lastCaptureAt: new Date().toISOString(), last_telegram_send_status: firstSendOk ? 'ok' : 'error' });
  console.log('READY_WAITING_FILE');

  async function refreshCaptcha() {
    await page.locator('#img-verify').click();
    await page.waitForTimeout(1200);
    await page.locator('#img-verify').screenshot({ path: CAPTURE });
    const refreshCaption = 'CEAIR 驗證碼刷新了，請回傳新的 6 碼答案檔名，例如 live_cap_123456.png';
    const refreshSendOk = sendCaptchaToTelegram(refreshCaption);
    saveState({ last_ok_step:'captcha_captured', current_step:'wait_for_human_file', note:'Captcha refreshed, waiting for NEW live_cap_######.png answer file', lastCaptureAt: new Date().toISOString(), last_telegram_send_status: refreshSendOk ? 'ok' : 'error' });
  }

  async function submitCode(code, sourceFile) {
    const st = loadState();
    const seenFiles = Array.from(new Set([...(st.seenFiles || []), path.basename(sourceFile)]));
    saveState({ status:'self_recovering', current_step:'submit_code', note:`Submitting code ${code} from ${path.basename(sourceFile)}`, seenFiles });
    lastApiText = '';
    await page.fill('#waybill', '112-04511312');
    await page.fill('#code-verify', code);
    await page.locator('.waybill-button').first().click();
    await page.waitForTimeout(5000);
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 30000));
    fs.writeFileSync(path.join(BASE, 'tmp_ceair_last_body.txt'), bodyText);
    const nextAttempts = (st.attempts || 0) + 1;
    if (lastApiText.includes('图片验证码错误')) {
      saveState({ status:'running', attempts:nextAttempts, seenFiles, note:`Code ${code} rejected, refreshing captcha`, current_step:'refresh_after_bad_code' });
      await refreshCaptcha();
      return false;
    }
    if (!bodyText.includes('暂无信息')) {
      await page.screenshot({ path: path.join(BASE, 'tmp_ceair_success.png'), fullPage:true });
      saveState({ status:'done', attempts:nextAttempts, seenFiles, last_ok_step:'query_succeeded', current_step:'done', note:'Cargo query succeeded' });
      console.log('SUCCESS_BODY_START');
      console.log(bodyText);
      console.log('SUCCESS_BODY_END');
      return true;
    }
    saveState({ status:'self_recovering', attempts:nextAttempts, seenFiles, current_step:'unknown_result', note:'No explicit captcha error, but no cargo result yet' });
    return false;
  }

  setInterval(async () => {
    try {
      const st = loadState();
      const seen = new Set(st.seenFiles || []);
      const files = fs.readdirSync(BASE)
        .filter(f => WATCH_RE.test(f))
        .map(f => ({ f, mtime: fs.statSync(path.join(BASE, f)).mtimeMs }))
        .filter(x => x.mtime >= START_TS && !seen.has(x.f))
        .sort((a,b) => a.mtime - b.mtime);
      const next = files[0];
      if (!next) return;
      const m = next.f.match(WATCH_RE);
      const code = m[1];
      await submitCode(code, path.join(BASE, next.f));
    } catch (err) {
      const st = loadState();
      saveState({ status:'self_recovering', current_step:'watch_loop_error', note:String(err.message || err), attempts: st.attempts || 0 });
    }
  }, 3000);
})();
