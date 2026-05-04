const { spawnSync } = require('child_process');
const prompt = process.argv[2];
const images = process.argv.slice(3);
const payload = JSON.stringify({ prompt, images, model: '' });
const out = spawnSync('openclaw', ['tool', 'image'], { input: payload, encoding: 'utf8' });
if (out.status !== 0) {
  process.stderr.write(out.stderr || out.stdout || 'tool call failed');
  process.exit(out.status || 1);
}
try {
  const parsed = JSON.parse(out.stdout);
  process.stdout.write(String(parsed.output || parsed.text || parsed.result || '').trim());
} catch {
  process.stdout.write(String(out.stdout).trim());
}
