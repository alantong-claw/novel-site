const path = require('path');

const ROOT = '/home/alantong/ai-work';
const LEGACY_BASE = path.join(ROOT, 'tmp', 'pixnet-playwright-test');
const MODERN_BASE = process.env.PIXNET_WORKDIR || path.join(ROOT, 'work_tmp', 'pixnet-playwright-test');
const ACTIVE_BASE = process.env.PIXNET_USE_LEGACY_TMP === '1' ? LEGACY_BASE : MODERN_BASE;

function ensureRelative(name) {
  return path.join(ACTIVE_BASE, name);
}

module.exports = {
  ROOT,
  LEGACY_BASE,
  MODERN_BASE,
  ACTIVE_BASE,
  userDataDir: ensureRelative('pixnet-user-data'),
  statusFile: ensureRelative('controller-status.json'),
  commandFile: ensureRelative('controller-command.json'),
  batchJson: (name) => ensureRelative(name),
  logsDir: path.join(ROOT, 'work_tmp', 'pixnet-logs'),
};
