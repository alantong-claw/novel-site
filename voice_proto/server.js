import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads') });
const publicDir = path.join(__dirname, 'public');
const activeSessions = new Map();

app.use(express.json());
app.use(express.static(publicDir));

app.post('/api/login', (req, res) => {
  const providedPassword = String(req.body?.password || '');
  if (!isPasswordValid(providedPassword)) {
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  activeSessions.set(token, Date.now());
  return res.json({ ok: true, token });
});

app.post('/api/text', requireAuth, async (req, res) => {
  try {
    const transcript = (req.body?.text || '').trim();
    const replyText = await askOpenClaw(transcript || '（沒有收到文字）');
    const audioUrl = await fakeSynthesize(replyText);
    res.json({ transcript, replyText, audioUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Text pipeline failed.', details: error.message });
  }
});

app.post('/api/talk', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    const transcript = await transcribeAudio(req.file?.path, req.file?.originalname);
    const replyText = await askOpenClaw(transcript);
    const audioUrl = await fakeSynthesize(replyText);

    if (req.file?.path) fs.unlink(req.file.path, () => {});

    res.json({ transcript, replyText, audioUrl });
  } catch (error) {
    console.error(error);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Voice pipeline failed.', details: error.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'voice-proto',
    stt: getSttMode(),
    tts: 'browser-speech-synthesis',
    assistant: 'openclaw-agent',
    sessionId: getVoiceSessionId(),
    auth: isPasswordConfigured() ? 'password' : 'off',
  });
});

function isPasswordConfigured() {
  return Boolean(process.env.VOICE_PROTO_PASSWORD);
}

function isPasswordValid(providedPassword) {
  const expected = process.env.VOICE_PROTO_PASSWORD || '';
  if (!expected) return true;
  const a = Buffer.from(String(providedPassword));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function requireAuth(req, res, next) {
  if (!isPasswordConfigured()) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  activeSessions.set(token, Date.now());
  next();
}

function getVoiceSessionId() {
  return process.env.VOICE_PROTO_SESSION_ID || 'voice-proto';
}

function getSttMode() {
  return process.env.OPENAI_API_KEY ? 'openai-audio-transcription' : 'browser-speech-recognition';
}

async function askOpenClaw(message) {
  const args = [
    'agent',
    '--session-id',
    getVoiceSessionId(),
    '--message',
    message,
    '--json',
  ];

  if (process.env.VOICE_PROTO_THINKING) {
    args.push('--thinking', process.env.VOICE_PROTO_THINKING);
  }

  const { stdout, stderr } = await execFileAsync('openclaw', args, {
    cwd: path.resolve(__dirname, '..'),
    maxBuffer: 1024 * 1024 * 4,
    timeout: Number(process.env.VOICE_PROTO_TIMEOUT_MS || 120000),
    env: process.env,
  });

  if (stderr?.trim()) {
    console.warn(stderr.trim());
  }

  let data;
  try {
    data = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Failed to parse OpenClaw JSON: ${error.message}\n${stdout}`);
  }

  const payloads = data?.result?.payloads;
  if (!Array.isArray(payloads) || payloads.length === 0) {
    throw new Error('OpenClaw returned no payloads.');
  }

  const text = payloads
    .map((item) => item?.text)
    .filter(Boolean)
    .join('\n\n')
    .trim();

  return text || '（OpenClaw 有回覆，但沒有文字內容）';
}

async function transcribeAudio(filePath, originalName = 'recording.webm') {
  if (!filePath) return '沒有收到音訊檔。';

  if (!process.env.OPENAI_API_KEY) {
    return '未設定 OPENAI_API_KEY。請改用瀏覽器 SpeechRecognition → /api/text 流程。';
  }

  const form = new FormData();
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: detectMimeType(originalName) });

  form.append('file', blob, sanitizeFilename(originalName));
  form.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');
  form.append('language', process.env.OPENAI_TRANSCRIBE_LANGUAGE || 'zh');
  form.append('response_format', 'json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`STT request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.text?.trim() || '（轉錄成功，但沒有文字輸出）';
}

function detectMimeType(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  return 'application/octet-stream';
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function fakeSynthesize(_replyText) {
  return null;
}

const port = process.env.PORT || 3110;
app.listen(port, () => {
  console.log(`Voice prototype listening on http://localhost:${port}`);
  console.log(`STT mode: ${getSttMode()}`);
  console.log(`Assistant mode: openclaw-agent (${getVoiceSessionId()})`);
  console.log(`Auth mode: ${isPasswordConfigured() ? 'password' : 'off'}`);
});
