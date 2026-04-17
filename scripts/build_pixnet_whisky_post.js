const fs = require('fs');

function parseCsvLine(s) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (q && s[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (c === ',' && !q) {
      out.push(cur); cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function clean(v) { return (v || '').trim(); }
function keep(v) { v = clean(v); return v && v.toUpperCase() !== 'NA'; }
function formatYear(v) {
  v = clean(v);
  if (!v || v.toUpperCase() === 'NA') return '';
  return `${v} Yr`;
}

const csvPath = process.argv[2] || '/mnt/g/TMP/whisky_photo/Whisky365_NoteAll.csv';
const id = process.argv[3];
if (!id) {
  console.error('usage: node build_pixnet_whisky_post.js <csvPath> <id>');
  process.exit(1);
}

const txt = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const rows = txt.split(/\r?\n/).filter(Boolean).map(parseCsvLine);
const row = rows.find(r => r[0] === id);
if (!row) {
  console.error(`row not found: ${id}`);
  process.exit(2);
}

const region = clean(row[6]);
const parts = [row[1], row[2], formatYear(row[7])].filter(keep).map(clean);
const title = `[Whisky][${region}] ${parts.join(' / ')}`.trim();
const tags = [];
for (const part of region.split('/').map(s => s.trim()).filter(keep)) tags.push(part);
for (const v of [row[1], row[2], row[7]]) if (keep(v)) tags.push(clean(v));

console.log(JSON.stringify({
  id,
  title,
  personalCategory: 'Whisky',
  globalCategoryPrimary: '美味食記',
  globalCategorySecondary: '生活綜合',
  tags,
  visibility: '公開',
  commentPermission: '可留言，留言公開'
}, null, 2));
