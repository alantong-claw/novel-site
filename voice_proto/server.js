import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads') });
const publicDir = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(publicDir));

app.post('/api/talk', upload.single('audio'), async (req, res) => {
  try {
    const transcript = await transcribeAudio(req.file?.path, req.file?.originalname);
    const replyText = await fakeAssistantReply(transcript);
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
  res.json({ ok: true, service: 'voice-proto', stt: getSttMode() });
});

function getSttMode() {
  return process.env.OPENAI_API_KEY ? 'openai-audio-transcription' : 'stub';
}

async function transcribeAudio(filePath, originalName = 'recording.webm') {
  if (!filePath) return '沒有收到音訊檔。';

  if (!process.env.OPENAI_API_KEY) {
    return '這是暫時的語音辨識結果。尚未設定 OPENAI_API_KEY，所以目前仍使用 stub。';
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

async function fakeAssistantReply(transcript) {
  return `收到：${transcript}\n\n這裡是 prototype 回覆。下一步會接到真正的 OpenClaw 對話流程。`;
}

async function fakeSynthesize(_replyText) {
  return null;
}

const port = process.env.PORT || 3100;
app.listen(port, () => {
  console.log(`Voice prototype listening on http://localhost:${port}`);
  console.log(`STT mode: ${getSttMode()}`);
});
