import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads') });
const publicDir = path.join(__dirname, 'public');
const generatedDir = path.join(publicDir, 'generated');

fs.mkdirSync(generatedDir, { recursive: true });

app.use(express.json());
app.use(express.static(publicDir));

app.post('/api/text', async (req, res) => {
  try {
    const transcript = (req.body?.text || '').trim();
    const replyText = await askOpenClaw(transcript || '（沒有收到文字）');
    const audioUrl = await synthesizeSpeech(replyText);
    res.json({ transcript, replyText, audioUrl, ttsMode: getTtsMode() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Text pipeline failed.', details: error.message });
  }
});

app.post('/api/talk', upload.single('audio'), async (req, res) => {
  try {
    const transcript = await transcribeAudio(req.file?.path, req.file?.originalname);
    const replyText = await askOpenClaw(transcript);
    const audioUrl = await synthesizeSpeech(replyText);

    if (req.file?.path) fs.unlink(req.file.path, () => {});

    res.json({ transcript, replyText, audioUrl, ttsMode: getTtsMode() });
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
    tts: getTtsMode(),
    assistant: 'openclaw-agent',
    sessionId: getVoiceSessionId(),
  });
});

function getVoiceSessionId() {
  return process.env.VOICE_PROTO_SESSION_ID || 'voice-proto';
}

function getSttMode() {
  return process.env.OPENAI_API_KEY ? 'openai-audio-transcription' : 'browser-speech-recognition';
}

function getTtsMode() {
  return process.env.OPENAI_API_KEY ? 'openai-audio-speech' : 'browser-speech-synthesis';
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

async function synthesizeSpeech(replyText) {
  const text = String(replyText || '').trim();
  if (!text) return null;

  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const model = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
  const voice = process.env.OPENAI_TTS_VOICE || 'alloy';
  const format = process.env.OPENAI_TTS_FORMAT || 'mp3';
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      format,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TTS request failed: ${response.status} ${errText}`);
  }

  const ext = format === 'wav' ? 'wav' : 'mp3';
  const fileName = `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = path.join(generatedDir, fileName);
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
  cleanupGeneratedAudio().catch((error) => console.warn('audio cleanup failed', error));
  return `/generated/${fileName}`;
}

async function cleanupGeneratedAudio() {
  const keepMs = Number(process.env.VOICE_PROTO_AUDIO_TTL_MS || 1000 * 60 * 30);
  const entries = await fs.promises.readdir(generatedDir, { withFileTypes: true });
  const now = Date.now();
  await Promise.all(entries.filter((entry) => entry.isFile()).map(async (entry) => {
    const filePath = path.join(generatedDir, entry.name);
    const stat = await fs.promises.stat(filePath);
    if (now - stat.mtimeMs > keepMs) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
  }));
}

const port = process.env.PORT || 3100;
app.listen(port, () => {
  console.log(`Voice prototype listening on http://localhost:${port}`);
  console.log(`STT mode: ${getSttMode()}`);
  console.log(`TTS mode: ${getTtsMode()}`);
  console.log(`Assistant mode: openclaw-agent (${getVoiceSessionId()})`);
});
