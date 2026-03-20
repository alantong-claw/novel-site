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
    const transcript = await fakeTranscribe(req.file?.path);
    const replyText = await fakeAssistantReply(transcript);
    const audioUrl = await fakeSynthesize(replyText);

    if (req.file?.path) fs.unlink(req.file.path, () => {});

    res.json({ transcript, replyText, audioUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Voice pipeline failed.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'voice-proto' });
});

async function fakeTranscribe(_filePath) {
  return '這是暫時的語音辨識結果。之後會接真正的 STT。';
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
});
