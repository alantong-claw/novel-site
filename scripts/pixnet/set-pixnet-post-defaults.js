const fs = require('fs');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

const commandFile = pixnetPaths.commandFile;

fs.writeFileSync(commandFile, JSON.stringify({
  action: 'setPixnetPostDefaults'
}, null, 2));

console.log(`Wrote ${commandFile}`);
